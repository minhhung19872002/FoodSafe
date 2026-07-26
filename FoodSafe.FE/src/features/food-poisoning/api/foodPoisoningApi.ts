import { api } from "@/lib/axios";
import type {
  CaseFilter,
  ConcludeIncidentInput,
  CreateErrorReportInput,
  CreateUpdateCaseInput,
  CreateUpdateIncidentInput,
  FoodPoisoningCase,
  FoodPoisoningIncident,
  IncidentFilter,
  PagedResult,
  PoisoningErrorReport,
} from "../types/foodPoisoning.types";

const caseEndpoint = "/v1/app/food-poisoning-case";
const incidentEndpoint = "/v1/app/food-poisoning-incident";

export const poisoningCaseApi = {
  async list(
    filter: CaseFilter,
  ): Promise<PagedResult<FoodPoisoningCase>> {
    return (
      await api.get<PagedResult<FoodPoisoningCase>>(caseEndpoint, {
        params: filter,
      })
    ).data;
  },
  async get(id: string): Promise<FoodPoisoningCase> {
    return (await api.get<FoodPoisoningCase>(`${caseEndpoint}/${id}`)).data;
  },
  async create(input: CreateUpdateCaseInput): Promise<FoodPoisoningCase> {
    return (await api.post<FoodPoisoningCase>(caseEndpoint, input)).data;
  },
  async update(
    id: string,
    input: CreateUpdateCaseInput,
  ): Promise<FoodPoisoningCase> {
    return (await api.put<FoodPoisoningCase>(`${caseEndpoint}/${id}`, input))
      .data;
  },
  async delete(id: string): Promise<void> {
    await api.delete(`${caseEndpoint}/${id}`);
  },
  async submit(id: string): Promise<FoodPoisoningCase> {
    return (
      await api.post<FoodPoisoningCase>(`${caseEndpoint}/${id}/submit`)
    ).data;
  },
  async verify(id: string): Promise<FoodPoisoningCase> {
    return (
      await api.post<FoodPoisoningCase>(`${caseEndpoint}/${id}/verify`)
    ).data;
  },
  async getErrorReports(id: string): Promise<PoisoningErrorReport[]> {
    return (
      await api.get<PoisoningErrorReport[]>(
        `${caseEndpoint}/${id}/error-reports`,
      )
    ).data;
  },
  async addErrorReport(
    id: string,
    input: CreateErrorReportInput,
  ): Promise<void> {
    await api.post(`${caseEndpoint}/${id}/error-report`, input);
  },
};

export const poisoningIncidentApi = {
  async list(
    filter: IncidentFilter,
  ): Promise<PagedResult<FoodPoisoningIncident>> {
    return (
      await api.get<PagedResult<FoodPoisoningIncident>>(incidentEndpoint, {
        params: filter,
      })
    ).data;
  },
  async get(id: string): Promise<FoodPoisoningIncident> {
    return (
      await api.get<FoodPoisoningIncident>(`${incidentEndpoint}/${id}`)
    ).data;
  },
  async create(
    input: CreateUpdateIncidentInput,
  ): Promise<FoodPoisoningIncident> {
    return (
      await api.post<FoodPoisoningIncident>(incidentEndpoint, input)
    ).data;
  },
  async update(
    id: string,
    input: CreateUpdateIncidentInput,
  ): Promise<FoodPoisoningIncident> {
    return (
      await api.put<FoodPoisoningIncident>(
        `${incidentEndpoint}/${id}`,
        input,
      )
    ).data;
  },
  async delete(id: string): Promise<void> {
    await api.delete(`${incidentEndpoint}/${id}`);
  },
  async submit(id: string): Promise<FoodPoisoningIncident> {
    return (
      await api.post<FoodPoisoningIncident>(
        `${incidentEndpoint}/${id}/submit`,
      )
    ).data;
  },
  async verify(id: string): Promise<FoodPoisoningIncident> {
    return (
      await api.post<FoodPoisoningIncident>(
        `${incidentEndpoint}/${id}/verify`,
      )
    ).data;
  },
  async conclude(
    id: string,
    input: ConcludeIncidentInput,
  ): Promise<FoodPoisoningIncident> {
    return (
      await api.post<FoodPoisoningIncident>(
        `${incidentEndpoint}/${id}/conclude`,
        input,
      )
    ).data;
  },
  async getErrorReports(id: string): Promise<PoisoningErrorReport[]> {
    return (
      await api.get<PoisoningErrorReport[]>(
        `${incidentEndpoint}/${id}/error-reports`,
      )
    ).data;
  },
  async addErrorReport(
    id: string,
    input: CreateErrorReportInput,
  ): Promise<void> {
    await api.post(`${incidentEndpoint}/${id}/error-report`, input);
  },
};
