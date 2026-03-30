/**
 * UI types for escalations (Kanban, detail sheet). Distinct from API DTOs in lib/api.
 */

export type TicketStatus = 'new' | 'analyzing' | 'escalated' | 'resolved'

export type TicketPriority = 'critical' | 'high' | 'medium' | 'low'

export type TimelineEventType =
  | 'ai_decision'
  | 'human_action'
  | 'status_change'
  | 'assignment'
  | 'comment'

export interface TimelineEvent {
  id: string
  type: TimelineEventType
  actor: string
  timestamp: Date
  description: string
  metadata?: Record<string, string>
}

export interface EscalationTicket {
  id: string
  subject: string
  description: string
  priority: TicketPriority
  status: TicketStatus
  assignee: string | null
  source: string
  createdAt: Date
  updatedAt: Date
  timeline: TimelineEvent[]
}
