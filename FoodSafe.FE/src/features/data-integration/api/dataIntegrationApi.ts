import { api } from "@/lib/axios";
import type {
  ApiEndpoint,
  ApiEndpointFilter,
  CreateUpdateApiEndpoint,
  ApiCallLog,
  ApiCallLogDetail,
  ApiCallLogFilter,
  PagedResult,
} from "../types/dataIntegration.types";

export const dataIntegrationApi = {
  getEndpoints: (params: ApiEndpointFilter) =>
    api
      .get<PagedResult<ApiEndpoint>>("/api/app/api-endpoint", { params })
      .then((r) => r.data),

  getEndpoint: (id: string) =>
    api.get<ApiEndpoint>(`/api/app/api-endpoint/${id}`).then((r) => r.data),

  createEndpoint: (input: CreateUpdateApiEndpoint) =>
    api.post<ApiEndpoint>("/api/app/api-endpoint", input).then((r) => r.data),

  updateEndpoint: (id: string, input: CreateUpdateApiEndpoint) =>
    api
      .put<ApiEndpoint>(`/api/app/api-endpoint/${id}`, input)
      .then((r) => r.data),

  toggleEndpointStatus: (id: string) =>
    api.post(`/api/app/api-endpoint/${id}/toggle-status`),

  deleteEndpoint: (id: string) =>
    api.delete(`/api/app/api-endpoint/${id}`),

  getCallLogs: (params: ApiCallLogFilter) =>
    api
      .get<PagedResult<ApiCallLog>>("/api/app/api-call-log", { params })
      .then((r) => r.data),

  getCallLog: (id: string) =>
    api
      .get<ApiCallLogDetail>(`/api/app/api-call-log/${id}`)
      .then((r) => r.data),
};
