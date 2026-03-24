"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Mail, 
  FileText, 
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Bot,
  RefreshCw
} from "lucide-react"
import { cn } from "@/lib/utils"

const activities = [
  {
    id: 1,
    type: "email",
    action: "Email batch processed",
    description: "45 emails classified and routed to appropriate departments",
    agent: "Email Triage Agent",
    time: "Just now",
    status: "success",
  },
  {
    id: 2,
    type: "report",
    action: "Daily logistics report generated",
    description: "Comprehensive report for operations team including KPIs and alerts",
    agent: "Report Generator",
    time: "5 min ago",
    status: "success",
  },
  {
    id: 3,
    type: "escalation",
    action: "New escalation created",
    description: "Critical delivery failure detected and escalated to management",
    agent: "Escalation Agent",
    time: "12 min ago",
    status: "warning",
  },
  {
    id: 4,
    type: "email",
    action: "High-priority email flagged",
    description: "VIP customer complaint automatically escalated",
    agent: "Email Triage Agent",
    time: "18 min ago",
    status: "warning",
  },
  {
    id: 5,
    type: "report",
    action: "Weekly summary compiled",
    description: "Performance metrics aggregated for executive review",
    agent: "Report Generator",
    time: "32 min ago",
    status: "success",
  },
  {
    id: 6,
    type: "escalation",
    action: "Escalation resolved",
    description: "Customs clearance issue marked as resolved by Pedro Lima",
    agent: "Escalation Agent",
    time: "1 hour ago",
    status: "resolved",
  },
  {
    id: 7,
    type: "email",
    action: "Spam detection",
    description: "23 spam emails identified and filtered",
    agent: "Email Triage Agent",
    time: "1 hour ago",
    status: "success",
  },
  {
    id: 8,
    type: "report",
    action: "Custom report requested",
    description: "User-requested inventory analysis report queued",
    agent: "Report Generator",
    time: "2 hours ago",
    status: "pending",
  },
]

const typeConfig = {
  email: { icon: Mail, color: "text-chart-1", bg: "bg-chart-1/20" },
  report: { icon: FileText, color: "text-chart-2", bg: "bg-chart-2/20" },
  escalation: { icon: AlertTriangle, color: "text-chart-4", bg: "bg-chart-4/20" },
}

const statusConfig = {
  success: { label: "Completed", color: "bg-success/20 text-success border-success/30" },
  warning: { label: "Attention", color: "bg-chart-4/20 text-chart-4 border-chart-4/30" },
  resolved: { label: "Resolved", color: "bg-chart-2/20 text-chart-2 border-chart-2/30" },
  pending: { label: "Pending", color: "bg-chart-3/20 text-chart-3 border-chart-3/30" },
}

export function RecentActivity() {
  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base font-semibold">Recent Activity</CardTitle>
            <Badge variant="outline" className="text-xs">
              <RefreshCw className="mr-1 h-3 w-3" />
              Live updates
            </Badge>
          </div>
          <Button variant="ghost" size="sm" className="text-xs">
            View activity log
            <ArrowRight className="ml-1 h-3 w-3" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-[19px] top-3 bottom-3 w-px bg-border" />
          
          <div className="space-y-1">
            {activities.map((activity) => {
              const typeInfo = typeConfig[activity.type as keyof typeof typeConfig]
              const statusInfo = statusConfig[activity.status as keyof typeof statusConfig]
              const Icon = typeInfo.icon

              return (
                <div 
                  key={activity.id}
                  className="relative flex gap-4 py-3 pl-2 pr-3 rounded-lg hover:bg-secondary/30 transition-colors"
                >
                  {/* Icon */}
                  <div className={cn("relative z-10 p-2 rounded-lg shrink-0", typeInfo.bg)}>
                    <Icon className={cn("h-4 w-4", typeInfo.color)} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-foreground">
                          {activity.action}
                        </p>
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {activity.description}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Bot className="h-3 w-3" />
                          <span>{activity.agent}</span>
                          <span>•</span>
                          <span>{activity.time}</span>
                        </div>
                      </div>
                      <Badge 
                        variant="outline" 
                        className={cn("text-[10px] shrink-0 border", statusInfo.color)}
                      >
                        {statusInfo.label}
                      </Badge>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
