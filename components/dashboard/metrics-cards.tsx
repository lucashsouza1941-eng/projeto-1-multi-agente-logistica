"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Mail,
  Target,
  FileText,
  AlertTriangle,
  Clock,
  TrendingUp,
  TrendingDown,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { useDashboardKpis } from "@/hooks/use-dashboard-kpis"
import type { DashboardDateRange, DashboardPeriod } from "@/lib/api"
import { toUserFriendlyError } from "@/lib/user-friendly-error"

export interface MetricsCardsProps {
  period: string
  onPeriodChange: (value: string) => void
  customRange: DashboardDateRange | null
  onCustomRangeChange: (range: DashboardDateRange) => void
}

const periodToApi = (p: string): DashboardPeriod => {
  if (p === "today" || p === "7d" || p === "30d" || p === "custom") return p
  return "7d"
}

const nf = new Intl.NumberFormat("pt-BR")

export function MetricsCards({
  period,
  onPeriodChange,
  customRange,
  onCustomRangeChange,
}: MetricsCardsProps) {
  const apiPeriod = periodToApi(period)
  const { data, isLoading, isError, error, isFetching } = useDashboardKpis(
    apiPeriod,
    period === "custom" ? customRange : null,
  )

  if (isLoading || (period === "custom" && !customRange)) {
    return (
      <div className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-full sm:w-[200px]" />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i} className="bg-card border-border">
              <CardContent className="space-y-3 p-5">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-3 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Não foi possível carregar as métricas</AlertTitle>
        <AlertDescription>{toUserFriendlyError(error)}</AlertDescription>
      </Alert>
    )
  }

  if (!data) {
    return null
  }

  const avgSec = (data.avgProcessingTimeMs / 1000).toFixed(1)

  let periodLabel = "Últimos 7 dias"
  if (period === "today") periodLabel = "Hoje"
  else if (period === "30d") periodLabel = "Últimos 30 dias"
  else if (period === "custom" && customRange) {
    periodLabel = `${new Date(customRange.startDate + "T12:00:00Z").toLocaleDateString("pt-BR")} — ${new Date(customRange.endDate + "T12:00:00Z").toLocaleDateString("pt-BR")}`
  } else if (period === "custom") periodLabel = "Intervalo personalizado"

  const metrics = [
    {
      name: "E-mails Processados",
      value: nf.format(data.emailsProcessed),
      change: isFetching ? "…" : "—",
      trend: "up" as const,
      description: periodLabel,
      icon: Mail,
      iconBg: "bg-chart-1/20",
      iconColor: "text-chart-1",
    },
    {
      name: "Taxa de Acerto",
      value: `${data.triageAccuracyPercent}%`,
      change: "—",
      trend: "up" as const,
      description: "Precisão na triagem",
      icon: Target,
      iconBg: "bg-success/20",
      iconColor: "text-success",
    },
    {
      name: "Relatórios Gerados",
      value: nf.format(data.reportsGenerated),
      change: "—",
      trend: "up" as const,
      description: "Documentos criados",
      icon: FileText,
      iconBg: "bg-chart-2/20",
      iconColor: "text-chart-2",
    },
    {
      name: "Tickets Escalonados",
      value: nf.format(data.ticketsEscalated),
      change: "—",
      trend: "down" as const,
      description: "Requer atenção humana",
      icon: AlertTriangle,
      iconBg: "bg-chart-4/20",
      iconColor: "text-chart-4",
    },
    {
      name: "Tempo Médio",
      value: `${avgSec}s`,
      change: "—",
      trend: "down" as const,
      description: "Por processamento",
      icon: Clock,
      iconBg: "bg-chart-5/20",
      iconColor: "text-chart-5",
    },
  ]

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Métricas</h2>
          <p className="text-sm text-muted-foreground">
            Visão geral do desempenho dos agentes
          </p>
        </div>
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:min-w-[280px]">
          <Select value={period} onValueChange={onPeriodChange}>
            <SelectTrigger className="w-full sm:w-[220px]">
              <SelectValue placeholder="Selecionar período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Hoje</SelectItem>
              <SelectItem value="7d">Últimos 7 dias</SelectItem>
              <SelectItem value="30d">Últimos 30 dias</SelectItem>
              <SelectItem value="custom">Intervalo personalizado</SelectItem>
            </SelectContent>
          </Select>
          {period === "custom" && customRange && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="dash-start" className="text-xs">
                  Início
                </Label>
                <Input
                  id="dash-start"
                  type="date"
                  value={customRange.startDate}
                  onChange={(e) =>
                    onCustomRangeChange({
                      ...customRange,
                      startDate: e.target.value,
                    })
                  }
                  className="w-full"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="dash-end" className="text-xs">
                  Fim
                </Label>
                <Input
                  id="dash-end"
                  type="date"
                  value={customRange.endDate}
                  min={customRange.startDate}
                  onChange={(e) =>
                    onCustomRangeChange({
                      ...customRange,
                      endDate: e.target.value,
                    })
                  }
                  className="w-full"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {metrics.map((metric) => (
          <Card key={metric.name} className="bg-card border-border">
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1 space-y-2">
                  <p className="text-sm text-muted-foreground">{metric.name}</p>
                  <p className="text-2xl font-bold tracking-tight text-foreground">
                    {metric.value}
                  </p>
                  <div className="flex items-center gap-1.5">
                    {metric.trend === "up" && (
                      <TrendingUp className="h-3.5 w-3.5 text-success" />
                    )}
                    {metric.trend === "down" && (
                      <TrendingDown
                        className={cn(
                          "h-3.5 w-3.5",
                          metric.name === "Tickets Escalonados" || metric.name === "Tempo Médio"
                            ? "text-success"
                            : "text-destructive",
                        )}
                      />
                    )}
                    <span
                      className={cn(
                        "text-xs font-medium",
                        metric.trend === "up" && "text-success",
                        metric.trend === "down" &&
                          (metric.name === "Tickets Escalonados" || metric.name === "Tempo Médio"
                            ? "text-success"
                            : "text-destructive"),
                      )}
                    >
                      {metric.change}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">{metric.description}</p>
                </div>
                <div className={cn("shrink-0 rounded-lg p-2.5", metric.iconBg)}>
                  <metric.icon className={cn("h-5 w-5", metric.iconColor)} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
