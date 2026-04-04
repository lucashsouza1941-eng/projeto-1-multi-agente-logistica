import { redirect } from "next/navigation"

/** Alias de produto: tickets de escalação vivem em /escalations. */
export default function TicketsPage() {
  redirect("/escalations")
}
