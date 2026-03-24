"use client"

import { useState } from "react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { 
  Mail, 
  FileText, 
  AlertTriangle, 
  Activity,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Play,
  Pause,
  RotateCcw,
  Download
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { Agent, AgentStatus } from "./agent-grid"

interface AgentDrawerProps {
  agent: Agent | null
  open: boolean
  onClose: () => void
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

interface LogEntry {
  id: string
  timestamp: string
  level: "info" | "warning" | "error" | "success"
  message: string
}

const mockLogs: LogEntry[] = [
  { id: "1", timestamp: "14:32:45", level: "success", message: "E-mail processado com sucesso: ID #45821" },
  { id: "2", timestamp: "14:32:44", level: "info", message: "Iniciando análise de conteúdo..." },
  { id: "3", timestamp: "14:32:43", level: "info", message: "E-mail recebido: Solicitação de Cotação - Cliente ABC" },
  { id: "4", timestamp: "14:32:40", level: "warning", message: "Tempo de resposta acima do esperado: 2.1s" },
  { id: "5", timestamp: "14:32:38", level: "success", message: "E-mail processado com sucesso: ID #45820" },
  { id: "6", timestamp: "14:32:35", level: "info", message: "Classificado como: Urgente - Ação Requerida" },
  { id: "7", timestamp: "14:32:33", level: "error", message: "Falha ao conectar com serviço de NLP. Tentando novamente..." },
  { id: "8", timestamp: "14:32:30", level: "success", message: "Reconexão estabelecida com sucesso" },
  { id: "9", timestamp: "14:32:28", level: "info", message: "E-mail recebido: RE: Atraso na Entrega - Pedido #7823" },
  { id: "10", timestamp: "14:32:25", level: "success", message: "E-mail processado com sucesso: ID #45819" },
]

interface HistoryEntry {
  id: string
  date: string
  processed: number
  successRate: number
  avgTime: string
}

const mockHistory: HistoryEntry[] = [
  { id: "1", date: "Hoje", processed: 1284, successRate: 98.7, avgTime: "1.2s" },
  { id: "2", date: "Ontem", processed: 2156, successRate: 98.9, avgTime: "1.1s" },
  { id: "3", date: "14/03", processed: 1987, successRate: 99.1, avgTime: "1.0s" },
  { id: "4", date: "13/03", processed: 2234, successRate: 98.5, avgTime: "1.3s" },
  { id: "5", date: "12/03", processed: 1876, successRate: 98.8, avgTime: "1.2s" },
  { id: "6", date: "11/03", processed: 2102, successRate: 99.0, avgTime: "1.1s" },
  { id: "7", date: "10/03", processed: 1945, successRate: 98.6, avgTime: "1.2s" },
]

const logIcons = {
  info: AlertCircle,
  warning: AlertTriangle,
  error: XCircle,
  success: CheckCircle2
}

const logColors = {
  info: "text-muted-foreground",
  warning: "text-warning",
  error: "text-destructive",
  success: "text-success"
}

export function AgentDrawer({ agent, open, onClose }: AgentDrawerProps) {
  const [autoRetry, setAutoRetry] = useState(true)
  const [notifications, setNotifications] = useState(true)
  const [concurrency, setConcurrency] = useState([5])
  const [priority, setPriority] = useState([50])

  if (!agent) return null

  const status = statusConfig[agent.status]
  const Icon = agentIcons[agent.id] || Activity

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-xl overflow-hidden flex flex-col">
        <SheetHeader className="flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <SheetTitle className="text-left">{agent.name}</SheetTitle>
              <SheetDescription className="text-left">{agent.version}</SheetDescription>
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
          
          <div className="flex gap-2 pt-4">
            <Button 
              variant={agent.status === "online" ? "outline" : "default"}
              size="sm" 
              className="flex-1"
            >
              {agent.status === "online" ? (
                <>
                  <Pause className="h-4 w-4 mr-2" />
                  Pausar
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Iniciar
                </>
              )}
            </Button>
            <Button variant="outline" size="sm" className="flex-1">
              <RotateCcw className="h-4 w-4 mr-2" />
              Reiniciar
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4" />
              <span className="sr-only">Exportar</span>
            </Button>
          </div>
        </SheetHeader>

        <Tabs defaultValue="logs" className="flex-1 mt-6 flex flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-3 flex-shrink-0">
            <TabsTrigger value="logs">Logs</TabsTrigger>
            <TabsTrigger value="config">Configurações</TabsTrigger>
            <TabsTrigger value="history">Histórico</TabsTrigger>
          </TabsList>

          <TabsContent value="logs" className="flex-1 overflow-hidden mt-4">
            <Card className="h-full flex flex-col">
              <CardHeader className="py-3 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">Logs em Tempo Real</CardTitle>
                  <Badge variant="secondary" className="text-xs">
                    <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse mr-1.5" />
                    Ao vivo
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="flex-1 overflow-hidden p-0">
                <ScrollArea className="h-[400px] px-4 pb-4">
                  <div className="space-y-2">
                    {mockLogs.map((log) => {
                      const LogIcon = logIcons[log.level]
                      return (
                        <div 
                          key={log.id} 
                          className="flex items-start gap-2 text-sm py-2 border-b border-border/50 last:border-0"
                        >
                          <LogIcon className={cn("h-4 w-4 mt-0.5 flex-shrink-0", logColors[log.level])} />
                          <span className="text-muted-foreground font-mono text-xs w-16 flex-shrink-0">
                            {log.timestamp}
                          </span>
                          <span className="text-foreground">{log.message}</span>
                        </div>
                      )
                    })}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="config" className="flex-1 overflow-hidden mt-4">
            <ScrollArea className="h-[450px]">
              <div className="space-y-6 pr-4">
                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm font-medium">Comportamento</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="auto-retry">Auto Retry</Label>
                        <p className="text-xs text-muted-foreground">
                          Tentar novamente em caso de falha
                        </p>
                      </div>
                      <Switch
                        id="auto-retry"
                        checked={autoRetry}
                        onCheckedChange={setAutoRetry}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="notifications">Notificações</Label>
                        <p className="text-xs text-muted-foreground">
                          Alertar sobre erros e eventos
                        </p>
                      </div>
                      <Switch
                        id="notifications"
                        checked={notifications}
                        onCheckedChange={setNotifications}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm font-medium">Performance</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label>Concorrência</Label>
                        <span className="text-sm text-muted-foreground">{concurrency[0]} tarefas</span>
                      </div>
                      <Slider
                        value={concurrency}
                        onValueChange={setConcurrency}
                        max={20}
                        min={1}
                        step={1}
                      />
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label>Prioridade</Label>
                        <span className="text-sm text-muted-foreground">{priority[0]}%</span>
                      </div>
                      <Slider
                        value={priority}
                        onValueChange={setPriority}
                        max={100}
                        min={0}
                        step={10}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm font-medium">Informações</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <dl className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Versão</dt>
                        <dd className="font-medium">{agent.version}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Uptime</dt>
                        <dd className="font-medium">{agent.uptime}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Última atualização</dt>
                        <dd className="font-medium">12/03/2026</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Modelo IA</dt>
                        <dd className="font-medium">GPT-4o</dd>
                      </div>
                    </dl>
                  </CardContent>
                </Card>
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="history" className="flex-1 overflow-hidden mt-4">
            <Card className="h-full flex flex-col">
              <CardHeader className="py-3 flex-shrink-0">
                <CardTitle className="text-sm font-medium">Histórico de Performance</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 overflow-hidden p-0">
                <ScrollArea className="h-[400px] px-4 pb-4">
                  <div className="space-y-2">
                    {mockHistory.map((entry) => (
                      <div 
                        key={entry.id}
                        className="flex items-center justify-between py-3 border-b border-border/50 last:border-0"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">{entry.date}</p>
                            <p className="text-xs text-muted-foreground">
                              {entry.processed.toLocaleString("pt-BR")} processados
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-success">{entry.successRate}%</p>
                          <p className="text-xs text-muted-foreground">{entry.avgTime} avg</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  )
}
