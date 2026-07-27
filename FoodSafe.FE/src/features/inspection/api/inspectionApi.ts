import { api } from "@/lib/axios";
import type {
  BusinessOption,
  CreateUpdateInspectionPlanInput,
  CreateUpdateInspectionResultInput,
  FileDownload,
  InspectionPlan,
  InspectionPlanFilter,
  InspectionResult,
  InspectionResultFilter,
  PagedResult,
} from "../types/inspection.types";
import type { FollowUpResult } from "../types/inspection.types";

const planEndpoint = "/v1/app/inspection-plan";
const planExcelEndpoint = `${planEndpoint}/excel`;
const resultEndpoint = "/v1/app/inspection-result";
const resultExcelEndpoint = `${resultEndpoint}/excel`;

function download(data: Blob, contentDisposition?: string): FileDownload {
  const encoded = contentDisposition?.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
  const plain = contentDisposition?.match(/filename="?([^";]+)"?/i)?.[1];
  return {
    blob: data,
    fileName: decodeURIComponent(encoded ?? plain ?? "download"),
  };
}

export const inspectionPlanApi = {
  async list(
    filter: InspectionPlanFilter,
  ): Promise<PagedResult<InspectionPlan>> {
    return (
      await api.get<PagedResult<InspectionPlan>>(planEndpoint, {
        params: filter,
      })
    ).data;
  },
  async get(id: string): Promise<InspectionPlan> {
    return (await api.get<InspectionPlan>(`${planEndpoint}/${id}`)).data;
  },
  async businessOptions(filter?: string): Promise<BusinessOption[]> {
    return (
      await api.get<BusinessOption[]>(`${planEndpoint}/business-options`, {
        params: { filter },
      })
    ).data;
  },
  async create(
    input: CreateUpdateInspectionPlanInput,
  ): Promise<InspectionPlan> {
    return (await api.post<InspectionPlan>(planEndpoint, input)).data;
  },
  async update(
    id: string,
    input: CreateUpdateInspectionPlanInput,
  ): Promise<InspectionPlan> {
    return (await api.put<InspectionPlan>(`${planEndpoint}/${id}`, input)).data;
  },
  async delete(id: string) {
    await api.delete(`${planEndpoint}/${id}`);
  },
  async submit(id: string): Promise<InspectionPlan> {
    return (await api.post<InspectionPlan>(`${planEndpoint}/${id}/submit`))
      .data;
  },
  async approve(id: string): Promise<InspectionPlan> {
    return (await api.post<InspectionPlan>(`${planEndpoint}/${id}/approve`))
      .data;
  },
  async reject(id: string, reason: string): Promise<InspectionPlan> {
    return (
      await api.post<InspectionPlan>(`${planEndpoint}/${id}/reject`, { reason })
    ).data;
  },
  async complete(id: string): Promise<InspectionPlan> {
    return (await api.post<InspectionPlan>(`${planEndpoint}/${id}/complete`))
      .data;
  },
  async cancel(id: string, reason: string): Promise<InspectionPlan> {
    return (
      await api.post<InspectionPlan>(`${planEndpoint}/${id}/cancel`, { reason })
    ).data;
  },
  async exportExcel(filter: InspectionPlanFilter): Promise<FileDownload> {
    const response = await api.get<Blob>(`${planExcelEndpoint}/export`, {
      params: filter,
      responseType: "blob",
    });
    return download(response.data, response.headers["content-disposition"]);
  },
};

export const inspectionResultApi = {
  async list(
    filter: InspectionResultFilter,
  ): Promise<PagedResult<InspectionResult>> {
    return (
      await api.get<PagedResult<InspectionResult>>(resultEndpoint, {
        params: filter,
      })
    ).data;
  },
  async get(id: string): Promise<InspectionResult> {
    return (await api.get<InspectionResult>(`${resultEndpoint}/${id}`)).data;
  },
  async create(
    input: CreateUpdateInspectionResultInput,
  ): Promise<InspectionResult> {
    return (await api.post<InspectionResult>(resultEndpoint, input)).data;
  },
  async update(
    id: string,
    input: CreateUpdateInspectionResultInput,
  ): Promise<InspectionResult> {
    return (await api.put<InspectionResult>(`${resultEndpoint}/${id}`, input))
      .data;
  },
  async delete(id: string) {
    await api.delete(`${resultEndpoint}/${id}`);
  },
  async markViolationRemedied(
    resultId: string,
    violationId: string,
    notes?: string,
  ) {
    await api.post(
      `${resultEndpoint}/mark-violation-remedied`,
      { notes },
      { params: { resultId, violationId } },
    );
  },
  async setFollowUpResult(id: string, result: FollowUpResult) {
    await api.post(`${resultEndpoint}/${id}/set-follow-up-result`, { result });
  },
  async exportExcel(filter: InspectionResultFilter): Promise<FileDownload> {
    const response = await api.get<Blob>(`${resultExcelEndpoint}/export`, {
      params: filter,
      responseType: "blob",
    });
    return download(response.data, response.headers["content-disposition"]);
  },
};
