import { api } from "@/lib/axios";
import type { GlobalSearchResult } from "../types/globalSearch.types";

const endpoint = "/v1/app/global-search";

export const globalSearchApi = {
  async search(q: string, maxPerGroup = 5): Promise<GlobalSearchResult> {
    const response = await api.get<GlobalSearchResult>(endpoint, {
      params: { q, maxPerGroup },
    });
    return response.data;
  },
};
