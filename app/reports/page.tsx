"use client"

import { useMemo, useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { AppDashboardLayout } from "@/components/layout/app-dashboard-layout"
import { ReportsList } from "@/components/reports/reports-list"
import { ReportPreviewModal } from "@/components/reports/report-preview-modal"
import { NewReportDialog } from "@/components/reports/new-report-dialog"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { useReports } from "@/hooks/use-reports"
import { createReport, regenerateReport, type ReportListItem } from "@/lib/api"
import type { Report } from "@/lib/report-ui-types"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { toUserFriendlyError } from "@/lib/user-friendly-error"

const UI_TYPES = ["performance", "triage", "escalation", "summary", "custom"] as const

function mapApiToUi(r: ReportListItem): Report {
  let status: Report["status"] = "pending"
  if (r.status === "COMPLETED") status = "generated"
  else if (r.status === "ERROR") status = "error"
  const raw = (r.type || "custom").toLowerCase()
  const type = (UI_TYPES.includes(raw as (typeof UI_TYPES)[number])
    ? raw
    : "custom") as Report["type"]
  return {
    id: r.id,
    title: r.title,
    type,
    status,
    createdAt: new Date(r.createdAt),
    generatedBy: r.generatedBy,
    period: r.period,
    summary: r.summary,
  }
}

export default function ReportsPage() {
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [newReportOpen, setNewReportOpen] = useState(false)

  const qc = useQueryClient()
  const { data, isLoading, isError, error } = useReports()
  const reports = useMemo(() => (data ?? []).map(mapApiToUi), [data])

  const regenMutation = useMutation({
    mutationFn: regenerateReport,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["reports"] })
      toast.success("Relatório atualizado", {
        description: "A geração foi enfileirada. A lista será atualizada em instantes.",
      })
    },
    onError: (e) => {
      toast.error("Não foi possível atualizar o relatório", {
        description: toUserFriendlyError(e),
      })
    },
  })

  const createMutation = useMutation({
    mutationFn: createReport,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["reports"] })
      toast.success("Relatório solicitado", {
        description: "O relatório foi enfileirado para geração.",
      })
    },
    onError: (e) => {
      toast.error("Não foi possível criar o relatório", {
        description: toUserFriendlyError(e),
      })
    },
  })

  const handlePreview = (report: Report) => {
    setSelectedReport(report)
    setPreviewOpen(true)
  }

  const handleRegenerate = (reportId: string) => {
    regenMutation.mutate(reportId)
  }

  const handleNewReport = (form: { type: string; period: string; title: string }) => {
    createMutation.mutate({
      title: form.title,
      type: form.type,
      period: form.period,
    })
  }

  return (
    <AppDashboardLayout
      breadcrumbs={[
        { label: "LogiAgent", href: "/" },
        { label: "Relatórios", href: "/reports" },
      ]}
    >
      <main className="flex-1 overflow-auto p-4 sm:p-6">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-xl font-semibold text-foreground sm:text-2xl">
                Relatórios
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Gerencie e visualize relatórios gerados pelos agentes de IA.
              </p>
            </div>
            <Button
              className="w-full shrink-0 sm:w-auto"
              onClick={() => setNewReportOpen(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Novo relatório
            </Button>
          </div>

          {isError && (
            <Alert variant="destructive">
              <AlertTitle>Erro ao carregar relatórios</AlertTitle>
              <AlertDescription>{toUserFriendlyError(error)}</AlertDescription>
            </Alert>
          )}

          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-24 w-full rounded-lg" />
              ))}
            </div>
          ) : reports.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/20 px-6 py-16 text-center">
              <p className="text-sm font-medium text-foreground">
                Nenhum relatório ainda
              </p>
              <p className="mt-2 max-w-md text-xs text-muted-foreground sm:text-sm">
                Crie um relatório para ver resumos de performance, triagem ou escalação.
              </p>
              <Button className="mt-6" onClick={() => setNewReportOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Novo relatório
              </Button>
            </div>
          ) : (
            <ReportsList
              reports={reports}
              onPreview={handlePreview}
              onRegenerate={handleRegenerate}
            />
          )}
        </div>
      </main>

      <ReportPreviewModal
        report={selectedReport}
        open={previewOpen}
        onOpenChange={setPreviewOpen}
      />

      <NewReportDialog
        open={newReportOpen}
        onOpenChange={setNewReportOpen}
        onSubmit={handleNewReport}
      />
    </AppDashboardLayout>
  )
}
