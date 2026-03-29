"use client"

import { useQuery } from "@tanstack/react-query"
import { getDashboardVolume, type DashboardDateRange } from "@/lib/api"
import type { DashboardPeriod } from "@/lib/api"

export function useDashboardVolume(
  period: DashboardPeriod,
  range: DashboardDateRange | null,
) {
  const customReady =
    period !== "custom" ||
    (!!range?.startDate &&
      !!range?.endDate &&
      range.startDate <= range.endDate)

  return useQuery({
    queryKey: [
      "dashboard",
      "volume",
      period,
      range?.startDate,
      range?.endDate,
    ],
    queryFn: () =>
      getDashboardVolume(
        "hour",
        period === "custom" ? range : null,
      ),
    enabled: customReady,
  })
}
