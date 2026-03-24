import { z } from 'zod';
declare const envSchema: z.ZodObject<{
    NODE_ENV: z.ZodDefault<z.ZodEnum<["development", "production", "test"]>>;
    PORT: z.ZodDefault<z.ZodNumber>;
    DATABASE_URL: z.ZodOptional<z.ZodString>;
    REDIS_URL: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    JWT_SECRET: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    OPENAI_API_KEY: z.ZodOptional<z.ZodString>;
    FRONTEND_URL: z.ZodDefault<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    JWT_SECRET: string;
    REDIS_URL: string;
    NODE_ENV: "development" | "production" | "test";
    PORT: number;
    FRONTEND_URL: string;
    OPENAI_API_KEY?: string | undefined;
    DATABASE_URL?: string | undefined;
}, {
    JWT_SECRET?: string | undefined;
    OPENAI_API_KEY?: string | undefined;
    REDIS_URL?: string | undefined;
    NODE_ENV?: "development" | "production" | "test" | undefined;
    PORT?: number | undefined;
    DATABASE_URL?: string | undefined;
    FRONTEND_URL?: string | undefined;
}>;
export type AppConfig = z.infer<typeof envSchema>;
declare const _default: () => {
    JWT_SECRET: string;
    REDIS_URL: string;
    NODE_ENV: "development" | "production" | "test";
    PORT: number;
    FRONTEND_URL: string;
    OPENAI_API_KEY?: string | undefined;
    DATABASE_URL?: string | undefined;
};
export default _default;
