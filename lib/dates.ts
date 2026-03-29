/** Retorna YYYY-MM-DD em UTC a partir de um Date. */
export function toIsoDateUTC(d: Date): string {
  return d.toISOString().slice(0, 10)
}

/** Intervalo padrão para período personalizado: últimos 7 dias (UTC). */
export function defaultCustomRange(): { startDate: string; endDate: string } {
  const end = new Date()
  const start = new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000)
  return { startDate: toIsoDateUTC(start), endDate: toIsoDateUTC(end) }
}
