import { useQuery } from "@tanstack/react-query";
import { notificationApi } from "./notificationApi";
import type { NotificationFilter } from "../types/notification.types";

export const notificationKeys = {
  all: ["notifications"] as const,
  lists: () => [...notificationKeys.all, "list"] as const,
  list: (filter: NotificationFilter) =>
    [...notificationKeys.lists(), filter] as const,
  unreadCount: () => [...notificationKeys.all, "unread-count"] as const,
};

export function useNotifications(filter: NotificationFilter) {
  return useQuery({
    queryKey: notificationKeys.list(filter),
    queryFn: () => notificationApi.list(filter),
    staleTime: 30_000,
  });
}

export function useUnreadCount() {
  return useQuery({
    queryKey: notificationKeys.unreadCount(),
    queryFn: () => notificationApi.getUnreadCount(),
    refetchInterval: 60_000,
    staleTime: 60_000,
  });
}
