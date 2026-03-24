"use client"

import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Line,
  LineChart,
  CartesianGrid,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts"
import { useDashboardVolume } from "@/hooks/use-dashboard-volume"

const numberFormatter = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 })

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{ value: number }>
  label?: string
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border border-border bg-card p-3 shadow-lg">
        <p className="text-sm font-medium text-foreground mb-1">{label}</p>
        <div className="flex items-center gap-2 text-sm">
          <span className="h-2 w-2 rounded-full bg-chart-1" />
          <span className="text-muted-foreground">E-mails:</span>
          <span className="font-medium text-foreground">{payload[0].value}</span>
        </div>
      </div>
    )
  }
  return null
}

export function EmailVolumeChart() {
  const { data: vol, isLoading, isError, error } = useDashboardVolume()

  const data = useMemo(() => {
    if (!vol?.data?.length) {
      return Array.from({ length: 24 }, (_, i) => ({
        time: `${String(i).padStart(2, "0")}:00`,
        emails: 0,
      }))
    }
    return vol.data.map((b) => {
      const h = b.label.endsWith("h") ? parseInt(b.label.slice(0, -1), 10) : 0
      return {
        time: `${String(h).padStart(2, "0")}:00`,
        emails: b.value,
      }
    })
  }, [vol])

  const totalEmails = data.reduce((sum, item) => sum + item.emails, 0)
  const avgEmails = Math.round(totalEmails / 24) || 0
  const peakHour = data.reduce((max, item) => (item.emails > max.emails ? item : max), data[0])

  if (isLoading) {
    return (
      <Card className="bg-card border-border h-full">
        <CardHeader className="pb-2">
          <Skeleton className="h-6 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[280px] w-full" />
        </CardContent>
      </Card>
    )
  }

  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Gráfico de volume</AlertTitle>
        <AlertDescription>
          {error instanceof Error ? error.message : "Erro ao carregar dados"}
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <Card className="bg-card border-border h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base font-semibold">Volume de E-mails (24h)</CardTitle>
            <p className="text-sm text-muted-foreground">E-mails processados por hora</p>
          </div>
          <div className="flex items-center gap-6 text-sm">
            <div className="text-right">
              <p className="text-muted-foreground">Total</p>
              <p className="font-semibold text-foreground">{numberFormatter.format(totalEmails)}</p>
            </div>
            <div className="text-right">
              <p className="text-muted-foreground">Média/hora</p>
              <p className="font-semibold text-foreground">{avgEmails}</p>
            </div>
            <div className="text-right">
              <p className="text-muted-foreground">Pico</p>
              <p className="font-semibold text-foreground">{peakHour.time}</p>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="emailLineGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="oklch(0.7 0.18 270)" />
                  <stop offset="100%" stopColor="oklch(0.65 0.15 180)" />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
              <XAxis
                dataKey="time"
                tick={{ fontSize: 11, fill: "oklch(0.6 0 0)" }}
                tickLine={false}
                axisLine={false}
                interval={2}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "oklch(0.6 0 0)" }}
                tickLine={false}
                axisLine={false}
                width={40}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="emails"
                stroke="url(#emailLineGradient)"
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 4, fill: "oklch(0.7 0.18 270)" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
