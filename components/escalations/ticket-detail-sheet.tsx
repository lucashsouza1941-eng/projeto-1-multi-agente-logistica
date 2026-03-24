"use client"

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { 
  Clock, 
  Bot, 
  User, 
  ArrowRight, 
  MessageSquare,
  CheckCircle2,
  AlertTriangle,
  UserPlus,
  Send
} from "lucide-react"
import type { EscalationTicket, TimelineEvent, TicketPriority } from "@/types/escalation-ui"
import { useState } from "react"

interface TicketDetailSheetProps {
  ticket: EscalationTicket | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

const priorityConfig: Record<TicketPriority, { label: string; color: string }> = {
  critical: { label: "Crítica", color: "bg-red-500/10 text-red-400 border-red-500/20" },
  high: { label: "Alta", color: "bg-orange-500/10 text-orange-400 border-orange-500/20" },
  medium: { label: "Média", color: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" },
  low: { label: "Baixa", color: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
}

const statusConfig = {
  new: { label: "Novo", color: "bg-blue-500/10 text-blue-400" },
  analyzing: { label: "Em Análise", color: "bg-yellow-500/10 text-yellow-400" },
  escalated: { label: "Escalonado", color: "bg-orange-500/10 text-orange-400" },
  resolved: { label: "Resolvido", color: "bg-green-500/10 text-green-400" },
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  })
}

function TimelineEventIcon({ type }: { type: TimelineEvent["type"] }) {
  switch (type) {
    case "ai_decision":
      return <Bot className="h-4 w-4 text-primary" />
    case "human_action":
      return <User className="h-4 w-4 text-green-400" />
    case "status_change":
      return <ArrowRight className="h-4 w-4 text-yellow-400" />
    case "assignment":
      return <UserPlus className="h-4 w-4 text-blue-400" />
    default:
      return <MessageSquare className="h-4 w-4 text-muted-foreground" />
  }
}

function TimelineEventBadge({ type }: { type: TimelineEvent["type"] }) {
  const config = {
    ai_decision: { label: "Decisão IA", color: "bg-primary/10 text-primary" },
    human_action: { label: "Ação Humana", color: "bg-green-500/10 text-green-400" },
    status_change: { label: "Status", color: "bg-yellow-500/10 text-yellow-400" },
    assignment: { label: "Atribuição", color: "bg-blue-500/10 text-blue-400" },
  }
  const { label, color } = config[type]
  return <Badge variant="outline" className={cn("text-xs", color)}>{label}</Badge>
}

export function TicketDetailSheet({ ticket, open, onOpenChange }: TicketDetailSheetProps) {
  const [comment, setComment] = useState("")

  if (!ticket) return null

  const priority = priorityConfig[ticket.priority]
  const status = statusConfig[ticket.status]

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl p-0 flex flex-col">
        <SheetHeader className="p-6 pb-4 border-b border-border">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground font-mono">{ticket.id}</p>
              <SheetTitle className="text-lg font-semibold leading-tight">
                {ticket.subject}
              </SheetTitle>
            </div>
          </div>
          <div className="flex items-center gap-2 pt-2">
            <Badge variant="outline" className={priority.color}>
              {priority.label}
            </Badge>
            <Badge variant="outline" className={status.color}>
              {status.label}
            </Badge>
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1">
          <div className="p-6 space-y-6">
            {/* Details */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-foreground">Detalhes</h3>
              <div className="rounded-lg border border-border bg-secondary/30 p-4">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {ticket.description}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground mb-1">Origem</p>
                  <div className="flex items-center gap-2">
                    <Bot className="h-4 w-4 text-primary" />
                    <span className="text-foreground">{ticket.source}</span>
                  </div>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Responsável</p>
                  {ticket.assignee ? (
                    <div className="flex items-center gap-2">
                      <Avatar className="h-5 w-5">
                        <AvatarFallback className="text-[10px]">
                          {ticket.assignee.split(" ").map(n => n[0]).join("")}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-foreground">{ticket.assignee}</span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">Não atribuído</span>
                  )}
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Criado em</p>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-foreground">{formatDate(ticket.createdAt)}</span>
                  </div>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Atualizado em</p>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-foreground">{formatDate(ticket.updatedAt)}</span>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Timeline */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-foreground">Timeline de Eventos</h3>
              <div className="space-y-4">
                {ticket.timeline.map((event, index) => (
                  <div key={event.id} className="relative pl-6">
                    {index < ticket.timeline.length - 1 && (
                      <div className="absolute left-[9px] top-6 bottom-0 w-px bg-border" />
                    )}
                    <div className="absolute left-0 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-secondary border border-border">
                      <TimelineEventIcon type={event.type} />
                    </div>
                    <div className="rounded-lg border border-border bg-card p-3">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <TimelineEventBadge type={event.type} />
                          <span className="text-xs text-muted-foreground">
                            {event.actor}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(event.timestamp)}
                        </span>
                      </div>
                      <p className="text-sm text-foreground">{event.description}</p>
                      {event.metadata && (
                        <div className="mt-2 flex items-center gap-2">
                          {Object.entries(event.metadata).map(([key, value]) => (
                            <Badge key={key} variant="secondary" className="text-xs">
                              {key}: {value}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Actions */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-foreground">Ações</h3>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground">Alterar Status</label>
                  <Select defaultValue={ticket.status}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">Novo</SelectItem>
                      <SelectItem value="analyzing">Em Análise</SelectItem>
                      <SelectItem value="escalated">Escalonado</SelectItem>
                      <SelectItem value="resolved">Resolvido</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground">Atribuir para</label>
                  <Select defaultValue={ticket.assignee || ""}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Maria Santos">Maria Santos</SelectItem>
                      <SelectItem value="Carlos Oliveira">Carlos Oliveira</SelectItem>
                      <SelectItem value="Ana Costa">Ana Costa</SelectItem>
                      <SelectItem value="Pedro Lima">Pedro Lima</SelectItem>
                      <SelectItem value="Tech Team">Tech Team</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs text-muted-foreground">Adicionar Comentário</label>
                <Textarea
                  placeholder="Escreva um comentário ou atualização..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          </div>
        </ScrollArea>

        <div className="p-4 border-t border-border flex items-center justify-between gap-3">
          <Button variant="outline" className="text-destructive hover:text-destructive">
            <AlertTriangle className="h-4 w-4 mr-2" />
            Escalar
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="outline">
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Resolver
            </Button>
            <Button>
              <Send className="h-4 w-4 mr-2" />
              Salvar
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
