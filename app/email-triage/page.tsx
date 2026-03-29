"use client"

import { useMemo, useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { AppDashboardLayout } from "@/components/layout/app-dashboard-layout"
import { EmailTriageTable } from "@/components/email-triage/email-triage-table"
import { EmailDetailPanel } from "@/components/email-triage/email-detail-panel"
import { useEmails } from "@/hooks/use-emails"
import { enqueueEmailProcess } from "@/lib/api"
import { mapEmailDtoToUi } from "@/lib/map-email-dto"
import type { Email } from "@/lib/types/email-ui"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { toUserFriendlyError } from "@/lib/user-friendly-error"

export default function EmailTriagePage() {
  const [selectedEmails, setSelectedEmails] = useState<string[]>([])
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null)
  const qc = useQueryClient()
  const { data, isLoading, isError, error } = useEmails({ page: 1, limit: 50 })
  const emails = useMemo(
    () => (data?.data ?? []).map(mapEmailDtoToUi),
    [data],
  )

  const enqueueMut = useMutation({
    mutationFn: enqueueEmailProcess,
    onSuccess: () => {
      toast.success("Triagem enfileirada", {
        description: "O agente processará este e-mail em breve.",
      })
      void qc.invalidateQueries({ queryKey: ["emails"] })
      void qc.invalidateQueries({ queryKey: ["dashboard"] })
      void qc.invalidateQueries({ queryKey: ["sidebar-stats"] })
    },
    onError: (e) =>
      toast.error("Não foi possível enfileirar", {
        description: toUserFriendlyError(e),
      }),
  })

  return (
    <AppDashboardLayout
      breadcrumbs={[
        { label: "LogiAgent", href: "/" },
        { label: "Triagem de e-mails", href: "/email-triage" },
      ]}
    >
      <main className="flex-1 overflow-hidden p-4 sm:p-6">
        <div className="mx-auto flex h-full max-w-[1600px] flex-col gap-4">
          <div>
            <h1 className="text-xl font-semibold text-foreground sm:text-2xl">
              Triagem de e-mails
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Revise e enfileire o processamento com o agente de IA.
            </p>
          </div>
          {isError && (
            <Alert variant="destructive">
              <AlertTitle>Não foi possível carregar a lista</AlertTitle>
              <AlertDescription>{toUserFriendlyError(error)}</AlertDescription>
            </Alert>
          )}
          {isLoading ? (
            <div className="space-y-3 rounded-lg border border-border bg-card p-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-[320px] w-full" />
            </div>
          ) : emails.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/20 px-6 py-16 text-center">
              <p className="text-sm font-medium text-foreground">
                Nenhum e-mail por aqui
              </p>
              <p className="mt-2 max-w-md text-xs text-muted-foreground sm:text-sm">
                Quando houver mensagens na API, elas aparecerão aqui para triagem.
              </p>
            </div>
          ) : (
            <div className="flex min-h-0 flex-1 flex-col gap-4 lg:flex-row">
              <div className="min-h-[280px] min-w-0 flex-1 overflow-hidden rounded-lg border border-border bg-card">
                <EmailTriageTable
                  emails={emails}
                  selectedEmails={selectedEmails}
                  onSelectEmails={setSelectedEmails}
                  onSelectEmail={setSelectedEmail}
                  selectedEmailId={selectedEmail?.id}
                />
              </div>
              {selectedEmail ? (
                <div className="shrink-0 lg:w-[min(100%,420px)]">
                  <EmailDetailPanel
                    email={selectedEmail}
                    onClose={() => setSelectedEmail(null)}
                    onEnqueueTriage={(id) => enqueueMut.mutate(id)}
                    isEnqueueing={enqueueMut.isPending}
                  />
                </div>
              ) : null}
            </div>
          )}
        </div>
      </main>
    </AppDashboardLayout>
  )
}
