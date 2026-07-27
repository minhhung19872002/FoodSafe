import { api } from "@/lib/axios";
import type {
  AuditLog,
  AuditLogDetail,
  AuditLogFilter,
  PagedResult,
} from "../types/auditLog.types";

export const auditLogApi = {
  async list(filter: AuditLogFilter): Promise<PagedResult<AuditLog>> {
    const response = await api.get<PagedResult<AuditLog>>("/v1/app/audit-log", {
      params: filter,
    });
    return response.data;
  },

  async getDetail(id: string): Promise<AuditLogDetail> {
    const response = await api.get<AuditLogDetail>(
      `/v1/app/audit-log/get-detail/${id}`,
    );
    return response.data;
  },

  async exportExcel(
    filter: AuditLogFilter,
  ): Promise<{ blob: Blob; fileName: string }> {
    const response = await api.get("/v1/app/audit-log/excel", {
      params: filter,
      responseType: "blob",
    });
    const disposition = response.headers["content-disposition"] as
      string | undefined;
    const match = disposition?.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
    const fileName = match
      ? match[1].replace(/['"]/g, "")
      : "nhat-ky-hoat-dong.xlsx";
    return { blob: response.data as Blob, fileName };
  },
};
