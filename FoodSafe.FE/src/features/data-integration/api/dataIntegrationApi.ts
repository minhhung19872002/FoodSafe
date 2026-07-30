import { api } from "@/lib/axios";
import type {
  ApiEndpoint,
  ApiEndpointFilter,
  AlertShareOption,
  ApiSpecification,
  ApiSpecificationDownload,
  ApiSpecificationFilter,
  CreateUpdateApiEndpoint,
  ApiCallLog,
  ApiCallLogDetail,
  ApiCallLogFilter,
  CreatePartnerAccount,
  FileDownload,
  InboundSubmission,
  InboundSubmissionDetail,
  InboundSubmissionFilter,
  InspectionResultShareOption,
  IssuePartnerApiKeyInput,
  IssuedPartnerApiKey,
  PagedResult,
  PartnerAccount,
  PartnerAccountFilter,
  PartnerApiKey,
  ShareDataInput,
  ShareDataResult,
  TestConnectionResult,
  UpdateApiSpecMetadataInput,
  UpdatePartnerAccount,
  UploadApiSpecificationInput,
} from "../types/dataIntegration.types";

function download(data: Blob, contentDisposition?: string): FileDownload {
  const encoded = contentDisposition?.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
  const plain = contentDisposition?.match(/filename="?([^";]+)"?/i)?.[1];
  return {
    blob: data,
    fileName: decodeURIComponent(encoded ?? plain ?? "download"),
  };
}

export const dataIntegrationApi = {
  getEndpoints: (params: ApiEndpointFilter) =>
    api
      .get<PagedResult<ApiEndpoint>>("/v1/app/api-endpoint", { params })
      .then((r) => r.data),

  getEndpoint: (id: string) =>
    api.get<ApiEndpoint>(`/v1/app/api-endpoint/${id}`).then((r) => r.data),

  createEndpoint: (input: CreateUpdateApiEndpoint) =>
    api.post<ApiEndpoint>("/v1/app/api-endpoint", input).then((r) => r.data),

  updateEndpoint: (id: string, input: CreateUpdateApiEndpoint) =>
    api
      .put<ApiEndpoint>(`/v1/app/api-endpoint/${id}`, input)
      .then((r) => r.data),

  toggleEndpointStatus: (id: string) =>
    api.post(`/v1/app/api-endpoint/${id}/toggle-status`),

  deleteEndpoint: (id: string) => api.delete(`/v1/app/api-endpoint/${id}`),

  getCallLogs: (params: ApiCallLogFilter) =>
    api
      .get<PagedResult<ApiCallLog>>("/v1/app/api-call-log", { params })
      .then((r) => r.data),

  getCallLog: (id: string) =>
    api.get<ApiCallLogDetail>(`/v1/app/api-call-log/${id}`).then((r) => r.data),

  exportEndpoints: async (filter: ApiEndpointFilter): Promise<FileDownload> => {
    const response = await api.get<Blob>("/v1/app/api-endpoint/excel/export", {
      params: filter,
      responseType: "blob",
    });
    return download(response.data, response.headers["content-disposition"]);
  },

  testConnection: (id: string) =>
    api
      .post<TestConnectionResult>(`/v1/app/api-endpoint/${id}/test-connection`)
      .then((r) => r.data),

  getAlertShareOptions: (filter?: string) =>
    api
      .get<AlertShareOption[]>("/v1/app/data-sharing/alert-options", {
        params: { filter },
      })
      .then((r) => r.data),

  getInspectionResultShareOptions: (filter?: string) =>
    api
      .get<InspectionResultShareOption[]>(
        "/v1/app/data-sharing/inspection-result-options",
        { params: { filter } },
      )
      .then((r) => r.data),

  shareData: (input: ShareDataInput) =>
    api
      .post<ShareDataResult>("/v1/app/data-sharing/share", input)
      .then((r) => r.data),

  retryCallLog: (logId: string) =>
    api
      .post<ShareDataResult>(`/v1/app/data-sharing/retry/${logId}`)
      .then((r) => r.data),

  exportCallLogs: async (filter: ApiCallLogFilter): Promise<FileDownload> => {
    const response = await api.get<Blob>("/v1/app/api-call-log/excel/export", {
      params: filter,
      responseType: "blob",
    });
    return download(response.data, response.headers["content-disposition"]);
  },

  getPartners: (params: PartnerAccountFilter) =>
    api
      .get<PagedResult<PartnerAccount>>("/v1/app/partner-account", { params })
      .then((r) => r.data),

  createPartner: (input: CreatePartnerAccount) =>
    api
      .post<PartnerAccount>("/v1/app/partner-account", input)
      .then((r) => r.data),

  updatePartner: (id: string, input: UpdatePartnerAccount) =>
    api
      .put<PartnerAccount>(`/v1/app/partner-account/${id}`, input)
      .then((r) => r.data),

  togglePartnerStatus: (id: string) =>
    api.post(`/v1/app/partner-account/${id}/toggle-status`),

  deletePartner: (id: string) => api.delete(`/v1/app/partner-account/${id}`),

  getPartnerKeys: (id: string) =>
    api
      .get<PartnerApiKey[]>(`/v1/app/partner-account/${id}/keys`)
      .then((r) => r.data),

  issuePartnerKey: (id: string, input: IssuePartnerApiKeyInput) =>
    api
      .post<IssuedPartnerApiKey>(`/v1/app/partner-account/${id}/keys`, input)
      .then((r) => r.data),

  revokePartnerKey: (id: string, keyId: string) =>
    api.delete(`/v1/app/partner-account/${id}/keys/${keyId}`),

  getInboundSubmissions: (params: InboundSubmissionFilter) =>
    api
      .get<PagedResult<InboundSubmission>>(
        "/v1/app/partner-account/submissions",
        { params },
      )
      .then((r) => r.data),

  getInboundSubmission: (submissionId: string) =>
    api
      .get<InboundSubmissionDetail>(
        `/v1/app/partner-account/submissions/${submissionId}`,
      )
      .then((r) => r.data),

  processInboundSubmission: (submissionId: string) =>
    api
      .post<InboundSubmission>(
        `/v1/app/partner-account/submissions/${submissionId}/process`,
      )
      .then((r) => r.data),

  rejectInboundSubmission: (submissionId: string, reason: string) =>
    api
      .post<InboundSubmission>(
        `/v1/app/partner-account/submissions/${submissionId}/reject`,
        { reason },
      )
      .then((r) => r.data),

  getApiSpecs: (params: ApiSpecificationFilter) =>
    api
      .get<PagedResult<ApiSpecification>>("/v1/app/api-specification", {
        params,
      })
      .then((r) => r.data),

  getApiSpec: (id: string) =>
    api
      .get<ApiSpecification>(`/v1/app/api-specification/${id}`)
      .then((r) => r.data),

  uploadApiSpec: (input: UploadApiSpecificationInput) =>
    api
      .post<ApiSpecification>("/v1/app/api-specification", input)
      .then((r) => r.data),

  updateApiSpecMetadata: (id: string, input: UpdateApiSpecMetadataInput) =>
    api
      .put<ApiSpecification>(`/v1/app/api-specification/${id}/metadata`, input)
      .then((r) => r.data),

  publishApiSpec: (id: string) =>
    api
      .post<ApiSpecification>(`/v1/app/api-specification/${id}/publish`)
      .then((r) => r.data),

  unpublishApiSpec: (id: string) =>
    api
      .post<ApiSpecification>(`/v1/app/api-specification/${id}/unpublish`)
      .then((r) => r.data),

  deleteApiSpec: (id: string) => api.delete(`/v1/app/api-specification/${id}`),

  downloadApiSpec: (id: string) =>
    api
      .get<ApiSpecificationDownload>(`/v1/app/api-specification/${id}/download`)
      .then((r) => r.data),

  exportApiSpecs: async (
    filter: ApiSpecificationFilter,
  ): Promise<FileDownload> => {
    const response = await api.get<Blob>(
      "/v1/app/api-specification/excel/export",
      {
        params: filter,
        responseType: "blob",
      },
    );
    return download(response.data, response.headers["content-disposition"]);
  },
};
