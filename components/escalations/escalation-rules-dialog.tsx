"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { 
  Plus, 
  Trash2, 
  GripVertical,
  Clock,
  DollarSign,
  AlertTriangle,
  Users,
  Mail,
  Bot
} from "lucide-react"

interface EscalationRulesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface EscalationRule {
  id: string
  name: string
  condition: string
  action: string
  priority: "critical" | "high" | "medium" | "low"
  enabled: boolean
  icon: React.ReactNode
}

const defaultRules: EscalationRule[] = [
  {
    id: "1",
    name: "Cliente VIP",
    condition: "Cliente com tag VIP ou faturamento > R$ 100k/mês",
    action: "Escalar para gerência imediatamente",
    priority: "critical",
    enabled: true,
    icon: <Users className="h-4 w-4" />
  },
  {
    id: "2",
    name: "Valor Alto",
    condition: "Reembolso ou reclamação > R$ 5.000",
    action: "Escalar para aprovação financeira",
    priority: "high",
    enabled: true,
    icon: <DollarSign className="h-4 w-4" />
  },
  {
    id: "3",
    name: "Tempo de Resposta",
    condition: "Ticket sem resposta há mais de 4 horas",
    action: "Notificar supervisor e aumentar prioridade",
    priority: "high",
    enabled: true,
    icon: <Clock className="h-4 w-4" />
  },
  {
    id: "4",
    name: "Reclamação Recorrente",
    condition: "3+ reclamações do mesmo cliente em 30 dias",
    action: "Criar caso especial e atribuir analista dedicado",
    priority: "medium",
    enabled: true,
    icon: <AlertTriangle className="h-4 w-4" />
  },
  {
    id: "5",
    name: "Falha de Integração",
    condition: "Erro de API com taxa > 5% em 1 hora",
    action: "Notificar equipe técnica e criar ticket de incidente",
    priority: "critical",
    enabled: true,
    icon: <Bot className="h-4 w-4" />
  },
  {
    id: "6",
    name: "Baixa Confiança IA",
    condition: "Classificação com confiança < 70%",
    action: "Marcar para revisão manual",
    priority: "low",
    enabled: false,
    icon: <Mail className="h-4 w-4" />
  },
]

const priorityColors = {
  critical: "bg-red-500/10 text-red-400 border-red-500/20",
  high: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  medium: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  low: "bg-blue-500/10 text-blue-400 border-blue-500/20",
}

export function EscalationRulesDialog({ open, onOpenChange }: EscalationRulesDialogProps) {
  const [rules, setRules] = useState<EscalationRule[]>(defaultRules)
  const [showNewRuleForm, setShowNewRuleForm] = useState(false)
  const [autoEscalationTime, setAutoEscalationTime] = useState([4])
  const [confidenceThreshold, setConfidenceThreshold] = useState([70])

  const toggleRule = (ruleId: string) => {
    setRules(prev => prev.map(rule => 
      rule.id === ruleId ? { ...rule, enabled: !rule.enabled } : rule
    ))
  }

  const deleteRule = (ruleId: string) => {
    setRules(prev => prev.filter(rule => rule.id !== ruleId))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] p-0 flex flex-col">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle>Regras de Escalonamento</DialogTitle>
          <DialogDescription>
            Configure as regras automáticas para escalonamento de tickets pelos agentes de IA.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 px-6">
          <div className="space-y-6 pb-6">
            {/* Global Settings */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-foreground">Configurações Globais</h3>
              
              <div className="grid gap-4 rounded-lg border border-border p-4 bg-secondary/30">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Tempo para auto-escalonamento</Label>
                    <span className="text-sm text-muted-foreground">{autoEscalationTime[0]} horas</span>
                  </div>
                  <Slider
                    value={autoEscalationTime}
                    onValueChange={setAutoEscalationTime}
                    max={24}
                    min={1}
                    step={1}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">
                    Tickets sem resposta serão escalonados automaticamente após este período.
                  </p>
                </div>

                <Separator />

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Limite de confiança para revisão</Label>
                    <span className="text-sm text-muted-foreground">{confidenceThreshold[0]}%</span>
                  </div>
                  <Slider
                    value={confidenceThreshold}
                    onValueChange={setConfidenceThreshold}
                    max={100}
                    min={0}
                    step={5}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">
                    Classificações com confiança abaixo deste valor serão marcadas para revisão.
                  </p>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-sm">Notificações em tempo real</Label>
                    <p className="text-xs text-muted-foreground">
                      Receber alertas imediatos para escalonamentos críticos
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-sm">Escalonamento automático ativo</Label>
                    <p className="text-xs text-muted-foreground">
                      Permitir que agentes escalem tickets automaticamente
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>
            </div>

            <Separator />

            {/* Rules List */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-foreground">Regras de Escalonamento</h3>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => setShowNewRuleForm(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Regra
                </Button>
              </div>

              <div className="space-y-3">
                {rules.map((rule) => (
                  <div
                    key={rule.id}
                    className="flex items-start gap-3 rounded-lg border border-border p-4 bg-card transition-opacity"
                    style={{ opacity: rule.enabled ? 1 : 0.5 }}
                  >
                    <div className="flex items-center gap-2 pt-1">
                      <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary">
                        {rule.icon}
                      </div>
                    </div>

                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm text-foreground">{rule.name}</span>
                        <Badge variant="outline" className={priorityColors[rule.priority]}>
                          {rule.priority === "critical" ? "Crítica" : 
                           rule.priority === "high" ? "Alta" : 
                           rule.priority === "medium" ? "Média" : "Baixa"}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        <strong>Se:</strong> {rule.condition}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        <strong>Então:</strong> {rule.action}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Switch 
                        checked={rule.enabled}
                        onCheckedChange={() => toggleRule(rule.id)}
                      />
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => deleteRule(rule.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* New Rule Form */}
            {showNewRuleForm && (
              <>
                <Separator />
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-foreground">Nova Regra</h3>
                  <div className="grid gap-4 rounded-lg border border-border p-4 bg-secondary/30">
                    <div className="grid gap-2">
                      <Label htmlFor="rule-name">Nome da Regra</Label>
                      <Input id="rule-name" placeholder="Ex: Cliente VIP" />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="rule-condition">Condição (Se)</Label>
                      <Input id="rule-condition" placeholder="Ex: Cliente com tag VIP" />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="rule-action">Ação (Então)</Label>
                      <Input id="rule-action" placeholder="Ex: Escalar para gerência" />
                    </div>
                    <div className="grid gap-2">
                      <Label>Prioridade</Label>
                      <Select defaultValue="medium">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="critical">Crítica</SelectItem>
                          <SelectItem value="high">Alta</SelectItem>
                          <SelectItem value="medium">Média</SelectItem>
                          <SelectItem value="low">Baixa</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setShowNewRuleForm(false)}>
                        Cancelar
                      </Button>
                      <Button onClick={() => setShowNewRuleForm(false)}>
                        Adicionar Regra
                      </Button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </ScrollArea>

        <div className="p-4 border-t border-border flex justify-end gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={() => onOpenChange(false)}>
            Salvar Configurações
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
