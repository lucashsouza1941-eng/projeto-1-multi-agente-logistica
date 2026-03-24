import type {
  AgentSettings,
  AgentTypeId,
  ApiKeyDescriptor,
  GeneralSettingsFormValues,
  IntegrationSettingsFormValues,
  NotificationSettingsFormValues,
  NotificationSummaryFrequencyId,
  NotificationTypeId,
  ReportTemplateId,
  SettingsTabId,
  TriageAgentSettings,
  ReportAgentSettings,
  EscalationAgentSettings,
} from '@/types/settings'

export const SETTINGS_TABS: { id: SettingsTabId; label: string }[] = [
  { id: 'general', label: 'Geral' },
  { id: 'agents', label: 'Agentes' },
  { id: 'integrations', label: 'Integrações' },
  { id: 'notifications', label: 'Notificações' },
]

export const TIMEZONE_OPTIONS: { value: string; label: string }[] = [
  { value: 'America/Sao_Paulo', label: 'America/São Paulo (GMT-3)' },
  { value: 'America/Manaus', label: 'America/Manaus (GMT-4)' },
  { value: 'America/Fortaleza', label: 'America/Fortaleza (GMT-3)' },
]

export const LANGUAGE_OPTIONS: { value: string; label: string }[] = [
  { value: 'pt-BR', label: 'Português (Brasil)' },
  { value: 'en-US', label: 'Inglês (EUA)' },
]

export const GENERAL_DEFAULT_VALUES: GeneralSettingsFormValues = {
  companyName: 'LogiAgent Transportes',
  timezone: 'America/Sao_Paulo',
  language: 'pt-BR',
  contactEmail: 'contato@logiagent.com.br',
}

export const AGENT_IDS: AgentTypeId[] = ['triage', 'reports', 'escalation']

export const TRIAGE_RULE_OPTIONS: { value: string; label: string }[] = [
  {
    value: 'urgent_keywords',
    label: 'Marcar como urgente se contiver palavras-chave',
  },
  {
    value: 'ignore_spam',
    label: 'Ignorar spam automaticamente',
  },
  {
    value: 'vip_clients',
    label: 'Priorizar clientes VIP',
  },
]

export const REPORT_TEMPLATE_OPTIONS: { value: ReportTemplateId; label: string }[] = [
  { value: 'daily', label: 'Diário' },
  { value: 'weekly', label: 'Semanal' },
  { value: 'monthly', label: 'Mensal' },
  { value: 'custom', label: 'Personalizado' },
]

export const DEFAULT_AGENT_SETTINGS: AgentSettings[] = [
  {
    id: 'triage',
    name: 'Triagem de E-mails',
    confidenceThreshold: 85,
    triageRules: ['urgent_keywords', 'ignore_spam'],
  } as TriageAgentSettings,
  {
    id: 'reports',
    name: 'Gerador de Relatórios',
    confidenceThreshold: 90,
    template: 'weekly',
  } as ReportAgentSettings,
  {
    id: 'escalation',
    name: 'Escalonamento',
    confidenceThreshold: 88,
  } as EscalationAgentSettings,
]

export const EMAIL_INTEGRATION_DEFAULTS: IntegrationSettingsFormValues['email'] = {
  host: 'smtp.logiagent.com.br',
  port: 587,
  username: 'alerts@logiagent.com.br',
  password: '',
  protocol: 'IMAP',
  sslEnabled: true,
}

export const WEBHOOK_INTEGRATION_DEFAULTS: IntegrationSettingsFormValues['webhook'] = {
  url: 'https://webhook.logiagent.com.br/events',
}

export const DEFAULT_API_KEYS: ApiKeyDescriptor[] = [
  {
    id: 'primary',
    label: 'Key primária',
    maskedValue: 'sk-••••••••••••3f9a',
  },
  {
    id: 'secondary',
    label: 'Key secundária',
    maskedValue: 'sk-••••••••••••7b2c',
  },
]

export const INTEGRATIONS_DEFAULT_VALUES: IntegrationSettingsFormValues = {
  email: EMAIL_INTEGRATION_DEFAULTS,
  webhook: WEBHOOK_INTEGRATION_DEFAULTS,
  apiKeys: DEFAULT_API_KEYS,
}

export const NOTIFICATION_TYPE_LABELS: Record<NotificationTypeId, string> = {
  newEscalationTicket: 'E-mail em novo ticket escalonado',
  agentOffline: 'Alerta de agente offline',
  reportGenerated: 'Relatório gerado',
  confidenceBelowThreshold: 'Confidence abaixo do threshold',
}

export const NOTIFICATION_SUMMARY_FREQUENCY_OPTIONS: {
  value: NotificationSummaryFrequencyId
  label: string
}[] = [
  { value: 'realtime', label: 'Tempo real' },
  { value: 'hourly', label: 'A cada hora' },
  { value: 'daily', label: 'Diário' },
]

export const NOTIFICATIONS_DEFAULT_VALUES: NotificationSettingsFormValues = {
  notifications: [
    { id: 'newEscalationTicket', enabled: true },
    { id: 'agentOffline', enabled: true },
    { id: 'reportGenerated', enabled: true },
    { id: 'confidenceBelowThreshold', enabled: false },
  ],
  summaryFrequency: 'realtime',
}

