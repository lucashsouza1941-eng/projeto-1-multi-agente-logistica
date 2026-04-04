import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { ThrottlerModule } from '@nestjs/throttler';
import * as bcrypt from 'bcrypt';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('Auth HTTP (integration)', () => {
  let app: INestApplication;
  const prismaMock = {
    user: {
      findUnique: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  };

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        ThrottlerModule.forRoot([{ name: 'auth', ttl: 60000, limit: 100 }]),
        JwtModule.register({
          secret: 'integration-jwt-secret-minimum-32-characters!',
          signOptions: { expiresIn: '15m' },
        }),
      ],
      controllers: [AuthController],
      providers: [
        AuthService,
        {
          provide: ConfigService,
          useValue: {
            get: vi
              .fn()
              .mockReturnValue('integration-refresh-secret-minimum-32-chars!!'),
          },
        },
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /auth/login retorna JWT com credenciais válidas', async () => {
    const hash = await bcrypt.hash('mypassword', 4);
    prismaMock.user.findUnique.mockResolvedValue({
      id: 'u-int',
      email: 'user@example.com',
      passwordHash: hash,
      name: 'User',
      role: 'USER',
      refreshToken: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    prismaMock.user.update.mockResolvedValue({
      id: 'u-int',
      email: 'user@example.com',
      passwordHash: hash,
      name: 'User',
      role: 'USER',
      refreshToken: 'stored',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'user@example.com', password: 'mypassword' })
      .expect(201);

    expect(res.body.access_token).toBeTruthy();
    expect(typeof res.body.access_token).toBe('string');
    expect(res.body.refresh_token).toContain('u-int.');
    expect(res.body.user).toMatchObject({
      email: 'user@example.com',
      name: 'User',
    });
  });

  it('POST /auth/login 401 credenciais inválidas', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);

    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'x@y.com', password: 'nope' })
      .expect(401);
  });
});
