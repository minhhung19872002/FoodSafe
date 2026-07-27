import { api } from "@/lib/axios";
import type {
  CreateOrganizationInput,
  OrganizationDto,
  OrganizationFilter,
  OrganizationListResponse,
  OrganizationTreeResponse,
  UpdateOrganizationInput,
} from "../types/organization.types";

const endpoint = "/v1/app/organization";

export const organizationApi = {
  async getList(filter: OrganizationFilter): Promise<OrganizationListResponse> {
    const response = await api.get<OrganizationListResponse>(endpoint, {
      params: filter,
    });
    return response.data;
  },

  async getTree(): Promise<OrganizationTreeResponse> {
    const response = await api.get<OrganizationTreeResponse>(
      `${endpoint}/tree`,
    );
    return response.data;
  },

  async create(input: CreateOrganizationInput): Promise<OrganizationDto> {
    const response = await api.post<OrganizationDto>(endpoint, input);
    return response.data;
  },

  async update(
    id: string,
    input: UpdateOrganizationInput,
  ): Promise<OrganizationDto> {
    const response = await api.put<OrganizationDto>(`${endpoint}/${id}`, input);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`${endpoint}/${id}`);
  },

  async exportExcel(
    filter: OrganizationFilter,
  ): Promise<{ blob: Blob; fileName: string }> {
    const response = await api.get(`${endpoint}/excel`, {
      params: filter,
      responseType: "blob",
    });
    const disposition = response.headers["content-disposition"] as
      string | undefined;
    const match = disposition?.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
    const fileName = match
      ? match[1].replace(/['"]/g, "")
      : "danh-sach-don-vi.xlsx";
    return { blob: response.data as Blob, fileName };
  },
};
