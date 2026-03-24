"use client"

import { useMemo, useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Mail, FileText, AlertTriangle, Bot, RefreshCw, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { useDashboardActivity } from "@/hooks/use-dashboard-activity"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import type { DashboardActivityItem } from "@/lib/api"

type ActivityType = "email" | "report" | "escalation"
type ActivityStatus = "success" | "warning" | "resolved" | "pending"

interface Activity {
  id: string
  type: ActivityType
  action: string
  description: string
  agent: string
  timestamp: Date
  status: ActivityStatus
}

const typeConfig = {
  email: { icon: Mail, color: "text-chart-1", bg: "bg-chart-1/20" },
  report: { icon: FileText, color: "text-chart-2", bg: "bg-chart-2/20" },
  escalation: { icon: AlertTriangle, color: "text-chart-4", bg: "bg-chart-4/20" },
}

const statusConfig = {
  success: { label: "Concluído", color: "bg-success/20 text-success border-success/30" },
  warning: { label: "Atenção", color: "bg-chart-4/20 text-chart-4 border-chart-4/30" },
  resolved: { label: "Resolvido", color: "bg-chart-2/20 text-chart-2 border-chart-2/30" },
  pending: { label: "Pendente", color: "bg-chart-3/20 text-chart-3 border-chart-3/30" },
}

function mapApiItem(item: DashboardActivityItem, index: number): Activity {
  const types: ActivityType[] = ["email", "report", "escalation"]
  const type = types[index % 3]
  const status: ActivityStatus = item.status === "success" ? "success" : "warning"
  return {
    id: item.id,
    type,
    action: item.action,
    description: `Registrado para ${item.agentName}`,
    agent: item.agentName,
    timestamp: new Date(item.timestamp),
    status,
  }
}

export function ActivityFeed() {
  const [isLive, setIsLive] = useState(true)
  const [mounted, setMounted] = useState(false)
  const { data, isLoading, isError, error, isFetching } = useDashboardActivity(50, isLive)

  useEffect(() => {
    setMounted(true)
  }, [])

  const activities = useMemo(() => (data ?? []).map(mapApiItem), [data])

  const formatTime = (date: Date) => {
    if (!mounted) {
      return date.toLocaleString("pt-BR", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })
    }
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    if (minutes < 1) return "Agora mesmo"
    if (minutes < 60) return `${minutes} min atrás`
    if (hours < 24) return `${hours}h atrás`
    return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })
  }

  if (isLoading) {
    return (
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-3 px-4 pb-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </CardContent>
      </Card>
    )
  }

  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Feed de atividade</AlertTitle>
        <AlertDescription>
          {error instanceof Error ? error.message : "Erro ao carregar"}
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CardTitle className="text-base font-semibold">Feed de Atividade</CardTitle>
            <Badge
              variant="outline"
              className={cn(
                "text-xs transition-colors",
                isLive ? "border-success/50 text-success" : "border-muted",
              )}
            >
              <span
                className={cn(
                  "mr-1.5 h-1.5 w-1.5 rounded-full",
                  isLive ? "bg-success animate-pulse" : "bg-muted-foreground",
                )}
              />
              {isLive ? "Ao vivo" : "Pausado"}
            </Badge>
            {isFetching && isLive && (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            )}
          </div>
          <Button variant="ghost" size="sm" className="text-xs" onClick={() => setIsLive(!isLive)}>
            <RefreshCw className={cn("mr-1 h-3 w-3", isLive && "animate-spin")} />
            {isLive ? "Pausar" : "Retomar"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="h-[400px] overflow-y-auto px-4 pb-4">
          <div className="relative">
            <div className="absolute left-[19px] top-3 bottom-3 w-px bg-border" />
            <div className="space-y-1">
              {activities.map((activity) => {
                const typeInfo = typeConfig[activity.type]
                const statusInfo = statusConfig[activity.status]
                const Icon = typeInfo.icon
                return (
                  <div
                    key={activity.id}
                    className="relative flex gap-4 py-3 pl-2 pr-3 rounded-lg hover:bg-secondary/30 transition-colors"
                  >
                    <div className={cn("relative z-10 p-2 rounded-lg shrink-0", typeInfo.bg)}>
                      <Icon className={cn("h-4 w-4", typeInfo.color)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-foreground">{activity.action}</p>
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            {activity.description}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Bot className="h-3 w-3" />
                            <span>{activity.agent}</span>
                            <span>•</span>
                            <span>{formatTime(activity.timestamp)}</span>
                          </div>
                        </div>
                        <Badge
                          variant="outline"
                          className={cn("text-[10px] shrink-0 border", statusInfo.color)}
                        >
                          {statusInfo.label}
                        </Badge>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
