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
import { useDashboardKpis } from "@/hooks/use-dashboard-kpis"
import type { DashboardPeriod } from "@/lib/api"

interface MetricsCardsProps {
  period: string
  onPeriodChange: (value: string) => void
}

const periodToApi: Record<string, DashboardPeriod> = {
  today: "today",
  "7d": "7d",
  "30d": "30d",
  custom: "custom",
}

const nf = new Intl.NumberFormat("pt-BR")

export function MetricsCards({ period, onPeriodChange }: MetricsCardsProps) {
  const apiPeriod = periodToApi[period] ?? "7d"
  const { data, isLoading, isError, error } = useDashboardKpis(apiPeriod)

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-[160px]" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i} className="bg-card border-border">
              <CardContent className="p-5 space-y-3">
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
        <AlertTitle>Erro ao carregar métricas</AlertTitle>
        <AlertDescription>
          {error instanceof Error ? error.message : "Falha na API"}
        </AlertDescription>
      </Alert>
    )
  }

  if (!data) {
    return null
  }

  const avgSec = (data.avgProcessingTimeMs / 1000).toFixed(1)

  const metrics = [
    {
      name: "E-mails Processados",
      value: nf.format(data.emailsProcessed),
      change: "—",
      trend: "up" as const,
      description:
        period === "today"
          ? "Hoje"
          : period === "7d"
            ? "Últimos 7 dias"
            : period === "30d"
              ? "Últimos 30 dias"
              : "Período personalizado",
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Métricas</h2>
          <p className="text-sm text-muted-foreground">Visão geral do desempenho dos agentes</p>
        </div>
        <Select value={period} onValueChange={onPeriodChange}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Selecionar período" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Hoje</SelectItem>
            <SelectItem value="7d">Últimos 7 dias</SelectItem>
            <SelectItem value="30d">Últimos 30 dias</SelectItem>
            <SelectItem value="custom">Período customizado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {metrics.map((metric) => (
          <Card key={metric.name} className="bg-card border-border">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-2 flex-1">
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
                <div className={cn("p-2.5 rounded-lg shrink-0", metric.iconBg)}>
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
