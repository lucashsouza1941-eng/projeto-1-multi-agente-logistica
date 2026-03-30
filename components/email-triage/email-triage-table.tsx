"use client"

import { useState, type ReactNode } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  ArrowUpDown, 
  ChevronLeft, 
  ChevronRight,
  ChevronsLeft,
  ChevronsRight
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { Email } from "@/lib/types/email-ui"

interface EmailTriageTableProps {
  emails: Email[]
  selectedEmails: string[]
  onSelectEmails: (ids: string[]) => void
  onSelectEmail: (email: Email) => void
  selectedEmailId?: string
}

type SortField = "from" | "subject" | "category" | "priority" | "confidence" | "date"
type SortDirection = "asc" | "desc"

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

function SortableHeader({
  field,
  children,
  onSort,
}: {
  field: SortField
  children: ReactNode
  onSort: (field: SortField) => void
}) {
  return (
    <Button
      variant="ghost"
      size="sm"
      className="-ml-3 h-8 data-[state=open]:bg-accent"
      onClick={() => onSort(field)}
    >
      {children}
      <ArrowUpDown className="ml-2 h-4 w-4" />
    </Button>
  )
}

export function EmailTriageTable({
  emails,
  selectedEmails,
  onSelectEmails,
  onSelectEmail,
  selectedEmailId,
}: EmailTriageTableProps) {
  const [sortField, setSortField] = useState<SortField>("date")
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  const sortedEmails = [...emails].sort((a, b) => {
    const direction = sortDirection === "asc" ? 1 : -1
    switch (sortField) {
      case "from":
        return direction * a.from.localeCompare(b.from)
      case "subject":
        return direction * a.subject.localeCompare(b.subject)
      case "category":
        return direction * a.category.localeCompare(b.category)
      case "priority": {
        const priorityOrder = { alta: 3, media: 2, baixa: 1 }
        return direction * (priorityOrder[a.priority] - priorityOrder[b.priority])
      }
      case "confidence":
        return direction * (a.confidence - b.confidence)
      case "date":
        return direction * (new Date(a.date).getTime() - new Date(b.date).getTime())
      default:
        return 0
    }
  })

  const totalPages = Math.ceil(sortedEmails.length / itemsPerPage)
  const paginatedEmails = sortedEmails.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onSelectEmails(paginatedEmails.map((e) => e.id))
    } else {
      onSelectEmails([])
    }
  }

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      onSelectEmails([...selectedEmails, id])
    } else {
      onSelectEmails(selectedEmails.filter((i) => i !== id))
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
  }

  return (
    <div className="flex flex-col h-full">
      <div className="border border-border rounded-lg overflow-hidden flex-1">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="w-[40px]">
                <Checkbox
                  checked={paginatedEmails.length > 0 && selectedEmails.length === paginatedEmails.length}
                  onCheckedChange={handleSelectAll}
                  aria-label="Selecionar todos"
                />
              </TableHead>
              <TableHead className="w-[180px]">
                <SortableHeader field="from" onSort={handleSort}>
                  De
                </SortableHeader>
              </TableHead>
              <TableHead className="min-w-[250px]">
                <SortableHeader field="subject" onSort={handleSort}>
                  Assunto
                </SortableHeader>
              </TableHead>
              <TableHead className="w-[140px]">
                <SortableHeader field="category" onSort={handleSort}>
                  Categoria
                </SortableHeader>
              </TableHead>
              <TableHead className="w-[100px]">
                <SortableHeader field="priority" onSort={handleSort}>
                  Prioridade
                </SortableHeader>
              </TableHead>
              <TableHead className="w-[120px]">
                <SortableHeader field="confidence" onSort={handleSort}>
                  Confiança IA
                </SortableHeader>
              </TableHead>
              <TableHead className="w-[180px]">Ação Tomada</TableHead>
              <TableHead className="w-[100px]">
                <SortableHeader field="date" onSort={handleSort}>
                  Data
                </SortableHeader>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedEmails.map((email) => (
              <TableRow
                key={email.id}
                className={cn(
                  "cursor-pointer transition-colors",
                  selectedEmailId === email.id && "bg-primary/5"
                )}
                onClick={() => onSelectEmail(email)}
              >
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    checked={selectedEmails.includes(email.id)}
                    onCheckedChange={(checked) => handleSelectOne(email.id, checked as boolean)}
                    aria-label={`Selecionar ${email.subject}`}
                  />
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium text-foreground truncate max-w-[160px]">
                      {email.from}
                    </span>
                    <span className="text-xs text-muted-foreground truncate max-w-[160px]">
                      {email.fromEmail}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-foreground line-clamp-1">{email.subject}</span>
                </TableCell>
                <TableCell>
                  <Badge 
                    variant="outline" 
                    className={cn("font-medium", categoryConfig[email.category].className)}
                  >
                    {categoryConfig[email.category].label}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge 
                    variant="secondary" 
                    className={cn("font-medium", priorityConfig[email.priority].className)}
                  >
                    {priorityConfig[email.priority].label}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="w-12 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div 
                        className={cn(
                          "h-full rounded-full",
                          email.confidence >= 90 ? "bg-green-500" :
                          email.confidence >= 80 ? "bg-amber-500" : "bg-red-500"
                        )}
                        style={{ width: `${email.confidence}%` }}
                      />
                    </div>
                    <span className="text-sm text-muted-foreground">{email.confidence}%</span>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-muted-foreground truncate max-w-[160px] block">
                    {email.actionTaken}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-muted-foreground">{formatDate(email.date)}</span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-4 px-2">
        <p className="text-sm text-muted-foreground">
          Mostrando {(currentPage - 1) * itemsPerPage + 1} a{" "}
          {Math.min(currentPage * itemsPerPage, sortedEmails.length)} de {sortedEmails.length} e-mails
        </p>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground px-3">
            Página {currentPage} de {totalPages}
          </span>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage === totalPages}
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
