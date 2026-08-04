import { api } from "@/lib/axios";
import type {
  CaseFilter,
  ConcludeIncidentInput,
  CreateErrorReportInput,
  CreateUpdateCaseInput,
  CreateUpdateIncidentInput,
  FileDownload,
  FoodPoisoningCase,
  FoodPoisoningIncident,
  IncidentFilter,
  PagedResult,
  PoisoningErrorReport,
  RespondErrorReportInput,
} from "../types/foodPoisoning.types";

const caseEndpoint = "/v1/app/food-poisoning-case";
const caseExcelEndpoint = `${caseEndpoint}/excel`;
const incidentEndpoint = "/v1/app/food-poisoning-incident";
const incidentExcelEndpoint = `${incidentEndpoint}/excel`;

function download(data: Blob, contentDisposition?: string): FileDownload {
  const encoded = contentDisposition?.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
  const plain = contentDisposition?.match(/filename="?([^";]+)"?/i)?.[1];
  return {
    blob: data,
    fileName: decodeURIComponent(encoded ?? plain ?? "download"),
  };
}

export const poisoningCaseApi = {
  async list(filter: CaseFilter): Promise<PagedResult<FoodPoisoningCase>> {
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
    return (await api.post<FoodPoisoningCase>(`${caseEndpoint}/${id}/submit`))
      .data;
  },
  async verify(id: string): Promise<FoodPoisoningCase> {
    return (await api.post<FoodPoisoningCase>(`${caseEndpoint}/${id}/verify`))
      .data;
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
  async acknowledgeErrorReport(
    id: string,
    reportId: string,
  ): Promise<PoisoningErrorReport> {
    return (
      await api.post<PoisoningErrorReport>(
        `${caseEndpoint}/${id}/acknowledge-error-report/${reportId}`,
      )
    ).data;
  },
  async respondErrorReport(
    id: string,
    reportId: string,
    input: RespondErrorReportInput,
  ): Promise<PoisoningErrorReport> {
    return (
      await api.post<PoisoningErrorReport>(
        `${caseEndpoint}/${id}/respond-error-report/${reportId}`,
        input,
      )
    ).data;
  },
  async exportExcel(filter: CaseFilter): Promise<FileDownload> {
    const response = await api.get<Blob>(`${caseExcelEndpoint}/export`, {
      params: filter,
      responseType: "blob",
    });
    return download(response.data, response.headers["content-disposition"]);
  },
  async downloadPdf(id: string): Promise<FileDownload> {
    const response = await api.get<Blob>(`${caseEndpoint}/${id}/pdf`, {
      responseType: "blob",
    });
    return download(response.data, response.headers["content-disposition"]);
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
    return (await api.get<FoodPoisoningIncident>(`${incidentEndpoint}/${id}`))
      .data;
  },
  async create(
    input: CreateUpdateIncidentInput,
  ): Promise<FoodPoisoningIncident> {
    return (await api.post<FoodPoisoningIncident>(incidentEndpoint, input))
      .data;
  },
  async update(
    id: string,
    input: CreateUpdateIncidentInput,
  ): Promise<FoodPoisoningIncident> {
    return (
      await api.put<FoodPoisoningIncident>(`${incidentEndpoint}/${id}`, input)
    ).data;
  },
  async delete(id: string): Promise<void> {
    await api.delete(`${incidentEndpoint}/${id}`);
  },
  async submit(id: string): Promise<FoodPoisoningIncident> {
    return (
      await api.post<FoodPoisoningIncident>(`${incidentEndpoint}/${id}/submit`)
    ).data;
  },
  async verify(id: string): Promise<FoodPoisoningIncident> {
    return (
      await api.post<FoodPoisoningIncident>(`${incidentEndpoint}/${id}/verify`)
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
  async acknowledgeErrorReport(
    id: string,
    reportId: string,
  ): Promise<PoisoningErrorReport> {
    return (
      await api.post<PoisoningErrorReport>(
        `${incidentEndpoint}/${id}/acknowledge-error-report/${reportId}`,
      )
    ).data;
  },
  async respondErrorReport(
    id: string,
    reportId: string,
    input: RespondErrorReportInput,
  ): Promise<PoisoningErrorReport> {
    return (
      await api.post<PoisoningErrorReport>(
        `${incidentEndpoint}/${id}/respond-error-report/${reportId}`,
        input,
      )
    ).data;
  },
  async exportExcel(filter: IncidentFilter): Promise<FileDownload> {
    const response = await api.get<Blob>(`${incidentExcelEndpoint}/export`, {
      params: filter,
      responseType: "blob",
    });
    return download(response.data, response.headers["content-disposition"]);
  },
  async downloadPdf(id: string): Promise<FileDownload> {
    const response = await api.get<Blob>(`${incidentEndpoint}/${id}/pdf`, {
      responseType: "blob",
    });
    return download(response.data, response.headers["content-disposition"]);
  },
  /** 3 mẫu báo cáo vụ theo QĐ 01/2006/QĐ-BYT: 1=khẩn ban đầu, 2=cập nhật, 3=kết thúc. */
  async downloadEmergencyReportPdf(
    id: string,
    kind: 1 | 2 | 3,
  ): Promise<FileDownload> {
    const response = await api.get<Blob>(
      `${incidentEndpoint}/${id}/emergency-report-pdf`,
      { params: { kind }, responseType: "blob" },
    );
    return download(response.data, response.headers["content-disposition"]);
  },
};
