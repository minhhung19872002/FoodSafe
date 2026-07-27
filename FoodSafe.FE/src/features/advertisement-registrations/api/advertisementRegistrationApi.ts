import { api } from "@/lib/axios";
import type {
  AdvertisementRegistration,
  AdvertisementRegistrationFilter,
  AdvertisementRegistrationInput,
  AdvertisementTypeOption,
  BusinessOption,
  FileAttachment,
  FileDownload,
  PagedResult,
  ProductOption,
  PublicAdRegistration,
} from "../types/advertisementRegistration.types";

const endpoint = "/v1/app/advertisement-registration";

function download(data: Blob, disposition?: string): FileDownload {
  const encoded = disposition?.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
  const plain = disposition?.match(/filename="?([^";]+)"?/i)?.[1];
  return {
    blob: data,
    fileName: decodeURIComponent(encoded ?? plain ?? "download"),
  };
}

export const publicAdRegistrationApi = {
  async lookup(number: string): Promise<PublicAdRegistration> {
    const response = await api.get<PublicAdRegistration>(
      "/v1/public/advertisement-registrations",
      { params: { number } },
    );
    return response.data;
  },
};

export const advertisementRegistrationApi = {
  async list(
    filter: AdvertisementRegistrationFilter,
  ): Promise<PagedResult<AdvertisementRegistration>> {
    const response = await api.get<PagedResult<AdvertisementRegistration>>(
      endpoint,
      { params: filter },
    );
    return response.data;
  },
  async businessOptions(): Promise<BusinessOption[]> {
    return (await api.get<BusinessOption[]>(`${endpoint}/business-options`))
      .data;
  },
  async productOptions(businessId: string): Promise<ProductOption[]> {
    return (
      await api.get<ProductOption[]>(
        `${endpoint}/product-options/${businessId}`,
      )
    ).data;
  },
  async advertisementTypes(): Promise<AdvertisementTypeOption[]> {
    return (
      await api.get<AdvertisementTypeOption[]>(
        `${endpoint}/advertisement-type-options`,
      )
    ).data;
  },
  async create(
    input: AdvertisementRegistrationInput,
  ): Promise<AdvertisementRegistration> {
    return (await api.post<AdvertisementRegistration>(endpoint, input)).data;
  },
  async update(
    id: string,
    input: AdvertisementRegistrationInput,
  ): Promise<AdvertisementRegistration> {
    return (
      await api.put<AdvertisementRegistration>(`${endpoint}/${id}`, input)
    ).data;
  },
  async delete(id: string) {
    await api.delete(`${endpoint}/${id}`);
  },
  async revoke(id: string, reason: string) {
    return (
      await api.post<AdvertisementRegistration>(`${endpoint}/${id}/revoke`, {
        reason,
      })
    ).data;
  },
  async exportExcel(filter: AdvertisementRegistrationFilter) {
    const response = await api.get<Blob>(`${endpoint}/excel/export`, {
      params: filter,
      responseType: "blob",
    });
    return download(response.data, response.headers["content-disposition"]);
  },
  async attachments(id: string): Promise<FileAttachment[]> {
    return (await api.get<FileAttachment[]>(`${endpoint}/${id}/attachments`))
      .data;
  },
  async upload(id: string, file: File) {
    const form = new FormData();
    form.append("file", file);
    return (
      await api.post<FileAttachment>(`${endpoint}/${id}/attachments`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      })
    ).data;
  },
  async downloadAttachment(id: string, attachmentId: string) {
    const response = await api.get<Blob>(
      `${endpoint}/${id}/attachments/${attachmentId}/download`,
      { responseType: "blob" },
    );
    return download(response.data, response.headers["content-disposition"]);
  },
  async deleteAttachment(id: string, attachmentId: string) {
    await api.delete(`${endpoint}/${id}/attachments/${attachmentId}`);
  },
};
