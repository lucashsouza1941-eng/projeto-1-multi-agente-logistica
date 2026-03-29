"use client"

import { useState } from "react"
import { AppDashboardLayout } from "@/components/layout/app-dashboard-layout"
import { MetricsCards } from "@/components/dashboard/metrics-cards"
import { EmailVolumeChart } from "@/components/dashboard/email-volume-chart"
import { TriageDistributionChart } from "@/components/dashboard/triage-distribution-chart"
import type { DashboardDateRange } from "@/lib/api"
import { defaultCustomRange } from "@/lib/dates"

export default function AnalyticsPage() {
  const [period, setPeriod] = useState("7d")
  const [customRange, setCustomRange] = useState<DashboardDateRange | null>(null)

  const handlePeriodChange = (value: string) => {
    setPeriod(value)
    if (value === "custom") {
      setCustomRange((r) => r ?? defaultCustomRange())
    }
  }

  return (
    <AppDashboardLayout
      breadcrumbs={[
        { label: "LogiAgent", href: "/" },
        { label: "Analytics", href: "/analytics" },
      ]}
    >
      <main className="flex-1 overflow-auto p-4 sm:p-6">
        <div className="mx-auto max-w-[1600px] space-y-6">
          <div>
            <h1 className="text-xl font-semibold text-foreground sm:text-2xl">
              Analytics
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Métricas e volume de e-mails no período escolhido.
            </p>
          </div>

          <MetricsCards
            period={period}
            onPeriodChange={handlePeriodChange}
            customRange={customRange}
            onCustomRangeChange={setCustomRange}
          />

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
            <div className="lg:col-span-3">
              <EmailVolumeChart period={period} customRange={customRange} />
            </div>
            <div className="lg:col-span-2">
              <TriageDistributionChart />
            </div>
          </div>
        </div>
      </main>
    </AppDashboardLayout>
  )
}
