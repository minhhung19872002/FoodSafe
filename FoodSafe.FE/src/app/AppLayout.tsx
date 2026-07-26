import { useMemo, useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  Layout,
  Menu,
  Avatar,
  Dropdown,
  Breadcrumb,
  Drawer,
  Button,
  type MenuProps,
} from "antd";
import {
  DashboardOutlined,
  ApartmentOutlined,
  EnvironmentOutlined,
  UserOutlined,
  LogoutOutlined,
  KeyOutlined,
  SafetyCertificateOutlined,
  DatabaseOutlined,
  ShopOutlined,
  FileTextOutlined,
  SolutionOutlined,
  NotificationOutlined,
  GlobalOutlined,
  SettingOutlined,
  MenuOutlined,
  FileProtectOutlined,
  ExportOutlined,
} from "@ant-design/icons";
import { useAuthStore } from "@/features/auth/store/authStore";
import { useLogout } from "@/features/auth/api/authMutations";
import {
  SIDEBAR_WIDTH,
  SIDEBAR_COLLAPSED_WIDTH,
} from "@/theme/themeConfig";

const { Sider, Content } = Layout;

const BREADCRUMB_LABELS: Record<string, string> = {
  dashboard: "Bảng điều khiển",
  organizations: "Đơn vị",
  geography: "Địa bàn",
  catalogs: "Danh mục dùng chung",
  businesses: "Cơ sở và sản phẩm",
  "self-declarations": "Hồ sơ tự công bố",
  "product-registrations": "Đăng ký công bố sản phẩm",
  "advertisement-registrations": "Đăng ký quảng cáo",
  "eligibility-certificates": "Giấy đủ điều kiện ATTP",
  "cfs-certificates": "Chứng nhận CFS",
  "export-food-certificates": "GCN Xuất khẩu thực phẩm",
  administration: "Quản trị hệ thống",
  identity: "Tài khoản và quyền",
  account: "Tài khoản",
  "change-password": "Đổi mật khẩu",
};

interface NavItem {
  key: string;
  icon: React.ReactNode;
  label: string;
  permission?: string | string[];
}

interface NavGroup {
  key: string;
  label: string;
  children: NavItem[];
}

type NavEntry = NavItem | NavGroup;

const NAV_CONFIG: NavEntry[] = [
  {
    key: "/dashboard",
    icon: <DashboardOutlined />,
    label: "Bảng điều khiển",
  },
  {
    key: "system",
    label: "Quản trị hệ thống",
    children: [
      {
        key: "/administration/identity",
        icon: <SafetyCertificateOutlined />,
        label: "Tài khoản và quyền",
        permission: "FoodSafe.SystemAdministration",
      },
      {
        key: "/organizations",
        icon: <ApartmentOutlined />,
        label: "Đơn vị",
        permission: "FoodSafe.Organizations.View",
      },
      {
        key: "/geography",
        icon: <EnvironmentOutlined />,
        label: "Địa bàn",
        permission: "FoodSafe.GeographicCatalogs.View",
      },
      {
        key: "/catalogs",
        icon: <DatabaseOutlined />,
        label: "Danh mục dùng chung",
        permission: "FoodSafe.Catalogs.View",
      },
    ],
  },
  {
    key: "/businesses",
    icon: <ShopOutlined />,
    label: "Cơ sở và sản phẩm",
    permission: [
      "FoodSafe.BusinessManagement.Businesses.View",
      "FoodSafe.BusinessManagement.Products.View",
    ],
  },
  {
    key: "licensing",
    label: "Công bố và giấy phép",
    children: [
      {
        key: "/self-declarations",
        icon: <FileTextOutlined />,
        label: "Hồ sơ tự công bố",
        permission: "FoodSafe.BusinessManagement.SelfDeclarations.View",
      },
      {
        key: "/product-registrations",
        icon: <SolutionOutlined />,
        label: "Đăng ký công bố SP",
        permission: "FoodSafe.Licensing.ProductRegistrations.View",
      },
      {
        key: "/advertisement-registrations",
        icon: <NotificationOutlined />,
        label: "Đăng ký quảng cáo",
        permission: "FoodSafe.Licensing.AdRegistrations.View",
      },
      {
        key: "/eligibility-certificates",
        icon: <FileProtectOutlined />,
        label: "Giấy đủ ĐK ATTP",
        permission: "FoodSafe.Licensing.EligibilityCertificates.View",
      },
      {
        key: "/cfs-certificates",
        icon: <GlobalOutlined />,
        label: "Chứng nhận CFS",
        permission: "FoodSafe.Licensing.CfsCertificates.View",
      },
      {
        key: "/export-food-certificates",
        icon: <ExportOutlined />,
        label: "GCN Xuất khẩu",
        permission: "FoodSafe.Licensing.ExportCertificates.View",
      },
    ],
  },
];

function isNavGroup(entry: NavEntry): entry is NavGroup {
  return "children" in entry;
}

function hasItemPermission(
  item: NavItem,
  hasPermission: (p: string) => boolean,
): boolean {
  if (!item.permission) return true;
  if (Array.isArray(item.permission))
    return item.permission.some(hasPermission);
  return hasPermission(item.permission);
}

function buildMenuItems(
  hasPermission: (p: string) => boolean,
): MenuProps["items"] {
  const result: NonNullable<MenuProps["items"]> = [];

  for (const entry of NAV_CONFIG) {
    if (isNavGroup(entry)) {
      const children = entry.children.filter((child) =>
        hasItemPermission(child, hasPermission),
      );
      if (children.length === 0) continue;
      result.push({
        type: "group",
        key: entry.key,
        label: entry.label,
        children: children.map((child) => ({
          key: child.key,
          icon: child.icon,
          label: child.label,
        })),
      });
    } else {
      if (!hasItemPermission(entry, hasPermission)) continue;
      result.push({
        key: entry.key,
        icon: entry.icon,
        label: entry.label,
      });
    }
  }

  return result;
}

function buildBreadcrumbs(pathname: string) {
  const segments = pathname.split("/").filter(Boolean);
  const items = [
    { title: BREADCRUMB_LABELS[segments[0]] ?? "Trang chủ" },
  ];
  if (segments.length > 1) {
    items.push({
      title: BREADCRUMB_LABELS[segments[1]] ?? segments[1],
    });
  }
  return items;
}

export function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((s) => s.user);
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const logoutMutation = useLogout();

  const menuItems = useMemo(
    () => buildMenuItems(hasPermission),
    [hasPermission],
  );
  const breadcrumbItems = useMemo(
    () => buildBreadcrumbs(location.pathname),
    [location.pathname],
  );

  const handleMenuClick: MenuProps["onClick"] = ({ key }) => {
    navigate(key);
    setMobileOpen(false);
  };

  const userMenuItems: MenuProps["items"] = [
    {
      key: "user-info",
      label: user?.organizationName ?? "Phạm vi toàn hệ thống",
      disabled: true,
      style: { color: "rgba(0,0,0,0.45)", fontSize: 12 },
    },
    { type: "divider" },
    {
      key: "change-password",
      icon: <KeyOutlined />,
      label: "Đổi mật khẩu",
      onClick: () => navigate("/account/change-password"),
    },
    { type: "divider" },
    {
      key: "logout",
      icon: <LogoutOutlined />,
      label: "Đăng xuất",
      danger: true,
      onClick: () => logoutMutation.mutate(),
    },
  ];

  const sidebarContent = (
    <>
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <SettingOutlined />
        </div>
        <div className="sidebar-logo-text">
          <span className="sidebar-logo-title">FoodSafe</span>
          <span className="sidebar-logo-subtitle">An toàn thực phẩm</span>
        </div>
      </div>
      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={[location.pathname]}
        items={menuItems}
        onClick={handleMenuClick}
        style={{ borderRight: 0, paddingTop: 8 }}
      />
    </>
  );

  return (
    <Layout style={{ minHeight: "100vh" }}>
      {/* Desktop sidebar */}
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        theme="dark"
        width={SIDEBAR_WIDTH}
        collapsedWidth={SIDEBAR_COLLAPSED_WIDTH}
        className={collapsed ? "sidebar-collapsed" : ""}
        breakpoint="lg"
        onBreakpoint={(broken) => {
          if (broken) setCollapsed(true);
        }}
        style={{
          overflow: "auto",
          height: "100vh",
          position: "sticky",
          top: 0,
          left: 0,
        }}
        trigger={null}
      >
        {sidebarContent}
      </Sider>

      {/* Mobile drawer */}
      <Drawer
        placement="left"
        width={SIDEBAR_WIDTH}
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        styles={{ body: { padding: 0, background: "#001529" } }}
        closable={false}
      >
        {sidebarContent}
      </Drawer>

      <Layout>
        <header className="app-header">
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Button
              type="text"
              icon={<MenuOutlined />}
              onClick={() => {
                if (window.innerWidth < 992) {
                  setMobileOpen(true);
                } else {
                  setCollapsed(!collapsed);
                }
              }}
              style={{ fontSize: 16, width: 32, height: 32 }}
            />
            <Breadcrumb items={breadcrumbItems} />
          </div>

          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <div className="app-header-user">
              <Avatar
                size="small"
                icon={<UserOutlined />}
                style={{ backgroundColor: "#00796B" }}
              />
              <span style={{ fontSize: 13 }}>
                {user?.name ?? "Người dùng"}
              </span>
            </div>
          </Dropdown>
        </header>

        <Content style={{ margin: 16, minHeight: 280 }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
