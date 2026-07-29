import { useMutation, useQueryClient } from "@tanstack/react-query";
import { poisoningCaseApi, poisoningIncidentApi } from "./foodPoisoningApi";
import { caseKeys, incidentKeys } from "./foodPoisoningQueries";
import type {
  CaseFilter,
  ConcludeIncidentInput,
  CreateErrorReportInput,
  CreateUpdateCaseInput,
  CreateUpdateIncidentInput,
  IncidentFilter,
  RespondErrorReportInput,
} from "../types/foodPoisoning.types";

function useCaseRefresh() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: caseKeys.all });
}

export function useCreateCase() {
  const refresh = useCaseRefresh();
  return useMutation({
    mutationFn: (input: CreateUpdateCaseInput) =>
      poisoningCaseApi.create(input),
    onSuccess: refresh,
  });
}

export function useUpdateCase() {
  const refresh = useCaseRefresh();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: CreateUpdateCaseInput }) =>
      poisoningCaseApi.update(id, input),
    onSuccess: refresh,
  });
}

export function useDeleteCase() {
  const refresh = useCaseRefresh();
  return useMutation({
    mutationFn: (id: string) => poisoningCaseApi.delete(id),
    onSuccess: refresh,
  });
}

export function useSubmitCase() {
  const refresh = useCaseRefresh();
  return useMutation({
    mutationFn: (id: string) => poisoningCaseApi.submit(id),
    onSuccess: refresh,
  });
}

export function useVerifyCase() {
  const refresh = useCaseRefresh();
  return useMutation({
    mutationFn: (id: string) => poisoningCaseApi.verify(id),
    onSuccess: refresh,
  });
}

export function useAddCaseErrorReport() {
  const refresh = useCaseRefresh();
  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: CreateErrorReportInput;
    }) => poisoningCaseApi.addErrorReport(id, input),
    onSuccess: refresh,
  });
}

export function useAcknowledgeCaseErrorReport() {
  const refresh = useCaseRefresh();
  return useMutation({
    mutationFn: ({ id, reportId }: { id: string; reportId: string }) =>
      poisoningCaseApi.acknowledgeErrorReport(id, reportId),
    onSuccess: refresh,
  });
}

export function useRespondCaseErrorReport() {
  const refresh = useCaseRefresh();
  return useMutation({
    mutationFn: ({
      id,
      reportId,
      input,
    }: {
      id: string;
      reportId: string;
      input: RespondErrorReportInput;
    }) => poisoningCaseApi.respondErrorReport(id, reportId, input),
    onSuccess: refresh,
  });
}

function useIncidentRefresh() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: incidentKeys.all });
}

export function useCreateIncident() {
  const refresh = useIncidentRefresh();
  return useMutation({
    mutationFn: (input: CreateUpdateIncidentInput) =>
      poisoningIncidentApi.create(input),
    onSuccess: refresh,
  });
}

export function useUpdateIncident() {
  const refresh = useIncidentRefresh();
  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: CreateUpdateIncidentInput;
    }) => poisoningIncidentApi.update(id, input),
    onSuccess: refresh,
  });
}

export function useDeleteIncident() {
  const refresh = useIncidentRefresh();
  return useMutation({
    mutationFn: (id: string) => poisoningIncidentApi.delete(id),
    onSuccess: refresh,
  });
}

export function useSubmitIncident() {
  const refresh = useIncidentRefresh();
  return useMutation({
    mutationFn: (id: string) => poisoningIncidentApi.submit(id),
    onSuccess: refresh,
  });
}

export function useVerifyIncident() {
  const refresh = useIncidentRefresh();
  return useMutation({
    mutationFn: (id: string) => poisoningIncidentApi.verify(id),
    onSuccess: refresh,
  });
}

export function useConcludeIncident() {
  const refresh = useIncidentRefresh();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: ConcludeIncidentInput }) =>
      poisoningIncidentApi.conclude(id, input),
    onSuccess: refresh,
  });
}

export function useAddIncidentErrorReport() {
  const refresh = useIncidentRefresh();
  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: CreateErrorReportInput;
    }) => poisoningIncidentApi.addErrorReport(id, input),
    onSuccess: refresh,
  });
}

export function useAcknowledgeIncidentErrorReport() {
  const refresh = useIncidentRefresh();
  return useMutation({
    mutationFn: ({ id, reportId }: { id: string; reportId: string }) =>
      poisoningIncidentApi.acknowledgeErrorReport(id, reportId),
    onSuccess: refresh,
  });
}

export function useRespondIncidentErrorReport() {
  const refresh = useIncidentRefresh();
  return useMutation({
    mutationFn: ({
      id,
      reportId,
      input,
    }: {
      id: string;
      reportId: string;
      input: RespondErrorReportInput;
    }) => poisoningIncidentApi.respondErrorReport(id, reportId, input),
    onSuccess: refresh,
  });
}

export function useExportCases() {
  return useMutation({
    mutationFn: (filter: CaseFilter) => poisoningCaseApi.exportExcel(filter),
  });
}

export function useDownloadCasePdf() {
  return useMutation({
    mutationFn: (id: string) => poisoningCaseApi.downloadPdf(id),
  });
}

export function useDownloadIncidentPdf() {
  return useMutation({
    mutationFn: (id: string) => poisoningIncidentApi.downloadPdf(id),
  });
}

export function useExportIncidents() {
  return useMutation({
    mutationFn: (filter: IncidentFilter) =>
      poisoningIncidentApi.exportExcel(filter),
  });
}
