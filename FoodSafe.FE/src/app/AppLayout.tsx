import { useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import {
  Layout,
  Menu,
  Avatar,
  Dropdown,
  Breadcrumb,
  theme,
  type MenuProps,
} from 'antd'
import {
  DashboardOutlined,
  ShopOutlined,
  AuditOutlined,
  AlertOutlined,
  FileTextOutlined,
  BookOutlined,
  SettingOutlined,
  ApartmentOutlined,
  UserOutlined,
  LogoutOutlined,
  KeyOutlined,
} from '@ant-design/icons'
import { useAuthStore } from '@/features/auth/store/authStore'
import { useLogout } from '@/features/auth/api/authMutations'

const { Header, Sider, Content } = Layout

const menuItems: MenuProps['items'] = [
  {
    key: '/dashboard',
    icon: <DashboardOutlined />,
    label: 'Bảng điều khiển',
  },
  {
    key: '/organizations',
    icon: <ApartmentOutlined />,
    label: 'Đơn vị',
  },
  {
    key: 'businesses',
    icon: <ShopOutlined />,
    label: 'Quản lý cơ sở',
    children: [
      { key: '/businesses', label: 'Danh sách cơ sở' },
      { key: '/businesses/products', label: 'Sản phẩm' },
    ],
  },
  {
    key: 'inspection',
    icon: <AuditOutlined />,
    label: 'Thanh kiểm tra',
    children: [
      { key: '/inspection/plans', label: 'Kế hoạch' },
      { key: '/inspection/results', label: 'Kết quả' },
    ],
  },
  {
    key: 'food-poisoning',
    icon: <AlertOutlined />,
    label: 'Ngộ độc thực phẩm',
    children: [
      { key: '/food-poisoning/cases', label: 'Ca ngộ độc' },
      { key: '/food-poisoning/incidents', label: 'Vụ ngộ độc' },
    ],
  },
  {
    key: 'reporting',
    icon: <FileTextOutlined />,
    label: 'Báo cáo',
    children: [
      { key: '/reporting/ndtp', label: 'Báo cáo NĐTP' },
      { key: '/reporting/attp-work', label: 'Công tác ATTP' },
    ],
  },
  {
    key: 'catalogs',
    icon: <BookOutlined />,
    label: 'Danh mục',
    children: [
      { key: '/catalogs/business-types', label: 'Loại hình cơ sở' },
      { key: '/catalogs/product-groups', label: 'Nhóm sản phẩm' },
    ],
  },
  {
    key: 'administration',
    icon: <SettingOutlined />,
    label: 'Quản trị',
    children: [
      { key: '/admin/users', label: 'Người dùng' },
      { key: '/admin/roles', label: 'Vai trò' },
      { key: '/admin/audit-log', label: 'Nhật ký thao tác' },
    ],
  },
]

export function AppLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const user = useAuthStore((s) => s.user)
  const { token: { colorBgContainer, borderRadiusLG } } = theme.useToken()
  const logoutMutation = useLogout()

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'change-password',
      icon: <KeyOutlined />,
      label: 'Đổi mật khẩu',
      onClick: () => navigate('/account/change-password'),
    },
    { type: 'divider' },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Đăng xuất',
      danger: true,
      onClick: () => logoutMutation.mutate(),
    },
  ]

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        theme="dark"
        width={240}
      >
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: collapsed ? 14 : 16,
            fontWeight: 700,
            padding: '0 16px',
            background: 'rgba(255,255,255,0.05)',
            margin: 8,
            borderRadius: 8,
          }}
        >
          {collapsed ? 'FS' : 'FoodSafe'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          defaultOpenKeys={['businesses', 'inspection']}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>

      <Layout>
        <Header
          style={{
            background: colorBgContainer,
            padding: '0 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
          }}
        >
          <Breadcrumb
            items={[
              { title: 'Chi cục ATVSTP Quảng Ninh' },
              { title: location.pathname.split('/')[1] || 'Trang chủ' },
            ]}
          />

          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Avatar icon={<UserOutlined />} style={{ backgroundColor: '#1677ff' }} />
              <span>{user?.name ?? 'Người dùng'}</span>
            </div>
          </Dropdown>
        </Header>

        <Content
          style={{
            margin: '16px',
            padding: 24,
            background: colorBgContainer,
            borderRadius: borderRadiusLG,
            minHeight: 280,
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}
