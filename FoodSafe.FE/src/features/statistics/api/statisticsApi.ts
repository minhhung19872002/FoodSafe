import { api } from "@/lib/axios";
import type {
  ReportExportKind,
  ReportStatisticsDto,
  StatisticsDto,
  StatisticsFilter,
} from "../types/statistics.types";

export interface FileDownload {
  blob: Blob;
  fileName: string;
}

function toDownload(data: Blob, disposition?: string): FileDownload {
  const encoded = disposition?.match(/filename\*=UTF-8''([^;]+)/)?.[1];
  const plain = disposition?.match(/filename="?([^";]+)"?/)?.[1];
  return {
    blob: data,
    fileName: decodeURIComponent(encoded ?? plain ?? "download"),
  };
}

export const statisticsApi = {
  async get(filter: StatisticsFilter): Promise<StatisticsDto> {
    const response = await api.get<StatisticsDto>("/v1/app/statistics", {
      params: filter,
    });
    return response.data;
  },

  async getReport(filter: StatisticsFilter): Promise<ReportStatisticsDto> {
    const response = await api.get<ReportStatisticsDto>(
      "/v1/app/report-statistics",
      { params: filter },
    );
    return response.data;
  },

  async exportReport(
    kind: ReportExportKind,
    filter: StatisticsFilter,
  ): Promise<FileDownload> {
    const response = await api.get<Blob>(`/v1/app/statistics/excel/${kind}`, {
      params: filter,
      responseType: "blob",
    });
    return toDownload(response.data, response.headers["content-disposition"]);
  },
};
