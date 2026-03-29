"use client"

import { AppDashboardLayout } from "@/components/layout/app-dashboard-layout"
import { ActivityFeed } from "@/components/dashboard/activity-feed"

export default function ActivityPage() {
  return (
    <AppDashboardLayout
      breadcrumbs={[
        { label: "LogiAgent", href: "/" },
        { label: "Log de atividade", href: "/activity" },
      ]}
    >
      <main className="flex-1 overflow-auto p-4 sm:p-6">
        <div className="mx-auto max-w-[1600px] space-y-6">
          <div>
            <h1 className="text-xl font-semibold text-foreground sm:text-2xl">
              Log de atividade
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Acompanhe o que os agentes fizeram recentemente.
            </p>
          </div>
          <ActivityFeed />
        </div>
      </main>
    </AppDashboardLayout>
  )
}
