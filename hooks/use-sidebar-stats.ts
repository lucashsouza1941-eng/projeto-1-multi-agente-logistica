"use client"

import { useQuery } from "@tanstack/react-query"
import { getDashboardKpis } from "@/lib/api"

/**
 * KPIs para badges da sidebar (GET /dashboard/kpis).
 * Refetch a cada 30s; em erro de rede/API, use os flags para exibir "–".
 */
export function useSidebarStats() {
  const { data, isPending, isError } = useQuery({
    queryKey: ["dashboard", "kpis", "sidebar"],
    queryFn: () => getDashboardKpis("7d"),
    refetchInterval: 30_000,
    staleTime: 15_000,
    retry: 1,
  })

  return {
    isLoading: isPending,
    isError,
    activeAgents:
      isError || typeof data?.agentsOnline !== "number" ? null : data.agentsOnline,
    pendingEmails:
      isError || typeof data?.emailsPending !== "number" ? null : data.emailsPending,
    openEscalationTickets:
      isError || typeof data?.ticketsEscalated !== "number"
        ? null
        : data.ticketsEscalated,
  }
}
