import { api } from "@/lib/axios";
import type {
  DashboardFilter,
  DashboardStats,
  ExpiringLicense,
  PoisoningTrendPoint,
  ReportComplianceRow,
} from "../types/dashboard.types";

const endpoint = "/v1/app/dashboard";

export const dashboardApi = {
  async getStats(filter: DashboardFilter): Promise<DashboardStats> {
    return (
      await api.get<DashboardStats>(`${endpoint}/stats`, { params: filter })
    ).data;
  },

  async getExpiringLicenses(
    filter: DashboardFilter,
  ): Promise<{ items: ExpiringLicense[] }> {
    return (
      await api.get<{ items: ExpiringLicense[] }>(
        `${endpoint}/expiring-licenses`,
        { params: filter },
      )
    ).data;
  },

  async getReportCompliance(
    filter: DashboardFilter,
  ): Promise<{ items: ReportComplianceRow[] }> {
    return (
      await api.get<{ items: ReportComplianceRow[] }>(
        `${endpoint}/report-compliance`,
        { params: filter },
      )
    ).data;
  },

  async exportReportCompliance(
    filter: DashboardFilter,
  ): Promise<{ blob: Blob; fileName: string }> {
    const response = await api.get<Blob>(
      "/v1/app/statistics/excel/report-compliance",
      { params: filter, responseType: "blob" },
    );
    const disposition = response.headers["content-disposition"] as
      | string
      | undefined;
    const encoded = disposition?.match(/filename\*=UTF-8''([^;]+)/)?.[1];
    const plain = disposition?.match(/filename="?([^";]+)"?/)?.[1];
    return {
      blob: response.data,
      fileName: decodeURIComponent(
        encoded ?? plain ?? "trang-thai-bao-cao.xlsx",
      ),
    };
  },

  async getFoodPoisoningTrend(
    filter: DashboardFilter,
  ): Promise<PoisoningTrendPoint[]> {
    return (
      await api.get<PoisoningTrendPoint[]>(
        "/v1/app/statistics/food-poisoning-trend",
        { params: filter },
      )
    ).data;
  },
};
