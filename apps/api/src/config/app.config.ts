import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3001),
  DATABASE_URL: z.string().url().optional(),
  REDIS_URL: z.string().optional().default('redis://localhost:6379'),
  JWT_SECRET: z.string().optional().default('logiagent-dev-secret'),
  OPENAI_API_KEY: z.string().optional(),
  FRONTEND_URL: z.string().optional().default('http://localhost:3000'),
});

export default () => {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    console.warn('Env validation warnings:', parsed.error.flatten());
  }
  return parsed.data ?? (process.env as unknown as z.infer<typeof envSchema>);
};
