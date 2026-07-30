import { useMemo, useState } from "react";
import { Link, Outlet, useNavigate, useLocation } from "react-router-dom";
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
  UserOutlined,
  LogoutOutlined,
  KeyOutlined,
  MenuOutlined,
  DownOutlined,
} from "@ant-design/icons";
import { GlobalSearchBox } from "@/features/global-search/components/GlobalSearchBox";
import { NotificationBell } from "@/features/notifications/components/NotificationBell";
import { useAuthStore } from "@/features/auth/store/authStore";
import { avatarUrl } from "@/features/auth/api/profileApi";
import { useLogout } from "@/features/auth/api/authMutations";
import { ROUTE_PERMISSIONS } from "./routePermissions";
import {
  brandingLogoUrl,
  defaultBrandingLogoUrl,
  useBranding,
} from "@/hooks/useBranding";
import {
  SIDEBAR_WIDTH,
  SIDEBAR_COLLAPSED_WIDTH,
  brand,
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
  "vsattp-commitments": "Cam kết VSATTP",
  "cfs-certificates": "Chứng nhận CFS",
  "export-food-certificates": "GCN Xuất khẩu thực phẩm",
  inspection: "Thanh tra - Kiểm tra ATTP",
  "alerts-news": "Cảnh báo và Tin tức",
  "food-poisoning": "Ngộ độc thực phẩm",
  reporting: "Báo cáo",
  statistics: "Thống kê tổng hợp",
  "audit-logs": "Nhật ký hoạt động",
  settings: "Cấu hình hệ thống",
  "risk-analysis": "Phân tích nguy cơ",
  "testing-results": "Kết quả kiểm nghiệm",
  documents: "Văn bản pháp quy",
  "data-integration": "Tích hợp dữ liệu",
  administration: "Quản trị hệ thống",
  identity: "Tài khoản và quyền",
  account: "Tài khoản",
  "change-password": "Đổi mật khẩu",
};

interface NavItem {
  key: string;
  icon: React.ReactNode;
  label: string;
  permission?: string | readonly string[];
}

interface NavGroup {
  key: string;
  label: string;
  children: NavItem[];
}

type NavEntry = NavItem | NavGroup;

/**
 * Icon điều hướng dạng ký tự như trong bản thiết kế. Nhãn chữ nằm ngay cạnh
 * nên icon được ẩn khỏi trình đọc màn hình để tránh đọc lặp.
 */
function navIcon(glyph: string) {
  return (
    <span className="nav-icon" aria-hidden="true">
      {glyph}
    </span>
  );
}

const NAV_CONFIG: NavEntry[] = [
  {
    key: "overview",
    label: "Tổng quan",
    children: [
      { key: "/dashboard", icon: navIcon("📊"), label: "Bảng điều khiển" },
      { key: "/statistics", icon: navIcon("📈"), label: "Thống kê tổng hợp" },
    ],
  },
  {
    key: "licensing",
    label: "Cơ sở & giấy phép",
    children: [
      {
        key: "/businesses",
        icon: navIcon("🏭"),
        label: "Cơ sở và sản phẩm",
        permission: ROUTE_PERMISSIONS.businesses,
      },
      {
        key: "/self-declarations",
        icon: navIcon("📄"),
        label: "Hồ sơ tự công bố",
        permission: ROUTE_PERMISSIONS.selfDeclarations,
      },
      {
        key: "/product-registrations",
        icon: navIcon("✅"),
        label: "Đăng ký công bố SP",
        permission: ROUTE_PERMISSIONS.productRegistrations,
      },
      {
        key: "/advertisement-registrations",
        icon: navIcon("📣"),
        label: "Đăng ký quảng cáo",
        permission: ROUTE_PERMISSIONS.adRegistrations,
      },
      {
        key: "/eligibility-certificates",
        icon: navIcon("📋"),
        label: "Giấy đủ ĐK ATTP",
        permission: ROUTE_PERMISSIONS.eligibilityCertificates,
      },
      {
        key: "/vsattp-commitments",
        icon: navIcon("✍️"),
        label: "Cam kết VSATTP",
        permission: ROUTE_PERMISSIONS.vsattpCommitments,
      },
      {
        key: "/cfs-certificates",
        icon: navIcon("🌐"),
        label: "Chứng nhận CFS",
        permission: ROUTE_PERMISSIONS.cfsCertificates,
      },
      {
        key: "/export-food-certificates",
        icon: navIcon("🚢"),
        label: "GCN Xuất khẩu",
        permission: ROUTE_PERMISSIONS.exportCertificates,
      },
    ],
  },
  {
    key: "operations",
    label: "Nghiệp vụ",
    children: [
      {
        key: "/inspection",
        icon: navIcon("🔍"),
        label: "Thanh tra - Kiểm tra",
        permission: ROUTE_PERMISSIONS.inspection,
      },
      {
        key: "/food-poisoning",
        icon: navIcon("🚑"),
        label: "Ngộ độc thực phẩm",
        permission: ROUTE_PERMISSIONS.foodPoisoning,
      },
      {
        key: "/alerts-news",
        icon: navIcon("📢"),
        label: "Cảnh báo và Tin tức",
        permission: ROUTE_PERMISSIONS.alertsNews,
      },
      {
        key: "/risk-analysis",
        icon: navIcon("⚖️"),
        label: "Phân tích nguy cơ",
        permission: ROUTE_PERMISSIONS.riskAnalysis,
      },
      {
        key: "/testing-results",
        icon: navIcon("🧪"),
        label: "Kết quả kiểm nghiệm",
        permission: ROUTE_PERMISSIONS.testingResults,
      },
      {
        key: "/documents",
        icon: navIcon("📚"),
        label: "Văn bản pháp quy",
        permission: ROUTE_PERMISSIONS.documents,
      },
      {
        key: "/reporting",
        icon: navIcon("🗂️"),
        label: "Báo cáo",
        permission: ROUTE_PERMISSIONS.reporting,
      },
    ],
  },
  {
    key: "system",
    label: "Quản trị hệ thống",
    children: [
      {
        key: "/administration/identity",
        icon: navIcon("🛡️"),
        label: "Tài khoản và quyền",
        permission: ROUTE_PERMISSIONS.identity,
      },
      {
        key: "/organizations",
        icon: navIcon("🏛"),
        label: "Đơn vị",
        permission: ROUTE_PERMISSIONS.organizations,
      },
      {
        key: "/geography",
        icon: navIcon("🗺️"),
        label: "Địa bàn",
        permission: ROUTE_PERMISSIONS.geography,
      },
      {
        key: "/catalogs",
        icon: navIcon("🗃️"),
        label: "Danh mục dùng chung",
        permission: ROUTE_PERMISSIONS.catalogs,
      },
      {
        key: "/data-integration",
        icon: navIcon("🔌"),
        label: "Tích hợp dữ liệu",
        permission: ROUTE_PERMISSIONS.dataIntegration,
      },
      {
        key: "/administration/audit-logs",
        icon: navIcon("📝"),
        label: "Nhật ký hoạt động",
        permission: ROUTE_PERMISSIONS.auditLogs,
      },
      {
        key: "/administration/settings",
        icon: navIcon("⚙️"),
        label: "Cấu hình hệ thống",
        permission: ROUTE_PERMISSIONS.settings,
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
  const required =
    typeof item.permission === "string" ? [item.permission] : item.permission;
  return required.some(hasPermission);
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

/** Viết tắt tên cán bộ cho avatar, ví dụ "Nguyễn Thị Hòa" → "NH". */
function initialsOf(name: string | undefined): string {
  const words = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "FS";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

function buildBreadcrumbs(pathname: string) {
  const segments = pathname.split("/").filter(Boolean);
  const items = [{ title: BREADCRUMB_LABELS[segments[0]] ?? "Trang chủ" }];
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
  const avatarVersion = useAuthStore((s) => s.avatarVersion);
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const logoutMutation = useLogout();
  const branding = useBranding();

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
      key: "profile",
      icon: <UserOutlined />,
      label: "Thông tin cá nhân",
      onClick: () => navigate("/account/profile"),
    },
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
      <Link
        to="/dashboard"
        className="sidebar-logo"
        aria-label="Về trang chủ"
        onClick={() => setMobileOpen(false)}
      >
        <img
          src={
            branding.data?.hasLogo ? brandingLogoUrl : defaultBrandingLogoUrl
          }
          alt="Logo FoodSafe"
          className="sidebar-logo-image"
        />
        <div className="sidebar-logo-text">
          <span className="sidebar-logo-title">FoodSafe</span>
          <span className="sidebar-logo-subtitle">Quản lý ATTP Quảng Ninh</span>
        </div>
      </Link>
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
        styles={{ body: { padding: 0, background: brand.ink } }}
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

          <div className="app-header-actions">
            <GlobalSearchBox />

            <NotificationBell />

            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <div className="app-header-user">
                <Avatar
                  size={32}
                  src={`${avatarUrl}?v=${avatarVersion}`}
                  style={{
                    backgroundColor: brand.green,
                    fontSize: 13,
                    fontWeight: 700,
                  }}
                >
                  {initialsOf(user?.name)}
                </Avatar>
                <div className="app-header-user-text">
                  <span className="app-header-user-name">
                    {user?.name ?? "Người dùng"}
                  </span>
                  <span className="app-header-user-org">
                    {user?.organizationName ?? "Phạm vi toàn hệ thống"}
                  </span>
                </div>
                <DownOutlined
                  style={{ fontSize: 10, color: brand.muted, flexShrink: 0 }}
                />
              </div>
            </Dropdown>
          </div>
        </header>

        <Content style={{ margin: 24, minHeight: 280 }}>
          <Outlet />
        </Content>

        <footer className="app-footer">
          FoodSafe v2.0 — Phần mềm quản lý An toàn thực phẩm tỉnh Quảng Ninh
        </footer>
      </Layout>
    </Layout>
  );
}
