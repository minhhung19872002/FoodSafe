import { api } from "@/lib/axios";
import type {
  BusinessOption,
  FileAttachment,
  FileDownload,
  PagedResult,
  ProductOption,
  SelfDeclaration,
  SelfDeclarationFilter,
  SelfDeclarationInput,
} from "../types/selfDeclaration.types";

const endpoint = "/v1/app/self-declaration";
const excelEndpoint = `${endpoint}/excel`;

function download(data: Blob, contentDisposition?: string): FileDownload {
  const encoded = contentDisposition?.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
  const plain = contentDisposition?.match(/filename="?([^";]+)"?/i)?.[1];
  return {
    blob: data,
    fileName: decodeURIComponent(encoded ?? plain ?? "download"),
  };
}

export const selfDeclarationApi = {
  async list(
    filter: SelfDeclarationFilter,
  ): Promise<PagedResult<SelfDeclaration>> {
    const response = await api.get<PagedResult<SelfDeclaration>>(endpoint, {
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

  async create(input: SelfDeclarationInput): Promise<SelfDeclaration> {
    const response = await api.post<SelfDeclaration>(endpoint, input);
    return response.data;
  },

  async update(
    id: string,
    input: SelfDeclarationInput,
  ): Promise<SelfDeclaration> {
    const response = await api.put<SelfDeclaration>(`${endpoint}/${id}`, input);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`${endpoint}/${id}`);
  },

  async revoke(id: string, reason: string): Promise<SelfDeclaration> {
    const response = await api.post<SelfDeclaration>(
      `${endpoint}/${id}/revoke`,
      { reason },
    );
    return response.data;
  },

  async exportExcel(filter: SelfDeclarationFilter): Promise<FileDownload> {
    const response = await api.get<Blob>(`${excelEndpoint}/export`, {
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
