import { useMutation, useQueryClient } from "@tanstack/react-query";
import { message } from "antd";
import { notificationApi } from "./notificationApi";
import { notificationKeys } from "./notificationQueries";

function useNotificationRefresh() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: notificationKeys.all });
}

export function useMarkRead() {
  const refresh = useNotificationRefresh();
  return useMutation({
    mutationFn: (id: string) => notificationApi.markRead(id),
    onSuccess: refresh,
    onError: () => message.error("Không thể đánh dấu đã đọc. Vui lòng thử lại."),
  });
}

export function useMarkAllRead() {
  const refresh = useNotificationRefresh();
  return useMutation({
    mutationFn: () => notificationApi.markAllRead(),
    onSuccess: refresh,
    onError: () => message.error("Không thể đánh dấu tất cả đã đọc. Vui lòng thử lại."),
  });
}

export function useDeleteNotification() {
  const refresh = useNotificationRefresh();
  return useMutation({
    mutationFn: (id: string) => notificationApi.remove(id),
    onSuccess: refresh,
    onError: () => message.error("Không thể xóa thông báo. Vui lòng thử lại."),
  });
}
