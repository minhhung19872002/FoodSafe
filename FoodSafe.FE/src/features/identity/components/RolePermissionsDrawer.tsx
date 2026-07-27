import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  Checkbox,
  Drawer,
  Empty,
  Space,
  Spin,
  Typography,
} from "antd";
import type {
  AdminRole,
  RolePermission,
  RolePermissionGroup,
} from "../types/identity.types";

interface Props {
  role?: AdminRole;
  groups: RolePermissionGroup[];
  loading: boolean;
  saving: boolean;
  onClose: () => void;
  onSave: (permissions: Array<{ name: string; isGranted: boolean }>) => void;
}

export function RolePermissionsDrawer({
  role,
  groups,
  loading,
  saving,
  onClose,
  onSave,
}: Props) {
  const permissions = useMemo(
    () => groups.flatMap((group) => group.permissions),
    [groups],
  );
  const [granted, setGranted] = useState<Set<string>>(new Set());

  useEffect(() => {
    setGranted(
      new Set(
        permissions
          .filter((permission) => permission.isGranted)
          .map((permission) => permission.name),
      ),
    );
  }, [permissions]);

  const toggle = (permission: RolePermission, checked: boolean) => {
    setGranted((current) => {
      const next = new Set(current);
      if (checked) {
        let cursor: RolePermission | undefined = permission;
        while (cursor) {
          next.add(cursor.name);
          cursor = cursor.parentName
            ? permissions.find((item) => item.name === cursor?.parentName)
            : undefined;
        }
      } else {
        const queue = [permission.name];
        while (queue.length > 0) {
          const name = queue.pop();
          if (!name) continue;
          next.delete(name);
          permissions
            .filter((item) => item.parentName === name)
            .forEach((item) => queue.push(item.name));
        }
      }
      return next;
    });
  };

  return (
    <Drawer
      open={Boolean(role)}
      width={600}
      title={`Phân quyền — ${role?.name ?? ""}`}
      onClose={onClose}
      extra={
        <Button
          type="primary"
          loading={saving}
          disabled={loading}
          onClick={() =>
            onSave(
              permissions.map((permission) => ({
                name: permission.name,
                isGranted: granted.has(permission.name),
              })),
            )
          }
        >
          Lưu phân quyền
        </Button>
      }
    >
      <Alert
        showIcon
        type="info"
        message="Quyền cha được chọn tự động. Bỏ quyền cha sẽ bỏ toàn bộ quyền con."
        style={{ marginBottom: 16 }}
      />
      {loading ? (
        <Spin />
      ) : groups.length === 0 ? (
        <Empty description="Không có quyền có thể gán" />
      ) : (
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          {groups.map((group) => (
            <section key={group.name} aria-label={group.displayName}>
              <Typography.Title level={5}>{group.displayName}</Typography.Title>
              <Space direction="vertical">
                {group.permissions.map((permission) => {
                  const depth = permission.name.split(".").length - 2;
                  return (
                    <Checkbox
                      key={permission.name}
                      checked={granted.has(permission.name)}
                      style={{ marginLeft: Math.max(0, depth) * 18 }}
                      onChange={(event) =>
                        toggle(permission, event.target.checked)
                      }
                    >
                      {permission.displayName}
                    </Checkbox>
                  );
                })}
              </Space>
            </section>
          ))}
        </Space>
      )}
    </Drawer>
  );
}
