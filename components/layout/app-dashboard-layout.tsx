"use client"

import { useState, type ReactNode } from "react"
import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { DashboardHeader } from "@/components/dashboard/header"

export interface AppBreadcrumbItem {
  label: string
  href?: string
}

export function AppDashboardLayout({
  children,
  breadcrumbs,
}: {
  children: ReactNode
  breadcrumbs: AppBreadcrumbItem[]
}) {
  const [open, setOpen] = useState(true)
  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar open={open} onToggle={() => setOpen(!open)} />
      <div className="flex flex-1 flex-col min-w-0">
        <DashboardHeader
          onMenuToggle={() => setOpen(!open)}
          breadcrumbs={breadcrumbs}
        />
        {children}
      </div>
    </div>
  )
}
