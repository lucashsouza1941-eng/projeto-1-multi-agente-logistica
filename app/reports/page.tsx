"use client"

import { useMemo } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Sidebar } from "@/components/dashboard/sidebar"
import { Header } from "@/components/dashboard/header"
import { ReportsList } from "@/components/reports/reports-list"
import { ReportPreviewModal } from "@/components/reports/report-preview-modal"
import { NewReportDialog } from "@/components/reports/new-report-dialog"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { useState } from "react"
import { useReports } from "@/hooks/use-reports"
import { createReport, regenerateReport, type ReportListItem } from "@/lib/api"
import type { Report } from "@/lib/report-ui-types"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"

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
  const [sidebarOpen, setSidebarOpen] = useState(true)
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
    },
  })

  const createMutation = useMutation({
    mutationFn: createReport,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["reports"] })
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
    <div className="flex h-screen bg-background">
      <Sidebar open={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          breadcrumbs={[{ label: "LogiAgent", href: "/" }, { label: "Relatórios" }]}
        />

        <main className="flex-1 overflow-auto p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-semibold text-foreground">Relatórios</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Gerencie e visualize relatórios gerados pelos agentes de IA
                </p>
              </div>
              <Button onClick={() => setNewReportOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Relatório
              </Button>
            </div>

            {isError && (
              <Alert variant="destructive">
                <AlertTitle>Relatórios</AlertTitle>
                <AlertDescription>
                  {error instanceof Error ? error.message : "Erro ao carregar"}
                </AlertDescription>
              </Alert>
            )}

            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-24 w-full" />
                ))}
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
      </div>

      <ReportPreviewModal report={selectedReport} open={previewOpen} onOpenChange={setPreviewOpen} />

      <NewReportDialog open={newReportOpen} onOpenChange={setNewReportOpen} onSubmit={handleNewReport} />
    </div>
  )
}
