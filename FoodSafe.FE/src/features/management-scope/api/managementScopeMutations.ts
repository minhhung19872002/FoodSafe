import { useMutation, useQueryClient } from "@tanstack/react-query";
import { managementScopeApi } from "./managementScopeApi";
import { managementScopeKeys } from "./managementScopeQueries";

export function useCreateScopeAssignment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: managementScopeApi.createAssignment,
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: managementScopeKeys.all,
      });
    },
  });
}

export function useDeleteScopeAssignment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: managementScopeApi.deleteAssignment,
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: managementScopeKeys.all,
      });
    },
  });
}
