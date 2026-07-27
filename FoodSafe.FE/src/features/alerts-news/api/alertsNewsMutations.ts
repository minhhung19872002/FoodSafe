import { useMutation, useQueryClient } from "@tanstack/react-query";
import { alertApi, newsApi } from "./alertsNewsApi";
import { alertKeys, newsKeys } from "./alertsNewsQueries";
import type {
  AlertFilter,
  CreateUpdateAlertInput,
  CreateUpdateNewsInput,
  NewsFilter,
} from "../types/alertsNews.types";

function useAlertRefresh() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: alertKeys.all });
}

function useNewsRefresh() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: newsKeys.all });
  };
}

export function useCreateAlert() {
  const refresh = useAlertRefresh();
  return useMutation({
    mutationFn: (input: CreateUpdateAlertInput) => alertApi.create(input),
    onSuccess: refresh,
  });
}

export function useUpdateAlert() {
  const refresh = useAlertRefresh();
  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: CreateUpdateAlertInput;
    }) => alertApi.update(id, input),
    onSuccess: refresh,
  });
}

export function useDeleteAlert() {
  const refresh = useAlertRefresh();
  return useMutation({
    mutationFn: (id: string) => alertApi.delete(id),
    onSuccess: refresh,
  });
}

export function usePublishAlert() {
  const refresh = useAlertRefresh();
  return useMutation({
    mutationFn: ({ id, isPublic }: { id: string; isPublic: boolean }) =>
      alertApi.publish(id, isPublic),
    onSuccess: refresh,
  });
}

export function useRecallAlert() {
  const refresh = useAlertRefresh();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      alertApi.recall(id, reason),
    onSuccess: refresh,
  });
}

export function useCreateNews() {
  const refresh = useNewsRefresh();
  return useMutation({
    mutationFn: (input: CreateUpdateNewsInput) => newsApi.create(input),
    onSuccess: refresh,
  });
}

export function useUpdateNews() {
  const refresh = useNewsRefresh();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: CreateUpdateNewsInput }) =>
      newsApi.update(id, input),
    onSuccess: refresh,
  });
}

export function useDeleteNews() {
  const refresh = useNewsRefresh();
  return useMutation({
    mutationFn: (id: string) => newsApi.delete(id),
    onSuccess: refresh,
  });
}

export function usePublishNews() {
  const refresh = useNewsRefresh();
  return useMutation({
    mutationFn: ({ id, isPublic }: { id: string; isPublic: boolean }) =>
      newsApi.publish(id, isPublic),
    onSuccess: refresh,
  });
}

export function useRecallNews() {
  const refresh = useNewsRefresh();
  return useMutation({
    mutationFn: (id: string) => newsApi.recall(id),
    onSuccess: refresh,
  });
}

export function useExportAlerts() {
  return useMutation({
    mutationFn: (filter: AlertFilter) => alertApi.exportExcel(filter),
  });
}

export function useExportNews() {
  return useMutation({
    mutationFn: (filter: NewsFilter) => newsApi.exportExcel(filter),
  });
}
