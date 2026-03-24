"use client"

import { useQuery } from "@tanstack/react-query"
import { getReports } from "@/lib/api"

export function useReports(status?: string) {
  return useQuery({
    queryKey: ["reports", status ?? "all"],
    queryFn: () => getReports(status),
  })
}
