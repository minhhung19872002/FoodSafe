import { useMemo } from "react";
import { Drawer, Empty, Spin, Table, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import { usePermissionMatrix } from "../api/identityQueries";
import type {
  PermissionOption,
  RolePermissionRow,
} from "../types/identity.types";

interface Props {
  open: boolean;
  onClose: () => void;
}

interface PermissionRow {
  key: string;
  name: string;
  displayName: string;
  depth: number;
  grants: Record<string, boolean>;
}

function buildRows(
  permissions: PermissionOption[],
  roles: RolePermissionRow[],
): PermissionRow[] {
  return permissions.map((p) => {
    const depth = p.name.split(".").length - 2;
    const grants: Record<string, boolean> = {};
    for (const role of roles) {
      grants[role.name] = role.grants[p.name] ?? false;
    }
    return {
      key: p.name,
      name: p.name,
      displayName: p.displayName,
      depth,
      grants,
    };
  });
}

export function PermissionMatrixDrawer({ open, onClose }: Props) {
  const { data, isLoading } = usePermissionMatrix(open);

  const rows = useMemo(
    () => (data ? buildRows(data.permissions, data.roles) : []),
    [data],
  );

  const columns = useMemo<ColumnsType<PermissionRow>>(() => {
    if (!data) return [];
    return [
      {
        title: "Quyền",
        dataIndex: "displayName",
        width: 280,
        fixed: "left" as const,
        render: (text: string, row: PermissionRow) => (
          <span style={{ paddingLeft: row.depth * 16 }}>{text}</span>
        ),
      },
      ...data.roles.map((role) => ({
        title: role.name,
        dataIndex: ["grants", role.name],
        width: 110,
        align: "center" as const,
        render: (granted: boolean) =>
          granted ? (
            <Tag color="green">Co</Tag>
          ) : (
            <span style={{ color: "#ccc" }}>—</span>
          ),
      })),
    ];
  }, [data]);

  return (
    <Drawer
      title="Ma tran quyen theo vai tro"
      open={open}
      onClose={onClose}
      width={Math.min(
        280 + (data?.roles.length ?? 0) * 110 + 48,
        window.innerWidth - 40,
      )}
    >
      {isLoading ? (
        <div style={{ textAlign: "center", padding: 64 }}>
          <Spin size="large" />
        </div>
      ) : rows.length === 0 ? (
        <Empty description="Khong co du lieu" />
      ) : (
        <Table
          dataSource={rows}
          columns={columns}
          rowKey="key"
          size="small"
          pagination={false}
          scroll={{ x: 280 + (data?.roles.length ?? 0) * 110, y: "70vh" }}
          bordered
        />
      )}
    </Drawer>
  );
}
