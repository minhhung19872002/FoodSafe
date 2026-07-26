import { Col, Row, Card, Typography } from "antd";
import {
  ShopOutlined,
  FileProtectOutlined,
  SafetyCertificateOutlined,
  WarningOutlined,
  AuditOutlined,
  SolutionOutlined,
} from "@ant-design/icons";
import { PageHeader } from "@/components/PageHeader";
import { useAuthStore } from "@/features/auth/store/authStore";

interface StatCardProps {
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  label: string;
  value: string | number;
  footer?: string;
}

function StatCard({
  icon,
  iconBg,
  iconColor,
  label,
  value,
  footer,
}: StatCardProps) {
  return (
    <div className="stat-card">
      <div
        className="stat-card-icon"
        style={{ background: iconBg, color: iconColor }}
      >
        {icon}
      </div>
      <div className="stat-card-content">
        <div className="stat-card-label">{label}</div>
        <div className="stat-card-value">{value}</div>
        {footer && <div className="stat-card-footer">{footer}</div>}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);

  return (
    <div className="page-container">
      <PageHeader
        title={`Xin chào, ${user?.name ?? "Người dùng"}`}
        subtitle={user?.organizationName ?? "Phạm vi toàn hệ thống"}
      />

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            icon={<ShopOutlined />}
            iconBg="rgba(0, 121, 107, 0.1)"
            iconColor="#00796B"
            label="Cơ sở SXKD"
            value="—"
            footer="Tổng số cơ sở đang quản lý"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            icon={<FileProtectOutlined />}
            iconBg="rgba(9, 88, 217, 0.1)"
            iconColor="#0958D9"
            label="Hồ sơ công bố"
            value="—"
            footer="Hồ sơ tự công bố còn hiệu lực"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            icon={<SafetyCertificateOutlined />}
            iconBg="rgba(56, 158, 13, 0.1)"
            iconColor="#389E0D"
            label="Giấy chứng nhận"
            value="—"
            footer="Giấy ĐĐK ATTP + CFS còn hiệu lực"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            icon={<WarningOutlined />}
            iconBg="rgba(212, 136, 6, 0.1)"
            iconColor="#D48806"
            label="Sắp hết hạn"
            value="—"
            footer="Hồ sơ/giấy phép hết hạn trong 30 ngày"
          />
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card
            title="Hoạt động gần đây"
            size="small"
            styles={{ body: { minHeight: 200 } }}
          >
            <div className="empty-state" style={{ padding: 32 }}>
              <div className="empty-state-icon">
                <AuditOutlined />
              </div>
              <div className="empty-state-title">Chưa có hoạt động</div>
              <div className="empty-state-description">
                Các thao tác tạo, sửa, thu hồi hồ sơ sẽ hiển thị ở đây
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card
            title="Tổng hợp theo loại hồ sơ"
            size="small"
            styles={{ body: { minHeight: 200 } }}
          >
            <div className="empty-state" style={{ padding: 32 }}>
              <div className="empty-state-icon">
                <SolutionOutlined />
              </div>
              <div className="empty-state-title">Chưa có dữ liệu thống kê</div>
              <div className="empty-state-description">
                Biểu đồ phân bố hồ sơ theo loại sẽ hiển thị khi có dữ liệu
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      <Typography.Text
        type="secondary"
        style={{ fontSize: 12, display: "block", textAlign: "center" }}
      >
        Dữ liệu thống kê sẽ được cập nhật khi tích hợp API tổng hợp
      </Typography.Text>
    </div>
  );
}
