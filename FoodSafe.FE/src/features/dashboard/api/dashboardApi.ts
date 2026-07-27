import { api } from "@/lib/axios";
import type {
  DashboardStats,
  DashboardStatsFilter,
} from "../types/dashboard.types";

const endpoint = "/v1/app/dashboard";

export const dashboardApi = {
  async getStats(filter?: DashboardStatsFilter): Promise<DashboardStats> {
    return (
      await api.get<DashboardStats>(`${endpoint}/stats`, { params: filter })
    ).data;
  },
};
