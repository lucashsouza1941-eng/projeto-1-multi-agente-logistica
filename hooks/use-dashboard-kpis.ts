"use client"

import { useQuery } from "@tanstack/react-query"
import { getDashboardKpis, type DashboardPeriod } from "@/lib/api"

export function useDashboardKpis(period: DashboardPeriod) {
  return useQuery({
    queryKey: ["dashboard", "kpis", period],
    queryFn: () => getDashboardKpis(period),
  })
}
