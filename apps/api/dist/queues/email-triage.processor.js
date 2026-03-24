"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var EmailTriageProcessor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailTriageProcessor = void 0;
const bullmq_1 = require("@nestjs/bullmq");
const common_1 = require("@nestjs/common");
let EmailTriageProcessor = EmailTriageProcessor_1 = class EmailTriageProcessor extends bullmq_1.WorkerHost {
    constructor() {
        super(...arguments);
        this.logger = new common_1.Logger(EmailTriageProcessor_1.name);
    }
    async process(job) {
        this.logger.debug(`email-triage job ${job.id} received`);
    }
};
exports.EmailTriageProcessor = EmailTriageProcessor;
exports.EmailTriageProcessor = EmailTriageProcessor = EmailTriageProcessor_1 = __decorate([
    (0, bullmq_1.Processor)('email-triage')
], EmailTriageProcessor);
//# sourceMappingURL=email-triage.processor.js.map