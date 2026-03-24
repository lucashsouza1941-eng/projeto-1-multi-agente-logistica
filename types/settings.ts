export type SettingsTabId = 'general' | 'agents' | 'integrations' | 'notifications'

export interface GeneralSettingsFormValues {
  companyName: string
  timezone: string
  language: string
  contactEmail: string
}

export type AgentTypeId = 'triage' | 'reports' | 'escalation'

export interface AgentSettingsBase {
  id: AgentTypeId
  name: string
  confidenceThreshold: number
}

export interface TriageAgentSettings extends AgentSettingsBase {
  id: 'triage'
  triageRules: string[]
}

export type ReportTemplateId = 'daily' | 'weekly' | 'monthly' | 'custom'

export interface ReportAgentSettings extends AgentSettingsBase {
  id: 'reports'
  template: ReportTemplateId
}

export interface EscalationAgentSettings extends AgentSettingsBase {
  id: 'escalation'
}

export type AgentSettings =
  | TriageAgentSettings
  | ReportAgentSettings
  | EscalationAgentSettings

export interface EmailIntegrationSettings {
  host: string
  port: number
  username: string
  password: string
  protocol: string
  sslEnabled: boolean
}

export interface WebhookIntegrationSettings {
  url: string
}

export interface ApiKeyDescriptor {
  id: string
  label: string
  maskedValue: string
}

export interface IntegrationSettingsFormValues {
  email: EmailIntegrationSettings
  webhook: WebhookIntegrationSettings
  apiKeys: ApiKeyDescriptor[]
}

export type NotificationTypeId =
  | 'newEscalationTicket'
  | 'agentOffline'
  | 'reportGenerated'
  | 'confidenceBelowThreshold'

export type NotificationSummaryFrequencyId =
  | 'realtime'
  | 'hourly'
  | 'daily'

export interface NotificationToggle {
  id: NotificationTypeId
  enabled: boolean
}

export interface NotificationSettingsFormValues {
  notifications: NotificationToggle[]
  summaryFrequency: NotificationSummaryFrequencyId
}

