import {
  Button,
  Empty,
  Input,
  Popconfirm,
  Select,
  Space,
  Table,
  Tag,
  Tree,
} from "antd";
import {
  DeleteOutlined,
  EditOutlined,
  ExportOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import type { DataNode } from "antd/es/tree";
import { organizationLevelConfig } from "./organizationConfig";
import type {
  OrganizationDto,
  OrganizationLevel,
  OrganizationTreeNode,
} from "../types/organization.types";

interface Props {
  items: OrganizationDto[];
  treeItems: OrganizationTreeNode[];
  totalCount: number;
  loading: boolean;
  page: number;
  pageSize: number;
  filter: string;
  level?: OrganizationLevel;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  deletingId?: string;
  exporting: boolean;
  onExport: () => void;
  onFilterChange: (value: string) => void;
  onLevelChange: (value?: OrganizationLevel) => void;
  onPageChange: (page: number, pageSize: number) => void;
  onRefresh: () => void;
  onCreate: () => void;
  onEdit: (organization: OrganizationDto) => void;
  onDelete: (organization: OrganizationDto) => void;
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
  totalCount,
  loading,
  page,
  pageSize,
  filter,
  level,
  canCreate,
  canEdit,
  canDelete,
  deletingId,
  exporting,
  onExport,
  onFilterChange,
  onLevelChange,
  onPageChange,
  onRefresh,
  onCreate,
  onEdit,
  onDelete,
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
        pagination={{
          current: page,
          pageSize,
          total: totalCount,
          showSizeChanger: true,
          showTotal: (total) => `${total} bản ghi`,
          onChange: onPageChange,
        }}
        columns={[
          { title: "Mã", dataIndex: "code", width: 130, ellipsis: true },
          { title: "Tên đơn vị", dataIndex: "name", ellipsis: true },
          {
            title: "Cấp",
            dataIndex: "level",
            width: 130,
            render: (value: OrganizationLevel) => {
              const config = organizationLevelConfig[value];
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
                  width: 130,
                  render: (_: unknown, organization: OrganizationDto) => (
                    <Space>
                      {canEdit && (
                        <Button
                          type="text"
                          size="small"
                          aria-label={`Sửa ${organization.name}`}
                          icon={<EditOutlined />}
                          onClick={() => onEdit(organization)}
                        />
                      )}
                      {canDelete && (
                        <Popconfirm
                          title="Xóa đơn vị?"
                          description={`Bạn chắc chắn muốn xóa "${organization.name}"?`}
                          okText="Xóa"
                          cancelText="Hủy"
                          okButtonProps={{ danger: true }}
                          onConfirm={() => onDelete(organization)}
                        >
                          <Button
                            type="text"
                            danger
                            size="small"
                            loading={deletingId === organization.id}
                            aria-label={`Xóa ${organization.name}`}
                            icon={<DeleteOutlined />}
                          />
                        </Popconfirm>
                      )}
                    </Space>
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
