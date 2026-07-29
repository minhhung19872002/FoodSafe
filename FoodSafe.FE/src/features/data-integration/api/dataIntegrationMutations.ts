import { useMutation, useQueryClient } from "@tanstack/react-query";
import { dataIntegrationApi } from "./dataIntegrationApi";
import type {
  ApiCallLogFilter,
  ApiEndpointFilter,
  ApiSpecificationFilter,
  CreatePartnerAccount,
  CreateUpdateApiEndpoint,
  IssuePartnerApiKeyInput,
  ShareDataInput,
  UpdateApiSpecMetadataInput,
  UpdatePartnerAccount,
  UploadApiSpecificationInput,
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
    mutationFn: (input: ShareDataInput) => dataIntegrationApi.shareData(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["api-call-logs"] }),
  });
}

export function useRetryCallLog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (logId: string) => dataIntegrationApi.retryCallLog(logId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["api-call-logs"] }),
  });
}

export function useExportCallLogs() {
  return useMutation({
    mutationFn: (filter: ApiCallLogFilter) =>
      dataIntegrationApi.exportCallLogs(filter),
  });
}

export function useCreatePartner() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreatePartnerAccount) =>
      dataIntegrationApi.createPartner(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["partner-accounts"] }),
  });
}

export function useUpdatePartner() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdatePartnerAccount }) =>
      dataIntegrationApi.updatePartner(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["partner-accounts"] }),
  });
}

export function useTogglePartnerStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => dataIntegrationApi.togglePartnerStatus(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["partner-accounts"] }),
  });
}

export function useDeletePartner() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => dataIntegrationApi.deletePartner(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["partner-accounts"] }),
  });
}

export function useIssuePartnerKey() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: IssuePartnerApiKeyInput;
    }) => dataIntegrationApi.issuePartnerKey(id, input),
    onSuccess: (_, { id }) => {
      void qc.invalidateQueries({ queryKey: ["partner-keys", id] });
      void qc.invalidateQueries({ queryKey: ["partner-accounts"] });
    },
  });
}

export function useRevokePartnerKey() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, keyId }: { id: string; keyId: string }) =>
      dataIntegrationApi.revokePartnerKey(id, keyId),
    onSuccess: (_, { id }) => {
      void qc.invalidateQueries({ queryKey: ["partner-keys", id] });
      void qc.invalidateQueries({ queryKey: ["partner-accounts"] });
    },
  });
}

export function useUploadApiSpec() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UploadApiSpecificationInput) =>
      dataIntegrationApi.uploadApiSpec(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["api-specs"] }),
  });
}

export function useUpdateApiSpecMetadata() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: UpdateApiSpecMetadataInput;
    }) => dataIntegrationApi.updateApiSpecMetadata(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["api-specs"] }),
  });
}

export function usePublishApiSpec() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => dataIntegrationApi.publishApiSpec(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["api-specs"] }),
  });
}

export function useUnpublishApiSpec() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => dataIntegrationApi.unpublishApiSpec(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["api-specs"] }),
  });
}

export function useDeleteApiSpec() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => dataIntegrationApi.deleteApiSpec(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["api-specs"] }),
  });
}

export function useDownloadApiSpec() {
  return useMutation({
    mutationFn: (id: string) => dataIntegrationApi.downloadApiSpec(id),
  });
}

export function useExportApiSpecs() {
  return useMutation({
    mutationFn: (filter: ApiSpecificationFilter) =>
      dataIntegrationApi.exportApiSpecs(filter),
  });
}

/** Officer disposition of partner data received through the inbound API (INT-03). */
export function useProcessInboundSubmission() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (submissionId: string) =>
      dataIntegrationApi.processInboundSubmission(submissionId),
    onSuccess: () => invalidateInboundSubmissions(qc),
  });
}

export function useRejectInboundSubmission() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      submissionId,
      reason,
    }: {
      submissionId: string;
      reason: string;
    }) => dataIntegrationApi.rejectInboundSubmission(submissionId, reason),
    onSuccess: () => invalidateInboundSubmissions(qc),
  });
}

function invalidateInboundSubmissions(qc: ReturnType<typeof useQueryClient>) {
  void qc.invalidateQueries({ queryKey: ["inbound-submissions"] });
  void qc.invalidateQueries({ queryKey: ["inbound-submission"] });
}
