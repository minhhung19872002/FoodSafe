import {
  DeleteOutlined,
  EditOutlined,
  ExportOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import { Button, Input, Popconfirm, Space, Table, Tabs, Tag } from "antd";
import type { TablePaginationConfig } from "antd";
import type { ColumnsType } from "antd/es/table";
import { catalogDefinitions } from "../types/catalog.types";
import type { CatalogItem, CatalogKind } from "../types/catalog.types";

interface MasterCatalogViewProps {
  kind: CatalogKind;
  filter: string;
  items: CatalogItem[];
  pagination: TablePaginationConfig;
  loading: boolean;
  deleting: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  exporting?: boolean;
  onKindChange: (kind: CatalogKind) => void;
  onFilterChange: (filter: string) => void;
  onCreate: () => void;
  onEdit: (item: CatalogItem) => void;
  onDelete: (id: string) => void;
  onExport?: () => void;
  onShowDetail: (item: CatalogItem) => void;
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
    { title: "Mã", dataIndex: "code", width: 140, ellipsis: true },
    { title: "Tên", dataIndex: "name", ellipsis: true },
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
                    size="small"
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
                      size="small"
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
      <Tabs
        activeKey={props.kind}
        onChange={(key) => props.onKindChange(key as CatalogKind)}
        items={catalogDefinitions.map((catalog) => ({
          key: catalog.kind,
          label: catalog.label,
        }))}
      />
      <div className="filter-toolbar" style={{ marginBottom: 16 }}>
        <Input.Search
          allowClear
          placeholder="Tìm theo mã hoặc tên"
          value={props.filter}
          onChange={(event) => props.onFilterChange(event.target.value)}
          style={{ width: 320 }}
        />
        {props.kind === "testing-service" && props.onExport && (
          <Button
            icon={<ExportOutlined />}
            loading={props.exporting}
            onClick={props.onExport}
          >
            Xuất Excel
          </Button>
        )}
        {props.canCreate && (
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={props.onCreate}
          >
            Thêm mới
          </Button>
        )}
      </div>
      <Table<CatalogItem>
        rowKey="id"
        size="middle"
        loading={props.loading}
        dataSource={props.items}
        columns={columns}
        onRow={(item) => ({
          onDoubleClick: () => props.onShowDetail(item),
          style: { cursor: "pointer" },
        })}
        pagination={props.pagination}
      />
    </>
  );
}
