import { api } from "@/lib/axios";
import type {
  ActionMonthReport,
  ActionMonthReportFilter,
  AtpWorkReport,
  AtpWorkReportFilter,
  CreateActionMonthReportInput,
  CreateAtpWorkReportInput,
  CreateNdtpReportInput,
  FileDownload,
  NdtpReport,
  NdtpReportFilter,
  PagedResult,
  ReportErrorNotification,
  CreateReportErrorNotificationInput,
  RespondReportErrorNotificationInput,
  ReturnReportInput,
  UpdateActionMonthReportNarrativeInput,
  UpdateActionMonthReportStatsInput,
  UpdateAtpWorkReportNarrativeInput,
  UpdateAtpWorkReportStatsInput,
  UpdateNdtpReportNarrativeInput,
  UpdateNdtpReportStatsInput,
} from "../types/reporting.types";

const ndtpEndpoint = "/v1/app/ndtp-report";
const atpEndpoint = "/v1/app/atp-work-report";
const amrEndpoint = "/v1/app/action-month-report";

function download(data: Blob, contentDisposition?: string): FileDownload {
  const encoded = contentDisposition?.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
  const plain = contentDisposition?.match(/filename="?([^";]+)"?/i)?.[1];
  return {
    blob: data,
    fileName: decodeURIComponent(encoded ?? plain ?? "download"),
  };
}

function errorNotificationApi(endpoint: string) {
  return {
    async listErrorNotifications(
      id: string,
    ): Promise<ReportErrorNotification[]> {
      return (
        await api.get<ReportErrorNotification[]>(
          `${endpoint}/${id}/error-notifications`,
        )
      ).data;
    },
    async addErrorNotification(
      id: string,
      input: CreateReportErrorNotificationInput,
    ): Promise<ReportErrorNotification> {
      return (
        await api.post<ReportErrorNotification>(
          `${endpoint}/${id}/error-notification`,
          input,
        )
      ).data;
    },
    async acknowledgeErrorNotification(
      id: string,
      notificationId: string,
    ): Promise<ReportErrorNotification> {
      return (
        await api.post<ReportErrorNotification>(
          `${endpoint}/${id}/acknowledge-error-notification/${notificationId}`,
        )
      ).data;
    },
    async respondErrorNotification(
      id: string,
      notificationId: string,
      input: RespondReportErrorNotificationInput,
    ): Promise<ReportErrorNotification> {
      return (
        await api.post<ReportErrorNotification>(
          `${endpoint}/${id}/respond-error-notification/${notificationId}`,
          input,
        )
      ).data;
    },
  };
}

async function downloadPdf(url: string): Promise<FileDownload> {
  const response = await api.get<Blob>(url, { responseType: "blob" });
  return download(response.data, response.headers["content-disposition"]);
}

export const ndtpReportApi = {
  async list(filter: NdtpReportFilter): Promise<PagedResult<NdtpReport>> {
    return (
      await api.get<PagedResult<NdtpReport>>(ndtpEndpoint, { params: filter })
    ).data;
  },
  async get(id: string): Promise<NdtpReport> {
    return (await api.get<NdtpReport>(`${ndtpEndpoint}/${id}`)).data;
  },
  async create(input: CreateNdtpReportInput): Promise<NdtpReport> {
    return (await api.post<NdtpReport>(ndtpEndpoint, input)).data;
  },
  async updateStats(
    id: string,
    input: UpdateNdtpReportStatsInput,
  ): Promise<NdtpReport> {
    return (await api.put<NdtpReport>(`${ndtpEndpoint}/${id}/stats`, input))
      .data;
  },
  async updateNarrative(
    id: string,
    input: UpdateNdtpReportNarrativeInput,
  ): Promise<NdtpReport> {
    return (await api.put<NdtpReport>(`${ndtpEndpoint}/${id}/narrative`, input))
      .data;
  },
  async delete(id: string): Promise<void> {
    await api.delete(`${ndtpEndpoint}/${id}`);
  },
  async submit(id: string): Promise<NdtpReport> {
    return (await api.post<NdtpReport>(`${ndtpEndpoint}/${id}/submit`)).data;
  },
  async verify(id: string): Promise<NdtpReport> {
    return (await api.post<NdtpReport>(`${ndtpEndpoint}/${id}/verify`)).data;
  },
  async return(id: string, input: ReturnReportInput): Promise<NdtpReport> {
    return (await api.post<NdtpReport>(`${ndtpEndpoint}/${id}/return`, input))
      .data;
  },
  async complete(id: string): Promise<NdtpReport> {
    return (await api.post<NdtpReport>(`${ndtpEndpoint}/${id}/complete`)).data;
  },
  async returnToDraft(id: string): Promise<void> {
    await api.post(`${ndtpEndpoint}/${id}/return-to-draft`);
  },
  async populateFromPoisoningData(id: string): Promise<NdtpReport> {
    return (
      await api.post<NdtpReport>(
        `${ndtpEndpoint}/${id}/populate-from-poisoning-data`,
      )
    ).data;
  },
  async exportExcel(filter: NdtpReportFilter): Promise<FileDownload> {
    const response = await api.get<Blob>(`${ndtpEndpoint}/excel/export`, {
      params: filter,
      responseType: "blob",
    });
    return download(response.data, response.headers["content-disposition"]);
  },
  async downloadPdf(id: string): Promise<FileDownload> {
    return downloadPdf(`${ndtpEndpoint}/${id}/pdf`);
  },
  ...errorNotificationApi(ndtpEndpoint),
};

export const atpWorkReportApi = {
  async list(filter: AtpWorkReportFilter): Promise<PagedResult<AtpWorkReport>> {
    return (
      await api.get<PagedResult<AtpWorkReport>>(atpEndpoint, {
        params: filter,
      })
    ).data;
  },
  async get(id: string): Promise<AtpWorkReport> {
    return (await api.get<AtpWorkReport>(`${atpEndpoint}/${id}`)).data;
  },
  async create(input: CreateAtpWorkReportInput): Promise<AtpWorkReport> {
    return (await api.post<AtpWorkReport>(atpEndpoint, input)).data;
  },
  async updateStats(
    id: string,
    input: UpdateAtpWorkReportStatsInput,
  ): Promise<AtpWorkReport> {
    return (await api.put<AtpWorkReport>(`${atpEndpoint}/${id}/stats`, input))
      .data;
  },
  async updateNarrative(
    id: string,
    input: UpdateAtpWorkReportNarrativeInput,
  ): Promise<AtpWorkReport> {
    return (
      await api.put<AtpWorkReport>(`${atpEndpoint}/${id}/narrative`, input)
    ).data;
  },
  async delete(id: string): Promise<void> {
    await api.delete(`${atpEndpoint}/${id}`);
  },
  async internallyApprove(id: string): Promise<AtpWorkReport> {
    return (
      await api.post<AtpWorkReport>(`${atpEndpoint}/${id}/internally-approve`)
    ).data;
  },
  async submit(id: string): Promise<AtpWorkReport> {
    return (await api.post<AtpWorkReport>(`${atpEndpoint}/${id}/submit`)).data;
  },
  async verify(id: string): Promise<AtpWorkReport> {
    return (await api.post<AtpWorkReport>(`${atpEndpoint}/${id}/verify`)).data;
  },
  async return(id: string, input: ReturnReportInput): Promise<AtpWorkReport> {
    return (await api.post<AtpWorkReport>(`${atpEndpoint}/${id}/return`, input))
      .data;
  },
  async complete(id: string): Promise<AtpWorkReport> {
    return (await api.post<AtpWorkReport>(`${atpEndpoint}/${id}/complete`))
      .data;
  },
  async returnToDraft(id: string): Promise<void> {
    await api.post(`${atpEndpoint}/${id}/return-to-draft`);
  },
  async exportExcel(filter: AtpWorkReportFilter): Promise<FileDownload> {
    const response = await api.get<Blob>(`${atpEndpoint}/excel/export`, {
      params: filter,
      responseType: "blob",
    });
    return download(response.data, response.headers["content-disposition"]);
  },
  async downloadPdf(id: string): Promise<FileDownload> {
    return downloadPdf(`${atpEndpoint}/${id}/pdf`);
  },
  ...errorNotificationApi(atpEndpoint),
};

export const actionMonthReportApi = {
  async list(
    filter: ActionMonthReportFilter,
  ): Promise<PagedResult<ActionMonthReport>> {
    return (
      await api.get<PagedResult<ActionMonthReport>>(amrEndpoint, {
        params: filter,
      })
    ).data;
  },
  async get(id: string): Promise<ActionMonthReport> {
    return (await api.get<ActionMonthReport>(`${amrEndpoint}/${id}`)).data;
  },
  async create(
    input: CreateActionMonthReportInput,
  ): Promise<ActionMonthReport> {
    return (await api.post<ActionMonthReport>(amrEndpoint, input)).data;
  },
  async updateStats(
    id: string,
    input: UpdateActionMonthReportStatsInput,
  ): Promise<ActionMonthReport> {
    return (
      await api.put<ActionMonthReport>(`${amrEndpoint}/${id}/stats`, input)
    ).data;
  },
  async updateNarrative(
    id: string,
    input: UpdateActionMonthReportNarrativeInput,
  ): Promise<ActionMonthReport> {
    return (
      await api.put<ActionMonthReport>(`${amrEndpoint}/${id}/narrative`, input)
    ).data;
  },
  async delete(id: string): Promise<void> {
    await api.delete(`${amrEndpoint}/${id}`);
  },
  async internallyApprove(id: string): Promise<ActionMonthReport> {
    return (
      await api.post<ActionMonthReport>(
        `${amrEndpoint}/${id}/internally-approve`,
      )
    ).data;
  },
  async submit(id: string): Promise<ActionMonthReport> {
    return (await api.post<ActionMonthReport>(`${amrEndpoint}/${id}/submit`))
      .data;
  },
  async verify(id: string): Promise<ActionMonthReport> {
    return (await api.post<ActionMonthReport>(`${amrEndpoint}/${id}/verify`))
      .data;
  },
  async return(
    id: string,
    input: ReturnReportInput,
  ): Promise<ActionMonthReport> {
    return (
      await api.post<ActionMonthReport>(`${amrEndpoint}/${id}/return`, input)
    ).data;
  },
  async complete(id: string): Promise<ActionMonthReport> {
    return (await api.post<ActionMonthReport>(`${amrEndpoint}/${id}/complete`))
      .data;
  },
  async returnToDraft(id: string): Promise<void> {
    await api.post(`${amrEndpoint}/${id}/return-to-draft`);
  },
  async exportExcel(filter: ActionMonthReportFilter): Promise<FileDownload> {
    const response = await api.get<Blob>(`${amrEndpoint}/excel/export`, {
      params: filter,
      responseType: "blob",
    });
    return download(response.data, response.headers["content-disposition"]);
  },
  async downloadPdf(id: string): Promise<FileDownload> {
    return downloadPdf(`${amrEndpoint}/${id}/pdf`);
  },
  ...errorNotificationApi(amrEndpoint),
};

export interface AtpCalculatedStats {
  totalBusinesses: number;
  newBusinesses: number;
  inactiveBusinesses: number;
  businessesWithCertificate: number;
  dkcbIssued: number;
  selfDeclarationsReceived: number;
  adRegistrationsIssued: number;
  eligibilityCertificatesIssued: number;
  cfsIssued: number;
  exportCertificatesIssued: number;
  totalInspectionPlans: number;
  businessesInspected: number;
  violationsFound: number;
  finesIssued: number;
  fineTotalAmount: number;
  poisoningCaseCount: number;
  poisoningIncidentCount: number;
  totalAffected: number;
  totalDeaths: number;
}

export interface NdtpAggregatedStats {
  reportCount: number;
  caseCount: number;
  caseAffected: number;
  caseHospitalized: number;
  caseDeaths: number;
  incidentCount: number;
  incidentAffected: number;
  incidentHospitalized: number;
  incidentDeaths: number;
}

const calculationEndpoint = "/v1/app/report-calculation";

export const reportCalculationApi = {
  async atpWorkStats(input: {
    periodType: number;
    periodYear: number;
    periodHalf?: number;
  }): Promise<AtpCalculatedStats> {
    return (
      await api.get<AtpCalculatedStats>(
        `${calculationEndpoint}/atp-work-stats`,
        { params: input },
      )
    ).data;
  },
  async ndtpAggregation(input: {
    periodYear: number;
    periodMonth: number;
  }): Promise<NdtpAggregatedStats> {
    return (
      await api.get<NdtpAggregatedStats>(
        `${calculationEndpoint}/ndtp-aggregation`,
        { params: input },
      )
    ).data;
  },
};
