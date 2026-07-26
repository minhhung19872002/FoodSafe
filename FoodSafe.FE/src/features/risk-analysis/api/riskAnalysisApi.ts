import { api } from "@/lib/axios";
import type {
  RiskAnalysis,
  RiskAnalysisFilter,
  CreateUpdateRiskAnalysisInput,
  PagedResult,
} from "../types/riskAnalysis.types";

const endpoint = "/v1/app/risk-analysis";

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
};
