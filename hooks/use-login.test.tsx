import { describe, it, expect, vi, beforeEach } from "vitest"
import { renderHook, act, waitFor } from "@testing-library/react"
import { useLogin } from "./use-login"

const push = vi.fn()
const refresh = vi.fn()

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, refresh }),
}))

vi.mock("@/lib/auth", () => ({
  login: vi.fn(),
}))

import { login } from "@/lib/auth"

describe("useLogin", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("chama router.push(/dashboard) após login bem-sucedido", async () => {
    vi.mocked(login).mockResolvedValue({ ok: true })

    const { result } = renderHook(() => useLogin())

    await act(async () => {
      await result.current.submit("a@b.com", "secret")
    })

    expect(push).toHaveBeenCalledWith("/dashboard")
    expect(refresh).toHaveBeenCalled()
    expect(result.current.error).toBeNull()
    expect(result.current.pending).toBe(false)
  })

  it("mantém erro e não navega quando login falha", async () => {
    vi.mocked(login).mockResolvedValue({
      ok: false,
      message: "Credenciais inválidas",
    })

    const { result } = renderHook(() => useLogin())

    await act(async () => {
      await result.current.submit("x@y.com", "wrong")
    })

    await waitFor(() => {
      expect(result.current.error).toBe("Credenciais inválidas")
    })
    expect(push).not.toHaveBeenCalled()
    expect(result.current.pending).toBe(false)
  })
})
