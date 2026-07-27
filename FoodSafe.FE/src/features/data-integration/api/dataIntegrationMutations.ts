import { useMutation, useQueryClient } from "@tanstack/react-query";
import { dataIntegrationApi } from "./dataIntegrationApi";
import type {
  ApiCallLogFilter,
  ApiEndpointFilter,
  CreateUpdateApiEndpoint,
  ShareDataInput,
} from "../types/dataIntegration.types";

export function useCreateEndpoint() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateUpdateApiEndpoint) =>
      dataIntegrationApi.createEndpoint(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["api-endpoints"] }),
  });
}

export function useUpdateEndpoint() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: CreateUpdateApiEndpoint;
    }) => dataIntegrationApi.updateEndpoint(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["api-endpoints"] }),
  });
}

export function useToggleEndpointStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => dataIntegrationApi.toggleEndpointStatus(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["api-endpoints"] }),
  });
}

export function useDeleteEndpoint() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => dataIntegrationApi.deleteEndpoint(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["api-endpoints"] }),
  });
}

export function useExportEndpoints() {
  return useMutation({
    mutationFn: (filter: ApiEndpointFilter) =>
      dataIntegrationApi.exportEndpoints(filter),
  });
}

export function useTestConnection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => dataIntegrationApi.testConnection(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["api-call-logs"] }),
  });
}

export function useShareData() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: ShareDataInput) =>
      dataIntegrationApi.shareData(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["api-call-logs"] }),
  });
}

export function useExportCallLogs() {
  return useMutation({
    mutationFn: (filter: ApiCallLogFilter) =>
      dataIntegrationApi.exportCallLogs(filter),
  });
}
