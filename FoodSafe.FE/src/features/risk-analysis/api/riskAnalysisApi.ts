import { api } from "@/lib/axios";
import type {
  FileDownload,
  RiskAnalysis,
  RiskAnalysisFilter,
  CreateUpdateRiskAnalysisInput,
  PagedResult,
} from "../types/riskAnalysis.types";

const endpoint = "/v1/app/risk-analysis";

function download(data: Blob, contentDisposition?: string): FileDownload {
  const encoded =
    contentDisposition?.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
  const plain = contentDisposition?.match(/filename="?([^";]+)"?/i)?.[1];
  return {
    blob: data,
    fileName: decodeURIComponent(encoded ?? plain ?? "download"),
  };
}

export const riskAnalysisApi = {
  async list(filter: RiskAnalysisFilter): Promise<PagedResult<RiskAnalysis>> {
    return (
      await api.get<PagedResult<RiskAnalysis>>(endpoint, { params: filter })
    ).data;
  },
  async get(id: string): Promise<RiskAnalysis> {
    return (await api.get<RiskAnalysis>(`${endpoint}/${id}`)).data;
  },
  async create(input: CreateUpdateRiskAnalysisInput): Promise<RiskAnalysis> {
    return (await api.post<RiskAnalysis>(endpoint, input)).data;
  },
  async update(
    id: string,
    input: CreateUpdateRiskAnalysisInput,
  ): Promise<RiskAnalysis> {
    return (await api.put<RiskAnalysis>(`${endpoint}/${id}`, input)).data;
  },
  async delete(id: string): Promise<void> {
    await api.delete(`${endpoint}/${id}`);
  },
  async publish(id: string): Promise<RiskAnalysis> {
    return (await api.post<RiskAnalysis>(`${endpoint}/${id}/publish`)).data;
  },
  async exportExcel(filter: RiskAnalysisFilter): Promise<FileDownload> {
    const response = await api.get<Blob>(`${endpoint}/excel/export`, {
      params: filter,
      responseType: "blob",
    });
    return download(response.data, response.headers["content-disposition"]);
  },
};
