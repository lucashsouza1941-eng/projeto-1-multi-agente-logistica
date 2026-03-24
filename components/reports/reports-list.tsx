"use client"

import { useState } from "react"
import type { Report } from "@/lib/report-ui-types"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  FileText,
  Download,
  RefreshCw,
  Eye,
  Settings,
  Search,
  Calendar,
  FileBarChart,
  AlertTriangle,
  TrendingUp,
  ClipboardList,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Clock,
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"

interface ReportsListProps {
  reports: Report[]
  onPreview: (report: Report) => void
  onRegenerate: (reportId: string) => void
}

const typeConfig = {
  performance: { label: "Performance", icon: TrendingUp, color: "bg-chart-1/20 text-chart-1" },
  triage: { label: "Triagem", icon: FileBarChart, color: "bg-chart-2/20 text-chart-2" },
  escalation: { label: "Escalonamento", icon: AlertTriangle, color: "bg-chart-4/20 text-chart-4" },
  summary: { label: "Resumo", icon: ClipboardList, color: "bg-chart-5/20 text-chart-5" },
  custom: { label: "Customizado", icon: FileText, color: "bg-muted text-muted-foreground" },
}

const statusConfig = {
  generated: { label: "Gerado", icon: CheckCircle2, color: "bg-success/20 text-success" },
  pending: { label: "Gerando...", icon: Clock, color: "bg-warning/20 text-warning-foreground" },
  error: { label: "Erro", icon: AlertCircle, color: "bg-destructive/20 text-destructive" },
}

export function ReportsList({ reports, onPreview, onRegenerate }: ReportsListProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  const filteredReports = reports.filter(report => {
    const matchesSearch = report.title.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = typeFilter === "all" || report.type === typeFilter
    const matchesStatus = statusFilter === "all" || report.status === statusFilter
    return matchesSearch && matchesType && matchesStatus
  })

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar relatórios..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os tipos</SelectItem>
            <SelectItem value="performance">Performance</SelectItem>
            <SelectItem value="triage">Triagem</SelectItem>
            <SelectItem value="escalation">Escalonamento</SelectItem>
            <SelectItem value="summary">Resumo</SelectItem>
            <SelectItem value="custom">Customizado</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            <SelectItem value="generated">Gerado</SelectItem>
            <SelectItem value="pending">Pendente</SelectItem>
            <SelectItem value="error">Erro</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredReports.map((report) => {
          const typeInfo = typeConfig[report.type]
          const statusInfo = statusConfig[report.status]
          const TypeIcon = typeInfo.icon
          const StatusIcon = statusInfo.icon

          return (
            <Card key={report.id} className="group hover:border-primary/50 transition-colors">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className={`p-2 rounded-lg ${typeInfo.color}`}>
                    <TypeIcon className="h-5 w-5" />
                  </div>
                  <Badge variant="secondary" className={statusInfo.color}>
                    {report.status === "pending" ? (
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                    ) : (
                      <StatusIcon className="h-3 w-3 mr-1" />
                    )}
                    {statusInfo.label}
                  </Badge>
                </div>

                <h3 className="font-semibold text-foreground mb-1 line-clamp-2">
                  {report.title}
                </h3>
                
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                  <Badge variant="outline" className="text-xs font-normal">
                    {typeInfo.label}
                  </Badge>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {report.period}
                  </span>
                </div>

                {report.summary && (
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                    {report.summary}
                  </p>
                )}

                <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
                  <span>
                    {formatDistanceToNow(report.createdAt, { addSuffix: true, locale: ptBR })}
                  </span>
                  {report.size && (
                    <span className="flex items-center gap-2">
                      <span>{report.pages} páginas</span>
                      <span>{report.size}</span>
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {report.status === "generated" && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => onPreview(report)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Preview
                      </Button>
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                  {report.status === "error" && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => onRegenerate(report.id)}
                    >
                      <RefreshCw className="h-4 w-4 mr-1" />
                      Regenerar
                    </Button>
                  )}
                  {report.status === "pending" && (
                    <Button variant="outline" size="sm" className="flex-1" disabled>
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                      Gerando...
                    </Button>
                  )}
                  <Button variant="ghost" size="sm">
                    <Settings className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {filteredReports.length === 0 && (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-1">Nenhum relatório encontrado</h3>
          <p className="text-sm text-muted-foreground">
            Tente ajustar os filtros ou criar um novo relatório
          </p>
        </div>
      )}
    </div>
  )
}
