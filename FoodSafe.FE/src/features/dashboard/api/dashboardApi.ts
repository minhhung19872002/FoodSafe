import { api } from "@/lib/axios";
import type {
  DashboardFilter,
  DashboardStats,
  ReportComplianceRow,
} from "../types/dashboard.types";

const endpoint = "/v1/app/dashboard";

export const dashboardApi = {
  async getStats(filter: DashboardFilter): Promise<DashboardStats> {
    return (
      await api.get<DashboardStats>(`${endpoint}/stats`, { params: filter })
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
};
