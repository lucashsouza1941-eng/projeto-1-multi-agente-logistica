"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  Search,
  User,
  GripVertical
} from "lucide-react"
import type { EscalationTicket, TicketStatus, TicketPriority } from "@/app/escalations/page"

interface KanbanBoardProps {
  tickets: EscalationTicket[]
  onTicketMove: (ticketId: string, newStatus: TicketStatus) => void
  onTicketSelect: (ticket: EscalationTicket) => void
}

const columns: { id: TicketStatus; title: string; icon: React.ReactNode; color: string }[] = [
  { id: "new", title: "Novo", icon: <Clock className="h-4 w-4" />, color: "text-blue-400" },
  { id: "analyzing", title: "Em Análise", icon: <Search className="h-4 w-4" />, color: "text-yellow-400" },
  { id: "escalated", title: "Escalonado", icon: <AlertTriangle className="h-4 w-4" />, color: "text-orange-400" },
  { id: "resolved", title: "Resolvido", icon: <CheckCircle2 className="h-4 w-4" />, color: "text-green-400" },
]

const priorityConfig: Record<TicketPriority, { label: string; color: string; bgColor: string }> = {
  critical: { label: "Crítica", color: "text-red-400", bgColor: "bg-red-500/10 border-red-500/20" },
  high: { label: "Alta", color: "text-orange-400", bgColor: "bg-orange-500/10 border-orange-500/20" },
  medium: { label: "Média", color: "text-yellow-400", bgColor: "bg-yellow-500/10 border-yellow-500/20" },
  low: { label: "Baixa", color: "text-blue-400", bgColor: "bg-blue-500/10 border-blue-500/20" },
}

function formatTimeAgo(date: Date): string {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 60) return `${minutes}min`
  if (hours < 24) return `${hours}h`
  return `${days}d`
}

export function KanbanBoard({ tickets, onTicketMove, onTicketSelect }: KanbanBoardProps) {
  const [draggedTicket, setDraggedTicket] = useState<string | null>(null)
  const [dragOverColumn, setDragOverColumn] = useState<TicketStatus | null>(null)

  const handleDragStart = (e: React.DragEvent, ticketId: string) => {
    setDraggedTicket(ticketId)
    e.dataTransfer.effectAllowed = "move"
  }

  const handleDragOver = (e: React.DragEvent, columnId: TicketStatus) => {
    e.preventDefault()
    setDragOverColumn(columnId)
  }

  const handleDragLeave = () => {
    setDragOverColumn(null)
  }

  const handleDrop = (e: React.DragEvent, columnId: TicketStatus) => {
    e.preventDefault()
    if (draggedTicket) {
      onTicketMove(draggedTicket, columnId)
    }
    setDraggedTicket(null)
    setDragOverColumn(null)
  }

  const handleDragEnd = () => {
    setDraggedTicket(null)
    setDragOverColumn(null)
  }

  return (
    <div className="grid grid-cols-4 gap-4 h-[calc(100vh-280px)]">
      {columns.map((column) => {
        const columnTickets = tickets.filter((t) => t.status === column.id)
        const isDragOver = dragOverColumn === column.id

        return (
          <div
            key={column.id}
            className={cn(
              "flex flex-col rounded-lg border border-border bg-card/50 transition-colors",
              isDragOver && "border-primary/50 bg-primary/5"
            )}
            onDragOver={(e) => handleDragOver(e, column.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, column.id)}
          >
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-2">
                <span className={column.color}>{column.icon}</span>
                <h3 className="font-medium text-foreground">{column.title}</h3>
              </div>
              <Badge variant="secondary" className="text-xs">
                {columnTickets.length}
              </Badge>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {columnTickets.map((ticket) => {
                const priority = priorityConfig[ticket.priority]
                const isDragging = draggedTicket === ticket.id

                return (
                  <Card
                    key={ticket.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, ticket.id)}
                    onDragEnd={handleDragEnd}
                    onClick={() => onTicketSelect(ticket)}
                    className={cn(
                      "cursor-pointer transition-all hover:border-primary/50 group",
                      priority.bgColor,
                      isDragging && "opacity-50 scale-95"
                    )}
                  >
                    <CardHeader className="p-3 pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                        </div>
                        <Badge 
                          variant="outline" 
                          className={cn("text-xs shrink-0", priority.color)}
                        >
                          {priority.label}
                        </Badge>
                      </div>
                      <CardTitle className="text-sm font-medium leading-tight line-clamp-2">
                        {ticket.subject}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 pt-0">
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                        {ticket.description}
                      </p>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {ticket.assignee ? (
                            <div className="flex items-center gap-1.5">
                              <Avatar className="h-5 w-5">
                                <AvatarFallback className="text-[10px] bg-secondary">
                                  {ticket.assignee.split(" ").map(n => n[0]).join("")}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-xs text-muted-foreground truncate max-w-20">
                                {ticket.assignee.split(" ")[0]}
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                              <User className="h-4 w-4" />
                              <span className="text-xs">Não atribuído</span>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {formatTimeAgo(ticket.createdAt)}
                        </div>
                      </div>

                      <div className="mt-2 pt-2 border-t border-border/50">
                        <span className="text-[10px] text-muted-foreground">
                          {ticket.source} - {ticket.id}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}

              {columnTickets.length === 0 && (
                <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                  <p className="text-sm">Nenhum ticket</p>
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
