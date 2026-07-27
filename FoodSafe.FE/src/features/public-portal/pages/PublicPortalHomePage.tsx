import { Link } from "react-router-dom";
import { Card, Col, Row, Typography } from "antd";
import {
  SearchOutlined,
  SafetyCertificateOutlined,
  WarningOutlined,
  NotificationOutlined,
  FileTextOutlined,
  AlertOutlined,
  ShopOutlined,
  FileProtectOutlined,
  GlobalOutlined,
  ExportOutlined,
  SolutionOutlined,
  FundOutlined,
} from "@ant-design/icons";
import { PublicShell } from "../components/PublicShell";

interface PortalCard {
  title: string;
  description: string;
  to: string;
  icon: React.ReactNode;
  color: string;
}

const PORTAL_CARDS: PortalCard[] = [
  {
    title: "Tra cứu cơ sở SXKD",
    description: "Tìm kiếm thông tin cơ sở sản xuất, kinh doanh thực phẩm",
    to: "/tra-cuu-co-so",
    icon: <ShopOutlined style={{ fontSize: 32 }} />,
    color: "#00796B",
  },
  {
    title: "Tra cứu hồ sơ tự công bố",
    description: "Tra cứu hồ sơ tự công bố sản phẩm thực phẩm",
    to: "/tra-cuu-tu-cong-bo",
    icon: <FileTextOutlined style={{ fontSize: 32 }} />,
    color: "#1976D2",
  },
  {
    title: "Tra cứu cơ sở & sản phẩm",
    description: "Tìm kiếm tổng hợp cơ sở và sản phẩm thực phẩm",
    to: "/tra-cuu-chung",
    icon: <SearchOutlined style={{ fontSize: 32 }} />,
    color: "#388E3C",
  },
  {
    title: "Tra cứu giấy đủ ĐK ATTP",
    description: "Tra cứu giấy chứng nhận đủ điều kiện an toàn thực phẩm",
    to: "/tra-cuu-giay-du-dieu-kien",
    icon: <SafetyCertificateOutlined style={{ fontSize: 32 }} />,
    color: "#F57C00",
  },
  {
    title: "Tra cứu chứng nhận CFS",
    description: "Tra cứu Certificate of Free Sale cho sản phẩm xuất khẩu",
    to: "/tra-cuu-cfs",
    icon: <GlobalOutlined style={{ fontSize: 32 }} />,
    color: "#7B1FA2",
  },
  {
    title: "Tra cứu GCN xuất khẩu",
    description: "Tra cứu giấy chứng nhận xuất khẩu thực phẩm",
    to: "/tra-cuu-gcn-xuat-khau",
    icon: <ExportOutlined style={{ fontSize: 32 }} />,
    color: "#C62828",
  },
  {
    title: "Tra cứu đăng ký công bố",
    description: "Tra cứu đăng ký công bố sản phẩm thực phẩm",
    to: "/tra-cuu-dang-ky-cong-bo",
    icon: <SolutionOutlined style={{ fontSize: 32 }} />,
    color: "#00838F",
  },
  {
    title: "Tra cứu đăng ký quảng cáo",
    description: "Tra cứu đăng ký quảng cáo thực phẩm",
    to: "/tra-cuu-dang-ky-quang-cao",
    icon: <NotificationOutlined style={{ fontSize: 32 }} />,
    color: "#558B2F",
  },
  {
    title: "Tra cứu giấy phép (tổng hợp)",
    description: "Tra cứu tất cả các loại giấy phép, chứng nhận ATTP",
    to: "/tra-cuu-giay-phep",
    icon: <FileProtectOutlined style={{ fontSize: 32 }} />,
    color: "#4527A0",
  },
  {
    title: "Cơ sở bị cảnh báo",
    description: "Danh sách cơ sở đang bị cảnh báo vi phạm an toàn thực phẩm",
    to: "/co-so-bi-canh-bao",
    icon: <WarningOutlined style={{ fontSize: 32 }} />,
    color: "#E65100",
  },
  {
    title: "Tin tức & Cảnh báo",
    description: "Tin tức, cảnh báo và phân tích nguy cơ an toàn thực phẩm",
    to: "/tin-tuc",
    icon: <FundOutlined style={{ fontSize: 32 }} />,
    color: "#1565C0",
  },
  {
    title: "Văn bản pháp quy",
    description: "Tra cứu văn bản pháp luật, quy định về an toàn thực phẩm",
    to: "/tra-cuu-van-ban",
    icon: <FileTextOutlined style={{ fontSize: 32 }} />,
    color: "#2E7D32",
  },
  {
    title: "Gửi phản ánh",
    description:
      "Gửi phản ánh, báo cáo sự cố an toàn thực phẩm tới cơ quan quản lý",
    to: "/gui-phan-anh",
    icon: <AlertOutlined style={{ fontSize: 32 }} />,
    color: "#B71C1C",
  },
];

export default function PublicPortalHomePage() {
  return (
    <PublicShell>
      <Typography.Title
        level={2}
        style={{ textAlign: "center", marginBottom: 8 }}
      >
        Cổng thông tin An toàn thực phẩm Quảng Ninh
      </Typography.Title>
      <Typography.Paragraph
        type="secondary"
        style={{ textAlign: "center", marginBottom: 40, fontSize: 16 }}
      >
        Tra cứu thông tin, giấy phép, cảnh báo và gửi phản ánh về an toàn thực
        phẩm
      </Typography.Paragraph>

      <Row gutter={[24, 24]}>
        {PORTAL_CARDS.map((card) => (
          <Col key={card.to} xs={24} sm={12} md={8} lg={6}>
            <Link to={card.to} style={{ display: "block", height: "100%" }}>
              <Card
                hoverable
                style={{ height: "100%", borderTop: `4px solid ${card.color}` }}
                styles={{ body: { textAlign: "center", padding: 24 } }}
              >
                <div style={{ color: card.color, marginBottom: 12 }}>
                  {card.icon}
                </div>
                <Typography.Title level={5} style={{ marginBottom: 8 }}>
                  {card.title}
                </Typography.Title>
                <Typography.Text type="secondary" style={{ fontSize: 13 }}>
                  {card.description}
                </Typography.Text>
              </Card>
            </Link>
          </Col>
        ))}
      </Row>
    </PublicShell>
  );
}
