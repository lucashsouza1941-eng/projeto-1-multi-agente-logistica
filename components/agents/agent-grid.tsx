"use client"

import { useState, useMemo } from "react"
import { AgentCard } from "./agent-card"
import { AgentDrawer } from "./agent-drawer"
import { useAgents } from "@/hooks/use-agents"
import type { ApiAgent } from "@/lib/api"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { toUserFriendlyError } from "@/lib/user-friendly-error"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"

export type AgentStatus = "online" | "offline" | "processing"

export interface Agent {
  id: string
  name: string
  description: string
  status: AgentStatus
  metrics: {
    processed: number
    successRate: number
    avgResponseTime: string
    queueSize: number
  }
  lastProcessed: string
  uptime: string
  version: string
}

const DESC: Record<string, string> = {
  TRIAGE:
    "Classifica e-mails recebidos por urgência, categoria e ação necessária usando NLP avançado",
  REPORT:
    "Gera relatórios automatizados de logística, inventário e performance operacional",
  ESCALATION:
    "Detecta problemas críticos e escalona automaticamente para as equipes responsáveis",
}

function mapApi(a: ApiAgent): Agent {
  const idByType: Record<string, string> = {
    TRIAGE: "email-triage",
    REPORT: "report-generator",
    ESCALATION: "escalation",
  }
  const st: Record<string, AgentStatus> = {
    ONLINE: "online",
    OFFLINE: "offline",
    PROCESSING: "processing",
  }
  const processed = a.metrics?.processedToday ?? a.totalProcessed ?? 0
  const last = a.lastRunAt
    ? new Date(a.lastRunAt).toLocaleString("pt-BR", {
        dateStyle: "short",
        timeStyle: "short",
      })
    : "—"
  return {
    id: idByType[a.type] ?? a.id,
    name: a.name,
    description: DESC[a.type] ?? "Agente de IA",
    status: st[a.status] ?? "offline",
    metrics: {
      processed,
      successRate: Math.round(a.successRate * 10) / 10,
      avgResponseTime: "—",
      queueSize: 0,
    },
    lastProcessed: last,
    uptime: "—",
    version: "v1",
  }
}

export function AgentGrid() {
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const { data, isLoading, isError, error } = useAgents()

  const agents = useMemo(() => (data ?? []).map(mapApi), [data])

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6 space-y-4">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Erro ao carregar agentes</AlertTitle>
        <AlertDescription>{toUserFriendlyError(error)}</AlertDescription>
      </Alert>
    )
  }

  if (agents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/20 px-6 py-16 text-center">
        <p className="text-sm font-medium text-foreground">Nenhum agente cadastrado</p>
        <p className="mt-2 max-w-md text-xs text-muted-foreground sm:text-sm">
          Rode o seed do Prisma na API para registrar os agentes de triagem, relatório e escalação.
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {agents.map((agent) => (
          <AgentCard
            key={agent.id}
            agent={agent}
            onClick={() => {
              setSelectedAgent(agent)
              setDrawerOpen(true)
            }}
          />
        ))}
      </div>
      <AgentDrawer agent={selectedAgent} open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  )
}
