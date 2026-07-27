import { api } from "@/lib/axios";
import type {
  AdministrativeDocument,
  DocumentFilter,
  CreateUpdateDocumentInput,
  FileDownload,
  PagedResult,
} from "../types/document.types";

const endpoint = "/v1/app/administrative-document";

function download(data: Blob, contentDisposition?: string): FileDownload {
  const encoded = contentDisposition?.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
  const plain = contentDisposition?.match(/filename="?([^";]+)"?/i)?.[1];
  return {
    blob: data,
    fileName: decodeURIComponent(encoded ?? plain ?? "download"),
  };
}

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
  async documentTypeOptions(): Promise<{ id: string; name: string }[]> {
    const res = await api.get<{
      items: { id: string; name: string }[];
    }>("/v1/app/master-catalog/document-types", {
      params: { maxResultCount: 100 },
    });
    return res.data.items;
  },
  async exportExcel(filter: DocumentFilter): Promise<FileDownload> {
    const response = await api.get<Blob>(`${endpoint}/excel/export`, {
      params: filter,
      responseType: "blob",
    });
    return download(response.data, response.headers["content-disposition"]);
  },
};

export interface DocumentAttachment {
  id: string;
  originalName: string;
  sizeBytes: number;
  mimeType?: string;
  description?: string;
  creationTime: string;
}

export const documentAttachmentApi = {
  async list(documentId: string): Promise<DocumentAttachment[]> {
    return (
      await api.get<DocumentAttachment[]>(
        `${endpoint}/${documentId}/attachments`,
      )
    ).data;
  },
  async upload(documentId: string, file: File): Promise<void> {
    const form = new FormData();
    form.append("file", file);
    await api.post(`${endpoint}/${documentId}/attachments`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  async download(
    documentId: string,
    attachmentId: string,
  ): Promise<FileDownload> {
    const response = await api.get<Blob>(
      `${endpoint}/${documentId}/attachments/${attachmentId}/download`,
      { responseType: "blob" },
    );
    return download(response.data, response.headers["content-disposition"]);
  },
  async remove(documentId: string, attachmentId: string): Promise<void> {
    await api.delete(`${endpoint}/${documentId}/attachments/${attachmentId}`);
  },
};
