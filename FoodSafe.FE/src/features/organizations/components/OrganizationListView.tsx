import { Button, Empty, Input, Select, Space, Table, Tag, Tree } from 'antd'
import { PlusOutlined, ReloadOutlined, SearchOutlined } from '@ant-design/icons'
import type { DataNode } from 'antd/es/tree'
import { organizationLevelConfig } from './organizationConfig'
import type {
  OrganizationDto,
  OrganizationLevel,
  OrganizationTreeNode,
} from '../types/organization.types'

interface Props {
  items: OrganizationDto[]
  treeItems: OrganizationTreeNode[]
  totalCount: number
  loading: boolean
  page: number
  pageSize: number
  filter: string
  level?: OrganizationLevel
  canCreate: boolean
  onFilterChange: (value: string) => void
  onLevelChange: (value?: OrganizationLevel) => void
  onPageChange: (page: number, pageSize: number) => void
  onRefresh: () => void
  onCreate: () => void
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
  }))
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
  onFilterChange,
  onLevelChange,
  onPageChange,
  onRefresh,
  onCreate,
}: Props) {
  return (
    <Space orientation="vertical" size="large" style={{ width: '100%' }}>
      <Space wrap>
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
          options={Object.entries(organizationLevelConfig).map(([value, config]) => ({
            value: Number(value),
            label: config.label,
          }))}
        />
        <Button icon={<ReloadOutlined />} onClick={onRefresh}>
          Làm mới
        </Button>
        {canCreate && (
          <Button type="primary" icon={<PlusOutlined />} onClick={onCreate}>
            Thêm đơn vị
          </Button>
        )}
      </Space>

      <Table<OrganizationDto>
        rowKey="id"
        loading={loading}
        dataSource={items}
        pagination={{
          current: page,
          pageSize,
          total: totalCount,
          showSizeChanger: true,
          showTotal: (total) => `${total} đơn vị`,
          onChange: onPageChange,
        }}
        columns={[
          { title: 'Mã', dataIndex: 'code', width: 130 },
          { title: 'Tên đơn vị', dataIndex: 'name' },
          {
            title: 'Cấp',
            dataIndex: 'level',
            width: 130,
            render: (value: OrganizationLevel) => {
              const config = organizationLevelConfig[value]
              return <Tag color={config.color}>{config.label}</Tag>
            },
          },
          { title: 'Điện thoại', dataIndex: 'phone', width: 150 },
          {
            title: 'Trạng thái',
            dataIndex: 'isActive',
            width: 140,
            render: (active: boolean) => (
              <Tag color={active ? 'success' : 'default'}>
                {active ? 'Hoạt động' : 'Ngừng hoạt động'}
              </Tag>
            ),
          },
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
  )
}
