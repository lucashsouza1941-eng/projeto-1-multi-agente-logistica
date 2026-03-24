"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Mail, 
  FileText, 
  AlertTriangle, 
  Pause, 
  RotateCcw, 
  ScrollText, 
  Settings,
  Activity,
  Clock,
  CheckCircle2,
  Layers
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { Agent, AgentStatus } from "./agent-grid"

interface AgentCardProps {
  agent: Agent
  onClick: () => void
}

const statusConfig: Record<AgentStatus, { label: string; className: string }> = {
  online: {
    label: "Online",
    className: "bg-success/20 text-success border-success/30"
  },
  offline: {
    label: "Offline",
    className: "bg-destructive/20 text-destructive border-destructive/30"
  },
  processing: {
    label: "Processando",
    className: "bg-warning/20 text-warning border-warning/30"
  }
}

const agentIcons: Record<string, typeof Mail> = {
  "email-triage": Mail,
  "report-generator": FileText,
  "escalation": AlertTriangle
}

export function AgentCard({ agent, onClick }: AgentCardProps) {
  const status = statusConfig[agent.status]
  const Icon = agentIcons[agent.id] || Activity

  return (
    <Card 
      className="group cursor-pointer transition-all duration-200 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5"
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                {agent.name}
              </h3>
              <p className="text-xs text-muted-foreground">{agent.version}</p>
            </div>
          </div>
          <Badge variant="outline" className={cn("text-xs", status.className)}>
            <span className={cn(
              "mr-1.5 h-1.5 w-1.5 rounded-full",
              agent.status === "online" && "bg-success",
              agent.status === "offline" && "bg-destructive",
              agent.status === "processing" && "bg-warning animate-pulse"
            )} />
            {status.label}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
          {agent.description}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2 text-sm">
            <Activity className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Processados:</span>
            <span className="font-medium text-foreground ml-auto">
              {agent.metrics.processed.toLocaleString("pt-BR")}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Sucesso:</span>
            <span className="font-medium text-success ml-auto">
              {agent.metrics.successRate}%
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Tempo:</span>
            <span className="font-medium text-foreground ml-auto">
              {agent.metrics.avgResponseTime}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Layers className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Fila:</span>
            <span className="font-medium text-foreground ml-auto">
              {agent.metrics.queueSize}
            </span>
          </div>
        </div>

        <div className="pt-3 border-t border-border">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
            <span>Último processamento</span>
            <span className="font-medium text-foreground">{agent.lastProcessed}</span>
          </div>
          
          <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1 h-8 text-xs"
              disabled={agent.status === "offline"}
            >
              <Pause className="h-3.5 w-3.5 mr-1.5" />
              Pausar
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1 h-8 text-xs"
            >
              <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
              Reiniciar
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="h-8 w-8 p-0"
            >
              <ScrollText className="h-3.5 w-3.5" />
              <span className="sr-only">Ver Logs</span>
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="h-8 w-8 p-0"
            >
              <Settings className="h-3.5 w-3.5" />
              <span className="sr-only">Configurar</span>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
