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
exports.EscalationAgentService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
let EscalationAgentService = class EscalationAgentService {
    constructor(config) {
        this.config = config;
        this.status = 'ONLINE';
    }
    async evaluate(input) {
        this.status = 'PROCESSING';
        this.lastRunAt = new Date();
        const escalate = input.priority === 'HIGH' || input.category === 'URGENT';
        const ruleId = escalate ? '1' : undefined;
        this.status = 'ONLINE';
        return {
            escalate,
            reason: escalate ? 'Prioridade alta ou categoria urgente' : undefined,
            ruleId,
        };
    }
    getStatus() {
        return { name: 'Escalonamento', type: 'ESCALATION', status: this.status, lastRunAt: this.lastRunAt };
    }
};
exports.EscalationAgentService = EscalationAgentService;
exports.EscalationAgentService = EscalationAgentService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], EscalationAgentService);
//# sourceMappingURL=escalation-agent.service.js.map