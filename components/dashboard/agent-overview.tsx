"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { 
  Mail, 
  FileText, 
  AlertTriangle, 
  MoreVertical,
  PlayCircle,
  PauseCircle
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

const agents = [
  {
    id: "email-triage",
    name: "Email Triage Agent",
    description: "Classifies and routes incoming emails",
    status: "running",
    icon: Mail,
    processed: 847,
    queue: 24,
    accuracy: 98.2,
    color: "text-chart-1",
    bgColor: "bg-chart-1/20",
  },
  {
    id: "report-gen",
    name: "Report Generator",
    description: "Creates automated logistics reports",
    status: "running",
    icon: FileText,
    processed: 156,
    queue: 3,
    accuracy: 99.1,
    color: "text-chart-2",
    bgColor: "bg-chart-2/20",
  },
  {
    id: "escalation",
    name: "Escalation Agent",
    description: "Identifies and routes critical issues",
    status: "running",
    icon: AlertTriangle,
    processed: 89,
    queue: 5,
    accuracy: 96.7,
    color: "text-chart-4",
    bgColor: "bg-chart-4/20",
  },
]

export function AgentOverview() {
  return (
    <Card className="bg-card border-border h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">Agent Status</CardTitle>
          <Badge variant="outline" className="text-xs">
            Live
            <span className="ml-1.5 h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {agents.map((agent) => (
          <div
            key={agent.id}
            className="rounded-lg border border-border bg-secondary/30 p-4 space-y-3"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className={cn("p-2 rounded-lg", agent.bgColor)}>
                  <agent.icon className={cn("h-4 w-4", agent.color)} />
                </div>
                <div>
                  <p className="font-medium text-sm text-foreground">{agent.name}</p>
                  <p className="text-xs text-muted-foreground">{agent.description}</p>
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>
                    <PauseCircle className="mr-2 h-4 w-4" />
                    Pause Agent
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <PlayCircle className="mr-2 h-4 w-4" />
                    Restart Agent
                  </DropdownMenuItem>
                  <DropdownMenuItem>View Logs</DropdownMenuItem>
                  <DropdownMenuItem>Configure</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-md bg-background/50 p-2">
                <p className="text-lg font-semibold text-foreground">{agent.processed}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Processed</p>
              </div>
              <div className="rounded-md bg-background/50 p-2">
                <p className="text-lg font-semibold text-foreground">{agent.queue}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">In Queue</p>
              </div>
              <div className="rounded-md bg-background/50 p-2">
                <p className="text-lg font-semibold text-success">{agent.accuracy}%</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Accuracy</p>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Processing</span>
                <span className="text-foreground font-medium">
                  {Math.round((agent.processed / (agent.processed + agent.queue)) * 100)}%
                </span>
              </div>
              <Progress 
                value={(agent.processed / (agent.processed + agent.queue)) * 100} 
                className="h-1.5"
              />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
