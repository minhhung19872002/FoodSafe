import { useQuery } from "@tanstack/react-query";
import { managementScopeApi } from "./managementScopeApi";
import type { DataScopeAssignmentListInput } from "../types/managementScope.types";

export const managementScopeKeys = {
  all: ["management-scope"] as const,
  assignments: (params: DataScopeAssignmentListInput) =>
    [...managementScopeKeys.all, "assignments", params] as const,
};

export function useScopeAssignments(
  params: DataScopeAssignmentListInput,
  enabled = true,
) {
  return useQuery({
    queryKey: managementScopeKeys.assignments(params),
    queryFn: () => managementScopeApi.getAssignments(params),
    enabled,
  });
}
