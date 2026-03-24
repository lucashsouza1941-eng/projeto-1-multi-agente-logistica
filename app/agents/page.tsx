"use client"

import { Sidebar } from "@/components/dashboard/sidebar"
import { Header } from "@/components/dashboard/header"
import { AgentGrid } from "@/components/agents/agent-grid"

export default function AgentsPage() {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header 
          breadcrumbs={[
            { label: "LogiAgent", href: "/" },
            { label: "Agentes", href: "/agents" }
          ]} 
        />
        <main className="flex-1 p-6 overflow-auto">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-semibold text-foreground">Painel de Agentes</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Gerencie e monitore seus agentes de IA em tempo real
                </p>
              </div>
            </div>
            <AgentGrid />
          </div>
        </main>
      </div>
    </div>
  )
}
