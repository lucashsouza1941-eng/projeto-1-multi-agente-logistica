"use client"

import { useQuery } from "@tanstack/react-query"
import { getEmails } from "@/lib/api"
import type { EmailListFilters } from "@/lib/api"

export function useEmails(filters: EmailListFilters) {
  return useQuery({
    queryKey: ["emails", filters],
    queryFn: () => getEmails(filters),
  })
}
