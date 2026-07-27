import { Tag } from "antd";

const LICENSE_STATUS_CONFIG: Record<number, { color: string; label: string }> =
  {
    1: { color: "green", label: "Còn hiệu lực" },
    2: { color: "orange", label: "Hết hạn" },
    3: { color: "red", label: "Đã thu hồi" },
  };

interface StatusBadgeProps {
  status: number;
  config?: Record<number, { color: string; label: string }>;
}

export function StatusBadge({ status, config }: StatusBadgeProps) {
  const cfg = config ?? LICENSE_STATUS_CONFIG;
  const item = cfg[status];
  if (!item) return <Tag>{status}</Tag>;
  return <Tag color={item.color}>{item.label}</Tag>;
}

export { LICENSE_STATUS_CONFIG };
