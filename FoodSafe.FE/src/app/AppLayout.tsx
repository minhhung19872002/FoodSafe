import { useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  Layout,
  Menu,
  Avatar,
  Dropdown,
  Breadcrumb,
  theme,
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
} from "@ant-design/icons";
import { useAuthStore } from "@/features/auth/store/authStore";
import { useLogout } from "@/features/auth/api/authMutations";

const { Header, Sider, Content } = Layout;

function buildMenuItems(
  hasPermission: (permission: string) => boolean,
): MenuProps["items"] {
  const items: MenuProps["items"] = [
    {
      key: "/dashboard",
      icon: <DashboardOutlined />,
      label: "Bảng điều khiển",
    },
  ];
  if (hasPermission("FoodSafe.Organizations.View")) {
    items.push({
      key: "/organizations",
      icon: <ApartmentOutlined />,
      label: "Đơn vị",
    });
  }
  if (hasPermission("FoodSafe.GeographicCatalogs.View")) {
    items.push({
      key: "/geography",
      icon: <EnvironmentOutlined />,
      label: "Địa bàn",
    });
  }
  if (hasPermission("FoodSafe.SystemAdministration")) {
    items.push({
      key: "/administration/identity",
      icon: <SafetyCertificateOutlined />,
      label: "Tài khoản và quyền",
    });
  }
  return items;
}

export function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((s) => s.user);
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const menuItems = buildMenuItems(hasPermission);
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();
  const logoutMutation = useLogout();

  const userMenuItems: MenuProps["items"] = [
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

  return (
    <Layout style={{ minHeight: "100vh" }}>
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
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            fontSize: collapsed ? 14 : 16,
            fontWeight: 700,
            padding: "0 16px",
            background: "rgba(255,255,255,0.05)",
            margin: 8,
            borderRadius: 8,
          }}
        >
          {collapsed ? "FS" : "FoodSafe"}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>

      <Layout>
        <Header
          style={{
            background: colorBgContainer,
            padding: "0 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
          }}
        >
          <Breadcrumb
            items={[
              { title: user?.organizationName ?? "Phạm vi toàn hệ thống" },
              { title: location.pathname.split("/")[1] || "Trang chủ" },
            ]}
          />

          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <div
              style={{
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <Avatar
                icon={<UserOutlined />}
                style={{ backgroundColor: "#1677ff" }}
              />
              <span>{user?.name ?? "Người dùng"}</span>
            </div>
          </Dropdown>
        </Header>

        <Content
          style={{
            margin: "16px",
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
  );
}
