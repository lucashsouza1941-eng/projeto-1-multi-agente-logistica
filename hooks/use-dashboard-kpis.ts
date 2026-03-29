"use client"

import { useQuery } from "@tanstack/react-query"
import {
  getDashboardKpis,
  type DashboardDateRange,
  type DashboardPeriod,
} from "@/lib/api"

export function useDashboardKpis(
  period: DashboardPeriod,
  range: DashboardDateRange | null,
) {
  const customReady =
    period !== "custom" ||
    (!!range?.startDate &&
      !!range?.endDate &&
      range.startDate <= range.endDate)

  return useQuery({
    queryKey: ["dashboard", "kpis", period, range?.startDate, range?.endDate],
    queryFn: () =>
      getDashboardKpis(period, period === "custom" ? range : null),
    enabled: customReady,
  })
}
