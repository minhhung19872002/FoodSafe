import { api } from "@/lib/axios";
import type {
  BusinessOption,
  CompleteRecallInput,
  PagedResult,
  ProductRecall,
  ProductRecallFilter,
  ProductRecallInput,
} from "../types/productRecall.types";

const endpoint = "/v1/app/product-recall";

export const productRecallApi = {
  async list(filter: ProductRecallFilter): Promise<PagedResult<ProductRecall>> {
    const response = await api.get<PagedResult<ProductRecall>>(endpoint, {
      params: filter,
    });
    return response.data;
  },

  async get(id: string): Promise<ProductRecall> {
    const response = await api.get<ProductRecall>(`${endpoint}/${id}`);
    return response.data;
  },

  async businessOptions(): Promise<BusinessOption[]> {
    const response = await api.get<BusinessOption[]>(
      `${endpoint}/business-options`,
    );
    return response.data;
  },

  async create(input: ProductRecallInput): Promise<ProductRecall> {
    const response = await api.post<ProductRecall>(endpoint, input);
    return response.data;
  },

  async update(id: string, input: ProductRecallInput): Promise<ProductRecall> {
    const response = await api.put<ProductRecall>(`${endpoint}/${id}`, input);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`${endpoint}/${id}`);
  },

  async start(id: string): Promise<ProductRecall> {
    const response = await api.post<ProductRecall>(`${endpoint}/${id}/start`);
    return response.data;
  },

  async complete(
    id: string,
    input: CompleteRecallInput,
  ): Promise<ProductRecall> {
    const response = await api.post<ProductRecall>(
      `${endpoint}/${id}/complete`,
      input,
    );
    return response.data;
  },

  async cancel(id: string, reason: string): Promise<ProductRecall> {
    const response = await api.post<ProductRecall>(`${endpoint}/${id}/cancel`, {
      reason,
    });
    return response.data;
  },
};
