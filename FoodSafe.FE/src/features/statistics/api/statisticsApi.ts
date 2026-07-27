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
};
