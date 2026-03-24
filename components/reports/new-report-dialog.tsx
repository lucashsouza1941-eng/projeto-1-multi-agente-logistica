"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import {
  FileText,
  Calendar,
  Settings2,
  Sparkles,
} from "lucide-react"

interface NewReportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: { type: string; period: string; title: string }) => void
}

export function NewReportDialog({ open, onOpenChange, onSubmit }: NewReportDialogProps) {
  const [formData, setFormData] = useState({
    title: "",
    type: "",
    period: "",
    customPeriodStart: "",
    customPeriodEnd: "",
    includeCharts: true,
    includeRecommendations: true,
    includeRawData: false,
    additionalNotes: "",
  })

  const handleSubmit = () => {
    const period = formData.period === "custom" 
      ? `${formData.customPeriodStart} - ${formData.customPeriodEnd}`
      : formData.period === "today" ? "Hoje"
      : formData.period === "week" ? "Última Semana"
      : formData.period === "month" ? "Último Mês"
      : formData.period === "quarter" ? "Último Trimestre"
      : formData.period

    onSubmit({
      type: formData.type,
      period,
      title: formData.title || `Relatório de ${formData.type === "performance" ? "Performance" : formData.type === "triage" ? "Triagem" : formData.type === "escalation" ? "Escalonamento" : formData.type === "summary" ? "Resumo" : "Análise"}`,
    })

    setFormData({
      title: "",
      type: "",
      period: "",
      customPeriodStart: "",
      customPeriodEnd: "",
      includeCharts: true,
      includeRecommendations: true,
      includeRawData: false,
      additionalNotes: "",
    })
    onOpenChange(false)
  }

  const isValid = formData.type && (formData.period && (formData.period !== "custom" || (formData.customPeriodStart && formData.customPeriodEnd)))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle>Novo Relatório</DialogTitle>
              <DialogDescription>
                Configure os parâmetros para gerar um novo relatório
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Título do Relatório (opcional)</Label>
            <Input
              id="title"
              placeholder="Ex: Análise Semanal de Performance"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label>Tipo de Relatório</Label>
            <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="performance">Performance dos Agentes</SelectItem>
                <SelectItem value="triage">Análise de Triagem</SelectItem>
                <SelectItem value="escalation">Relatório de Escalonamentos</SelectItem>
                <SelectItem value="summary">Resumo Executivo</SelectItem>
                <SelectItem value="custom">Relatório Customizado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Período
            </Label>
            <Select value={formData.period} onValueChange={(value) => setFormData({ ...formData, period: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Hoje</SelectItem>
                <SelectItem value="week">Última Semana</SelectItem>
                <SelectItem value="month">Último Mês</SelectItem>
                <SelectItem value="quarter">Último Trimestre</SelectItem>
                <SelectItem value="custom">Período Customizado</SelectItem>
              </SelectContent>
            </Select>

            {formData.period === "custom" && (
              <div className="grid grid-cols-2 gap-3 mt-3">
                <div className="space-y-1">
                  <Label className="text-xs">Data Inicial</Label>
                  <Input
                    type="date"
                    value={formData.customPeriodStart}
                    onChange={(e) => setFormData({ ...formData, customPeriodStart: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Data Final</Label>
                  <Input
                    type="date"
                    value={formData.customPeriodEnd}
                    onChange={(e) => setFormData({ ...formData, customPeriodEnd: e.target.value })}
                  />
                </div>
              </div>
            )}
          </div>

          <Separator />

          <div className="space-y-4">
            <Label className="flex items-center gap-2">
              <Settings2 className="h-4 w-4" />
              Opções do Relatório
            </Label>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-normal">Incluir gráficos</Label>
                <p className="text-xs text-muted-foreground">Visualizações de dados e tendências</p>
              </div>
              <Switch
                checked={formData.includeCharts}
                onCheckedChange={(checked) => setFormData({ ...formData, includeCharts: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-normal">Incluir recomendações</Label>
                <p className="text-xs text-muted-foreground">Sugestões geradas pela IA</p>
              </div>
              <Switch
                checked={formData.includeRecommendations}
                onCheckedChange={(checked) => setFormData({ ...formData, includeRecommendations: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-normal">Incluir dados brutos</Label>
                <p className="text-xs text-muted-foreground">Tabelas detalhadas para análise</p>
              </div>
              <Switch
                checked={formData.includeRawData}
                onCheckedChange={(checked) => setFormData({ ...formData, includeRawData: checked })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notas Adicionais</Label>
            <Textarea
              id="notes"
              placeholder="Instruções ou contexto adicional para o gerador de relatórios..."
              value={formData.additionalNotes}
              onChange={(e) => setFormData({ ...formData, additionalNotes: e.target.value })}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={!isValid}>
            <Sparkles className="h-4 w-4 mr-2" />
            Gerar Relatório
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
