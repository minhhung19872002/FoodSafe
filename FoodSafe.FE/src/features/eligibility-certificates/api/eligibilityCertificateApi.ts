import { api } from "@/lib/axios";
import type {
  BusinessOption,
  EligibilityCertificate,
  EligibilityCertificateFilter,
  EligibilityCertificateInput,
  FileAttachment,
  FileDownload,
  PagedResult,
  PublicEligibilityCertificate,
} from "../types/eligibilityCertificate.types";

const endpoint = "/v1/app/eligibility-certificate";

function download(data: Blob, disposition?: string): FileDownload {
  const encoded = disposition?.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
  const plain = disposition?.match(/filename="?([^";]+)"?/i)?.[1];
  return {
    blob: data,
    fileName: decodeURIComponent(encoded ?? plain ?? "download"),
  };
}

export const eligibilityCertificateApi = {
  async list(
    filter: EligibilityCertificateFilter,
  ): Promise<PagedResult<EligibilityCertificate>> {
    return (
      await api.get<PagedResult<EligibilityCertificate>>(endpoint, {
        params: filter,
      })
    ).data;
  },
  async businessOptions(): Promise<BusinessOption[]> {
    return (await api.get<BusinessOption[]>(`${endpoint}/business-options`))
      .data;
  },
  async create(
    input: EligibilityCertificateInput,
  ): Promise<EligibilityCertificate> {
    return (await api.post<EligibilityCertificate>(endpoint, input)).data;
  },
  async update(
    id: string,
    input: EligibilityCertificateInput,
  ): Promise<EligibilityCertificate> {
    return (await api.put<EligibilityCertificate>(`${endpoint}/${id}`, input))
      .data;
  },
  async delete(id: string) {
    await api.delete(`${endpoint}/${id}`);
  },
  async revoke(id: string, reason: string) {
    return (
      await api.post<EligibilityCertificate>(`${endpoint}/${id}/revoke`, {
        reason,
      })
    ).data;
  },
  async exportExcel(filter: EligibilityCertificateFilter) {
    const response = await api.get<Blob>(`${endpoint}/excel/export`, {
      params: filter,
      responseType: "blob",
    });
    return download(response.data, response.headers["content-disposition"]);
  },
  async downloadPdf(id: string): Promise<FileDownload> {
    const response = await api.get<Blob>(
      `/v1/public/eligibility-certificates/${id}/pdf`,
      { responseType: "blob" },
    );
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
      await api.post<FileAttachment>(`${endpoint}/${id}/attachments`, form)
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
  async publicLookup(number: string): Promise<PublicEligibilityCertificate> {
    return (
      await api.get<PublicEligibilityCertificate>(
        "/v1/public/eligibility-certificates",
        { params: { number } },
      )
    ).data;
  },
};
