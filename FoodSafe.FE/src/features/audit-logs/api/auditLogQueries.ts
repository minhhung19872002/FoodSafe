import { useQuery } from "@tanstack/react-query";
import { auditLogApi } from "./auditLogApi";
import type { AuditLogFilter } from "../types/auditLog.types";

const auditLogKeys = {
  all: ["audit-logs"] as const,
  list: (filter: AuditLogFilter) => [...auditLogKeys.all, filter] as const,
};

export function useAuditLogs(filter: AuditLogFilter) {
  return useQuery({
    queryKey: auditLogKeys.list(filter),
    queryFn: () => auditLogApi.list(filter),
  });
}
