"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Mail, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  ArrowRight,
  Inbox,
  Archive
} from "lucide-react"
import { cn } from "@/lib/utils"

const categories = [
  { name: "Delivery Updates", count: 142, percentage: 35, color: "bg-chart-1" },
  { name: "Customer Inquiries", count: 98, percentage: 24, color: "bg-chart-2" },
  { name: "Shipping Issues", count: 67, percentage: 17, color: "bg-chart-4" },
  { name: "Order Status", count: 54, percentage: 13, color: "bg-chart-3" },
  { name: "Other", count: 45, percentage: 11, color: "bg-muted-foreground" },
]

const stats = [
  { label: "Pending", value: 24, icon: Clock, color: "text-warning" },
  { label: "Processing", value: 12, icon: Mail, color: "text-chart-1" },
  { label: "Completed", value: 847, icon: CheckCircle2, color: "text-success" },
  { label: "Flagged", value: 8, icon: AlertCircle, color: "text-destructive" },
]

export function EmailTriageStatus() {
  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base font-semibold">Email Triage</CardTitle>
            <Badge variant="secondary" className="text-xs">
              <Inbox className="mr-1 h-3 w-3" />
              24 in queue
            </Badge>
          </div>
          <Button variant="ghost" size="sm" className="text-xs">
            View all
            <ArrowRight className="ml-1 h-3 w-3" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Stats Row */}
        <div className="grid grid-cols-4 gap-3">
          {stats.map((stat) => (
            <div 
              key={stat.label}
              className="rounded-lg bg-secondary/50 p-3 text-center"
            >
              <stat.icon className={cn("h-4 w-4 mx-auto mb-1", stat.color)} />
              <p className="text-lg font-bold text-foreground">{stat.value}</p>
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                {stat.label}
              </p>
            </div>
          ))}
        </div>

        {/* Category Breakdown */}
        <div className="space-y-3">
          <p className="text-sm font-medium text-foreground">Category Distribution</p>
          {categories.map((category) => (
            <div key={category.name} className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{category.name}</span>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-foreground">{category.count}</span>
                  <span className="text-xs text-muted-foreground">({category.percentage}%)</span>
                </div>
              </div>
              <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
                <div 
                  className={cn("h-full rounded-full transition-all", category.color)}
                  style={{ width: `${category.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Recent Activity */}
        <div className="space-y-2 pt-2">
          <p className="text-sm font-medium text-foreground">Recent Triaged</p>
          <div className="space-y-2">
            {[
              { subject: "Re: Shipment #45892 delay notification", category: "Shipping Issues", time: "2m ago" },
              { subject: "Order confirmation - Customer #8847", category: "Order Status", time: "5m ago" },
              { subject: "Delivery rescheduling request", category: "Customer Inquiries", time: "8m ago" },
            ].map((email, index) => (
              <div 
                key={index}
                className="flex items-center gap-3 rounded-lg bg-secondary/30 p-3"
              >
                <div className="p-2 rounded bg-chart-1/20">
                  <Mail className="h-3 w-3 text-chart-1" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {email.subject}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {email.category} • {email.time}
                  </p>
                </div>
                <Badge variant="outline" className="text-xs shrink-0">
                  <Archive className="mr-1 h-3 w-3" />
                  Sorted
                </Badge>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
