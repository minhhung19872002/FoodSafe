import { api } from "@/lib/axios";
import type {
  StatisticsDto,
  StatisticsFilter,
} from "../types/statistics.types";

export const statisticsApi = {
  async get(filter: StatisticsFilter): Promise<StatisticsDto> {
    const response = await api.get<StatisticsDto>("/v1/app/statistics", {
      params: filter,
    });
    return response.data;
  },

  async exportExcel(filter: StatisticsFilter): Promise<Blob> {
    const response = await api.get("/v1/app/statistics/excel", {
      params: filter,
      responseType: "blob",
    });
    return response.data as Blob;
  },
};
