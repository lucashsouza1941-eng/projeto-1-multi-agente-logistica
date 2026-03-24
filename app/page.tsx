"use client"

import { useState } from "react"
import { DashboardHeader } from "@/components/dashboard/header"
import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { MetricsCards } from "@/components/dashboard/metrics-cards"
import { EmailVolumeChart } from "@/components/dashboard/email-volume-chart"
import { TriageDistributionChart } from "@/components/dashboard/triage-distribution-chart"
import { ActivityFeed } from "@/components/dashboard/activity-feed"

export default function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [period, setPeriod] = useState("today")

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar open={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      
      <div className="flex-1 flex flex-col">
        <DashboardHeader onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
        
        <main className="flex-1 p-6 overflow-auto">
          <div className="max-w-[1600px] mx-auto space-y-6">
            {/* KPI Metrics with Period Filter */}
            <MetricsCards period={period} onPeriodChange={setPeriod} />
            
            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              {/* Email Volume - Line Chart (wider) */}
              <div className="lg:col-span-3">
                <EmailVolumeChart />
              </div>
              
              {/* Triage Distribution - Bar Chart */}
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
