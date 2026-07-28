import { useMemo, useState } from "react";
import {
  Col,
  Row,
  Card,
  Select,
  Space,
  Spin,
  Progress,
  Table,
  Button,
  Tag,
  type TableColumnsType,
} from "antd";
import {
  ShopOutlined,
  FileProtectOutlined,
  SafetyCertificateOutlined,
  WarningOutlined,
  AuditOutlined,
  AlertOutlined,
  ExperimentOutlined,
  MedicineBoxOutlined,
  PlusOutlined,
  PieChartOutlined,
  BarChartOutlined,
  SolutionOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/PageHeader";
import { useAuthStore } from "@/features/auth/store/authStore";
import { useOrganizationTree } from "@/features/organizations/api/organizationQueries";
import type { OrganizationTreeNode } from "@/features/organizations/types/organization.types";
import {
  useDashboardStats,
  useExpiringLicenses,
  useReportCompliance,
} from "../api/dashboardQueries";
import { RecentActivityPanel } from "../components/RecentActivityPanel";
import type {
  ExpiringLicense,
  LicenseBreakdownItem,
  ReportComplianceRow,
} from "../types/dashboard.types";

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

const QUICK_ACTIONS = [
  {
    key: "/businesses",
    icon: <PlusOutlined />,
    label: "Thêm cơ sở mới",
    permission: "FoodSafe.BusinessManagement.Businesses.Create",
    color: "#00796B",
  },
  {
    key: "/self-declarations",
    icon: <SolutionOutlined />,
    label: "Tự công bố SP",
    permission: "FoodSafe.BusinessManagement.SelfDeclarations.Create",
    color: "#0958D9",
  },
  {
    key: "/inspection",
    icon: <AuditOutlined />,
    label: "Kế hoạch thanh tra",
    permission: "FoodSafe.Inspection.Plans.View",
    color: "#722ED1",
  },
  {
    key: "/reporting",
    icon: <BarChartOutlined />,
    label: "Báo cáo",
    permission: "FoodSafe.Reporting.NdtpReports.View",
    color: "#D48806",
  },
  {
    key: "/statistics",
    icon: <PieChartOutlined />,
    label: "Thống kê tổng hợp",
    color: "#389E0D",
  },
] as const;

function flattenOrganizationOptions(
  nodes: OrganizationTreeNode[],
  depth = 0,
): Array<{ value: string; label: string }> {
  return nodes.flatMap((node) => [
    {
      value: node.id,
      label: `${" ".repeat(depth * 3)}${node.name}`,
    },
    ...flattenOrganizationOptions(node.children, depth + 1),
  ]);
}

const complianceColumns: TableColumnsType<ReportComplianceRow> = [
  { title: "Đơn vị", dataIndex: "organizationName", ellipsis: true },
  {
    title: "BC NĐTP (tháng)",
    width: 160,
    render: (_, row) => (
      <Progress
        percent={Math.round(
          (row.ndtpSubmittedMonths / row.ndtpExpectedMonths) * 100,
        )}
        size="small"
        format={() => `${row.ndtpSubmittedMonths}/${row.ndtpExpectedMonths}`}
      />
    ),
  },
  {
    title: "BC công tác ATTP",
    width: 150,
    render: (_, row) => (
      <Progress
        percent={Math.round((row.atpWorkSubmitted / row.atpWorkExpected) * 100)}
        size="small"
        format={() => `${row.atpWorkSubmitted}/${row.atpWorkExpected}`}
      />
    ),
  },
  {
    title: "BC Tháng hành động",
    width: 150,
    render: (_, row) => (
      <Progress
        percent={Math.round(
          (row.actionMonthSubmitted / row.actionMonthExpected) * 100,
        )}
        size="small"
        format={() => `${row.actionMonthSubmitted}/${row.actionMonthExpected}`}
      />
    ),
  },
];

const expiringLicenseColumns: TableColumnsType<ExpiringLicense> = [
  { title: "Loại giấy phép", dataIndex: "licenseType", width: 150 },
  { title: "Số giấy phép", dataIndex: "licenseNumber", width: 160 },
  { title: "Cơ sở", dataIndex: "businessName", ellipsis: true },
  {
    title: "Ngày hết hạn",
    dataIndex: "expiryDate",
    width: 120,
    render: (v: string) => new Date(v).toLocaleDateString("vi-VN"),
  },
  {
    title: "Còn lại",
    dataIndex: "daysRemaining",
    width: 130,
    render: (days: number, row) => {
      const color =
        row.warningTier === 30
          ? "error"
          : row.warningTier === 60
            ? "warning"
            : "default";
      return <Tag color={color}>{`${days} ngày`}</Tag>;
    },
  },
];

const currentYear = new Date().getFullYear();
const yearOptions = Array.from({ length: 5 }, (_, index) => ({
  value: currentYear - index,
  label: `Năm ${currentYear - index}`,
}));

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const navigate = useNavigate();
  const [year, setYear] = useState<number>();
  const [organizationId, setOrganizationId] = useState<string>();
  const filter = useMemo(
    () => ({ year, organizationId }),
    [year, organizationId],
  );
  const { data: stats, isLoading } = useDashboardStats(filter);
  const compliance = useReportCompliance(filter);
  const expiringLicenses = useExpiringLicenses(filter);
  const organizationTree = useOrganizationTree();
  const organizationOptions = useMemo(
    () => flattenOrganizationOptions(organizationTree.data?.items ?? []),
    [organizationTree.data?.items],
  );

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
        actions={
          <Space>
            <Select
              allowClear
              placeholder="Tất cả các năm"
              value={year}
              onChange={setYear}
              options={yearOptions}
              style={{ width: 140 }}
            />
            <Select
              allowClear
              showSearch
              optionFilterProp="label"
              placeholder="Toàn bộ đơn vị"
              value={organizationId}
              onChange={setOrganizationId}
              options={organizationOptions}
              style={{ width: 220 }}
            />
          </Space>
        }
      />

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {QUICK_ACTIONS.filter(
          (a) =>
            !("permission" in a && a.permission) || hasPermission(a.permission),
        ).map((action) => (
          <Button
            key={action.key}
            icon={action.icon}
            onClick={() => navigate(action.key)}
            style={{ borderColor: action.color, color: action.color }}
          >
            {action.label}
          </Button>
        ))}
      </div>

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
                      strokeColor={
                        BREAKDOWN_COLORS[idx % BREAKDOWN_COLORS.length]
                      }
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

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24}>
          <Card title="Giấy phép sắp hết hạn (30/60/90 ngày)" size="small">
            <Table
              rowKey="id"
              columns={expiringLicenseColumns}
              dataSource={expiringLicenses.data?.items ?? []}
              loading={expiringLicenses.isLoading}
              size="small"
              locale={{
                emptyText: "Không có giấy phép nào sắp hết hạn trong 90 ngày",
              }}
              pagination={{ pageSize: 10, hideOnSinglePage: true }}
              scroll={{ x: 700 }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        {/* Compliance table shares the row with the activity feed on wide screens. */}
        <Col xs={24} xl={16}>
          <Card
            title={`Tình hình nộp báo cáo của các đơn vị — Năm ${year ?? currentYear}`}
            size="small"
          >
            <Table
              rowKey="organizationId"
              columns={complianceColumns}
              dataSource={compliance.data?.items ?? []}
              loading={compliance.isLoading}
              size="small"
              pagination={{ pageSize: 10, hideOnSinglePage: true }}
              scroll={{ x: 700 }}
            />
          </Card>
        </Col>
        <Col xs={24} xl={8}>
          <RecentActivityPanel items={stats?.recentActivities ?? []} />
        </Col>
      </Row>
    </div>
  );
}
