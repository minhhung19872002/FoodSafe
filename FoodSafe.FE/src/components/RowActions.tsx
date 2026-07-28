import type { ReactNode } from "react";
import { App, Button, Dropdown, Space, Tooltip } from "antd";
import type { MenuProps } from "antd";
import { EllipsisOutlined } from "@ant-design/icons";

export interface RowAction {
  key: string;
  /** Short Vietnamese name, shown as tooltip and overflow-menu label. */
  label: string;
  /** Accessible name with row context (e.g. `Sửa ${name}`); defaults to label. */
  ariaLabel?: string;
  icon?: ReactNode;
  onClick: () => void;
  danger?: boolean;
  disabled?: boolean;
  hidden?: boolean;
  /** Confirmation question asked before onClick runs (replaces Popconfirm). */
  confirm?: string;
}

interface RowActionsProps {
  actions: RowAction[];
  /** How many actions render as inline icon buttons before overflowing to ⋯. */
  maxInline?: number;
  /** Accessible name of the overflow button (e.g. `Thao tác ${name}`). */
  overflowAriaLabel?: string;
}

/**
 * Row-level action cell: the first `maxInline` actions render as tooltipped
 * icon buttons, the rest collapse into a ⋯ dropdown with full labels. Danger
 * actions sit below a divider and ask for confirmation via `confirm`.
 */
export function RowActions({
  actions,
  maxInline = 2,
  overflowAriaLabel = "Thêm thao tác",
}: RowActionsProps) {
  const { modal } = App.useApp();
  const visible = actions.filter((action) => !action.hidden);
  const inline = visible.slice(0, maxInline);
  const overflow = visible.slice(maxInline);

  const run = (action: RowAction) => {
    if (action.confirm) {
      modal.confirm({
        title: action.label,
        content: action.confirm,
        okButtonProps: { danger: action.danger },
        onOk: action.onClick,
      });
      return;
    }
    action.onClick();
  };

  const menuItems: MenuProps["items"] = [];
  overflow.forEach((action, index) => {
    const previous = overflow[index - 1];
    if (action.danger && previous && !previous.danger) {
      menuItems.push({ type: "divider" });
    }
    menuItems.push({
      key: action.key,
      label: action.label,
      icon: action.icon,
      danger: action.danger,
      disabled: action.disabled,
    });
  });

  return (
    <Space size={4}>
      {inline.map((action) => (
        <Tooltip key={action.key} title={action.label}>
          <Button
            type="text"
            size="small"
            danger={action.danger}
            disabled={action.disabled}
            icon={action.icon}
            aria-label={action.ariaLabel ?? action.label}
            onClick={() => run(action)}
          />
        </Tooltip>
      ))}
      {overflow.length > 0 && (
        <Dropdown
          trigger={["click"]}
          menu={{
            items: menuItems,
            onClick: ({ key }) => {
              const action = overflow.find((item) => item.key === key);
              if (action) run(action);
            },
          }}
        >
          <Button
            type="text"
            size="small"
            icon={<EllipsisOutlined />}
            aria-label={overflowAriaLabel}
          />
        </Dropdown>
      )}
    </Space>
  );
}
