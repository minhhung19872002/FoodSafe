import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ndtpReportApi,
  atpWorkReportApi,
  actionMonthReportApi,
} from "./reportingApi";
import { ndtpKeys, atpKeys, amrKeys } from "./reportingQueries";
import type {
  ActionMonthReportFilter,
  AtpWorkReportFilter,
  CreateNdtpReportInput,
  NdtpReportFilter,
  UpdateNdtpReportStatsInput,
  UpdateNdtpReportNarrativeInput,
  CreateAtpWorkReportInput,
  UpdateAtpWorkReportStatsInput,
  UpdateAtpWorkReportNarrativeInput,
  CreateActionMonthReportInput,
  UpdateActionMonthReportStatsInput,
  UpdateActionMonthReportNarrativeInput,
  ReturnReportInput,
  CreateReportErrorNotificationInput,
  RespondReportErrorNotificationInput,
} from "../types/reporting.types";

function useNdtpRefresh() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: ndtpKeys.all });
}

export function useCreateNdtpReport() {
  const refresh = useNdtpRefresh();
  return useMutation({
    mutationFn: (input: CreateNdtpReportInput) => ndtpReportApi.create(input),
    onSuccess: refresh,
  });
}

export function useUpdateNdtpStats() {
  const refresh = useNdtpRefresh();
  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: UpdateNdtpReportStatsInput;
    }) => ndtpReportApi.updateStats(id, input),
    onSuccess: refresh,
  });
}

export function useUpdateNdtpNarrative() {
  const refresh = useNdtpRefresh();
  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: UpdateNdtpReportNarrativeInput;
    }) => ndtpReportApi.updateNarrative(id, input),
    onSuccess: refresh,
  });
}

export function useDeleteNdtpReport() {
  const refresh = useNdtpRefresh();
  return useMutation({
    mutationFn: (id: string) => ndtpReportApi.delete(id),
    onSuccess: refresh,
  });
}

export function useSubmitNdtpReport() {
  const refresh = useNdtpRefresh();
  return useMutation({
    mutationFn: (id: string) => ndtpReportApi.submit(id),
    onSuccess: refresh,
  });
}

export function useVerifyNdtpReport() {
  const refresh = useNdtpRefresh();
  return useMutation({
    mutationFn: (id: string) => ndtpReportApi.verify(id),
    onSuccess: refresh,
  });
}

export function useReturnNdtpReport() {
  const refresh = useNdtpRefresh();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: ReturnReportInput }) =>
      ndtpReportApi.return(id, input),
    onSuccess: refresh,
  });
}

export function useCompleteNdtpReport() {
  const refresh = useNdtpRefresh();
  return useMutation({
    mutationFn: (id: string) => ndtpReportApi.complete(id),
    onSuccess: refresh,
  });
}

export function useReturnNdtpToDraft() {
  const refresh = useNdtpRefresh();
  return useMutation({
    mutationFn: (id: string) => ndtpReportApi.returnToDraft(id),
    onSuccess: refresh,
  });
}

function useAtpRefresh() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: atpKeys.all });
}

export function useCreateAtpWorkReport() {
  const refresh = useAtpRefresh();
  return useMutation({
    mutationFn: (input: CreateAtpWorkReportInput) =>
      atpWorkReportApi.create(input),
    onSuccess: refresh,
  });
}

export function useUpdateAtpStats() {
  const refresh = useAtpRefresh();
  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: UpdateAtpWorkReportStatsInput;
    }) => atpWorkReportApi.updateStats(id, input),
    onSuccess: refresh,
  });
}

export function useUpdateAtpNarrative() {
  const refresh = useAtpRefresh();
  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: UpdateAtpWorkReportNarrativeInput;
    }) => atpWorkReportApi.updateNarrative(id, input),
    onSuccess: refresh,
  });
}

export function useDeleteAtpWorkReport() {
  const refresh = useAtpRefresh();
  return useMutation({
    mutationFn: (id: string) => atpWorkReportApi.delete(id),
    onSuccess: refresh,
  });
}

export function useSubmitAtpWorkReport() {
  const refresh = useAtpRefresh();
  return useMutation({
    mutationFn: (id: string) => atpWorkReportApi.submit(id),
    onSuccess: refresh,
  });
}

export function useVerifyAtpWorkReport() {
  const refresh = useAtpRefresh();
  return useMutation({
    mutationFn: (id: string) => atpWorkReportApi.verify(id),
    onSuccess: refresh,
  });
}

export function useReturnAtpWorkReport() {
  const refresh = useAtpRefresh();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: ReturnReportInput }) =>
      atpWorkReportApi.return(id, input),
    onSuccess: refresh,
  });
}

export function useCompleteAtpWorkReport() {
  const refresh = useAtpRefresh();
  return useMutation({
    mutationFn: (id: string) => atpWorkReportApi.complete(id),
    onSuccess: refresh,
  });
}

export function useReturnAtpToDraft() {
  const refresh = useAtpRefresh();
  return useMutation({
    mutationFn: (id: string) => atpWorkReportApi.returnToDraft(id),
    onSuccess: refresh,
  });
}

function useAmrRefresh() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: amrKeys.all });
}

export function useCreateActionMonthReport() {
  const refresh = useAmrRefresh();
  return useMutation({
    mutationFn: (input: CreateActionMonthReportInput) =>
      actionMonthReportApi.create(input),
    onSuccess: refresh,
  });
}

export function useUpdateAmrStats() {
  const refresh = useAmrRefresh();
  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: UpdateActionMonthReportStatsInput;
    }) => actionMonthReportApi.updateStats(id, input),
    onSuccess: refresh,
  });
}

export function useUpdateAmrNarrative() {
  const refresh = useAmrRefresh();
  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: UpdateActionMonthReportNarrativeInput;
    }) => actionMonthReportApi.updateNarrative(id, input),
    onSuccess: refresh,
  });
}

export function useDeleteActionMonthReport() {
  const refresh = useAmrRefresh();
  return useMutation({
    mutationFn: (id: string) => actionMonthReportApi.delete(id),
    onSuccess: refresh,
  });
}

export function useSubmitActionMonthReport() {
  const refresh = useAmrRefresh();
  return useMutation({
    mutationFn: (id: string) => actionMonthReportApi.submit(id),
    onSuccess: refresh,
  });
}

export function useVerifyActionMonthReport() {
  const refresh = useAmrRefresh();
  return useMutation({
    mutationFn: (id: string) => actionMonthReportApi.verify(id),
    onSuccess: refresh,
  });
}

export function useReturnActionMonthReport() {
  const refresh = useAmrRefresh();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: ReturnReportInput }) =>
      actionMonthReportApi.return(id, input),
    onSuccess: refresh,
  });
}

export function useCompleteActionMonthReport() {
  const refresh = useAmrRefresh();
  return useMutation({
    mutationFn: (id: string) => actionMonthReportApi.complete(id),
    onSuccess: refresh,
  });
}

export function useReturnAmrToDraft() {
  const refresh = useAmrRefresh();
  return useMutation({
    mutationFn: (id: string) => actionMonthReportApi.returnToDraft(id),
    onSuccess: refresh,
  });
}

export function useExportNdtpReports() {
  return useMutation({
    mutationFn: (filter: NdtpReportFilter) => ndtpReportApi.exportExcel(filter),
  });
}

export function useExportAtpWorkReports() {
  return useMutation({
    mutationFn: (filter: AtpWorkReportFilter) =>
      atpWorkReportApi.exportExcel(filter),
  });
}

export function useExportActionMonthReports() {
  return useMutation({
    mutationFn: (filter: ActionMonthReportFilter) =>
      actionMonthReportApi.exportExcel(filter),
  });
}

const reportApis = {
  ndtp: ndtpReportApi,
  atp: atpWorkReportApi,
  amr: actionMonthReportApi,
} as const;
type ReportKind = keyof typeof reportApis;

function useErrorNotificationRefresh(kind: ReportKind, id: string | null) {
  const qc = useQueryClient();
  return () =>
    qc.invalidateQueries({
      queryKey: [`${kind}-reports`, "error-notifications", id ?? ""],
    });
}

export function useAddReportErrorNotification(
  kind: ReportKind,
  id: string | null,
) {
  const refresh = useErrorNotificationRefresh(kind, id);
  return useMutation({
    mutationFn: (input: CreateReportErrorNotificationInput) =>
      reportApis[kind].addErrorNotification(id as string, input),
    onSuccess: refresh,
  });
}

export function useAcknowledgeReportErrorNotification(
  kind: ReportKind,
  id: string | null,
) {
  const refresh = useErrorNotificationRefresh(kind, id);
  return useMutation({
    mutationFn: (notificationId: string) =>
      reportApis[kind].acknowledgeErrorNotification(
        id as string,
        notificationId,
      ),
    onSuccess: refresh,
  });
}

export function useRespondReportErrorNotification(
  kind: ReportKind,
  id: string | null,
) {
  const refresh = useErrorNotificationRefresh(kind, id);
  return useMutation({
    mutationFn: ({
      notificationId,
      input,
    }: {
      notificationId: string;
      input: RespondReportErrorNotificationInput;
    }) =>
      reportApis[kind].respondErrorNotification(
        id as string,
        notificationId,
        input,
      ),
    onSuccess: refresh,
  });
}
