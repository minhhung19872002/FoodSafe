import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { inspectionPlanApi, inspectionResultApi } from "./inspectionApi";
import type {
  InspectionPlanFilter,
  InspectionResultFilter,
} from "../types/inspection.types";

export const inspectionPlanKeys = {
  all: ["inspection-plans"] as const,
  list: (filter: InspectionPlanFilter) =>
    [...inspectionPlanKeys.all, "list", filter] as const,
  businesses: (filter?: string) =>
    [...inspectionPlanKeys.all, "businesses", filter ?? ""] as const,
};

export const inspectionResultKeys = {
  all: ["inspection-results"] as const,
  list: (filter: InspectionResultFilter) =>
    [...inspectionResultKeys.all, "list", filter] as const,
};

export function useInspectionPlans(filter: InspectionPlanFilter) {
  return useQuery({
    queryKey: inspectionPlanKeys.list(filter),
    queryFn: () => inspectionPlanApi.list(filter),
    placeholderData: keepPreviousData,
  });
}

export function useInspectionBusinesses(filter?: string) {
  return useQuery({
    queryKey: inspectionPlanKeys.businesses(filter),
    queryFn: () => inspectionPlanApi.businessOptions(filter || undefined),
    placeholderData: (previous) => previous,
  });
}

export function useInspectionResults(filter: InspectionResultFilter) {
  return useQuery({
    queryKey: inspectionResultKeys.list(filter),
    queryFn: () => inspectionResultApi.list(filter),
    placeholderData: keepPreviousData,
  });
}
