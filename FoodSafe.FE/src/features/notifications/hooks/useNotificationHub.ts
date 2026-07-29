import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { notification as antNotification } from "antd";
import { createNotificationConnection } from "@/lib/signalr";
import { notificationKeys } from "../api/notificationQueries";
import type { Notification } from "../types/notification.types";

export function useNotificationHub() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const connection = createNotificationConnection();

    connection.on("ReceiveNotification", (data: Notification) => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });

      antNotification.info({
        message: data.title,
        description: data.message,
        placement: "topRight",
        duration: 5,
      });
    });

    const started = connection.start().catch((err) => {
      console.warn("[SignalR] Connection failed, falling back to polling", err);
    });

    return () => {
      started.then(() => connection.stop()).catch(() => {});
    };
  }, [queryClient]);
}
