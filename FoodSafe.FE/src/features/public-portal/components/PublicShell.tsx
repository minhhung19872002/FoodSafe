import type { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { Layout, Menu, Typography, Space } from "antd";
import type { MenuProps } from "antd";
import {
  HomeOutlined,
  SearchOutlined,
  SafetyCertificateOutlined,
  WarningOutlined,
  NotificationOutlined,
  FileTextOutlined,
  AlertOutlined,
  LoginOutlined,
} from "@ant-design/icons";

const { Header, Content, Footer } = Layout;

const NAV_ITEMS: MenuProps["items"] = [
  {
    key: "/cong-thong-tin",
    icon: <HomeOutlined />,
    label: <Link to="/cong-thong-tin">Trang chủ</Link>,
  },
  {
    key: "/tra-cuu-chung",
    icon: <SearchOutlined />,
    label: <Link to="/tra-cuu-chung">Tra cứu cơ sở & sản phẩm</Link>,
  },
  {
    key: "/tra-cuu-giay-phep",
    icon: <SafetyCertificateOutlined />,
    label: <Link to="/tra-cuu-giay-phep">Tra cứu giấy phép</Link>,
  },
  {
    key: "/co-so-bi-canh-bao",
    icon: <WarningOutlined />,
    label: <Link to="/co-so-bi-canh-bao">Cơ sở bị cảnh báo</Link>,
  },
  {
    key: "/tin-tuc",
    icon: <NotificationOutlined />,
    label: <Link to="/tin-tuc">Tin tức & Cảnh báo</Link>,
  },
  {
    key: "/tra-cuu-van-ban",
    icon: <FileTextOutlined />,
    label: <Link to="/tra-cuu-van-ban">Văn bản pháp quy</Link>,
  },
  {
    key: "/gui-phan-anh",
    icon: <AlertOutlined />,
    label: <Link to="/gui-phan-anh">Gửi phản ánh</Link>,
  },
];

interface PublicShellProps {
  children: ReactNode;
}

export function PublicShell({ children }: PublicShellProps) {
  const location = useLocation();

  const selectedKey = NAV_ITEMS?.find((item) =>
    location.pathname.startsWith(String(item?.key ?? "")),
  )?.key as string | undefined;

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          display: "flex",
          alignItems: "center",
          gap: 24,
          padding: "0 24px",
          background: "#00796B",
        }}
      >
        <Typography.Title
          level={5}
          style={{ color: "#fff", margin: 0, whiteSpace: "nowrap", flexShrink: 0 }}
        >
          Cổng thông tin An toàn thực phẩm Quảng Ninh
        </Typography.Title>

        <Menu
          mode="horizontal"
          selectedKeys={selectedKey ? [selectedKey] : []}
          items={NAV_ITEMS}
          style={{ background: "transparent", borderBottom: "none", flex: 1 }}
          theme="dark"
          overflowedIndicatorPopupClassName="public-portal-nav-overflow"
        />

        <Space>
          <Link
            to="/login"
            style={{
              color: "#fff",
              whiteSpace: "nowrap",
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <LoginOutlined /> Đăng nhập
          </Link>
        </Space>
      </Header>

      <Content
        style={{
          maxWidth: 1200,
          width: "100%",
          margin: "0 auto",
          padding: "32px 24px",
        }}
      >
        {children}
      </Content>

      <Footer style={{ textAlign: "center", background: "#f5f5f5" }}>
        <Typography.Text type="secondary">
          Chi cục An toàn vệ sinh thực phẩm tỉnh Quảng Ninh — Cổng thông tin
          công khai ATTP
        </Typography.Text>
      </Footer>
    </Layout>
  );
}
