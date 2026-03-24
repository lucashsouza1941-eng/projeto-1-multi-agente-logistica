"use client"

import { useQuery } from "@tanstack/react-query"
import { getDashboardVolume } from "@/lib/api"

export function useDashboardVolume() {
  return useQuery({
    queryKey: ["dashboard", "volume"],
    queryFn: () => getDashboardVolume("hour"),
  })
}
