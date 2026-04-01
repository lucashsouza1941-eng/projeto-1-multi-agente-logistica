"use client"

import { CalendarDays, Workflow } from "lucide-react"

/** Reusable “em breve” block for features in development (e.g. Workflows). */
export function WorkflowsComingSoon() {
  return (
    <div className="mx-auto max-w-lg rounded-xl border border-dashed border-border bg-muted/20 px-6 py-12 text-center sm:px-10 sm:py-16">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
        <Workflow className="h-7 w-7 text-primary" aria-hidden />
      </div>
      <h2 className="mt-6 text-lg font-semibold text-foreground">Workflows em breve</h2>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        Estamos a desenhar orquestrações entre o agente de triagem, relatórios e
        escalação (filas, regras e gatilhos). Esta área ficará disponível numa
        release planeada para o{" "}
        <span className="font-medium text-foreground">Q3 2026</span>.
      </p>
      <div className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <CalendarDays className="h-4 w-4 shrink-0" aria-hidden />
        <span>Roadmap interno — sujeito a ajuste</span>
      </div>
      <p className="mt-4 text-xs text-muted-foreground">
        Até lá: use <strong className="text-foreground">Triagem</strong>,{" "}
        <strong className="text-foreground">Escalonamentos</strong> e{" "}
        <strong className="text-foreground">Relatórios</strong> no menu.
      </p>
    </div>
  )
}
