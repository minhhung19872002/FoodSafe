import { Col, Row, Card, Spin, Progress, Table, type TableColumnsType } from "antd";
import {
  ShopOutlined,
  FileProtectOutlined,
  SafetyCertificateOutlined,
  WarningOutlined,
  AuditOutlined,
  AlertOutlined,
  ExperimentOutlined,
  MedicineBoxOutlined,
} from "@ant-design/icons";
import { PageHeader } from "@/components/PageHeader";
import { useAuthStore } from "@/features/auth/store/authStore";
import { useDashboardStats } from "../api/dashboardQueries";
import type { LicenseBreakdownItem } from "../types/dashboard.types";

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

const BREAKDOWN_COLORS = [
  "#00796B",
  "#0958D9",
  "#389E0D",
  "#D48806",
  "#722ED1",
  "#CF1322",
];

const breakdownColumns: TableColumnsType<LicenseBreakdownItem> = [
  { title: "Loại hồ sơ", dataIndex: "category" },
  {
    title: "Số lượng",
    dataIndex: "count",
    width: 100,
    align: "right",
    render: (v: number) => v.toLocaleString("vi-VN"),
  },
];

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const { data: stats, isLoading } = useDashboardStats();

  if (isLoading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: 320,
        }}
      >
        <Spin size="large" />
      </div>
    );
  }

  const totalLicenses =
    (stats?.totalSelfDeclarations ?? 0) +
    (stats?.totalProductRegistrations ?? 0) +
    (stats?.totalEligibilityCertificates ?? 0) +
    (stats?.totalCfsCertificates ?? 0) +
    (stats?.totalExportCertificates ?? 0) +
    (stats?.totalAdRegistrations ?? 0);

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
            value={stats?.totalBusinesses ?? 0}
            footer={`${stats?.activeBusinesses ?? 0} đang hoạt động`}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            icon={<FileProtectOutlined />}
            iconBg="rgba(9, 88, 217, 0.1)"
            iconColor="#0958D9"
            label="Hồ sơ công bố"
            value={totalLicenses}
            footer={`${stats?.totalSelfDeclarations ?? 0} tự công bố + ${stats?.totalProductRegistrations ?? 0} đăng ký`}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            icon={<SafetyCertificateOutlined />}
            iconBg="rgba(56, 158, 13, 0.1)"
            iconColor="#389E0D"
            label="Giấy chứng nhận"
            value={
              (stats?.totalEligibilityCertificates ?? 0) +
              (stats?.totalCfsCertificates ?? 0) +
              (stats?.totalExportCertificates ?? 0)
            }
            footer={`ĐĐK: ${stats?.totalEligibilityCertificates ?? 0} | CFS: ${stats?.totalCfsCertificates ?? 0} | XK: ${stats?.totalExportCertificates ?? 0}`}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            icon={<WarningOutlined />}
            iconBg="rgba(212, 136, 6, 0.1)"
            iconColor="#D48806"
            label="Sắp hết hạn"
            value={stats?.expiringWithin30Days ?? 0}
            footer="Hồ sơ/giấy phép hết hạn trong 30 ngày"
          />
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            icon={<AuditOutlined />}
            iconBg="rgba(114, 46, 209, 0.1)"
            iconColor="#722ED1"
            label="Thanh tra"
            value={stats?.totalInspectionResults ?? 0}
            footer={`${stats?.inspectionViolationCount ?? 0} vi phạm / ${stats?.totalInspectionPlans ?? 0} kế hoạch`}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            icon={<MedicineBoxOutlined />}
            iconBg="rgba(207, 19, 34, 0.1)"
            iconColor="#CF1322"
            label="Ngộ độc thực phẩm"
            value={stats?.totalFoodPoisoningCases ?? 0}
            footer="Ca ngộ độc ghi nhận"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            icon={<AlertOutlined />}
            iconBg="rgba(250, 140, 22, 0.1)"
            iconColor="#FA8C16"
            label="Cảnh báo & phân tích"
            value={(stats?.totalAlerts ?? 0) + (stats?.totalRiskAnalyses ?? 0)}
            footer={`${stats?.totalAlerts ?? 0} cảnh báo + ${stats?.totalRiskAnalyses ?? 0} phân tích nguy cơ`}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            icon={<ExperimentOutlined />}
            iconBg="rgba(47, 84, 235, 0.1)"
            iconColor="#2F54EB"
            label="Kiểm nghiệm"
            value={stats?.totalTestingResults ?? 0}
            footer="Kết quả kiểm nghiệm mẫu"
          />
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={12}>
          <Card title="Phân bố hồ sơ theo loại" size="small">
            {stats?.licenseBreakdown && stats.licenseBreakdown.length > 0 ? (
              <div style={{ padding: "8px 0" }}>
                {stats.licenseBreakdown.map((item, idx) => (
                  <div
                    key={item.category}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      marginBottom: 12,
                    }}
                  >
                    <span style={{ width: 120, fontSize: 13 }}>
                      {item.category}
                    </span>
                    <Progress
                      percent={
                        totalLicenses > 0
                          ? Math.round((item.count / totalLicenses) * 100)
                          : 0
                      }
                      strokeColor={BREAKDOWN_COLORS[idx % BREAKDOWN_COLORS.length]}
                      size="small"
                      style={{ flex: 1, marginBottom: 0 }}
                    />
                    <span
                      style={{
                        width: 50,
                        textAlign: "right",
                        fontWeight: 600,
                        fontSize: 13,
                      }}
                    >
                      {item.count}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div
                style={{
                  textAlign: "center",
                  padding: 32,
                  color: "rgba(0,0,0,0.45)",
                }}
              >
                Chưa có dữ liệu
              </div>
            )}
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Chi tiết theo loại hồ sơ" size="small">
            <Table
              rowKey="category"
              columns={breakdownColumns}
              dataSource={stats?.licenseBreakdown ?? []}
              pagination={false}
              size="small"
              summary={() =>
                stats?.licenseBreakdown && stats.licenseBreakdown.length > 0 ? (
                  <Table.Summary.Row>
                    <Table.Summary.Cell index={0}>
                      <strong>Tổng cộng</strong>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={1} align="right">
                      <strong>{totalLicenses.toLocaleString("vi-VN")}</strong>
                    </Table.Summary.Cell>
                  </Table.Summary.Row>
                ) : null
              }
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
