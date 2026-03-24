"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HealthController = void 0;
const common_1 = require("@nestjs/common");
const common_2 = require("@nestjs/common");
const redis_1 = require("redis");
const prisma_service_1 = require("../prisma/prisma.service");
let HealthController = class HealthController {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async check() {
        let dbOk = true;
        let dbError;
        try {
            await this.prisma.$queryRaw `SELECT 1`;
        }
        catch (e) {
            dbOk = false;
            dbError = e instanceof Error ? e.message : String(e);
        }
        let redisOk = true;
        let redisError;
        const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
        const client = (0, redis_1.createClient)({ url: redisUrl });
        try {
            await client.connect();
            await client.ping();
            await client.quit();
        }
        catch (e) {
            redisOk = false;
            redisError = e instanceof Error ? e.message : String(e);
            try {
                await client.quit();
            }
            catch {
            }
        }
        if (!dbOk || !redisOk) {
            throw new common_1.HttpException({
                status: 'error',
                timestamp: new Date().toISOString(),
                db: dbOk ? 'ok' : dbError ?? 'unavailable',
                redis: redisOk ? 'ok' : redisError ?? 'unavailable',
            }, common_1.HttpStatus.SERVICE_UNAVAILABLE);
        }
        return {
            status: 'ok',
            timestamp: new Date().toISOString(),
            db: 'ok',
            redis: 'ok',
            agents: 'ok',
        };
    }
};
exports.HealthController = HealthController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], HealthController.prototype, "check", null);
exports.HealthController = HealthController = __decorate([
    (0, common_2.Controller)('health'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], HealthController);
//# sourceMappingURL=health.controller.js.map