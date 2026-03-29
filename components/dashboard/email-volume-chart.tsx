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
import type { DashboardDateRange, DashboardPeriod } from "@/lib/api"
import { toUserFriendlyError } from "@/lib/user-friendly-error"

const numberFormatter = new Intl.NumberFormat("pt-BR", {
  maximumFractionDigits: 0,
})

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{ value: number }>
  label?: string
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border border-border bg-card p-3 shadow-lg">
        <p className="mb-1 text-sm font-medium text-foreground">{label}</p>
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

function periodToApi(p: string): DashboardPeriod {
  if (p === "today" || p === "7d" || p === "30d" || p === "custom") return p
  return "7d"
}

export function EmailVolumeChart({
  period = "7d",
  customRange = null,
}: {
  period?: string
  customRange?: DashboardDateRange | null
}) {
  const apiPeriod = periodToApi(period)
  const { data: vol, isLoading, isError, error } = useDashboardVolume(
    apiPeriod,
    period === "custom" ? customRange : null,
  )

  const data = useMemo(() => {
    if (!vol?.data?.length) {
      return Array.from({ length: 24 }, (_, i) => ({
        time: `${String(i).padStart(2, "0")}:00`,
        emails: 0,
      }))
    }
    return vol.data.map((b) => {
      if (/^\d{4}-\d{2}-\d{2}$/.test(b.label)) {
        const d = new Date(`${b.label}T12:00:00Z`)
        return {
          time: d.toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "short",
          }),
          emails: b.value,
        }
      }
      if (b.label.startsWith("h")) {
        const n = b.label.slice(1)
        return {
          time: `Hora +${n}`,
          emails: b.value,
        }
      }
      const h = b.label.endsWith("h") ? parseInt(b.label.slice(0, -1), 10) : 0
      return {
        time: `${String(h).padStart(2, "0")}:00`,
        emails: b.value,
      }
    })
  }, [vol])

  const totalEmails = data.reduce((sum, item) => sum + item.emails, 0)
  const n = data.length || 1
  const avgEmails = Math.round(totalEmails / n) || 0
  const peakHour = data.reduce(
    (max, item) => (item.emails > max.emails ? item : max),
    data[0] ?? { time: "—", emails: 0 },
  )

  const title =
    vol?.startDate && vol?.endDate
      ? "Volume de e-mails no período"
      : "Volume de E-mails (24h)"

  if (isLoading || (period === "custom" && !customRange)) {
    return (
      <Card className="h-full border-border bg-card">
        <CardHeader className="pb-2">
          <Skeleton className="mb-2 h-6 w-48" />
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
        <AlertDescription>{toUserFriendlyError(error)}</AlertDescription>
      </Alert>
    )
  }

  const empty = totalEmails === 0

  return (
    <Card className="h-full border-border bg-card">
      <CardHeader className="pb-2">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0 space-y-1">
            <CardTitle className="text-base font-semibold">{title}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {empty
                ? "Nenhum e-mail registrado neste intervalo"
                : "Distribuição ao longo do tempo"}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-sm sm:gap-6">
            <div className="text-right">
              <p className="text-muted-foreground">Total</p>
              <p className="font-semibold text-foreground">
                {numberFormatter.format(totalEmails)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-muted-foreground">Média</p>
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
        <div className="h-[240px] min-h-[200px] sm:h-[280px]">
          {empty ? (
            <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-border bg-muted/20 px-4 text-center text-sm text-muted-foreground">
              Quando houver e-mails no período, o gráfico aparecerá aqui.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={data}
                margin={{ top: 5, right: 10, left: -10, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="emailLineGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="oklch(0.7 0.18 270)" />
                    <stop offset="100%" stopColor="oklch(0.65 0.15 180)" />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  className="stroke-border"
                  vertical={false}
                />
                <XAxis
                  dataKey="time"
                  tick={{ fontSize: 10, fill: "oklch(0.6 0 0)" }}
                  tickLine={false}
                  axisLine={false}
                  interval="preserveStartEnd"
                  minTickGap={8}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "oklch(0.6 0 0)" }}
                  tickLine={false}
                  axisLine={false}
                  width={36}
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
          )}
        </div>
      </CardContent>
    </Card>
  )
}
