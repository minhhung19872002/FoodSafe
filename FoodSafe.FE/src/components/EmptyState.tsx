import { InboxOutlined } from "@ant-design/icons";
import type { ReactNode } from "react";

interface EmptyStateProps {
  icon?: ReactNode;
  title?: string;
  description?: string;
}

export function EmptyState({
  icon,
  title = "Chưa có dữ liệu",
  description,
}: EmptyStateProps) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">{icon ?? <InboxOutlined />}</div>
      <div className="empty-state-title">{title}</div>
      {description && (
        <div className="empty-state-description">{description}</div>
      )}
    </div>
  );
}
