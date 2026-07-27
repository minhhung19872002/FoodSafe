import { useQuery } from "@tanstack/react-query";
import { statisticsApi } from "./statisticsApi";
import type { StatisticsFilter } from "../types/statistics.types";

const statisticsKeys = {
  all: ["statistics"] as const,
  detail: (filter: StatisticsFilter) =>
    [...statisticsKeys.all, filter] as const,
};

export function useStatistics(filter: StatisticsFilter) {
  return useQuery({
    queryKey: statisticsKeys.detail(filter),
    queryFn: () => statisticsApi.get(filter),
    staleTime: 60_000,
  });
}

export function useReportStatistics(filter: StatisticsFilter) {
  return useQuery({
    queryKey: [...statisticsKeys.all, "report", filter] as const,
    queryFn: () => statisticsApi.getReport(filter),
    staleTime: 60_000,
  });
}
