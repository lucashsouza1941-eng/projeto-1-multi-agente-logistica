"use client"

import { useState } from "react"
import { toast } from "sonner"
import { useQueryClient } from "@tanstack/react-query"
import { AppDashboardLayout } from "@/components/layout/app-dashboard-layout"
import { useEscalationTickets } from "@/hooks/use-escalation-tickets"
import { useUpdateTicketStatus } from "@/hooks/use-update-ticket-status"
import { createEscalationTicket } from "@/lib/api"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toUserFriendlyError } from "@/lib/user-friendly-error"

const STATUSES = [
  { value: "NEW", label: "Novo" },
  { value: "ANALYZING", label: "Em análise" },
  { value: "ESCALATED", label: "Escalado" },
  { value: "RESOLVED", label: "Resolvido" },
]

const PRIORITIES = [
  { value: "low", label: "Baixa" },
  { value: "medium", label: "Média" },
  { value: "high", label: "Alta" },
  { value: "critical", label: "Crítica" },
]

export default function EscalationsPage() {
  const qc = useQueryClient()
  const { data, isLoading, isError, error } = useEscalationTickets()
  const updateMut = useUpdateTicketStatus()
  const [subject, setSubject] = useState("")
  const [description, setDescription] = useState("")
  const [priority, setPriority] = useState("medium")
  const [creating, setCreating] = useState(false)

  async function onCreateTicket(e: React.FormEvent) {
    e.preventDefault()
    if (!subject.trim() || !description.trim()) {
      toast.error("Preencha assunto e descrição.")
      return
    }
    setCreating(true)
    try {
      await createEscalationTicket({
        subject: subject.trim(),
        description: description.trim(),
        priority,
      })
      setSubject("")
      setDescription("")
      setPriority("medium")
      await qc.invalidateQueries({ queryKey: ["escalation", "tickets"] })
      toast.success("Ticket criado", { description: "Aparece na lista abaixo." })
    } catch (err) {
      toast.error("Não foi possível criar o ticket", {
        description: err instanceof Error ? err.message : "Erro desconhecido",
      })
    } finally {
      setCreating(false)
    }
  }

  const onChangeStatus = (id: string, status: string) => {
    updateMut.mutate(
      { id, status },
      {
        onSuccess: () =>
          toast.success("Ticket atualizado", {
            description: "O novo status foi registrado.",
          }),
        onError: (e) =>
          toast.error("Não foi possível atualizar", {
            description: toUserFriendlyError(e),
          }),
      },
    )
  }

  return (
    <AppDashboardLayout
      breadcrumbs={[
        { label: "LogiAgent", href: "/" },
        { label: "Escalonamentos", href: "/escalations" },
      ]}
    >
      <main className="flex-1 overflow-auto p-4 sm:p-6">
        <div className="mx-auto max-w-4xl space-y-6">
          <div>
            <h1 className="text-xl font-semibold text-foreground sm:text-2xl">
              Escalonamentos
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Acompanhe tickets criados automaticamente ou manualmente.
            </p>
          </div>

          <Card className="border-border bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Novo ticket</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={onCreateTicket} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="ticket-subject">Assunto</Label>
                  <Input
                    id="ticket-subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Resumo da ocorrência"
                    autoComplete="off"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ticket-description">Descrição</Label>
                  <Textarea
                    id="ticket-description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Detalhes para a equipa"
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ticket-priority">Prioridade</Label>
                  <Select value={priority} onValueChange={setPriority}>
                    <SelectTrigger id="ticket-priority" className="w-full sm:w-[220px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PRIORITIES.map((p) => (
                        <SelectItem key={p.value} value={p.value}>
                          {p.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" disabled={creating}>
                  {creating ? "A criar…" : "Criar ticket"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {isError && (
            <Alert variant="destructive">
              <AlertTitle>Erro ao carregar tickets</AlertTitle>
              <AlertDescription>{toUserFriendlyError(error)}</AlertDescription>
            </Alert>
          )}

          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-28 w-full rounded-lg" />
              ))}
            </div>
          ) : !data?.length ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/20 px-6 py-16 text-center">
              <p className="text-sm font-medium text-foreground">
                Nenhum ticket de escalação
              </p>
              <p className="mt-2 max-w-md text-xs text-muted-foreground sm:text-sm">
                Tickets aparecem quando a triagem identificar prioridade alta ou quando você criar ocorrências pela API.
              </p>
            </div>
          ) : (
            <ul className="space-y-4">
              {data.map((t) => (
                <li key={t.id}>
                  <Card className="border-border bg-card">
                    <CardHeader className="pb-2">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <CardTitle className="text-base font-medium leading-snug">
                          {t.subject}
                        </CardTitle>
                        <Badge variant="outline" className="w-fit capitalize">
                          {t.priority}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-xs text-muted-foreground">
                        Aberto em{" "}
                        {new Date(t.createdAt).toLocaleString("pt-BR")}
                      </p>
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        <span className="text-sm text-muted-foreground">
                          Status
                        </span>
                        <Select
                          value={t.status}
                          onValueChange={(v) => onChangeStatus(t.id, v)}
                          disabled={updateMut.isPending}
                        >
                          <SelectTrigger className="w-full sm:w-[200px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {STATUSES.map((s) => (
                              <SelectItem key={s.value} value={s.value}>
                                {s.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </AppDashboardLayout>
  )
}
