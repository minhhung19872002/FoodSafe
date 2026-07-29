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
