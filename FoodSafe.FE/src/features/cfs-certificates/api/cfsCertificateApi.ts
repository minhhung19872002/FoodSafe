import { api } from "@/lib/axios";
import type {
  BusinessOption,
  CountryOption,
  FileAttachment,
  FileDownload,
  PagedResult,
  ProductOption,
  CfsCertificate,
  CfsCertificateFilter,
  CfsCertificateInput,
  PublicCfsCertificate,
} from "../types/cfsCertificate.types";

const endpoint = "/v1/app/cfs-certificate";

function download(data: Blob, contentDisposition?: string): FileDownload {
  const encoded = contentDisposition?.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
  const plain = contentDisposition?.match(/filename="?([^";]+)"?/i)?.[1];
  return {
    blob: data,
    fileName: decodeURIComponent(encoded ?? plain ?? "download"),
  };
}

export const cfsCertificateApi = {
  async publicLookup(number: string): Promise<PublicCfsCertificate> {
    const response = await api.get<PublicCfsCertificate>(
      "/v1/public/cfs-certificates",
      { params: { number } },
    );
    return response.data;
  },
  async list(
    filter: CfsCertificateFilter,
  ): Promise<PagedResult<CfsCertificate>> {
    const response = await api.get<PagedResult<CfsCertificate>>(endpoint, {
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

  async countryOptions(): Promise<CountryOption[]> {
    const response = await api.get<CountryOption[]>(
      `${endpoint}/country-options`,
    );
    return response.data;
  },

  async create(input: CfsCertificateInput): Promise<CfsCertificate> {
    const response = await api.post<CfsCertificate>(endpoint, input);
    return response.data;
  },

  async update(
    id: string,
    input: CfsCertificateInput,
  ): Promise<CfsCertificate> {
    const response = await api.put<CfsCertificate>(`${endpoint}/${id}`, input);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`${endpoint}/${id}`);
  },

  async revoke(id: string, reason: string): Promise<CfsCertificate> {
    const response = await api.post<CfsCertificate>(
      `${endpoint}/${id}/revoke`,
      { reason },
    );
    return response.data;
  },

  async exportExcel(filter: CfsCertificateFilter): Promise<FileDownload> {
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
