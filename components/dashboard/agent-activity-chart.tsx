"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts"

const data = [
  { time: "00:00", emails: 45, reports: 8, escalations: 3 },
  { time: "02:00", emails: 32, reports: 5, escalations: 2 },
  { time: "04:00", emails: 28, reports: 3, escalations: 1 },
  { time: "06:00", emails: 56, reports: 12, escalations: 4 },
  { time: "08:00", emails: 145, reports: 24, escalations: 8 },
  { time: "10:00", emails: 234, reports: 32, escalations: 12 },
  { time: "12:00", emails: 287, reports: 28, escalations: 15 },
  { time: "14:00", emails: 312, reports: 35, escalations: 11 },
  { time: "16:00", emails: 256, reports: 22, escalations: 9 },
  { time: "18:00", emails: 178, reports: 18, escalations: 6 },
  { time: "20:00", emails: 98, reports: 12, escalations: 4 },
  { time: "22:00", emails: 67, reports: 8, escalations: 2 },
]

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string; color: string }>; label?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border border-border bg-card p-3 shadow-lg">
        <p className="text-sm font-medium text-foreground mb-2">{label}</p>
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-muted-foreground capitalize">{entry.name}:</span>
            <span className="font-medium text-foreground">{entry.value}</span>
          </div>
        ))}
      </div>
    )
  }
  return null
}

export function AgentActivityChart() {
  return (
    <Card className="bg-card border-border h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base font-semibold">Agent Activity</CardTitle>
            <p className="text-sm text-muted-foreground">Tasks processed over time</p>
          </div>
          <div className="flex items-center gap-2">
            <Select defaultValue="today">
              <SelectTrigger className="w-[130px] h-8 text-sm">
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="yesterday">Yesterday</SelectItem>
                <SelectItem value="week">Last 7 days</SelectItem>
                <SelectItem value="month">Last 30 days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        <div className="flex items-center gap-4 mb-4">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-chart-1" />
            <span className="text-sm text-muted-foreground">Emails</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-chart-2" />
            <span className="text-sm text-muted-foreground">Reports</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-chart-4" />
            <span className="text-sm text-muted-foreground">Escalations</span>
          </div>
        </div>
        
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="emailGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="oklch(0.7 0.18 270)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="oklch(0.7 0.18 270)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="reportGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="oklch(0.7 0.15 180)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="oklch(0.7 0.15 180)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="escalationGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="oklch(0.6 0.2 25)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="oklch(0.6 0.2 25)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
              <XAxis
                dataKey="time"
                tick={{ fontSize: 12, fill: "oklch(0.6 0 0)" }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 12, fill: "oklch(0.6 0 0)" }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="emails"
                stroke="oklch(0.7 0.18 270)"
                strokeWidth={2}
                fill="url(#emailGradient)"
                name="emails"
              />
              <Area
                type="monotone"
                dataKey="reports"
                stroke="oklch(0.7 0.15 180)"
                strokeWidth={2}
                fill="url(#reportGradient)"
                name="reports"
              />
              <Area
                type="monotone"
                dataKey="escalations"
                stroke="oklch(0.6 0.2 25)"
                strokeWidth={2}
                fill="url(#escalationGradient)"
                name="escalations"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
