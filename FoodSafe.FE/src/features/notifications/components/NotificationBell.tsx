import { useState } from "react";
import { Badge, Button, Popover } from "antd";
import { BellOutlined } from "@ant-design/icons";
import { useUnreadCount } from "../api/notificationQueries";
import { useNotificationHub } from "../hooks/useNotificationHub";
import { NotificationPopover } from "./NotificationPopover";
import { brand } from "@/theme/themeConfig";

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const { data } = useUnreadCount();
  useNotificationHub();
  const unreadCount = data?.count ?? 0;

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
      trigger="click"
      placement="bottomRight"
      content={<NotificationPopover onClose={() => setOpen(false)} />}
      overlayStyle={{ width: 400 }}
      arrow={false}
    >
      <Badge count={unreadCount} overflowCount={99} size="small">
        <Button
          type="text"
          icon={<BellOutlined />}
          aria-label={
            unreadCount > 0
              ? `Thông báo (${unreadCount} chưa đọc)`
              : "Thông báo"
          }
          aria-haspopup="dialog"
          aria-expanded={open}
          style={{
            background: brand.bgHead,
            width: 34,
            height: 34,
            borderRadius: 9,
          }}
        />
      </Badge>
    </Popover>
  );
}
