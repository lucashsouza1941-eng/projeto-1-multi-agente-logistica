import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let prisma: PrismaService;
  let jwt: JwtService;
  let config: ConfigService;
  let svc: AuthService;

  beforeEach(() => {
    prisma = {
      user: {
        findUnique: vi.fn(),
        count: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
      apiKey: {
        create: vi.fn(),
        findMany: vi.fn(),
        findUnique: vi.fn(),
        update: vi.fn(),
      },
    } as unknown as PrismaService;
    jwt = {
      sign: vi.fn().mockReturnValue('jwt-access-mock'),
    } as unknown as JwtService;
    config = {
      get: vi.fn().mockReturnValue('pepper-pepper-pepper-32chars!!'),
    } as unknown as ConfigService;
    svc = new AuthService(jwt, prisma, config);
  });

  it('login com credenciais válidas retorna tokens e user', async () => {
    const hash = await bcrypt.hash('secret123', 4);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: 'u1',
      email: 'admin@test.com',
      passwordHash: hash,
      name: 'Admin',
      role: 'ADMIN',
      refreshToken: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    vi.mocked(prisma.user.update).mockResolvedValue({
      id: 'u1',
      email: 'admin@test.com',
      passwordHash: hash,
      name: 'Admin',
      role: 'ADMIN',
      refreshToken: 'h',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const out = await svc.login('admin@test.com', 'secret123');

    expect(out.access_token).toBe('jwt-access-mock');
    expect(out.refresh_token).toContain('u1.');
    expect(out.user).toEqual({ email: 'admin@test.com', name: 'Admin' });
    expect(jwt.sign).toHaveBeenCalledWith(
      expect.objectContaining({ sub: 'u1', email: 'admin@test.com' }),
    );
  });

  it('login com e-mail inexistente → Unauthorized', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

    await expect(svc.login('nobody@test.com', 'x')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('register falha quando já existe utilizador', async () => {
    vi.mocked(prisma.user.count).mockResolvedValue(1);

    await expect(
      svc.register('a@b.com', 'x', 'N'),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
