import { useQuery } from "@tanstack/react-query";
import { dataIntegrationApi } from "./dataIntegrationApi";
import type {
  ApiEndpointFilter,
  ApiCallLogFilter,
  ApiSpecificationFilter,
  InboundSubmissionFilter,
  PartnerAccountFilter,
} from "../types/dataIntegration.types";

const keys = {
  endpoints: (filter: ApiEndpointFilter) => ["api-endpoints", filter] as const,
  callLogs: (filter: ApiCallLogFilter) => ["api-call-logs", filter] as const,
  callLog: (id: string) => ["api-call-log", id] as const,
  alertShareOptions: (filter?: string) =>
    ["data-sharing", "alert-options", filter] as const,
  inspectionResultShareOptions: (filter?: string) =>
    ["data-sharing", "inspection-result-options", filter] as const,
  partners: (filter: PartnerAccountFilter) =>
    ["partner-accounts", filter] as const,
  partnerKeys: (id: string) => ["partner-keys", id] as const,
  submissions: (filter: InboundSubmissionFilter) =>
    ["inbound-submissions", filter] as const,
  submission: (id: string) => ["inbound-submission", id] as const,
  apiSpecs: (filter: ApiSpecificationFilter) => ["api-specs", filter] as const,
  apiSpec: (id: string) => ["api-spec", id] as const,
};

export function useApiEndpoints(filter: ApiEndpointFilter, enabled = true) {
  return useQuery({
    queryKey: keys.endpoints(filter),
    queryFn: () => dataIntegrationApi.getEndpoints(filter),
    enabled,
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

export function useAlertShareOptions(filter?: string, enabled = true) {
  return useQuery({
    queryKey: keys.alertShareOptions(filter),
    queryFn: () => dataIntegrationApi.getAlertShareOptions(filter),
    enabled,
  });
}

export function useInspectionResultShareOptions(
  filter?: string,
  enabled = true,
) {
  return useQuery({
    queryKey: keys.inspectionResultShareOptions(filter),
    queryFn: () => dataIntegrationApi.getInspectionResultShareOptions(filter),
    enabled,
  });
}

export function usePartnerAccounts(filter: PartnerAccountFilter) {
  return useQuery({
    queryKey: keys.partners(filter),
    queryFn: () => dataIntegrationApi.getPartners(filter),
  });
}

export function usePartnerKeys(partnerId: string | undefined) {
  return useQuery({
    queryKey: keys.partnerKeys(partnerId!),
    queryFn: () => dataIntegrationApi.getPartnerKeys(partnerId!),
    enabled: Boolean(partnerId),
  });
}

export function useInboundSubmissions(filter: InboundSubmissionFilter) {
  return useQuery({
    queryKey: keys.submissions(filter),
    queryFn: () => dataIntegrationApi.getInboundSubmissions(filter),
  });
}

export function useInboundSubmissionDetail(id: string | undefined) {
  return useQuery({
    queryKey: keys.submission(id!),
    queryFn: () => dataIntegrationApi.getInboundSubmission(id!),
    enabled: Boolean(id),
  });
}

export function useApiSpecs(filter: ApiSpecificationFilter, enabled = true) {
  return useQuery({
    queryKey: keys.apiSpecs(filter),
    queryFn: () => dataIntegrationApi.getApiSpecs(filter),
    enabled,
  });
}

export function useApiSpec(id: string | undefined) {
  return useQuery({
    queryKey: keys.apiSpec(id!),
    queryFn: () => dataIntegrationApi.getApiSpec(id!),
    enabled: Boolean(id),
  });
}
