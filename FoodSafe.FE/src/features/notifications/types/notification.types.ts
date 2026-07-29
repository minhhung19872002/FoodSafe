export type NotificationType =
  | 11 | 12 | 13 | 14 | 15
  | 21 | 22 | 23 | 24 | 25 | 26
  | 31
  | 51;

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  entityType?: string;
  entityId?: string;
  isRead: boolean;
  readAt?: string;
  creationTime: string;
}

export interface UnreadCount {
  count: number;
}

export interface NotificationFilter {
  isRead?: boolean;
  skipCount?: number;
  maxResultCount?: number;
}

export interface PagedNotifications {
  totalCount: number;
  items: Notification[];
}
