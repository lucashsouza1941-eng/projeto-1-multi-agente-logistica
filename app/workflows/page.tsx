"use client"

import { AppDashboardLayout } from "@/components/layout/app-dashboard-layout"
import { Workflow } from "lucide-react"

export default function WorkflowsPage() {
  return (
    <AppDashboardLayout
      breadcrumbs={[
        { label: "LogiAgent", href: "/" },
        { label: "Workflows", href: "/workflows" },
      ]}
    >
      <main className="flex-1 overflow-auto p-4 sm:p-6">
        <div className="mx-auto flex max-w-lg flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/20 px-6 py-20 text-center">
          <Workflow className="mb-4 h-12 w-12 text-muted-foreground" />
          <h1 className="text-lg font-semibold text-foreground">Workflows</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Orquestrações automáticas entre agentes estarão disponíveis em uma
            próxima versão. Por enquanto, use triagem, escalação e relatórios nas
            seções dedicadas.
          </p>
        </div>
      </main>
    </AppDashboardLayout>
  )
}
