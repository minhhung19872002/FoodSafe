import { api } from "@/lib/axios";
import type {
  BusinessOption,
  FileAttachment,
  FileDownload,
  PagedResult,
  ProductOption,
  ProductRegistration,
  ProductRegistrationFilter,
  ProductRegistrationInput,
  PublicProductRegistration,
} from "../types/productRegistration.types";

const endpoint = "/v1/app/product-registration";

function download(data: Blob, contentDisposition?: string): FileDownload {
  const encoded = contentDisposition?.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
  const plain = contentDisposition?.match(/filename="?([^";]+)"?/i)?.[1];
  return {
    blob: data,
    fileName: decodeURIComponent(encoded ?? plain ?? "download"),
  };
}

export const productRegistrationApi = {
  async publicLookup(number: string): Promise<PublicProductRegistration> {
    const response = await api.get<PublicProductRegistration>(
      "/v1/public/product-registrations",
      { params: { number } },
    );
    return response.data;
  },
  async list(
    filter: ProductRegistrationFilter,
  ): Promise<PagedResult<ProductRegistration>> {
    const response = await api.get<PagedResult<ProductRegistration>>(endpoint, {
      params: filter,
    });
    return response.data;
  },

  async businessOptions(): Promise<BusinessOption[]> {
    const response = await api.get<BusinessOption[]>(
      `${endpoint}/business-options`,
    );
    return response.data;
  },

  async productOptions(businessId: string): Promise<ProductOption[]> {
    const response = await api.get<ProductOption[]>(
      `${endpoint}/product-options/${businessId}`,
    );
    return response.data;
  },

  async create(input: ProductRegistrationInput): Promise<ProductRegistration> {
    const response = await api.post<ProductRegistration>(endpoint, input);
    return response.data;
  },

  async update(
    id: string,
    input: ProductRegistrationInput,
  ): Promise<ProductRegistration> {
    const response = await api.put<ProductRegistration>(
      `${endpoint}/${id}`,
      input,
    );
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`${endpoint}/${id}`);
  },

  async revoke(id: string, reason: string): Promise<ProductRegistration> {
    const response = await api.post<ProductRegistration>(
      `${endpoint}/${id}/revoke`,
      { reason },
    );
    return response.data;
  },

  async exportExcel(filter: ProductRegistrationFilter): Promise<FileDownload> {
    const response = await api.get<Blob>(`${endpoint}/excel/export`, {
      params: filter,
      responseType: "blob",
    });
    return download(response.data, response.headers["content-disposition"]);
  },

  async downloadPdf(id: string): Promise<FileDownload> {
    const response = await api.get<Blob>(
      `/v1/public/product-registrations/${id}/pdf`,
      { responseType: "blob" },
    );
    return download(response.data, response.headers["content-disposition"]);
  },

  async attachments(id: string): Promise<FileAttachment[]> {
    const response = await api.get<FileAttachment[]>(
      `${endpoint}/${id}/attachments`,
    );
    return response.data;
  },

  async upload(id: string, file: File): Promise<FileAttachment> {
    const form = new FormData();
    form.append("file", file);
    const response = await api.post<FileAttachment>(
      `${endpoint}/${id}/attachments`,
      form,
    );
    return response.data;
  },

  async downloadAttachment(
    id: string,
    attachmentId: string,
  ): Promise<FileDownload> {
    const response = await api.get<Blob>(
      `${endpoint}/${id}/attachments/${attachmentId}/download`,
      { responseType: "blob" },
    );
    return download(response.data, response.headers["content-disposition"]);
  },

  async deleteAttachment(id: string, attachmentId: string): Promise<void> {
    await api.delete(`${endpoint}/${id}/attachments/${attachmentId}`);
  },
};
