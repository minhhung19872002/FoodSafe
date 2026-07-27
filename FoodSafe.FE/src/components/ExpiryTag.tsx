import { Space, Tag } from "antd";

interface ExpiryTagProps {
  expiryDate: string | null | undefined;
  status: number;
  daysUntilExpiry: number | undefined;
  activeStatus?: number;
}

const ACTIVE = 1;

export function ExpiryTag({
  expiryDate,
  status,
  daysUntilExpiry,
  activeStatus = ACTIVE,
}: ExpiryTagProps) {
  if (!expiryDate) return <span>Không thời hạn</span>;

  const date = new Date(expiryDate).toLocaleDateString("vi-VN");

  if (
    status === activeStatus &&
    daysUntilExpiry !== undefined &&
    daysUntilExpiry <= 90
  ) {
    return (
      <Space direction="vertical" size={0}>
        <span>{date}</span>
        <Tag color={daysUntilExpiry <= 30 ? "red" : "gold"}>
          Còn {daysUntilExpiry} ngày
        </Tag>
      </Space>
    );
  }

  return <span>{date}</span>;
}
