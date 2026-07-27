import { useQuery } from "@tanstack/react-query";
import { alertApi, newsApi } from "./alertsNewsApi";
import type { AlertFilter, NewsFilter } from "../types/alertsNews.types";

export const alertKeys = {
  all: ["alerts"] as const,
  lists: () => [...alertKeys.all, "list"] as const,
  list: (filter: AlertFilter) => [...alertKeys.lists(), filter] as const,
  detail: (id: string) => [...alertKeys.all, "detail", id] as const,
};

export const newsKeys = {
  all: ["news"] as const,
  lists: () => [...newsKeys.all, "list"] as const,
  list: (filter: NewsFilter) => [...newsKeys.lists(), filter] as const,
  detail: (id: string) => [...newsKeys.all, "detail", id] as const,
  alertOptions: (filter?: string) =>
    [...newsKeys.all, "alert-options", filter] as const,
};

export function useAlerts(filter: AlertFilter) {
  return useQuery({
    queryKey: alertKeys.list(filter),
    queryFn: () => alertApi.list(filter),
  });
}

export function useNews(filter: NewsFilter) {
  return useQuery({
    queryKey: newsKeys.list(filter),
    queryFn: () => newsApi.list(filter),
  });
}

export function useAlertOptions(filter?: string) {
  return useQuery({
    queryKey: newsKeys.alertOptions(filter),
    queryFn: () => newsApi.alertOptions(filter),
  });
}
