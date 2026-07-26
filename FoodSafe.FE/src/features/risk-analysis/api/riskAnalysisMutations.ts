import { useMutation, useQueryClient } from "@tanstack/react-query";
import { riskAnalysisApi } from "./riskAnalysisApi";
import { raKeys } from "./riskAnalysisQueries";
import type { CreateUpdateRiskAnalysisInput } from "../types/riskAnalysis.types";

function useRefresh() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: raKeys.all });
}

export function useCreateRiskAnalysis() {
  const refresh = useRefresh();
  return useMutation({
    mutationFn: (input: CreateUpdateRiskAnalysisInput) =>
      riskAnalysisApi.create(input),
    onSuccess: refresh,
  });
}

export function useUpdateRiskAnalysis() {
  const refresh = useRefresh();
  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: CreateUpdateRiskAnalysisInput;
    }) => riskAnalysisApi.update(id, input),
    onSuccess: refresh,
  });
}

export function useDeleteRiskAnalysis() {
  const refresh = useRefresh();
  return useMutation({
    mutationFn: (id: string) => riskAnalysisApi.delete(id),
    onSuccess: refresh,
  });
}

export function usePublishRiskAnalysis() {
  const refresh = useRefresh();
  return useMutation({
    mutationFn: (id: string) => riskAnalysisApi.publish(id),
    onSuccess: refresh,
  });
}
