import { useQuery } from "@tanstack/react-query";
import { testingResultApi } from "./testingResultApi";
import type { TestingResultFilter } from "../types/testingResult.types";

const OPTIONS_STALE_TIME = 5 * 60 * 1000;

export const trKeys = {
  all: ["testing-results"] as const,
  lists: () => [...trKeys.all, "list"] as const,
  list: (filter: TestingResultFilter) => [...trKeys.lists(), filter] as const,
  detail: (id: string) => [...trKeys.all, "detail", id] as const,
  businessOptions: () => [...trKeys.all, "business-options"] as const,
  productOptions: (businessId?: string) =>
    [...trKeys.all, "product-options", businessId ?? null] as const,
  inspectionResultOptions: (businessId?: string) =>
    [...trKeys.all, "inspection-result-options", businessId ?? null] as const,
};

export function useTestingResults(filter: TestingResultFilter) {
  return useQuery({
    queryKey: trKeys.list(filter),
    queryFn: () => testingResultApi.list(filter),
  });
}

export function useTestingResult(id: string) {
  return useQuery({
    queryKey: trKeys.detail(id),
    queryFn: () => testingResultApi.get(id),
    enabled: !!id,
  });
}

export function useTestingCenterOptions() {
  return useQuery({
    queryKey: [...trKeys.all, "testing-center-options"] as const,
    queryFn: () => testingResultApi.testingCenterOptions(),
    staleTime: OPTIONS_STALE_TIME,
  });
}

export function useTestingServiceOptions() {
  return useQuery({
    queryKey: [...trKeys.all, "testing-service-options"] as const,
    queryFn: () => testingResultApi.testingServiceOptions(),
    staleTime: OPTIONS_STALE_TIME,
  });
}

/** Facilities a sample can be attributed to (also drives the list filter). */
export function useSampledBusinessOptions() {
  return useQuery({
    queryKey: trKeys.businessOptions(),
    queryFn: () => testingResultApi.businessOptions(),
    staleTime: OPTIONS_STALE_TIME,
  });
}

/** Products of the selected facility; idle until a facility is chosen. */
export function useSampledProductOptions(businessId?: string) {
  return useQuery({
    queryKey: trKeys.productOptions(businessId),
    queryFn: () => testingResultApi.productOptions(businessId ?? ""),
    enabled: !!businessId,
    staleTime: OPTIONS_STALE_TIME,
  });
}

/**
 * Inspection results of the selected facility. `enabled` also carries the
 * caller's `Inspection.Results.View` check so users without that permission
 * never fire a request that the backend would reject.
 */
export function useRelatedInspectionResultOptions(
  businessId: string | undefined,
  enabled: boolean,
) {
  return useQuery({
    queryKey: trKeys.inspectionResultOptions(businessId),
    queryFn: () => testingResultApi.inspectionResultOptions(businessId ?? ""),
    enabled: enabled && !!businessId,
    staleTime: OPTIONS_STALE_TIME,
  });
}
