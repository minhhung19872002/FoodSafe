import { useQuery } from "@tanstack/react-query";
import { dashboardApi } from "./dashboardApi";
import type { DashboardStatsFilter } from "../types/dashboard.types";

export const dashboardKeys = {
  all: ["dashboard"] as const,
  stats: (filter?: DashboardStatsFilter) =>
    [...dashboardKeys.all, "stats", filter] as const,
};

export function useDashboardStats(filter?: DashboardStatsFilter) {
  return useQuery({
    queryKey: dashboardKeys.stats(filter),
    queryFn: () => dashboardApi.getStats(filter),
    staleTime: 60_000,
  });
}
