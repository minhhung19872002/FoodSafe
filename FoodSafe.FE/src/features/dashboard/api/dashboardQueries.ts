import { useQuery } from "@tanstack/react-query";
import { dashboardApi } from "./dashboardApi";
import type { DashboardFilter } from "../types/dashboard.types";

export const dashboardKeys = {
  all: ["dashboard"] as const,
  stats: (filter: DashboardFilter) =>
    [...dashboardKeys.all, "stats", filter] as const,
  compliance: (filter: DashboardFilter) =>
    [...dashboardKeys.all, "compliance", filter] as const,
};

export function useDashboardStats(filter: DashboardFilter) {
  return useQuery({
    queryKey: dashboardKeys.stats(filter),
    queryFn: () => dashboardApi.getStats(filter),
    staleTime: 60_000,
  });
}

export function useReportCompliance(filter: DashboardFilter) {
  return useQuery({
    queryKey: dashboardKeys.compliance(filter),
    queryFn: () => dashboardApi.getReportCompliance(filter),
    staleTime: 60_000,
  });
}
