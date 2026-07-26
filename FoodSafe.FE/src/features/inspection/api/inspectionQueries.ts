import { useQuery } from "@tanstack/react-query";
import { inspectionPlanApi, inspectionResultApi } from "./inspectionApi";
import type {
  InspectionPlanFilter,
  InspectionResultFilter,
} from "../types/inspection.types";

export const inspectionPlanKeys = {
  all: ["inspection-plans"] as const,
  list: (filter: InspectionPlanFilter) =>
    [...inspectionPlanKeys.all, "list", filter] as const,
  businesses: () => [...inspectionPlanKeys.all, "businesses"] as const,
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
  });
}

export function useInspectionBusinesses() {
  return useQuery({
    queryKey: inspectionPlanKeys.businesses(),
    queryFn: () => inspectionPlanApi.businessOptions(),
  });
}

export function useInspectionResults(filter: InspectionResultFilter) {
  return useQuery({
    queryKey: inspectionResultKeys.list(filter),
    queryFn: () => inspectionResultApi.list(filter),
  });
}
