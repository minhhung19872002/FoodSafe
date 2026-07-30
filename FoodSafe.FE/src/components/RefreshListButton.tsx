import { ReloadOutlined } from "@ant-design/icons";
import { Button, Tooltip } from "antd";

interface RefreshListButtonProps {
  loading?: boolean;
  onClick: () => void;
}

export function RefreshListButton({
  loading = false,
  onClick,
}: RefreshListButtonProps) {
  return (
    <Tooltip title="Làm mới danh sách">
      <Button
        aria-label="Làm mới danh sách"
        icon={<ReloadOutlined />}
        loading={loading}
        onClick={onClick}
      />
    </Tooltip>
  );
}
