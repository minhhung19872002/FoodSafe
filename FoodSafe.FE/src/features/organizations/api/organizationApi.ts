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

export interface FileDownload {
  blob: Blob;
  fileName: string;
}

function toDownload(data: Blob, disposition?: string): FileDownload {
  const encoded = disposition?.match(/filename\*=UTF-8''([^;]+)/)?.[1];
  const plain = disposition?.match(/filename="?([^";]+)"?/)?.[1];
  return {
    blob: data,
    fileName: decodeURIComponent(encoded ?? plain ?? "download"),
  };
}

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
    filter: Omit<OrganizationFilter, "skipCount" | "maxResultCount">,
  ): Promise<FileDownload> {
    const response = await api.get<Blob>(`${endpoint}/excel/export`, {
      params: filter,
      responseType: "blob",
    });
    return toDownload(response.data, response.headers["content-disposition"]);
  },
};
