"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { 
  AlertTriangle, 
  ArrowRight,
  Clock,
  User,
  ChevronRight,
  Flame
} from "lucide-react"
import { cn } from "@/lib/utils"

const escalations = [
  {
    id: "ESC-001",
    title: "Critical delivery failure - Priority shipment",
    description: "Container #45892 stuck at port due to documentation issues",
    priority: "critical",
    time: "12m ago",
    assignee: "Maria Santos",
    initials: "MS",
    source: "Email Triage Agent",
  },
  {
    id: "ESC-002",
    title: "Customer complaint - Damaged goods",
    description: "Client ABC Corp reporting damaged electronics shipment",
    priority: "high",
    time: "28m ago",
    assignee: "Pedro Lima",
    initials: "PL",
    source: "Report Generator",
  },
  {
    id: "ESC-003",
    title: "Customs clearance delay",
    description: "Multiple shipments pending customs approval at border",
    priority: "high",
    time: "1h ago",
    assignee: "Ana Costa",
    initials: "AC",
    source: "Escalation Agent",
  },
  {
    id: "ESC-004",
    title: "Route optimization alert",
    description: "Suggested alternative routes due to traffic conditions",
    priority: "medium",
    time: "2h ago",
    assignee: "Carlos Oliveira",
    initials: "CO",
    source: "Report Generator",
  },
  {
    id: "ESC-005",
    title: "Inventory discrepancy detected",
    description: "Warehouse B showing 15% variance in stock levels",
    priority: "medium",
    time: "3h ago",
    assignee: "Unassigned",
    initials: "?",
    source: "Email Triage Agent",
  },
]

const priorityConfig = {
  critical: {
    label: "Critical",
    color: "bg-destructive text-destructive-foreground",
    icon: Flame,
  },
  high: {
    label: "High",
    color: "bg-chart-4/20 text-chart-4 border border-chart-4/30",
    icon: AlertTriangle,
  },
  medium: {
    label: "Medium",
    color: "bg-chart-3/20 text-chart-3 border border-chart-3/30",
    icon: Clock,
  },
}

export function EscalationQueue() {
  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base font-semibold">Escalation Queue</CardTitle>
            <Badge variant="destructive" className="text-xs">
              5 pending
            </Badge>
          </div>
          <Button variant="ghost" size="sm" className="text-xs">
            View all
            <ArrowRight className="ml-1 h-3 w-3" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {escalations.map((escalation) => {
          const priority = priorityConfig[escalation.priority as keyof typeof priorityConfig]
          const PriorityIcon = priority.icon
          
          return (
            <div 
              key={escalation.id}
              className="group rounded-lg border border-border bg-secondary/30 p-4 hover:bg-secondary/50 transition-colors cursor-pointer"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge className={cn("text-[10px] font-medium", priority.color)}>
                      <PriorityIcon className="mr-1 h-3 w-3" />
                      {priority.label}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{escalation.id}</span>
                  </div>
                  
                  <div>
                    <p className="font-medium text-sm text-foreground line-clamp-1">
                      {escalation.title}
                    </p>
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {escalation.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {escalation.time}
                    </div>
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {escalation.source}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className={cn(
                      "text-xs",
                      escalation.assignee === "Unassigned" 
                        ? "bg-muted text-muted-foreground" 
                        : "bg-primary text-primary-foreground"
                    )}>
                      {escalation.initials}
                    </AvatarFallback>
                  </Avatar>
                  <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
