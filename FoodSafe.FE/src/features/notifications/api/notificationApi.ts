import { api } from "@/lib/axios";
import type {
  NotificationFilter,
  PagedNotifications,
  UnreadCount,
} from "../types/notification.types";

const endpoint = "/v1/app/notification";

export const notificationApi = {
  async list(filter: NotificationFilter): Promise<PagedNotifications> {
    return (await api.get<PagedNotifications>(endpoint, { params: filter }))
      .data;
  },

  async getUnreadCount(): Promise<UnreadCount> {
    return (await api.get<UnreadCount>(`${endpoint}/unread-count`)).data;
  },

  async markRead(id: string): Promise<void> {
    await api.post(`${endpoint}/${id}/mark-read`);
  },

  async markAllRead(): Promise<void> {
    await api.post(`${endpoint}/mark-all-read`);
  },

  async remove(id: string): Promise<void> {
    await api.delete(`${endpoint}/${id}`);
  },
};
