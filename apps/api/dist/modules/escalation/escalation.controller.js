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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EscalationController = void 0;
const common_1 = require("@nestjs/common");
const common_2 = require("@nestjs/common");
const escalation_service_1 = require("./escalation.service");
let EscalationController = class EscalationController {
    constructor(escalationService) {
        this.escalationService = escalationService;
    }
    listTickets(status) {
        return this.escalationService.listTickets(status);
    }
    getTicket(id) {
        return this.escalationService.getTicket(id);
    }
    updateStatus(id, body) {
        return this.escalationService.updateStatus(id, body.status);
    }
    getRules() {
        return this.escalationService.getRules();
    }
    updateRules(body) {
        return this.escalationService.updateRules(body.rules);
    }
};
exports.EscalationController = EscalationController;
__decorate([
    (0, common_1.Get)('tickets'),
    __param(0, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], EscalationController.prototype, "listTickets", null);
__decorate([
    (0, common_1.Get)('tickets/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], EscalationController.prototype, "getTicket", null);
__decorate([
    (0, common_1.Patch)('tickets/:id/status'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], EscalationController.prototype, "updateStatus", null);
__decorate([
    (0, common_1.Get)('rules'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], EscalationController.prototype, "getRules", null);
__decorate([
    (0, common_1.Put)('rules'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], EscalationController.prototype, "updateRules", null);
exports.EscalationController = EscalationController = __decorate([
    (0, common_2.Controller)('escalation'),
    __metadata("design:paramtypes", [escalation_service_1.EscalationService])
], EscalationController);
//# sourceMappingURL=escalation.controller.js.map