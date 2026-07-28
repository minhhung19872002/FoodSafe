import { useQuery } from "@tanstack/react-query";
import { poisoningCaseApi, poisoningIncidentApi } from "./foodPoisoningApi";
import type { CaseFilter, IncidentFilter } from "../types/foodPoisoning.types";

export const caseKeys = {
  all: ["poisoning-cases"] as const,
  lists: () => [...caseKeys.all, "list"] as const,
  list: (filter: CaseFilter) => [...caseKeys.lists(), filter] as const,
  detail: (id: string) => [...caseKeys.all, "detail", id] as const,
  errorReports: (id: string) => [...caseKeys.all, "error-reports", id] as const,
};

export const incidentKeys = {
  all: ["poisoning-incidents"] as const,
  lists: () => [...incidentKeys.all, "list"] as const,
  list: (filter: IncidentFilter) => [...incidentKeys.lists(), filter] as const,
  detail: (id: string) => [...incidentKeys.all, "detail", id] as const,
  errorReports: (id: string) =>
    [...incidentKeys.all, "error-reports", id] as const,
};

export function usePoisoningCases(
  filter: CaseFilter,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: caseKeys.list(filter),
    queryFn: () => poisoningCaseApi.list(filter),
    // Trang dùng chung (thống kê) tắt query khi thiếu quyền Cases.View.
    enabled: options?.enabled ?? true,
  });
}

export function usePoisoningCase(id: string) {
  return useQuery({
    queryKey: caseKeys.detail(id),
    queryFn: () => poisoningCaseApi.get(id),
    enabled: !!id,
  });
}

export function useCaseErrorReports(id: string) {
  return useQuery({
    queryKey: caseKeys.errorReports(id),
    queryFn: () => poisoningCaseApi.getErrorReports(id),
    enabled: !!id,
  });
}

export function usePoisoningIncidents(
  filter: IncidentFilter,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: incidentKeys.list(filter),
    queryFn: () => poisoningIncidentApi.list(filter),
    // Trang dùng chung (thống kê) tắt query khi thiếu quyền Incidents.View.
    enabled: options?.enabled ?? true,
  });
}

export function usePoisoningIncident(id: string) {
  return useQuery({
    queryKey: incidentKeys.detail(id),
    queryFn: () => poisoningIncidentApi.get(id),
    enabled: !!id,
  });
}

export function useIncidentErrorReports(id: string) {
  return useQuery({
    queryKey: incidentKeys.errorReports(id),
    queryFn: () => poisoningIncidentApi.getErrorReports(id),
    enabled: !!id,
  });
}
