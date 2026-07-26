import { api } from "@/lib/axios";
import type {
  AuditLog,
  AuditLogFilter,
  PagedResult,
} from "../types/auditLog.types";

export const auditLogApi = {
  async list(filter: AuditLogFilter): Promise<PagedResult<AuditLog>> {
    const response = await api.get<PagedResult<AuditLog>>(
      "/v1/app/audit-log",
      { params: filter },
    );
    return response.data;
  },
};
