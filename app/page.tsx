"use client"

import { useState } from "react"
import { DashboardHeader } from "@/components/dashboard/header"
import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { MetricsCards } from "@/components/dashboard/metrics-cards"
import { EmailVolumeChart } from "@/components/dashboard/email-volume-chart"
import { TriageDistributionChart } from "@/components/dashboard/triage-distribution-chart"
import { ActivityFeed } from "@/components/dashboard/activity-feed"
import type { DashboardDateRange } from "@/lib/api"
import { defaultCustomRange } from "@/lib/dates"

export default function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [period, setPeriod] = useState("today")
  const [customRange, setCustomRange] = useState<DashboardDateRange | null>(null)

  const handlePeriodChange = (value: string) => {
    setPeriod(value)
    if (value === "custom") {
      setCustomRange((r) => r ?? defaultCustomRange())
    }
  }

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar open={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      
      <div className="flex min-w-0 flex-1 flex-col">
        <DashboardHeader onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
        
        <main className="flex-1 overflow-auto p-4 sm:p-6">
          <div className="mx-auto max-w-[1600px] space-y-6">
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
            
            {/* Activity Feed with Infinite Scroll */}
            <ActivityFeed />
          </div>
        </main>
      </div>
    </div>
  )
}
