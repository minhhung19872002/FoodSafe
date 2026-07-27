import { api } from "@/lib/axios";
import type {
  ApiEndpoint,
  ApiEndpointFilter,
  CreateUpdateApiEndpoint,
  ApiCallLog,
  ApiCallLogDetail,
  ApiCallLogFilter,
  FileDownload,
  PagedResult,
  ShareDataInput,
  ShareDataResult,
  TestConnectionResult,
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
      .post<TestConnectionResult>(
        `/v1/app/api-endpoint/${id}/test-connection`,
      )
      .then((r) => r.data),

  shareData: (input: ShareDataInput) =>
    api
      .post<ShareDataResult>("/v1/app/data-sharing/share", input)
      .then((r) => r.data),

  exportCallLogs: async (filter: ApiCallLogFilter): Promise<FileDownload> => {
    const response = await api.get<Blob>("/v1/app/api-call-log/excel/export", {
      params: filter,
      responseType: "blob",
    });
    return download(response.data, response.headers["content-disposition"]);
  },
};
