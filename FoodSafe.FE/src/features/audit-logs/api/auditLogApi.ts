import { api } from "@/lib/axios";
import type {
  AuditLog,
  AuditLogDetail,
  AuditLogFilter,
  PagedResult,
} from "../types/auditLog.types";

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

export const auditLogApi = {
  async list(filter: AuditLogFilter): Promise<PagedResult<AuditLog>> {
    const response = await api.get<PagedResult<AuditLog>>("/v1/app/audit-log", {
      params: filter,
    });
    return response.data;
  },
  async get(id: string): Promise<AuditLogDetail> {
    const response = await api.get<AuditLogDetail>(`/v1/app/audit-log/${id}`);
    return response.data;
  },
  async exportExcel(filter: AuditLogFilter): Promise<FileDownload> {
    const response = await api.get<Blob>("/v1/app/audit-log/excel/export", {
      params: filter,
      responseType: "blob",
    });
    return toDownload(response.data, response.headers["content-disposition"]);
  },
};
