"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  X, 
  Mail, 
  User, 
  Clock, 
  Brain, 
  CheckCircle2, 
  AlertCircle,
  ArrowRight,
  ThumbsUp,
  ThumbsDown,
  RefreshCw
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { Email } from "@/app/email-triage/page"

interface EmailDetailPanelProps {
  email: Email
  onClose: () => void
}

const categoryConfig = {
  urgente: { label: "Urgente", className: "bg-red-500/10 text-red-400 border-red-500/20" },
  rotina: { label: "Rotina", className: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  spam: { label: "Spam", className: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20" },
  "acao-requerida": { label: "Ação Requerida", className: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
}

const priorityConfig = {
  alta: { label: "Alta", className: "bg-red-500/10 text-red-400" },
  media: { label: "Média", className: "bg-amber-500/10 text-amber-400" },
  baixa: { label: "Baixa", className: "bg-green-500/10 text-green-400" },
}

export function EmailDetailPanel({ email, onClose }: EmailDetailPanelProps) {
  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(dateString))
  }

  const actionMatches = email.actionTaken === email.suggestedAction

  return (
    <div className="w-[420px] border border-border rounded-lg bg-card flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h3 className="font-semibold text-foreground">Detalhes do E-mail</h3>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
          <X className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {/* Email Info */}
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 shrink-0">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground">{email.from}</p>
                <p className="text-sm text-muted-foreground truncate">{email.fromEmail}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>{formatDate(email.date)}</span>
            </div>

            <div className="flex items-center gap-2">
              <Badge 
                variant="outline" 
                className={cn("font-medium", categoryConfig[email.category].className)}
              >
                {categoryConfig[email.category].label}
              </Badge>
              <Badge 
                variant="secondary" 
                className={cn("font-medium", priorityConfig[email.priority].className)}
              >
                {priorityConfig[email.priority].label}
              </Badge>
            </div>
          </div>

          <Separator />

          {/* Subject & Preview */}
          <div className="space-y-3">
            <div className="flex items-start gap-2">
              <Mail className="h-4 w-4 text-muted-foreground mt-1 shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Assunto</p>
                <p className="font-medium text-foreground">{email.subject}</p>
              </div>
            </div>

            <Card className="bg-muted/30 border-border">
              <CardHeader className="pb-2 pt-3 px-3">
                <CardTitle className="text-xs text-muted-foreground uppercase tracking-wide">
                  Preview do E-mail
                </CardTitle>
              </CardHeader>
              <CardContent className="px-3 pb-3">
                <p className="text-sm text-foreground/80 leading-relaxed">
                  {email.preview}
                </p>
              </CardContent>
            </Card>
          </div>

          <Separator />

          {/* AI Reasoning */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Brain className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-foreground">Raciocínio da IA</span>
              <Badge variant="secondary" className="ml-auto">
                {email.confidence}% confiança
              </Badge>
            </div>

            <Card className="bg-primary/5 border-primary/10">
              <CardContent className="p-3">
                <p className="text-sm text-foreground/80 leading-relaxed">
                  {email.aiReasoning}
                </p>
              </CardContent>
            </Card>
          </div>

          <Separator />

          {/* Actions Comparison */}
          <div className="space-y-3">
            <p className="text-sm font-medium text-foreground">Ações</p>
            
            <div className="grid gap-3">
              <Card className="border-border">
                <CardContent className="p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="h-4 w-4 text-amber-500" />
                    <span className="text-xs text-muted-foreground uppercase tracking-wide">
                      Sugerida pela IA
                    </span>
                  </div>
                  <p className="text-sm font-medium text-foreground">{email.suggestedAction}</p>
                </CardContent>
              </Card>

              <div className="flex justify-center">
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </div>

              <Card className={cn(
                "border",
                actionMatches ? "border-green-500/20 bg-green-500/5" : "border-amber-500/20 bg-amber-500/5"
              )}>
                <CardContent className="p-3">
                  <div className="flex items-center gap-2 mb-2">
                    {actionMatches ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-amber-500" />
                    )}
                    <span className="text-xs text-muted-foreground uppercase tracking-wide">
                      Ação Tomada
                    </span>
                    {actionMatches && (
                      <Badge variant="secondary" className="ml-auto text-xs bg-green-500/10 text-green-400">
                        Match
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm font-medium text-foreground">{email.actionTaken}</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </ScrollArea>

      {/* Actions Footer */}
      <div className="p-4 border-t border-border space-y-3">
        <div className="flex items-center gap-2">
          <Button className="flex-1 gap-2" variant="default">
            <ThumbsUp className="h-4 w-4" />
            Aprovar
          </Button>
          <Button className="flex-1 gap-2" variant="outline">
            <ThumbsDown className="h-4 w-4" />
            Rejeitar
          </Button>
        </div>
        <Button className="w-full gap-2" variant="secondary">
          <RefreshCw className="h-4 w-4" />
          Re-classificar
        </Button>
      </div>
    </div>
  )
}
