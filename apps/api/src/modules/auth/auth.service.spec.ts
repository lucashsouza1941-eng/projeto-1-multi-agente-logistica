import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PrismaService } from '../../prisma/prisma.service';
import { AUTH_PRIMARY_USER_SETTING_KEY } from './auth.constants';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let prisma: PrismaService;
  let jwt: JwtService;
  let svc: AuthService;

  beforeEach(() => {
    prisma = {
      setting: {
        findUnique: vi.fn(),
        create: vi.fn(),
      },
    } as unknown as PrismaService;
    jwt = {
      sign: vi.fn().mockReturnValue('jwt-token-mock'),
    } as unknown as JwtService;
    svc = new AuthService(jwt, prisma);
  });

  it('login com credenciais válidas retorna access_token e user', async () => {
    const hash = await bcrypt.hash('secret123', 4);
    vi.mocked(prisma.setting.findUnique).mockResolvedValue({
      id: '1',
      key: AUTH_PRIMARY_USER_SETTING_KEY,
      value: {
        email: 'admin@test.com',
        passwordHash: hash,
        name: 'Admin',
      },
      category: 'auth',
      updatedAt: new Date(),
    });

    const out = await svc.login('admin@test.com', 'secret123');

    expect(out.access_token).toBe('jwt-token-mock');
    expect(out.user).toEqual({ email: 'admin@test.com', name: 'Admin' });
    expect(jwt.sign).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'admin@test.com' }),
    );
  });

  it('login com e-mail inexistente na setting → Unauthorized', async () => {
    vi.mocked(prisma.setting.findUnique).mockResolvedValue(null);

    await expect(svc.login('nobody@test.com', 'x')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('login com senha inválida → Unauthorized', async () => {
    const hash = await bcrypt.hash('right-pass', 4);
    vi.mocked(prisma.setting.findUnique).mockResolvedValue({
      id: '1',
      key: AUTH_PRIMARY_USER_SETTING_KEY,
      value: {
        email: 'a@test.com',
        passwordHash: hash,
        name: 'A',
      },
      category: 'auth',
      updatedAt: new Date(),
    });

    await expect(svc.login('a@test.com', 'wrong-pass')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('register falha quando usuário já existe', async () => {
    vi.mocked(prisma.setting.findUnique).mockResolvedValue({
      id: '1',
      key: AUTH_PRIMARY_USER_SETTING_KEY,
      value: {},
      category: 'auth',
      updatedAt: new Date(),
    });

    await expect(
      svc.register('x@test.com', 'p', 'X'),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
