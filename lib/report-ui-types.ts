export interface Report {
  id: string
  title: string
  type: "performance" | "triage" | "escalation" | "summary" | "custom"
  status: "generated" | "pending" | "error"
  createdAt: Date
  generatedBy: string
  period: string
  size?: string
  pages?: number
  summary?: string
}
