import { useQuery } from "@tanstack/react-query";
import {
  ndtpReportApi,
  atpWorkReportApi,
  actionMonthReportApi,
} from "./reportingApi";
import type {
  NdtpReportFilter,
  AtpWorkReportFilter,
  ActionMonthReportFilter,
} from "../types/reporting.types";

export const ndtpKeys = {
  all: ["ndtp-reports"] as const,
  lists: () => [...ndtpKeys.all, "list"] as const,
  list: (filter: NdtpReportFilter) => [...ndtpKeys.lists(), filter] as const,
  detail: (id: string) => [...ndtpKeys.all, "detail", id] as const,
};

export const atpKeys = {
  all: ["atp-work-reports"] as const,
  lists: () => [...atpKeys.all, "list"] as const,
  list: (filter: AtpWorkReportFilter) => [...atpKeys.lists(), filter] as const,
  detail: (id: string) => [...atpKeys.all, "detail", id] as const,
};

export const amrKeys = {
  all: ["action-month-reports"] as const,
  lists: () => [...amrKeys.all, "list"] as const,
  list: (filter: ActionMonthReportFilter) =>
    [...amrKeys.lists(), filter] as const,
  detail: (id: string) => [...amrKeys.all, "detail", id] as const,
};

export function useNdtpReports(filter: NdtpReportFilter) {
  return useQuery({
    queryKey: ndtpKeys.list(filter),
    queryFn: () => ndtpReportApi.list(filter),
  });
}

export function useNdtpReport(id: string) {
  return useQuery({
    queryKey: ndtpKeys.detail(id),
    queryFn: () => ndtpReportApi.get(id),
    enabled: !!id,
  });
}

export function useAtpWorkReports(filter: AtpWorkReportFilter) {
  return useQuery({
    queryKey: atpKeys.list(filter),
    queryFn: () => atpWorkReportApi.list(filter),
  });
}

export function useAtpWorkReport(id: string) {
  return useQuery({
    queryKey: atpKeys.detail(id),
    queryFn: () => atpWorkReportApi.get(id),
    enabled: !!id,
  });
}

export function useActionMonthReports(filter: ActionMonthReportFilter) {
  return useQuery({
    queryKey: amrKeys.list(filter),
    queryFn: () => actionMonthReportApi.list(filter),
  });
}

export function useActionMonthReport(id: string) {
  return useQuery({
    queryKey: amrKeys.detail(id),
    queryFn: () => actionMonthReportApi.get(id),
    enabled: !!id,
  });
}

const reportApis = {
  ndtp: ndtpReportApi,
  atp: atpWorkReportApi,
  amr: actionMonthReportApi,
} as const;
export type ReportKind = keyof typeof reportApis;

export const errorNotificationKeys = {
  list: (kind: ReportKind, id: string) =>
    [`${kind}-reports`, "error-notifications", id] as const,
};

export function useReportErrorNotifications(
  kind: ReportKind,
  id: string | null,
) {
  return useQuery({
    queryKey: errorNotificationKeys.list(kind, id ?? ""),
    queryFn: () => reportApis[kind].listErrorNotifications(id as string),
    enabled: !!id,
  });
}
