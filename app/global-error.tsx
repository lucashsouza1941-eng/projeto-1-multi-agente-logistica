'use client'

import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    const payload = {
      message: error.message,
      stack: error.stack,
      context: { digest: error.digest, source: 'global-error' },
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      userAgent:
        typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
    }
    void fetch('/api/log-error', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).catch(() => {
      /* evitar loop */
    })
  }, [error])

  return (
    <html lang="en">
      <body className="min-h-screen bg-background p-8 font-sans antialiased">
        <h1 className="text-2xl font-semibold">Algo correu mal</h1>
        <p className="mt-2 text-muted-foreground">
          Ocorreu um erro inesperado. Pode tentar novamente.
        </p>
        <button
          type="button"
          className="mt-6 rounded-md border border-border bg-card px-4 py-2 text-sm font-medium"
          onClick={() => reset()}
        >
          Tentar novamente
        </button>
      </body>
    </html>
  )
}
