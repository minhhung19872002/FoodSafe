import { useQuery } from "@tanstack/react-query";
import { useMutation } from "@tanstack/react-query";
import { auditLogApi } from "./auditLogApi";
import type { AuditLogFilter } from "../types/auditLog.types";

const auditLogKeys = {
  all: ["audit-logs"] as const,
  list: (filter: AuditLogFilter) => [...auditLogKeys.all, filter] as const,
  detail: (id: string) => [...auditLogKeys.all, "detail", id] as const,
};

export function useAuditLogs(filter: AuditLogFilter) {
  return useQuery({
    queryKey: auditLogKeys.list(filter),
    queryFn: () => auditLogApi.list(filter),
  });
}

export function useAuditLogDetail(id: string | undefined) {
  return useQuery({
    queryKey: auditLogKeys.detail(id ?? ""),
    queryFn: () => auditLogApi.getDetail(id!),
    enabled: Boolean(id),
  });
}

export function useExportAuditLogs() {
  return useMutation({
    mutationFn: (filter: AuditLogFilter) => auditLogApi.exportExcel(filter),
  });
}
