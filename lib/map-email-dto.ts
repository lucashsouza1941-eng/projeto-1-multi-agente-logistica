import type { EmailDto } from "./api"
import type { Email } from "./types/email-ui"

const CATEGORY_MAP: Record<string, Email["category"]> = {
  URGENT: "urgente",
  ROUTINE: "rotina",
  SPAM: "spam",
  ACTION_REQUIRED: "acao-requerida",
}

const PRIORITY_MAP: Record<string, Email["priority"]> = {
  HIGH: "alta",
  MEDIUM: "media",
  LOW: "baixa",
}

export function mapEmailDtoToUi(d: EmailDto): Email {
  const cat = (d.category || "").toUpperCase()
  const pri = (d.priority || "").toUpperCase()
  return {
    id: d.id,
    from: d.from,
    fromEmail: d.fromEmail,
    subject: d.subject,
    category: CATEGORY_MAP[cat] ?? "rotina",
    priority: PRIORITY_MAP[pri] ?? "baixa",
    confidence: d.confidence,
    actionTaken: d.actionTaken,
    date: d.date,
    preview: d.preview,
    aiReasoning: d.aiReasoning,
    suggestedAction: d.aiReasoning,
  }
}
