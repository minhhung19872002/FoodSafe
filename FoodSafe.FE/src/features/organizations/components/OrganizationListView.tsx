import { Button, Empty, Input, Select, Space, Table, Tag, Tree } from "antd";
import type { TablePaginationConfig } from "antd";
import {
  ClearOutlined,
  DeleteOutlined,
  EditOutlined,
  ExportOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import type { DataNode } from "antd/es/tree";
import { RowActions } from "@/components/RowActions";
import {
  getOrganizationLevelConfig,
  organizationLevelConfig,
} from "./organizationConfig";
import type {
  OrganizationDto,
  OrganizationLevel,
  OrganizationTreeNode,
} from "../types/organization.types";

interface ParentOption {
  id: string;
  name: string;
  level: OrganizationLevel;
}

interface Props {
  items: OrganizationDto[];
  treeItems: OrganizationTreeNode[];
  loading: boolean;
  pagination: TablePaginationConfig;
  filter: string;
  level?: OrganizationLevel;
  isActive?: boolean;
  parentId?: string;
  parentOptions: ParentOption[];
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  deletingId?: string;
  exporting: boolean;
  onExport: () => void;
  onFilterChange: (value: string) => void;
  onLevelChange: (value?: OrganizationLevel) => void;
  onIsActiveChange: (value?: boolean) => void;
  onParentIdChange: (value?: string) => void;
  onRefresh: () => void;
  onResetFilters: () => void;
  onCreate: () => void;
  onEdit: (organization: OrganizationDto) => void;
  onDelete: (organization: OrganizationDto) => void;
  onShowDetail: (organization: OrganizationDto) => void;
}

function toTreeData(items: OrganizationTreeNode[]): DataNode[] {
  return items.map((item) => ({
    key: item.id,
    title: (
      <Space>
        <span>{item.name}</span>
        <Tag>{item.code}</Tag>
        {!item.isActive && <Tag color="default">Ngừng hoạt động</Tag>}
      </Space>
    ),
    children: toTreeData(item.children),
  }));
}

export function OrganizationListView({
  items,
  treeItems,
  loading,
  pagination,
  filter,
  level,
  isActive,
  parentId,
  parentOptions,
  canCreate,
  canEdit,
  canDelete,
  deletingId,
  exporting,
  onExport,
  onFilterChange,
  onLevelChange,
  onIsActiveChange,
  onParentIdChange,
  onRefresh,
  onResetFilters,
  onCreate,
  onEdit,
  onDelete,
  onShowDetail,
}: Props) {
  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      <div className="filter-toolbar" style={{ marginBottom: 16 }}>
        <Input
          allowClear
          prefix={<SearchOutlined />}
          placeholder="Tìm theo mã hoặc tên đơn vị"
          value={filter}
          onChange={(event) => onFilterChange(event.target.value)}
          style={{ width: 320 }}
        />
        <Select
          allowClear
          placeholder="Tất cả cấp"
          value={level}
          onChange={onLevelChange}
          style={{ width: 160 }}
          options={Object.entries(organizationLevelConfig).map(
            ([value, config]) => ({
              value: Number(value),
              label: config.label,
            }),
          )}
        />
        <Select
          allowClear
          placeholder="Trạng thái"
          value={isActive}
          onChange={onIsActiveChange}
          style={{ width: 170 }}
          options={[
            { value: true, label: "Hoạt động" },
            { value: false, label: "Ngừng hoạt động" },
          ]}
        />
        <Select
          allowClear
          showSearch
          optionFilterProp="label"
          placeholder="Đơn vị cha"
          value={parentId}
          onChange={onParentIdChange}
          style={{ width: 220 }}
          options={parentOptions.map((o) => ({
            value: o.id,
            label: o.name,
          }))}
        />
        <Button icon={<ClearOutlined />} onClick={onResetFilters}>
          Đặt lại bộ lọc
        </Button>
        <Button icon={<ReloadOutlined />} onClick={onRefresh}>
          Làm mới
        </Button>
        <Button
          icon={<ExportOutlined />}
          loading={exporting}
          onClick={onExport}
        >
          Xuất Excel
        </Button>
        {canCreate && (
          <Button type="primary" icon={<PlusOutlined />} onClick={onCreate}>
            Thêm đơn vị
          </Button>
        )}
      </div>

      <Table<OrganizationDto>
        rowKey="id"
        loading={loading}
        dataSource={items}
        size="middle"
        scroll={{ x: 800 }}
        onRow={(organization) => ({
          onDoubleClick: () => onShowDetail(organization),
          style: { cursor: "pointer" },
        })}
        pagination={pagination}
        columns={[
          { title: "Mã", dataIndex: "code", width: 130, ellipsis: true },
          { title: "Tên đơn vị", dataIndex: "name", ellipsis: true },
          {
            title: "Cấp",
            dataIndex: "level",
            width: 130,
            render: (value: OrganizationLevel) => {
              const config = getOrganizationLevelConfig(value);
              return <Tag color={config.color}>{config.label}</Tag>;
            },
          },
          {
            title: "Điện thoại",
            dataIndex: "phone",
            width: 150,
            ellipsis: true,
          },
          {
            title: "Trạng thái",
            dataIndex: "isActive",
            width: 140,
            render: (active: boolean) => (
              <Tag color={active ? "success" : "default"}>
                {active ? "Hoạt động" : "Ngừng hoạt động"}
              </Tag>
            ),
          },
          ...(canEdit || canDelete
            ? [
                {
                  title: "Thao tác",
                  key: "actions",
                  width: 96,
                  fixed: "right" as const,
                  render: (_: unknown, organization: OrganizationDto) => (
                    <RowActions
                      overflowAriaLabel={`Thao tác ${organization.name}`}
                      actions={[
                        {
                          key: "edit",
                          label: "Sửa",
                          ariaLabel: `Sửa ${organization.name}`,
                          icon: <EditOutlined />,
                          hidden: !canEdit,
                          onClick: () => onEdit(organization),
                        },
                        {
                          key: "delete",
                          label: "Xóa",
                          ariaLabel: `Xóa ${organization.name}`,
                          icon: <DeleteOutlined />,
                          danger: true,
                          hidden: !canDelete,
                          disabled: deletingId === organization.id,
                          confirm: "Xóa đơn vị?",
                          onClick: () => onDelete(organization),
                        },
                      ]}
                    />
                  ),
                },
              ]
            : []),
        ]}
      />

      <section aria-labelledby="organization-tree-title">
        <h2 id="organization-tree-title" style={{ fontSize: 18 }}>
          Cây đơn vị
        </h2>
        {treeItems.length > 0 ? (
          <Tree defaultExpandAll treeData={toTreeData(treeItems)} />
        ) : (
          <Empty description="Chưa có dữ liệu cây đơn vị" />
        )}
      </section>
    </Space>
  );
}
