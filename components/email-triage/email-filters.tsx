"use client"

import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Calendar, Filter, RotateCcw } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface FilterState {
  category: string
  priority: string
  confidenceRange: [number, number]
  dateRange: string
}

interface EmailFiltersProps {
  filters: FilterState
  onFiltersChange: (filters: FilterState) => void
}

export function EmailFilters({ filters, onFiltersChange }: EmailFiltersProps) {
  const activeFiltersCount = [
    filters.category !== "all",
    filters.priority !== "all",
    filters.confidenceRange[0] > 0 || filters.confidenceRange[1] < 100,
    filters.dateRange !== "all",
  ].filter(Boolean).length

  const resetFilters = () => {
    onFiltersChange({
      category: "all",
      priority: "all",
      confidenceRange: [0, 100],
      dateRange: "all",
    })
  }

  return (
    <div className="flex flex-wrap items-center gap-3 mb-4 p-4 bg-card rounded-lg border border-border">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Filter className="h-4 w-4" />
        <span>Filtros</span>
        {activeFiltersCount > 0 && (
          <Badge variant="secondary" className="text-xs">
            {activeFiltersCount} ativo{activeFiltersCount > 1 ? "s" : ""}
          </Badge>
        )}
      </div>

      <div className="h-6 w-px bg-border" />

      <Select
        value={filters.category}
        onValueChange={(value) => onFiltersChange({ ...filters, category: value })}
      >
        <SelectTrigger className="w-[160px] h-9">
          <SelectValue placeholder="Categoria" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas Categorias</SelectItem>
          <SelectItem value="urgente">Urgente</SelectItem>
          <SelectItem value="rotina">Rotina</SelectItem>
          <SelectItem value="spam">Spam</SelectItem>
          <SelectItem value="acao-requerida">Ação Requerida</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={filters.priority}
        onValueChange={(value) => onFiltersChange({ ...filters, priority: value })}
      >
        <SelectTrigger className="w-[140px] h-9">
          <SelectValue placeholder="Prioridade" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas Prioridades</SelectItem>
          <SelectItem value="alta">Alta</SelectItem>
          <SelectItem value="media">Média</SelectItem>
          <SelectItem value="baixa">Baixa</SelectItem>
        </SelectContent>
      </Select>

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="h-9 gap-2">
            <span>Confiança: {filters.confidenceRange[0]}% - {filters.confidenceRange[1]}%</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80">
          <div className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Range de Confiança da IA</h4>
              <p className="text-xs text-muted-foreground">
                Filtre e-mails pela confiança do modelo de classificação
              </p>
            </div>
            <Slider
              value={filters.confidenceRange}
              onValueChange={(value) => onFiltersChange({ ...filters, confidenceRange: value as [number, number] })}
              min={0}
              max={100}
              step={5}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{filters.confidenceRange[0]}%</span>
              <span>{filters.confidenceRange[1]}%</span>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      <Select
        value={filters.dateRange}
        onValueChange={(value) => onFiltersChange({ ...filters, dateRange: value })}
      >
        <SelectTrigger className="w-[140px] h-9">
          <Calendar className="h-4 w-4 mr-2" />
          <SelectValue placeholder="Período" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todo Período</SelectItem>
          <SelectItem value="today">Hoje</SelectItem>
          <SelectItem value="week">Últimos 7 dias</SelectItem>
          <SelectItem value="month">Últimos 30 dias</SelectItem>
          <SelectItem value="custom">Personalizado</SelectItem>
        </SelectContent>
      </Select>

      {activeFiltersCount > 0 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={resetFilters}
          className="h-9 gap-2 text-muted-foreground hover:text-foreground"
        >
          <RotateCcw className="h-4 w-4" />
          Limpar
        </Button>
      )}
    </div>
  )
}
