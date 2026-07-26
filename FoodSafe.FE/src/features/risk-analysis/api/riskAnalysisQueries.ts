import { useQuery } from "@tanstack/react-query";
import { riskAnalysisApi } from "./riskAnalysisApi";
import type { RiskAnalysisFilter } from "../types/riskAnalysis.types";

export const raKeys = {
  all: ["risk-analyses"] as const,
  lists: () => [...raKeys.all, "list"] as const,
  list: (filter: RiskAnalysisFilter) => [...raKeys.lists(), filter] as const,
  detail: (id: string) => [...raKeys.all, "detail", id] as const,
};

export function useRiskAnalyses(filter: RiskAnalysisFilter) {
  return useQuery({
    queryKey: raKeys.list(filter),
    queryFn: () => riskAnalysisApi.list(filter),
  });
}

export function useRiskAnalysis(id: string) {
  return useQuery({
    queryKey: raKeys.detail(id),
    queryFn: () => riskAnalysisApi.get(id),
    enabled: !!id,
  });
}
