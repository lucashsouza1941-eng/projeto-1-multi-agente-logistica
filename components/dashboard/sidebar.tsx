"use client"

import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Mail,
  FileText,
  AlertTriangle,
  Bot,
  Settings,
  BarChart3,
  ChevronLeft,
  Boxes,
  Workflow,
  History,
  KeyRound,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSidebarStats } from "@/hooks/use-sidebar-stats"

interface SidebarProps {
  open: boolean
  onToggle: () => void
}

type SidebarStatKey = "agents" | "emails" | "escalations"

const navigation: Array<{
  name: string
  icon: typeof LayoutDashboard
  href: string
  stat?: SidebarStatKey
}> = [
  { name: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
  { name: "Agentes", icon: Bot, href: "/agents", stat: "agents" },
  { name: "Triagem de E-mails", icon: Mail, href: "/email-triage", stat: "emails" },
  { name: "Relatórios", icon: FileText, href: "/reports" },
  { name: "Escalonamentos", icon: AlertTriangle, href: "/escalations", stat: "escalations" },
  { name: "Workflows", icon: Workflow, href: "/workflows" },
  { name: "Analytics", icon: BarChart3, href: "/analytics" },
  { name: "Log de Atividade", icon: History, href: "/activity" },
]

function SidebarStatBadgeContent({
  statKey,
  isLoading,
  isError,
  activeAgents,
  pendingEmails,
  openEscalationTickets,
}: {
  statKey: SidebarStatKey
  isLoading: boolean
  isError: boolean
  activeAgents: number | null
  pendingEmails: number | null
  openEscalationTickets: number | null
}) {
  if (isLoading) {
    return <Skeleton className="h-5 min-w-[2.5rem] rounded-md" />
  }

  const dash = "–"

  if (statKey === "agents") {
    if (isError || activeAgents === null) return dash
    return `${activeAgents} ${activeAgents === 1 ? "ativo" : "ativos"}`
  }
  if (statKey === "emails") {
    if (isError || pendingEmails === null) return dash
    return String(pendingEmails)
  }
  if (isError || openEscalationTickets === null) return dash
  return String(openEscalationTickets)
}

const settings = [
  { name: "Configurações", icon: Settings, href: "/settings" },
  { name: "API Keys", icon: KeyRound, href: "/settings/api-keys" },
]

function NavContent({ open }: { open: boolean }) {
  const pathname = usePathname()
  const sidebarStats = useSidebarStats()

  return (
    <>
      <nav className="space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {open && (
                <>
                  <span className="flex-1">{item.name}</span>
                  {item.stat && (
                    <Badge
                      variant={isActive ? "default" : "secondary"}
                      className="text-xs tabular-nums"
                    >
                      <SidebarStatBadgeContent
                        statKey={item.stat}
                        isLoading={sidebarStats.isLoading}
                        isError={sidebarStats.isError}
                        activeAgents={sidebarStats.activeAgents}
                        pendingEmails={sidebarStats.pendingEmails}
                        openEscalationTickets={sidebarStats.openEscalationTickets}
                      />
                    </Badge>
                  )}
                </>
              )}
            </Link>
          )
        })}
      </nav>

      {open && <Separator className="my-4" />}

      <nav className="space-y-1">
        {settings.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {open && <span>{item.name}</span>}
            </Link>
          )
        })}
      </nav>
    </>
  )
}

export function DashboardSidebar({ open, onToggle }: SidebarProps) {
  return (
    <aside 
      className={cn(
        "relative flex flex-col border-r border-border bg-sidebar transition-all duration-300 ease-in-out",
        open ? "w-64" : "w-16"
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 px-4 border-b border-border">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
          <Boxes className="h-5 w-5 text-primary-foreground" />
        </div>
        {open && (
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-foreground">LogiAgent</span>
            <span className="text-xs text-muted-foreground">Enterprise</span>
          </div>
        )}
      </div>

      {/* Toggle Button */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute -right-3 top-20 h-6 w-6 rounded-full border border-border bg-background shadow-sm"
        onClick={onToggle}
      >
        <ChevronLeft className={cn("h-3 w-3 transition-transform", !open && "rotate-180")} />
      </Button>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <NavContent open={open} />
      </ScrollArea>

      {/* Status */}
      {open && (
        <div className="border-t border-border p-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground">System Status</p>
              <p className="text-sm font-medium text-success">All agents operational</p>
            </div>
          </div>
        </div>
      )}
    </aside>
  )
}

// Backwards-compatible alias for existing imports
export const Sidebar = DashboardSidebar

