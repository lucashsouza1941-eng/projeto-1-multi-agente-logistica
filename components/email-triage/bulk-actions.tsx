"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  ChevronDown,
  Tag,
  Trash2,
  Archive
} from "lucide-react"

interface BulkActionsProps {
  selectedCount: number
  onReclassify: () => void
  onApprove: () => void
  onReject: () => void
}

export function BulkActions({ 
  selectedCount, 
  onReclassify, 
  onApprove, 
  onReject 
}: BulkActionsProps) {
  return (
    <div className="flex items-center gap-3 p-3 bg-primary/5 border border-primary/20 rounded-lg">
      <Badge variant="secondary" className="bg-primary/10 text-primary">
        {selectedCount} selecionado{selectedCount > 1 ? "s" : ""}
      </Badge>

      <div className="h-6 w-px bg-border" />

      <div className="flex items-center gap-2">
        <Button size="sm" variant="default" className="gap-2" onClick={onApprove}>
          <CheckCircle2 className="h-4 w-4" />
          Aprovar
        </Button>

        <Button size="sm" variant="outline" className="gap-2" onClick={onReject}>
          <XCircle className="h-4 w-4" />
          Rejeitar
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" variant="outline" className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Re-classificar
              <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onReclassify}>
              <Tag className="h-4 w-4 mr-2 text-red-400" />
              Marcar como Urgente
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onReclassify}>
              <Tag className="h-4 w-4 mr-2 text-blue-400" />
              Marcar como Rotina
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onReclassify}>
              <Tag className="h-4 w-4 mr-2 text-amber-400" />
              Marcar como Ação Requerida
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onReclassify}>
              <Tag className="h-4 w-4 mr-2 text-zinc-400" />
              Marcar como Spam
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onReclassify}>
              <Archive className="h-4 w-4 mr-2" />
              Arquivar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onReclassify} className="text-destructive">
              <Trash2 className="h-4 w-4 mr-2" />
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
