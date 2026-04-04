"use client"

import { AppDashboardLayout } from "@/components/layout/app-dashboard-layout"
import { WorkflowsComingSoon } from "@/components/workflows/coming-soon"

export default function WorkflowsPage() {
  return (
    <AppDashboardLayout
      breadcrumbs={[
        { label: "LogiAgent", href: "/" },
        { label: "Workflows", href: "/workflows" },
      ]}
    >
      <main className="flex-1 overflow-auto p-4 sm:p-6">
        <div className="mx-auto max-w-3xl space-y-6">
          <div>
            <h1 className="text-xl font-semibold text-foreground sm:text-2xl">
              Workflows
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Automatize processos com gatilhos e etapas — em breve nesta área.
            </p>
          </div>
          <WorkflowsComingSoon />
        </div>
      </main>
    </AppDashboardLayout>
  )
}
