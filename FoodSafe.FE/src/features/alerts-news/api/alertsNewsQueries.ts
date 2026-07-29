import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { alertApi, newsApi, staffApi } from "./alertsNewsApi";
import type { AlertFilter, NewsFilter } from "../types/alertsNews.types";

export const alertKeys = {
  all: ["alerts"] as const,
  lists: () => [...alertKeys.all, "list"] as const,
  list: (filter: AlertFilter) => [...alertKeys.lists(), filter] as const,
  detail: (id: string) => [...alertKeys.all, "detail", id] as const,
};

export const staffKeys = {
  all: ["staff-users"] as const,
  list: (filter?: string) => [...staffKeys.all, filter] as const,
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
    placeholderData: keepPreviousData,
  });
}

export function useNews(filter: NewsFilter) {
  return useQuery({
    queryKey: newsKeys.list(filter),
    queryFn: () => newsApi.list(filter),
    placeholderData: keepPreviousData,
  });
}

export function useAlertOptions(filter?: string) {
  return useQuery({
    queryKey: newsKeys.alertOptions(filter),
    queryFn: () => newsApi.alertOptions(filter),
  });
}

/** Lists active staff users for the moderation-queue assignee Select. */
export function useStaffUsers(filter?: string) {
  return useQuery({
    queryKey: staffKeys.list(filter),
    queryFn: () => staffApi.listUsers(filter),
    staleTime: 5 * 60 * 1000, // users change rarely — cache for 5 min
  });
}
