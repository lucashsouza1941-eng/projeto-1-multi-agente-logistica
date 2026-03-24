"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { updateTicketStatus } from "@/lib/api"

export function useUpdateTicketStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      updateTicketStatus(id, status),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["escalation", "tickets"] })
    },
  })
}
