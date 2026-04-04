"use client"

import { Workflow } from "lucide-react"
import { Button } from "@/components/ui/button"

/** Placeholder de produto quando ainda não existe modelo de dados / API de workflows. */
export function WorkflowsComingSoon() {
  return (
    <section
      className="mx-auto max-w-lg rounded-xl border border-border bg-card px-6 py-10 text-center shadow-sm sm:px-10 sm:py-12"
      aria-labelledby="workflows-soon-title"
    >
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
        <Workflow className="h-7 w-7 text-primary" aria-hidden />
      </div>
      <h2
        id="workflows-soon-title"
        className="mt-6 text-lg font-semibold tracking-tight text-foreground"
      >
        Workflows em breve
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        Aqui poderá definir <span className="text-foreground">gatilhos</span>{" "}
        (por exemplo, quando chega um e-mail ou muda o estado de um ticket) e uma
        sequência de <span className="text-foreground">etapas</span> que ligam
        triagem, relatórios e escalação — sem código.
      </p>
      <div className="mt-8 flex flex-col items-center gap-2">
        <Button type="button" disabled className="min-w-[200px]" aria-disabled>
          Criar workflow
        </Button>
        <p className="text-xs text-muted-foreground">
          Este botão ficará ativo quando a funcionalidade estiver disponível.
        </p>
      </div>
    </section>
  )
}
