import { api } from "@/lib/axios";
import type {
  BusinessOption,
  CountryOption,
  FileAttachment,
  FileDownload,
  PagedResult,
  ProductOption,
  ExportFoodCertificate,
  ExportFoodCertificateFilter,
  ExportFoodCertificateInput,
  PublicExportFoodCertificate,
} from "../types/exportFoodCertificate.types";

const endpoint = "/v1/app/export-food-certificate";

function download(data: Blob, contentDisposition?: string): FileDownload {
  const encoded = contentDisposition?.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
  const plain = contentDisposition?.match(/filename="?([^";]+)"?/i)?.[1];
  return {
    blob: data,
    fileName: decodeURIComponent(encoded ?? plain ?? "download"),
  };
}

export const exportFoodCertificateApi = {
  async publicLookup(number: string): Promise<PublicExportFoodCertificate> {
    const response = await api.get<PublicExportFoodCertificate>(
      "/v1/public/export-food-certificates",
      { params: { number } },
    );
    return response.data;
  },

  async list(
    filter: ExportFoodCertificateFilter,
  ): Promise<PagedResult<ExportFoodCertificate>> {
    const response = await api.get<PagedResult<ExportFoodCertificate>>(
      endpoint,
      { params: filter },
    );
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

  async countryOptions(): Promise<CountryOption[]> {
    const response = await api.get<CountryOption[]>(
      `${endpoint}/country-options`,
    );
    return response.data;
  },

  async create(input: ExportFoodCertificateInput): Promise<ExportFoodCertificate> {
    const response = await api.post<ExportFoodCertificate>(endpoint, input);
    return response.data;
  },

  async update(
    id: string,
    input: ExportFoodCertificateInput,
  ): Promise<ExportFoodCertificate> {
    const response = await api.put<ExportFoodCertificate>(
      `${endpoint}/${id}`,
      input,
    );
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`${endpoint}/${id}`);
  },

  async revoke(id: string, reason: string): Promise<ExportFoodCertificate> {
    const response = await api.post<ExportFoodCertificate>(
      `${endpoint}/${id}/revoke`,
      { reason },
    );
    return response.data;
  },

  async exportExcel(
    filter: ExportFoodCertificateFilter,
  ): Promise<FileDownload> {
    const response = await api.get<Blob>(`${endpoint}/excel/export`, {
      params: filter,
      responseType: "blob",
    });
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
      { headers: { "Content-Type": "multipart/form-data" } },
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
