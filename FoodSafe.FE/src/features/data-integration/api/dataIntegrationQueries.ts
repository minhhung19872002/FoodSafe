import { useQuery } from "@tanstack/react-query";
import { dataIntegrationApi } from "./dataIntegrationApi";
import type {
  ApiEndpointFilter,
  ApiCallLogFilter,
} from "../types/dataIntegration.types";

const keys = {
  endpoints: (filter: ApiEndpointFilter) => ["api-endpoints", filter] as const,
  callLogs: (filter: ApiCallLogFilter) => ["api-call-logs", filter] as const,
  callLog: (id: string) => ["api-call-log", id] as const,
};

export function useApiEndpoints(filter: ApiEndpointFilter) {
  return useQuery({
    queryKey: keys.endpoints(filter),
    queryFn: () => dataIntegrationApi.getEndpoints(filter),
  });
}

export function useApiCallLogs(filter: ApiCallLogFilter) {
  return useQuery({
    queryKey: keys.callLogs(filter),
    queryFn: () => dataIntegrationApi.getCallLogs(filter),
  });
}

export function useApiCallLogDetail(id: string | undefined) {
  return useQuery({
    queryKey: keys.callLog(id!),
    queryFn: () => dataIntegrationApi.getCallLog(id!),
    enabled: Boolean(id),
  });
}
