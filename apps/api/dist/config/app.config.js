"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const zod_1 = require("zod");
const envSchema = zod_1.z.object({
    NODE_ENV: zod_1.z.enum(['development', 'production', 'test']).default('development'),
    PORT: zod_1.z.coerce.number().default(3001),
    DATABASE_URL: zod_1.z.string().url().optional(),
    REDIS_URL: zod_1.z.string().optional().default('redis://localhost:6379'),
    JWT_SECRET: zod_1.z.string().optional().default('logiagent-dev-secret'),
    OPENAI_API_KEY: zod_1.z.string().optional(),
    FRONTEND_URL: zod_1.z.string().optional().default('http://localhost:3000'),
});
exports.default = () => {
    const parsed = envSchema.safeParse(process.env);
    if (!parsed.success) {
        console.warn('Env validation warnings:', parsed.error.flatten());
    }
    return parsed.data ?? process.env;
};
//# sourceMappingURL=app.config.js.map