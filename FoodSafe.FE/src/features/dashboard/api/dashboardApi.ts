import { api } from "@/lib/axios";
import type { DashboardStats } from "../types/dashboard.types";

const endpoint = "/v1/app/dashboard";

export const dashboardApi = {
  async getStats(): Promise<DashboardStats> {
    return (await api.get<DashboardStats>(`${endpoint}/stats`)).data;
  },
};
