"use client"

import type { Report } from "@/lib/report-ui-types"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Download,
  RefreshCw,
  FileText,
  Calendar,
  User,
  FileBarChart,
  TrendingUp,
  AlertTriangle,
  ClipboardList,
  Printer,
  Share2,
} from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface ReportPreviewModalProps {
  report: Report | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

const typeConfig = {
  performance: { label: "Performance", icon: TrendingUp },
  triage: { label: "Triagem", icon: FileBarChart },
  escalation: { label: "Escalonamento", icon: AlertTriangle },
  summary: { label: "Resumo", icon: ClipboardList },
  custom: { label: "Customizado", icon: FileText },
}

export function ReportPreviewModal({ report, open, onOpenChange }: ReportPreviewModalProps) {
  if (!report) return null

  const typeInfo = typeConfig[report.type]
  const TypeIcon = typeInfo.icon

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[85vh] flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b border-border">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="p-2 rounded-lg bg-primary/10">
                <TypeIcon className="h-6 w-6 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-xl">{report.title}</DialogTitle>
                <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {report.period}
                  </span>
                  <span className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    {report.generatedBy}
                  </span>
                  <Badge variant="outline">{typeInfo.label}</Badge>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Share2 className="h-4 w-4 mr-1" />
                Compartilhar
              </Button>
              <Button variant="outline" size="sm">
                <Printer className="h-4 w-4 mr-1" />
                Imprimir
              </Button>
              <Button size="sm">
                <Download className="h-4 w-4 mr-1" />
                Download PDF
              </Button>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 p-6">
          <div className="max-w-3xl mx-auto">
            {/* Report Header Section */}
            <div className="text-center mb-8 pb-8 border-b border-border">
              <h1 className="text-2xl font-bold text-foreground mb-2">{report.title}</h1>
              <p className="text-muted-foreground">
                Período: {report.period} | Gerado em {format(report.createdAt, "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
              </p>
            </div>

            {/* Executive Summary */}
            <section className="mb-8">
              <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <div className="h-1 w-1 rounded-full bg-primary" />
                Resumo Executivo
              </h2>
              <div className="bg-secondary/50 rounded-lg p-4">
                <p className="text-sm text-foreground leading-relaxed">
                  {report.summary || "Este relatório apresenta uma análise detalhada das operações de processamento de e-mails e triagem automática realizadas pelo sistema LogiAgent durante o período especificado."}
                </p>
              </div>
            </section>

            {/* Key Metrics */}
            <section className="mb-8">
              <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <div className="h-1 w-1 rounded-full bg-primary" />
                Métricas Principais
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: "E-mails Processados", value: "3.247", change: "+12%" },
                  { label: "Taxa de Acurácia", value: "94.2%", change: "+2.1%" },
                  { label: "Tempo Médio", value: "1.2s", change: "-0.3s" },
                  { label: "Escalonamentos", value: "23", change: "-15%" },
                ].map((metric) => (
                  <div key={metric.label} className="bg-card border border-border rounded-lg p-4">
                    <p className="text-xs text-muted-foreground mb-1">{metric.label}</p>
                    <p className="text-2xl font-bold text-foreground">{metric.value}</p>
                    <p className="text-xs text-success mt-1">{metric.change} vs anterior</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Distribution Chart Placeholder */}
            <section className="mb-8">
              <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <div className="h-1 w-1 rounded-full bg-primary" />
                Distribuição por Categoria
              </h2>
              <div className="bg-card border border-border rounded-lg p-6">
                <div className="space-y-3">
                  {[
                    { category: "Rotina", percentage: 42, color: "bg-chart-2" },
                    { category: "Ação Requerida", percentage: 28, color: "bg-chart-3" },
                    { category: "Urgente", percentage: 18, color: "bg-chart-4" },
                    { category: "Spam", percentage: 12, color: "bg-muted" },
                  ].map((item) => (
                    <div key={item.category} className="flex items-center gap-4">
                      <span className="text-sm text-muted-foreground w-32">{item.category}</span>
                      <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${item.color} rounded-full`}
                          style={{ width: `${item.percentage}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-foreground w-12 text-right">
                        {item.percentage}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Timeline */}
            <section className="mb-8">
              <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <div className="h-1 w-1 rounded-full bg-primary" />
                Eventos Relevantes
              </h2>
              <div className="space-y-4">
                {[
                  { time: "09:15", event: "Pico de processamento detectado", detail: "847 e-mails processados em 1 hora" },
                  { time: "14:30", event: "Escalonamento crítico", detail: "Contrato de fornecedor escalado para aprovação" },
                  { time: "16:45", event: "Atualização de modelo", detail: "Modelo de triagem atualizado com novos padrões" },
                ].map((item, i) => (
                  <div key={i} className="flex gap-4 items-start">
                    <div className="text-sm text-muted-foreground w-16 shrink-0">{item.time}</div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">{item.event}</p>
                      <p className="text-xs text-muted-foreground">{item.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Recommendations */}
            <section>
              <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <div className="h-1 w-1 rounded-full bg-primary" />
                Recomendações
              </h2>
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                <ul className="space-y-2 text-sm text-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    Considerar ajuste no threshold de confiança para categoria Urgente (atual: 85%)
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    Revisar regras de escalonamento para reduzir falsos positivos
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    Agendar treinamento adicional do modelo com dados de março
                  </li>
                </ul>
              </div>
            </section>
          </div>
        </ScrollArea>

        <div className="px-6 py-4 border-t border-border flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {report.pages} páginas • {report.size}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Regenerar
            </Button>
            <Button>
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
