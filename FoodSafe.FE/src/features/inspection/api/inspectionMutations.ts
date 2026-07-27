import { useMutation, useQueryClient } from "@tanstack/react-query";
import { inspectionPlanApi, inspectionResultApi } from "./inspectionApi";
import { inspectionPlanKeys, inspectionResultKeys } from "./inspectionQueries";
import type {
  InspectionPlanFilter,
  InspectionPlanItemStatus,
  InspectionResultFilter,
} from "../types/inspection.types";

function usePlanRefresh<TVariables>(
  mutationFn: (variables: TVariables) => Promise<unknown>,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: inspectionPlanKeys.all }),
  });
}

function useResultRefresh<TVariables>(
  mutationFn: (variables: TVariables) => Promise<unknown>,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: inspectionResultKeys.all }),
  });
}

export function useCreateInspectionPlan() {
  return usePlanRefresh(inspectionPlanApi.create);
}

export function useUpdateInspectionPlan() {
  return usePlanRefresh(
    ({
      id,
      input,
    }: {
      id: string;
      input: Parameters<typeof inspectionPlanApi.update>[1];
    }) => inspectionPlanApi.update(id, input),
  );
}

export function useDeleteInspectionPlan() {
  return usePlanRefresh(inspectionPlanApi.delete);
}

export function useSubmitInspectionPlan() {
  return usePlanRefresh(inspectionPlanApi.submit);
}

export function useApproveInspectionPlan() {
  return usePlanRefresh(inspectionPlanApi.approve);
}

export function useRejectInspectionPlan() {
  return usePlanRefresh(({ id, reason }: { id: string; reason: string }) =>
    inspectionPlanApi.reject(id, reason),
  );
}

export function useCompleteInspectionPlan() {
  return usePlanRefresh(inspectionPlanApi.complete);
}

export function useUpdatePlanItemStatus() {
  return usePlanRefresh(
    ({
      id,
      itemId,
      status,
    }: {
      id: string;
      itemId: string;
      status: InspectionPlanItemStatus;
    }) => inspectionPlanApi.updateItemStatus(id, itemId, status),
  );
}

export function useCancelInspectionPlan() {
  return usePlanRefresh(({ id, reason }: { id: string; reason: string }) =>
    inspectionPlanApi.cancel(id, reason),
  );
}

export function useCreateInspectionResult() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: inspectionResultApi.create,
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: inspectionResultKeys.all,
      });
      void queryClient.invalidateQueries({
        queryKey: inspectionPlanKeys.all,
      });
    },
  });
}

export function useUpdateInspectionResult() {
  return useResultRefresh(
    ({
      id,
      input,
    }: {
      id: string;
      input: Parameters<typeof inspectionResultApi.update>[1];
    }) => inspectionResultApi.update(id, input),
  );
}

export function useDeleteInspectionResult() {
  return useResultRefresh(inspectionResultApi.delete);
}

export function useFinalizeInspectionResult() {
  return useResultRefresh(inspectionResultApi.finalize);
}

export function useMarkViolationRemedied() {
  return useResultRefresh(
    ({
      resultId,
      violationId,
      notes,
    }: {
      resultId: string;
      violationId: string;
      notes?: string;
    }) =>
      inspectionResultApi.markViolationRemedied(resultId, violationId, notes),
  );
}

export function useSetFollowUpResult() {
  return useResultRefresh(
    ({
      id,
      result,
    }: {
      id: string;
      result: Parameters<typeof inspectionResultApi.setFollowUpResult>[1];
    }) => inspectionResultApi.setFollowUpResult(id, result),
  );
}

export function useExportInspectionPlans() {
  return useMutation({
    mutationFn: (filter: InspectionPlanFilter) =>
      inspectionPlanApi.exportExcel(filter),
  });
}

export function useExportInspectionResults() {
  return useMutation({
    mutationFn: (filter: InspectionResultFilter) =>
      inspectionResultApi.exportExcel(filter),
  });
}
