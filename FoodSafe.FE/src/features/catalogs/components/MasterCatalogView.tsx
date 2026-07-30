import {
  DeleteOutlined,
  EditOutlined,
  ExportOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import { Button, Input, Table, Tabs, Tag } from "antd";
import type { TablePaginationConfig } from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import { RefreshListButton } from "@/components/RefreshListButton";
import { RowActions } from "@/components/RowActions";
import { catalogDefinitions } from "../types/catalog.types";
import type { CatalogItem, CatalogKind } from "../types/catalog.types";

interface GeographyOption {
  id: string;
  name: string;
}

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
  productGroupOptions: CatalogItem[];
  testingCenterOptions: CatalogItem[];
  provinceOptions: GeographyOption[];
  onKindChange: (kind: CatalogKind) => void;
  onFilterChange: (filter: string) => void;
  onRefresh: () => void;
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
  productGroupOptions,
  testingCenterOptions,
  provinceOptions,
  onEdit,
  onDelete,
}: Pick<
  MasterCatalogViewProps,
  | "kind"
  | "canEdit"
  | "canDelete"
  | "deleting"
  | "productGroupOptions"
  | "testingCenterOptions"
  | "provinceOptions"
  | "onEdit"
  | "onDelete"
>): ColumnsType<CatalogItem> {
  return [
    {
      title: kind === "country" ? "Mã ISO Alpha-2" : "Mã",
      dataIndex: "code",
      width: kind === "country" ? 130 : 140,
      ellipsis: true,
    },
    ...(kind === "country"
      ? [
          {
            title: "Mã ISO Alpha-3",
            dataIndex: "codeAlpha3",
            width: 130,
            ellipsis: true,
          },
          {
            title: "Tên tiếng Anh",
            dataIndex: "nameEn",
            ellipsis: true,
          },
        ]
      : []),
    {
      title: kind === "country" ? "Tên tiếng Việt" : "Tên",
      dataIndex: "name",
      ellipsis: true,
    },
    ...(kind === "business-classification"
      ? [
          {
            title: "Rủi ro",
            dataIndex: "riskLevel",
            width: 120,
            render: (value: number) => ["", "Cao", "Trung bình", "Thấp"][value],
          },
          {
            title: "Tiêu chí phân loại",
            dataIndex: "criteria",
            ellipsis: true,
          },
        ]
      : []),
    ...(kind === "product-group"
      ? [
          { title: "Cấp", dataIndex: "level", width: 80 },
          {
            title: "Nhóm cha",
            dataIndex: "parentId",
            ellipsis: true,
            render: (parentId: string | undefined) =>
              productGroupOptions.find((group) => group.id === parentId)
                ?.name ?? "—",
          },
        ]
      : []),
    ...(kind === "testing-center"
      ? [
          { title: "Địa chỉ", dataIndex: "address", ellipsis: true },
          {
            title: "Tỉnh/Thành",
            dataIndex: "provinceId",
            ellipsis: true,
            render: (provinceId: string | undefined) =>
              provinceOptions.find((province) => province.id === provinceId)
                ?.name ?? "—",
          },
          {
            title: "Người liên hệ",
            dataIndex: "contactPerson",
            ellipsis: true,
          },
          { title: "Điện thoại", dataIndex: "phone", width: 130 },
          {
            title: "Số công nhận",
            dataIndex: "accreditationNumber",
            ellipsis: true,
          },
          {
            title: "Hết hạn công nhận",
            dataIndex: "accreditationExpiresAt",
            width: 140,
            render: (value: string | undefined) =>
              value ? dayjs(value).format("DD/MM/YYYY") : "—",
          },
        ]
      : []),
    ...(kind === "testing-service"
      ? [
          {
            title: "Trung tâm kiểm nghiệm",
            dataIndex: "testingCenterId",
            ellipsis: true,
            render: (testingCenterId: string | undefined) =>
              testingCenterOptions.find(
                (center) => center.id === testingCenterId,
              )?.name ?? "—",
          },
          { title: "Đơn vị", dataIndex: "unit", width: 110 },
          { title: "Phương pháp", dataIndex: "method", ellipsis: true },
          {
            title: "Đơn giá",
            dataIndex: "price",
            width: 140,
            render: (value: number | undefined) =>
              value?.toLocaleString("vi-VN"),
          },
          {
            title: "TG trả kết quả",
            dataIndex: "turnaroundDays",
            width: 130,
            render: (value: number | undefined) =>
              value !== undefined ? `${value} ngày` : "—",
          },
        ]
      : []),
    ...(kind !== "country"
      ? [{ title: "Mô tả", dataIndex: "description", ellipsis: true }]
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
            width: 96,
            render: (_: unknown, item: CatalogItem) => (
              <RowActions
                overflowAriaLabel={`Thao tác ${item.name}`}
                actions={[
                  {
                    key: "edit",
                    label: "Sửa",
                    ariaLabel: `Sửa ${item.name}`,
                    icon: <EditOutlined />,
                    hidden: !canEdit,
                    onClick: () => onEdit(item),
                  },
                  {
                    key: "delete",
                    label: "Xóa",
                    ariaLabel: `Xóa ${item.name}`,
                    icon: <DeleteOutlined />,
                    danger: true,
                    hidden: !canDelete,
                    disabled: deleting,
                    confirm: "Xóa dữ liệu này?",
                    onClick: () => onDelete(item.id),
                  },
                ]}
              />
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
        <RefreshListButton loading={props.loading} onClick={props.onRefresh} />
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
        scroll={{ x: "max-content" }}
        onRow={(item) => ({
          onDoubleClick: () => props.onShowDetail(item),
          style: { cursor: "pointer" },
        })}
        pagination={props.pagination}
      />
    </>
  );
}
