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
exports.TriageAgentService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
let TriageAgentService = class TriageAgentService {
    constructor(config) {
        this.config = config;
        this.status = 'ONLINE';
        this.confidenceThreshold = 85;
        const key = this.config.get('OPENAI_API_KEY');
        if (key) {
            try {
                this.status = 'ONLINE';
            }
            catch {
                this.status = 'OFFLINE';
            }
        }
    }
    async process(email) {
        this.status = 'PROCESSING';
        this.lastRunAt = new Date();
        const lower = `${email.subject} ${email.body}`.toLowerCase();
        const isUrgent = lower.includes('urgente') || lower.includes('atraso') || lower.includes('crítico');
        const isSpam = lower.includes('desconto') || lower.includes('promoção') || /no-reply@/.test(email.from);
        const isActionRequired = lower.includes('proposta') || lower.includes('aprovação') || lower.includes('documentação');
        let category = 'ROUTINE';
        let priority = 'LOW';
        if (isUrgent) {
            category = 'URGENT';
            priority = 'HIGH';
        }
        else if (isSpam) {
            category = 'SPAM';
        }
        else if (isActionRequired) {
            category = 'ACTION_REQUIRED';
            priority = 'MEDIUM';
        }
        const confidence = isUrgent ? 94 : isSpam ? 99 : 87;
        this.status = 'ONLINE';
        return {
            category,
            priority,
            confidence,
            reasoning: `Classificação baseada em palavras-chave e remetente.${this.config.get('OPENAI_API_KEY') ? ' (LangChain/OpenAI disponível)' : ' (modo mock)'}`,
            suggestedActions: category === 'URGENT' ? ['Escalonar para gerência'] : category === 'SPAM' ? ['Mover para spam'] : ['Arquivar'],
        };
    }
    getStatus() {
        return { name: 'Triagem de E-mails', type: 'TRIAGE', status: this.status, lastRunAt: this.lastRunAt };
    }
    configure(config) {
        if (config.confidenceThreshold != null)
            this.confidenceThreshold = config.confidenceThreshold;
    }
};
exports.TriageAgentService = TriageAgentService;
exports.TriageAgentService = TriageAgentService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], TriageAgentService);
//# sourceMappingURL=triage-agent.service.js.map