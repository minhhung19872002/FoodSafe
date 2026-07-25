import { DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";
import {
  Button,
  Input,
  Popconfirm,
  Space,
  Table,
  Tabs,
  Tag,
  Typography,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { catalogDefinitions } from "../types/catalog.types";
import type { CatalogItem, CatalogKind } from "../types/catalog.types";

interface MasterCatalogViewProps {
  kind: CatalogKind;
  filter: string;
  items: CatalogItem[];
  totalCount: number;
  loading: boolean;
  deleting: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  onKindChange: (kind: CatalogKind) => void;
  onFilterChange: (filter: string) => void;
  onCreate: () => void;
  onEdit: (item: CatalogItem) => void;
  onDelete: (id: string) => void;
}

function buildColumns({
  kind,
  canEdit,
  canDelete,
  deleting,
  onEdit,
  onDelete,
}: Pick<
  MasterCatalogViewProps,
  "kind" | "canEdit" | "canDelete" | "deleting" | "onEdit" | "onDelete"
>): ColumnsType<CatalogItem> {
  return [
    { title: "Mã", dataIndex: "code", width: 140 },
    { title: "Tên", dataIndex: "name" },
    ...(kind === "business-classification"
      ? [
          {
            title: "Rủi ro",
            dataIndex: "riskLevel",
            width: 120,
            render: (value: number) => ["", "Cao", "Trung bình", "Thấp"][value],
          },
        ]
      : []),
    ...(kind === "product-group"
      ? [{ title: "Cấp", dataIndex: "level", width: 80 }]
      : []),
    ...(kind === "testing-service"
      ? [
          {
            title: "Đơn giá",
            dataIndex: "price",
            width: 140,
            render: (value: number | undefined) =>
              value?.toLocaleString("vi-VN"),
          },
        ]
      : []),
    {
      title: "Trạng thái",
      dataIndex: "isActive",
      width: 130,
      render: (active: boolean) => (
        <Tag color={active ? "success" : "default"}>
          {active ? "Hoạt động" : "Ngừng"}
        </Tag>
      ),
    },
    ...(canEdit || canDelete
      ? [
          {
            title: "Thao tác",
            key: "actions",
            width: 120,
            render: (_: unknown, item: CatalogItem) => (
              <Space>
                {canEdit && (
                  <Button
                    type="text"
                    aria-label={`Sửa ${item.name}`}
                    icon={<EditOutlined />}
                    onClick={() => onEdit(item)}
                  />
                )}
                {canDelete && (
                  <Popconfirm
                    title="Xóa dữ liệu này?"
                    okText="Xóa"
                    cancelText="Hủy"
                    onConfirm={() => onDelete(item.id)}
                  >
                    <Button
                      type="text"
                      danger
                      loading={deleting}
                      aria-label={`Xóa ${item.name}`}
                      icon={<DeleteOutlined />}
                    />
                  </Popconfirm>
                )}
              </Space>
            ),
          },
        ]
      : []),
  ];
}

export function MasterCatalogView(props: MasterCatalogViewProps) {
  const columns = buildColumns(props);

  return (
    <>
      <Typography.Title level={2}>Danh mục dùng chung</Typography.Title>
      <Typography.Paragraph type="secondary">
        Quản lý dữ liệu chuẩn dùng xuyên suốt các nghiệp vụ an toàn thực phẩm.
      </Typography.Paragraph>
      <Tabs
        activeKey={props.kind}
        onChange={(key) => props.onKindChange(key as CatalogKind)}
        items={catalogDefinitions.map((catalog) => ({
          key: catalog.kind,
          label: catalog.label,
        }))}
      />
      <Space style={{ marginBottom: 16 }}>
        <Input.Search
          allowClear
          placeholder="Tìm theo mã hoặc tên"
          value={props.filter}
          onChange={(event) => props.onFilterChange(event.target.value)}
          style={{ width: 320 }}
        />
        {props.canCreate && (
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={props.onCreate}
          >
            Thêm mới
          </Button>
        )}
      </Space>
      <Table<CatalogItem>
        rowKey="id"
        loading={props.loading}
        dataSource={props.items}
        columns={columns}
        pagination={{ total: props.totalCount, pageSize: 100 }}
      />
    </>
  );
}
