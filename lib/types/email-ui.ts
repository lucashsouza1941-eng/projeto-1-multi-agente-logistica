/** Modelo de e-mail usado na UI de triagem (mapeado a partir da API). */
export interface Email {
  id: string
  from: string
  fromEmail: string
  subject: string
  category: "urgente" | "rotina" | "spam" | "acao-requerida"
  priority: "alta" | "media" | "baixa"
  confidence: number
  actionTaken: string
  date: string
  preview: string
  aiReasoning: string
  /** Texto exibido como sugestão da IA (espelha o raciocínio resumido). */
  suggestedAction: string
}
