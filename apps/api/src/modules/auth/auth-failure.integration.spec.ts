import {
  Controller,
  Get,
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import { APP_GUARD, Reflector } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { Test, TestingModule } from '@nestjs/testing';
import { ThrottlerModule } from '@nestjs/throttler';
import * as bcrypt from 'bcrypt';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { JwtStrategy } from './jwt.strategy';
import { ApiKeyAuthGuard } from './api-key-auth.guard';

const JWT_SECRET = 'integration-jwt-secret-minimum-32-characters!';
const REFRESH_PEPPER = 'integration-refresh-secret-minimum-32-chars!!';

@Controller('probe')
class ProbeJwtController {
  @Get('jwt')
  probeJwt() {
    return { ok: true };
  }
}

describe('Auth — cenários de falha (integration)', () => {
  let app: INestApplication;
  let jwtService: JwtService;

  const prismaMock = {
    user: {
      findUnique: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    apiKey: {
      findUnique: vi.fn(),
    },
  };

  beforeAll(async () => {
    const configMock = {
      get: vi.fn((k: string) => {
        if (k === 'REFRESH_TOKEN_SECRET') return REFRESH_PEPPER;
        if (k === 'JWT_SECRET') return JWT_SECRET;
        return undefined;
      }),
    };
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        ThrottlerModule.forRoot([{ name: 'auth', ttl: 60_000, limit: 100 }]),
        PassportModule.register({ defaultStrategy: 'jwt' }),
        JwtModule.register({
          secret: JWT_SECRET,
          signOptions: { expiresIn: '15m' },
        }),
      ],
      controllers: [AuthController, ProbeJwtController],
      providers: [
        AuthService,
        JwtStrategy,
        { provide: PrismaService, useValue: prismaMock },
        Reflector,
        JwtAuthGuard,
        { provide: APP_GUARD, useExisting: JwtAuthGuard },
        ApiKeyAuthGuard,
      ],
    })
      .overrideProvider(ConfigService)
      .useValue(configMock)
      .compile();

    app = moduleRef.createNestApplication();
    jwtService = moduleRef.get(JwtService);
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

  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.apiKey.findUnique.mockResolvedValue(null);
  });

  it('POST /auth/refresh → 401 com refresh token inválido (formato)', async () => {
    await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken: 'sem-ponto-separador' })
      .expect(401);
  });

  it('POST /auth/refresh → 401 refresh expirado / sessão sem hash (refreshToken null)', async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: 'u1',
      email: 'a@b.com',
      refreshToken: null,
      passwordHash: 'x',
      name: 'N',
      role: 'USER',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken: 'u1.xyz' })
      .expect(401);
  });

  it('POST /auth/refresh → 401 replay (segundo uso do mesmo token após rotação)', async () => {
    const uid = 'u-replay';
    const raw = `${uid}.secretpart`;
    const hash = await bcrypt.hash(raw + REFRESH_PEPPER, 10);
    prismaMock.user.findUnique.mockResolvedValue({
      id: uid,
      email: 'r@b.com',
      refreshToken: hash,
      passwordHash: 'x',
      name: 'R',
      role: 'USER',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    prismaMock.user.update.mockResolvedValue({
      id: uid,
      refreshToken: 'new-hash',
    });

    await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken: raw })
      .expect(201);

    prismaMock.user.findUnique.mockResolvedValue({
      id: uid,
      email: 'r@b.com',
      refreshToken: 'new-hash',
      passwordHash: 'x',
      name: 'R',
      role: 'USER',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken: raw })
      .expect(401);
  });

  it('GET /auth/verify-api-key → 401 com API key revogada', async () => {
    prismaMock.apiKey.findUnique.mockResolvedValue({
      id: 'k1',
      userId: 'u1',
      keyHash: 'h',
      keyPrefix: 'logi_x',
      lookupHash: 'lh',
      revokedAt: new Date(),
      name: 'n',
      createdAt: new Date(),
    });
    await request(app.getHttpServer())
      .get('/auth/verify-api-key')
      .set('x-api-key', 'logi_validkeymustmatchhash')
      .expect(401);
  });

  it('GET /probe/jwt → 401 com JWT assinatura inválida', async () => {
    await request(app.getHttpServer())
      .get('/probe/jwt')
      .set('Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ4In0.wrong')
      .expect(401);
  });

  it('GET /probe/jwt → 401 com JWT de utilizador inexistente (eliminado)', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    const token = jwtService.sign({ sub: 'deleted-user-id', email: 'x@y.com' });
    await request(app.getHttpServer())
      .get('/probe/jwt')
      .set('Authorization', `Bearer ${token}`)
      .expect(401);
  });
});
