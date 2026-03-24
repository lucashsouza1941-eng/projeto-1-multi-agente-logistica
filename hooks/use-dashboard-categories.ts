"use client"

import { useQuery } from "@tanstack/react-query"
import { getDashboardCategories } from "@/lib/api"

export function useDashboardCategories() {
  return useQuery({
    queryKey: ["dashboard", "categories"],
    queryFn: () => getDashboardCategories(),
  })
}
