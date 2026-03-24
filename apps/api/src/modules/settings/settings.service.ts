import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async getByCategory(category: string) {
    const rows = await this.prisma.setting.findMany({
      where: { category },
    });
    if (rows.length === 0) {
      return {};
    }
    const out: Record<string, unknown> = {};
    for (const r of rows) {
      out[r.key] = r.value;
    }
    return out;
  }

  async update(key: string, value: unknown) {
    const json = value as Prisma.InputJsonValue;
    const category = key.includes('.') ? key.split('.')[0] : 'general';
    await this.prisma.setting.upsert({
      where: { key },
      create: { key, value: json, category },
      update: { value: json },
    });
    return { key, value, updated: true };
  }
}
