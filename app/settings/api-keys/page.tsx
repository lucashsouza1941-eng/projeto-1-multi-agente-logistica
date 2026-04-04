"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Sidebar } from "@/components/dashboard/sidebar"
import { Header } from "@/components/dashboard/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { createApiKey, listApiKeys, revokeApiKey } from "@/lib/api"
import { useState } from "react"

export default function ApiKeysSettingsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [name, setName] = useState("")
  const qc = useQueryClient()

  const { data: keys, isLoading } = useQuery({
    queryKey: ["api-keys"],
    queryFn: listApiKeys,
  })

  const createMut = useMutation({
    mutationFn: () => createApiKey(name.trim() || "Sem nome"),
    onSuccess: (res) => {
      toast.success("Chave criada — copie agora; não será mostrada novamente.")
      navigator.clipboard.writeText(res.apiKey).catch(() => undefined)
      setName("")
      void qc.invalidateQueries({ queryKey: ["api-keys"] })
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const revokeMut = useMutation({
    mutationFn: revokeApiKey,
    onSuccess: () => {
      toast.success("Chave revogada")
      void qc.invalidateQueries({ queryKey: ["api-keys"] })
    },
    onError: (e: Error) => toast.error(e.message),
  })

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar open={sidebarOpen} onToggle={() => setSidebarOpen((o) => !o)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header onMenuToggle={() => setSidebarOpen((o) => !o)} />
        <main className="mx-auto w-full max-w-2xl flex-1 space-y-6 p-6">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">API Keys</h1>
            <p className="text-sm text-muted-foreground">
              As chaves são associadas à sua sessão autenticada (JWT). Não é possível definir outro utilizador no pedido.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Nova chave</CardTitle>
              <CardDescription>Etiqueta para identificar a integração (ex.: ERP, webhook).</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="key-name">Nome</Label>
                <Input
                  id="key-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Integração produção"
                />
              </div>
              <Button
                type="button"
                disabled={createMut.isPending}
                onClick={() => createMut.mutate()}
              >
                {createMut.isPending ? "A criar…" : "Gerar chave"}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Chaves ativas</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <p className="text-sm text-muted-foreground">A carregar…</p>
              ) : !keys?.length ? (
                <p className="text-sm text-muted-foreground">Nenhuma chave ativa.</p>
              ) : (
                <ul className="space-y-3">
                  {keys.map((k) => (
                    <li
                      key={k.id}
                      className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3 last:border-0"
                    >
                      <div>
                        <p className="font-medium">{k.name}</p>
                        <p className="font-mono text-xs text-muted-foreground">
                          {k.maskedValue}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(k.createdAt).toLocaleString("pt-PT")}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        disabled={revokeMut.isPending}
                        onClick={() => revokeMut.mutate(k.id)}
                      >
                        Revogar
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  )
}
