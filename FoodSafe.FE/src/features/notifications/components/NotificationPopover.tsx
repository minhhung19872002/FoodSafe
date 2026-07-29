import { Button, Divider, Empty, Spin, Typography } from "antd";
import { useNavigate } from "react-router-dom";
import { useNotifications } from "../api/notificationQueries";
import { useMarkAllRead, useMarkRead } from "../api/notificationMutations";
import { NotificationItem, getEntityRoute } from "./NotificationItem";
import type { Notification } from "../types/notification.types";

interface Props {
  onClose: () => void;
}

export function NotificationPopover({ onClose }: Props) {
  const navigate = useNavigate();
  const { data, isLoading, isError } = useNotifications({ maxResultCount: 20 });
  const { mutate: markRead } = useMarkRead();
  const { mutate: markAllRead } = useMarkAllRead();

  const hasUnread = data?.items.some((n) => !n.isRead) ?? false;

  function handleClick(n: Notification) {
    if (!n.isRead) markRead(n.id);
    const route = getEntityRoute(n.entityType);
    if (route) navigate(route);
    onClose();
  }

  return (
    <div style={{ minHeight: 200, maxHeight: 480, overflow: "auto" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "8px 16px",
        }}
      >
        <Typography.Text strong style={{ fontSize: 15 }}>
          Thông báo
        </Typography.Text>
        <Button
          type="link"
          size="small"
          onClick={() => markAllRead()}
          disabled={!hasUnread || isLoading}
        >
          Đánh dấu tất cả đã đọc
        </Button>
      </div>
      <Divider style={{ margin: 0 }} />
      {isLoading && (
        <div style={{ textAlign: "center", padding: 24 }}>
          <Spin />
        </div>
      )}
      {isError && (
        <div style={{ padding: 24, textAlign: "center" }}>
          <Typography.Text type="danger">
            Không thể tải thông báo. Vui lòng thử lại.
          </Typography.Text>
        </div>
      )}
      {!isLoading && !isError && (!data || data.items.length === 0) && (
        <Empty
          description="Không có thông báo"
          style={{ padding: 24 }}
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      )}
      {!isLoading &&
        !isError &&
        data &&
        data.items.length > 0 &&
        data.items.map((item) => (
          <NotificationItem
            key={item.id}
            notification={item}
            onClick={handleClick}
          />
        ))}
    </div>
  );
}
