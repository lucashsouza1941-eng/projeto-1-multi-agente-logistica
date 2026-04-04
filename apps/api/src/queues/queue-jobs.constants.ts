export const PROCESS_EMAIL_JOB = 'process-email';
export const GENERATE_REPORT_FROM_EMAIL_JOB = 'generate-from-email';
export const CREATE_ESCALATION_TICKET_JOB = 'create-escalation-ticket';

export type ProcessEmailPayload = {
  emailId: string;
};

export type CreateEscalationTicketPayload = {
  emailId: string;
  subject: string;
  description: string;
  priority: string;
  userId?: string | null;
};
