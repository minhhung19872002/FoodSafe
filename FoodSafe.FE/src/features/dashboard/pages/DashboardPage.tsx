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
  AuditOutlined,
  PlusOutlined,
  PieChartOutlined,
  BarChartOutlined,
  SolutionOutlined,
} from "@ant-design/icons";
import { ChartCard } from "@/components/ChartCard";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/PageHeader";
import { brand } from "@/theme/themeConfig";
import { useAuthStore } from "@/features/auth/store/authStore";
import { useOrganizationTree } from "@/features/organizations/api/organizationQueries";
import type { OrganizationTreeNode } from "@/features/organizations/types/organization.types";
import { useBusinessList } from "@/features/businesses/api/businessQueries";
import { BusinessLocationMap } from "@/features/businesses/components/BusinessLocationMap";
import { useCatalogOptions } from "@/features/catalogs/api/catalogQueries";
import {
  useDashboardStats,
  useExpiringLicenses,
  useFoodPoisoningTrend,
  useReportCompliance,
} from "../api/dashboardQueries";
import { RecentActivityPanel } from "../components/RecentActivityPanel";
import type {
  ExpiringLicense,
  LicenseBreakdownItem,
  ReportComplianceRow,
} from "../types/dashboard.types";

interface StatCardProps {
  icon: string;
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
      <div className="stat-card-head">
        <div className="stat-card-label">{label}</div>
        <div
          className="stat-card-icon"
          style={{ background: iconBg, color: iconColor }}
        >
          {icon}
        </div>
      </div>
      <div className="stat-card-value">{value}</div>
      {footer && <div className="stat-card-footer">{footer}</div>}
    </div>
  );
}

const BREAKDOWN_COLORS = [
  brand.green,
  brand.blue,
  brand.greenMid,
  brand.amber,
  "#6B21A8",
  brand.red,
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
  },
  {
    key: "/self-declarations",
    icon: <SolutionOutlined />,
    label: "Tự công bố SP",
    permission: "FoodSafe.BusinessManagement.SelfDeclarations.Create",
  },
  {
    key: "/inspection",
    icon: <AuditOutlined />,
    label: "Kế hoạch thanh tra",
    permission: "FoodSafe.Inspection.Plans.View",
  },
  {
    key: "/reporting",
    icon: <BarChartOutlined />,
    label: "Báo cáo",
    permission: "FoodSafe.Reporting.NdtpReports.View",
  },
  {
    key: "/statistics",
    icon: <PieChartOutlined />,
    label: "Thống kê tổng hợp",
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
  const poisoningTrend = useFoodPoisoningTrend(filter);

  // Business map: fetch up to 500 businesses scoped to the selected org unit.
  // Fetching is independent of the year filter because locations don't change yearly.
  const mapBusinessFilter = useMemo(
    () => ({
      skipCount: 0,
      maxResultCount: 500,
      organizationId,
    }),
    [organizationId],
  );
  const { data: mapBusinessData, isLoading: isMapLoading } =
    useBusinessList(mapBusinessFilter);
  const { data: classificationsData } = useCatalogOptions(
    "business-classification",
  );

  // Cây đơn vị đòi quyền Organizations.View; tài khoản không có quyền vẫn vào
  // dashboard được nên phải tắt query và ẩn ô lọc, tránh 403 (UIA-005).
  const canViewOrganizations = hasPermission("FoodSafe.Organizations.View");
  const organizationTree = useOrganizationTree({
    enabled: canViewOrganizations,
  });
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
            {canViewOrganizations && (
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
            )}
          </Space>
        }
      />

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {QUICK_ACTIONS.filter(
          (a) =>
            !("permission" in a && a.permission) || hasPermission(a.permission),
        ).map((action, index) => (
          <Button
            key={action.key}
            /* Thiết kế dùng một nút chính, các nút còn lại là nút viền. */
            type={index === 0 ? "primary" : "default"}
            icon={action.icon}
            onClick={() => navigate(action.key)}
          >
            {action.label}
          </Button>
        ))}
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            icon={"🏭"}
            iconBg={brand.greenPale}
            iconColor={brand.greenDark}
            label="Cơ sở SXKD"
            value={stats?.totalBusinesses ?? 0}
            footer={`${stats?.activeBusinesses ?? 0} đang hoạt động`}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            icon={"📄"}
            iconBg="#E8EFFD"
            iconColor={brand.navy}
            label="Hồ sơ công bố"
            value={totalLicenses}
            footer={`${stats?.totalSelfDeclarations ?? 0} tự công bố + ${stats?.totalProductRegistrations ?? 0} đăng ký`}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            icon={"📋"}
            iconBg={brand.greenPale}
            iconColor={brand.success}
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
            icon={"⏰"}
            iconBg="#FBF1E2"
            iconColor={brand.amber}
            label="Sắp hết hạn"
            value={stats?.expiringWithin30Days ?? 0}
            footer="Hồ sơ/giấy phép hết hạn trong 30 ngày"
          />
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            icon={"🔍"}
            iconBg="#F3E8FD"
            iconColor="#6B21A8"
            label="Thanh tra"
            value={stats?.totalInspectionResults ?? 0}
            footer={`${stats?.inspectionViolationCount ?? 0} vi phạm / ${stats?.totalInspectionPlans ?? 0} kế hoạch`}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            icon={"🚑"}
            iconBg="#FBEAE7"
            iconColor={brand.red}
            label="Ngộ độc thực phẩm"
            value={stats?.totalFoodPoisoningCases ?? 0}
            footer="Ca ngộ độc ghi nhận"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            icon={"⚠️"}
            iconBg="#FBF1E2"
            iconColor={brand.amber}
            label="Cảnh báo & phân tích"
            value={(stats?.totalAlerts ?? 0) + (stats?.totalRiskAnalyses ?? 0)}
            footer={`${stats?.totalAlerts ?? 0} cảnh báo + ${stats?.totalRiskAnalyses ?? 0} phân tích nguy cơ`}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            icon={"🧪"}
            iconBg="#E8EFFD"
            iconColor={brand.blue}
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
              sticky
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
              sticky
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
              sticky
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

      {/* Map + Trend chart ───────────────────────────────────────────────── */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} xl={14}>
          <Card title="Bản đồ cơ sở kinh doanh" size="small">
            <Spin spinning={isMapLoading}>
              <BusinessLocationMap
                businesses={mapBusinessData?.items ?? []}
                classifications={classificationsData?.items ?? []}
                height={400}
              />
            </Spin>
          </Card>
        </Col>
        <Col xs={24} xl={10}>
          <ChartCard
            title="Diễn biến ngộ độc thực phẩm (12 tháng gần nhất)"
            fileName="dien-bien-ngo-doc.png"
            height={360}
            isEmpty={
              !poisoningTrend.isLoading &&
              (!poisoningTrend.data?.length ||
                poisoningTrend.data.every(
                  (d) => d.cases === 0 && d.victims === 0,
                ))
            }
          >
            <Spin spinning={poisoningTrend.isLoading}>
              <ResponsiveContainer width="100%" height={360}>
                <LineChart
                  data={poisoningTrend.data ?? []}
                  margin={{ top: 8, right: 16, left: -16, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(0,0,0,0.08)"
                  />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 11 }}
                    interval={0}
                    angle={-35}
                    textAnchor="end"
                    height={42}
                  />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip
                    formatter={(value, name) => [
                      value as number,
                      name === "cases" ? "Số vụ" : "Số người",
                    ]}
                  />
                  <Legend
                    formatter={(value) =>
                      value === "cases"
                        ? "Số vụ ngộ độc"
                        : "Số người bị ảnh hưởng"
                    }
                  />
                  <Line
                    type="monotone"
                    dataKey="cases"
                    stroke={brand.red}
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="victims"
                    stroke={brand.amber}
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Spin>
          </ChartCard>
        </Col>
      </Row>
    </div>
  );
}
