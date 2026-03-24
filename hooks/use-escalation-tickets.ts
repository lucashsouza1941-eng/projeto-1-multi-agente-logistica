"use client"

import { useQuery } from "@tanstack/react-query"
import { getEscalationTickets } from "@/lib/api"

export function useEscalationTickets(status?: string) {
  return useQuery({
    queryKey: ["escalation", "tickets", status ?? "all"],
    queryFn: () => getEscalationTickets(status),
  })
}
