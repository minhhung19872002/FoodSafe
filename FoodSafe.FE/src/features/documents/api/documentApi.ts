import { api } from "@/lib/axios";
import type {
  AdministrativeDocument,
  DocumentFilter,
  CreateUpdateDocumentInput,
  PagedResult,
} from "../types/document.types";

const endpoint = "/v1/app/administrative-document";

export const documentApi = {
  async list(
    filter: DocumentFilter,
  ): Promise<PagedResult<AdministrativeDocument>> {
    return (
      await api.get<PagedResult<AdministrativeDocument>>(endpoint, {
        params: filter,
      })
    ).data;
  },
  async get(id: string): Promise<AdministrativeDocument> {
    return (await api.get<AdministrativeDocument>(`${endpoint}/${id}`)).data;
  },
  async create(
    input: CreateUpdateDocumentInput,
  ): Promise<AdministrativeDocument> {
    return (await api.post<AdministrativeDocument>(endpoint, input)).data;
  },
  async update(
    id: string,
    input: CreateUpdateDocumentInput,
  ): Promise<AdministrativeDocument> {
    return (await api.put<AdministrativeDocument>(`${endpoint}/${id}`, input))
      .data;
  },
  async delete(id: string): Promise<void> {
    await api.delete(`${endpoint}/${id}`);
  },
};
