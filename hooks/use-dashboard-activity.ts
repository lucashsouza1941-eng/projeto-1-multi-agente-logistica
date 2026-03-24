"use client"

import { useQuery } from "@tanstack/react-query"
import { getDashboardActivity } from "@/lib/api"

export function useDashboardActivity(limit: number, refetchLive: boolean) {
  return useQuery({
    queryKey: ["dashboard", "activity", limit],
    queryFn: () => getDashboardActivity(limit),
    refetchInterval: refetchLive ? 5000 : false,
  })
}
