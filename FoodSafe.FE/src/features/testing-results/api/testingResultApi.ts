import { api } from "@/lib/axios";
import type {
  TestingResult,
  TestingResultFilter,
  CreateUpdateTestingResultInput,
  PagedResult,
} from "../types/testingResult.types";

const endpoint = "/v1/app/testing-result";

export const testingResultApi = {
  async list(filter: TestingResultFilter): Promise<PagedResult<TestingResult>> {
    return (
      await api.get<PagedResult<TestingResult>>(endpoint, { params: filter })
    ).data;
  },
  async get(id: string): Promise<TestingResult> {
    return (await api.get<TestingResult>(`${endpoint}/${id}`)).data;
  },
  async create(input: CreateUpdateTestingResultInput): Promise<TestingResult> {
    return (await api.post<TestingResult>(endpoint, input)).data;
  },
  async update(
    id: string,
    input: CreateUpdateTestingResultInput,
  ): Promise<TestingResult> {
    return (await api.put<TestingResult>(`${endpoint}/${id}`, input)).data;
  },
  async delete(id: string): Promise<void> {
    await api.delete(`${endpoint}/${id}`);
  },
};
