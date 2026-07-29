import { Drawer, Table, Tabs, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import { businessRelatedApi } from "../api/businessApi";
import type {
  Business,
  BusinessInspectionRecord,
  BusinessRelatedRecord,
  BusinessTestingRecord,
} from "../types/business.types";
import { BusinessVsattpCommitmentsTab } from "./BusinessVsattpCommitmentsTab";

interface Props {
  business?: Business;
  onClose: () => void;
}

const PAGE = { skipCount: 0, maxResultCount: 100 };

function formatDate(value?: string) {
  return value ? dayjs(value).format("DD/MM/YYYY") : "—";
}

const relatedColumns: ColumnsType<BusinessRelatedRecord> = [
  {
    title: "Số hiệu",
    dataIndex: "number",
    width: 200,
    render: (v?: string) => v ?? "—",
  },
  {
    title: "Tên sản phẩm / nội dung",
    dataIndex: "name",
    render: (v?: string) => v ?? "—",
  },
  {
    title: "Ngày cấp",
    dataIndex: "issuedDate",
    width: 110,
    render: formatDate,
  },
  {
    title: "Hết hạn",
    dataIndex: "expiryDate",
    width: 110,
    render: formatDate,
  },
];

const inspectionColumns: ColumnsType<BusinessInspectionRecord> = [
  {
    title: "Ngày kiểm tra",
    dataIndex: "inspectionDate",
    width: 120,
    render: formatDate,
  },
  {
    title: "Kết quả",
    dataIndex: "overallResult",
    width: 140,
    render: (v: number) =>
      v === 1 ? (
        <Tag color="success">Đạt</Tag>
      ) : v === 2 ? (
        <Tag color="error">Không đạt</Tag>
      ) : (
        <Tag color="warning">Đạt có điều kiện</Tag>
      ),
  },
  {
    title: "Vi phạm",
    dataIndex: "hasViolation",
    width: 90,
    render: (v: boolean) => (v ? <Tag color="error">Có</Tag> : "Không"),
  },
  {
    title: "Mô tả vi phạm",
    dataIndex: "violationDescription",
    render: (v?: string) => v ?? "—",
  },
  {
    title: "Số QĐ xử lý",
    dataIndex: "adminDecisionNumber",
    width: 140,
    render: (v?: string) => v ?? "—",
  },
];

function RelatedTable({
  businessId,
  kind,
}: {
  businessId: string;
  kind:
    | "selfDeclarations"
    | "productRegistrations"
    | "adRegistrations"
    | "eligibilityCertificates"
    | "cfsCertificates"
    | "exportFoodCertificates";
}) {
  const { data, isLoading } = useQuery({
    queryKey: ["business-related", kind, businessId] as const,
    queryFn: () => businessRelatedApi[kind]({ businessId, ...PAGE }),
  });
  return (
    <Table
      rowKey="id"
      size="small"
      loading={isLoading}
      columns={relatedColumns}
      dataSource={data?.items}
      pagination={false}
    />
  );
}

const TESTING_OUTCOME_CONFIG: Record<number, { color: string; label: string }> =
  {
    1: { color: "green", label: "Đạt" },
    2: { color: "red", label: "Không đạt" },
    3: { color: "orange", label: "Có điều kiện" },
  };

const testingColumns: ColumnsType<BusinessTestingRecord> = [
  { title: "Mã mẫu", dataIndex: "sampleCode", width: 130 },
  { title: "Tên mẫu", dataIndex: "sampleName" },
  {
    title: "Ngày lấy mẫu",
    dataIndex: "sampleDate",
    width: 120,
    render: formatDate,
  },
  {
    title: "Kết quả",
    dataIndex: "outcome",
    width: 120,
    render: (v: number) => {
      const cfg = TESTING_OUTCOME_CONFIG[v];
      return cfg ? <Tag color={cfg.color}>{cfg.label}</Tag> : "—";
    },
  },
  {
    title: "Tiêu chí không đạt",
    dataIndex: "failedCriteria",
    render: (v: string | null) => v ?? "—",
  },
];

function TestingResultTable({ businessId }: { businessId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ["business-related", "testingResults", businessId] as const,
    queryFn: () => businessRelatedApi.testingResults({ businessId, ...PAGE }),
  });
  return (
    <Table
      rowKey="id"
      size="small"
      loading={isLoading}
      columns={testingColumns}
      dataSource={data?.items}
      pagination={false}
    />
  );
}

function InspectionTable({ businessId }: { businessId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ["business-related", "inspections", businessId] as const,
    queryFn: () =>
      businessRelatedApi.inspectionResults({ businessId, ...PAGE }),
  });
  return (
    <Table
      rowKey="id"
      size="small"
      loading={isLoading}
      columns={inspectionColumns}
      dataSource={data?.items}
      pagination={false}
    />
  );
}

export function BusinessDetailDrawer({ business, onClose }: Props) {
  return (
    <Drawer
      title={business ? `Hồ sơ cơ sở: ${business.name}` : "Hồ sơ cơ sở"}
      open={Boolean(business)}
      onClose={onClose}
      width={860}
      destroyOnHidden
    >
      {business && (
        <Tabs
          items={[
            {
              key: "self-declarations",
              label: "Tự công bố",
              children: (
                <RelatedTable
                  businessId={business.id}
                  kind="selfDeclarations"
                />
              ),
            },
            {
              key: "product-registrations",
              label: "Đăng ký công bố",
              children: (
                <RelatedTable
                  businessId={business.id}
                  kind="productRegistrations"
                />
              ),
            },
            {
              key: "ad-registrations",
              label: "Quảng cáo",
              children: (
                <RelatedTable businessId={business.id} kind="adRegistrations" />
              ),
            },
            {
              key: "eligibility",
              label: "GCN đủ điều kiện",
              children: (
                <RelatedTable
                  businessId={business.id}
                  kind="eligibilityCertificates"
                />
              ),
            },
            {
              key: "cfs",
              label: "CFS",
              children: (
                <RelatedTable
                  businessId={business.id}
                  kind="cfsCertificates"
                />
              ),
            },
            {
              key: "export-food",
              label: "GCN xuất khẩu",
              children: (
                <RelatedTable
                  businessId={business.id}
                  kind="exportFoodCertificates"
                />
              ),
            },
            {
              key: "inspections",
              label: "Thanh kiểm tra",
              children: <InspectionTable businessId={business.id} />,
            },
            {
              key: "testing-results",
              label: "Kiểm nghiệm",
              children: <TestingResultTable businessId={business.id} />,
            },
            {
              key: "vsattp",
              label: "Cam kết VSATTP",
              children: (
                <BusinessVsattpCommitmentsTab
                  businessId={business.id}
                  organizationId={business.organizationId}
                />
              ),
            },
          ]}
        />
      )}
    </Drawer>
  );
}
