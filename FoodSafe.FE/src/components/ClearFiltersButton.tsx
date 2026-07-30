import { FilterOutlined } from "@ant-design/icons";
import { Button, Tooltip } from "antd";

interface ClearFiltersButtonProps {
  active: boolean;
  onClick: () => void;
}

export function ClearFiltersButton({
  active,
  onClick,
}: ClearFiltersButtonProps) {
  return (
    <Tooltip title="Xóa tất cả bộ lọc">
      <Button
        className="filter-clear-button"
        aria-label="Xóa tất cả bộ lọc"
        data-active={active}
        icon={
          <span className="filter-clear-icon" aria-hidden="true">
            <FilterOutlined />
            {active && <span className="filter-clear-active-dot" />}
          </span>
        }
        onClick={onClick}
      />
    </Tooltip>
  );
}
