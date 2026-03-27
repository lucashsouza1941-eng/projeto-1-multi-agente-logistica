import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { PrismaService } from '../../prisma/prisma.service';
import { AUTH_PRIMARY_USER_SETTING_KEY } from './auth.constants';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('Auth HTTP (integration)', () => {
  let app: INestApplication;
  const prismaMock = {
    setting: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  };

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [
        JwtModule.register({
          secret: 'integration-test-secret',
          signOptions: { expiresIn: '1h' },
        }),
      ],
      controllers: [AuthController],
      providers: [
        AuthService,
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
    prismaMock.setting.findUnique.mockResolvedValue({
      id: '1',
      key: AUTH_PRIMARY_USER_SETTING_KEY,
      value: {
        email: 'user@example.com',
        passwordHash: hash,
        name: 'User',
      },
      category: 'auth',
      updatedAt: new Date(),
    });

    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'user@example.com', password: 'mypassword' })
      .expect(201);

    expect(res.body.access_token).toBeTruthy();
    expect(typeof res.body.access_token).toBe('string');
    expect(res.body.user).toMatchObject({
      email: 'user@example.com',
      name: 'User',
    });
  });

  it('POST /auth/login 401 credenciais inválidas', async () => {
    prismaMock.setting.findUnique.mockResolvedValue(null);

    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'x@y.com', password: 'nope' })
      .expect(401);
  });
});
