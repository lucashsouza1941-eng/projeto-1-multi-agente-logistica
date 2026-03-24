"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SettingsService = void 0;
const common_1 = require("@nestjs/common");
const MOCK_SETTINGS = {
    general: { companyName: 'LogiAgent Brasil', timezone: 'America/Sao_Paulo', language: 'pt-BR' },
    agents: { triage: { confidenceThreshold: 85 }, reports: { template: 'weekly' }, escalation: { autoAssign: false } },
    integrations: { smtp: { host: 'smtp.example.com', port: 587 }, webhookUrl: 'https://***' },
    notifications: { email: true, push: false, summaryFrequency: 'daily' },
};
let SettingsService = class SettingsService {
    getByCategory(category) {
        return MOCK_SETTINGS[category] ?? {};
    }
    update(key, value) {
        return { key, value, updated: true };
    }
};
exports.SettingsService = SettingsService;
exports.SettingsService = SettingsService = __decorate([
    (0, common_1.Injectable)()
], SettingsService);
//# sourceMappingURL=settings.service.js.map