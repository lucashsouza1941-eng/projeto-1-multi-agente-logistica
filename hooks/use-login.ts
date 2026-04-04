"use client"

import { useRouter } from "next/navigation"
import { useCallback, useState } from "react"
import { login } from "@/lib/auth"

export function useLogin() {
  const router = useRouter()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = useCallback(
    async (email: string, password: string) => {
      setError(null)
      setPending(true)
      const result = await login(email, password)
      setPending(false)
      if (!result.ok) {
        setError(result.message)
        return { ok: false as const }
      }
      router.push("/dashboard")
      router.refresh()
      return { ok: true as const }
    },
    [router],
  )

  return { submit, pending, error }
}
