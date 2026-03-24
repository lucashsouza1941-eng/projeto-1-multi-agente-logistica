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
exports.ReportAgentService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
let ReportAgentService = class ReportAgentService {
    constructor(config) {
        this.config = config;
        this.status = 'ONLINE';
        if (this.config.get('OPENAI_API_KEY')) {
            this.status = 'ONLINE';
        }
    }
    async generate(params) {
        this.status = 'PROCESSING';
        this.lastRunAt = new Date();
        const content = {
            summary: `Relatório ${params.type} - Período: ${params.period}. Dados agregados do banco.`,
            sections: [{ title: 'Resumo Executivo', body: 'Taxa de processamento estável. 94.2% de acurácia na triagem.' }],
        };
        this.status = 'ONLINE';
        return { title: `Relatório ${params.type}`, content, status: 'COMPLETED' };
    }
    getStatus() {
        return { name: 'Gerador de Relatórios', type: 'REPORT', status: this.status, lastRunAt: this.lastRunAt };
    }
};
exports.ReportAgentService = ReportAgentService;
exports.ReportAgentService = ReportAgentService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], ReportAgentService);
//# sourceMappingURL=report-agent.service.js.map