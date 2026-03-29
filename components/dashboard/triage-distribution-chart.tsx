"use client"

import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  Cell,
} from "recharts"
import { useDashboardCategories } from "@/hooks/use-dashboard-categories"
import { toUserFriendlyError } from "@/lib/user-friendly-error"

const COLORS: Record<string, string> = {
  URGENT: "oklch(0.6 0.2 25)",
  ROUTINE: "oklch(0.7 0.15 180)",
  SPAM: "oklch(0.5 0 0)",
  ACTION_REQUIRED: "oklch(0.75 0.18 80)",
}

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{ value: number; payload: { category: string; count: number; color: string } }>
}

const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    const item = payload[0].payload
    return (
      <div className="rounded-lg border border-border bg-card p-3 shadow-lg">
        <p className="text-sm font-medium text-foreground mb-1">{item.category}</p>
        <div className="flex items-center gap-2 text-sm">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
          <span className="text-muted-foreground">Quantidade:</span>
          <span className="font-medium text-foreground">{item.count}</span>
        </div>
      </div>
    )
  }
  return null
}

const numberFormatter = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 })

export function TriageDistributionChart() {
  const { data: raw, isLoading, isError, error } = useDashboardCategories()

  const data = useMemo(() => {
    if (!raw?.length) {
      return [
        { category: "Urgente", count: 0, color: COLORS.URGENT },
        { category: "Rotina", count: 0, color: COLORS.ROUTINE },
        { category: "Spam", count: 0, color: COLORS.SPAM },
        { category: "Ação Requerida", count: 0, color: COLORS.ACTION_REQUIRED },
      ]
    }
    return raw.map((r) => ({
      category: r.label,
      count: r.count,
      color: COLORS[r.category] ?? "oklch(0.6 0 0)",
    }))
  }, [raw])

  const total = data.reduce((sum, item) => sum + item.count, 0)

  if (isLoading) {
    return (
      <Card className="bg-card border-border h-full">
        <CardHeader className="pb-2">
          <Skeleton className="h-6 w-56 mb-2" />
          <Skeleton className="h-4 w-40" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[220px] w-full" />
        </CardContent>
      </Card>
    )
  }

  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Distribuição por categoria</AlertTitle>
        <AlertDescription>{toUserFriendlyError(error)}</AlertDescription>
      </Alert>
    )
  }

  return (
    <Card className="bg-card border-border h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base font-semibold">Distribuição por Categoria</CardTitle>
            <p className="text-sm text-muted-foreground">Classificação da triagem de e-mails</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Total classificado</p>
            <p className="text-lg font-semibold text-foreground">{numberFormatter.format(total)}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="flex flex-wrap items-center gap-4 mb-4">
          {data.map((item) => (
            <div key={item.category} className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: item.color }} />
              <span className="text-sm text-muted-foreground">{item.category}</span>
              <span className="text-sm font-medium text-foreground">
                ({total > 0 ? Math.round((item.count / total) * 100) : 0}%)
              </span>
            </div>
          ))}
        </div>

        <div className="h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
              <XAxis
                dataKey="category"
                tick={{ fontSize: 12, fill: "oklch(0.6 0 0)" }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "oklch(0.6 0 0)" }}
                tickLine={false}
                axisLine={false}
                width={40}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={48}>
                {data.map((entry) => (
                  <Cell key={entry.category} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
