import { useState } from "react";
import { Drawer, Table, Tabs, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import { ExpiryTag } from "@/components/ExpiryTag";
import { StatusBadge } from "@/components/StatusBadge";
import { businessRelatedApi } from "../api/businessApi";
import type {
  Business,
  BusinessInspectionRecord,
  BusinessRelatedRecord,
  BusinessTestingRecord,
  Product,
} from "../types/business.types";
import { PRODUCT_STATUS } from "../types/business.types";
import { useProductList } from "../api/businessQueries";
import { BusinessVsattpCommitmentsTab } from "./BusinessVsattpCommitmentsTab";

interface Props {
  business?: Business;
  onClose: () => void;
}

const PAGE = { skipCount: 0, maxResultCount: 100 };

function formatDate(value?: string) {
  return value ? dayjs(value).format("DD/MM/YYYY") : "—";
}

const dash = (v?: string) => v ?? "—";

const numberColumn = (title: string): ColumnsType<BusinessRelatedRecord>[number] => ({
  title,
  dataIndex: "number",
  width: 170,
  render: dash,
});

const nameColumn = (
  title = "Sản phẩm",
): ColumnsType<BusinessRelatedRecord>[number] => ({
  title,
  dataIndex: "name",
  ellipsis: true,
  render: dash,
});

const issuedDateColumn = (
  title: string,
): ColumnsType<BusinessRelatedRecord>[number] => ({
  title,
  dataIndex: "issuedDate",
  width: 115,
  render: (v?: string) => formatDate(v),
});

const expiryColumn: ColumnsType<BusinessRelatedRecord>[number] = {
  title: "Hết hạn",
  width: 140,
  render: (_, item) => (
    <ExpiryTag
      expiryDate={item.expiryDate}
      status={item.status ?? 0}
      daysUntilExpiry={item.daysUntilExpiry}
    />
  ),
};

const statusColumn: ColumnsType<BusinessRelatedRecord>[number] = {
  title: "Trạng thái",
  dataIndex: "status",
  width: 125,
  render: (v?: number) => (v == null ? "—" : <StatusBadge status={v} />),
};

// Each tab mirrors the "prominent" columns of that feature's own list page
// (business name dropped — redundant inside its own profile drawer).
const RELATED_COLUMNS: Record<
  | "selfDeclarations"
  | "productRegistrations"
  | "adRegistrations"
  | "eligibilityCertificates"
  | "cfsCertificates"
  | "exportFoodCertificates",
  ColumnsType<BusinessRelatedRecord>
> = {
  selfDeclarations: [
    numberColumn("Số hồ sơ"),
    nameColumn(),
    issuedDateColumn("Ngày công bố"),
    expiryColumn,
    statusColumn,
  ],
  productRegistrations: [
    numberColumn("Số đăng ký"),
    {
      title: "Số tiếp nhận",
      dataIndex: "receiptNumber",
      width: 120,
      render: dash,
    },
    nameColumn(),
    issuedDateColumn("Ngày đăng ký"),
    expiryColumn,
    statusColumn,
  ],
  adRegistrations: [
    numberColumn("Số đăng ký"),
    {
      title: "Loại quảng cáo",
      dataIndex: "advertisementTypeName",
      width: 150,
      render: dash,
    },
    nameColumn(),
    issuedDateColumn("Ngày cấp"),
    expiryColumn,
    statusColumn,
  ],
  eligibilityCertificates: [
    numberColumn("Số giấy"),
    issuedDateColumn("Ngày cấp"),
    expiryColumn,
    {
      title: "Cơ quan cấp",
      dataIndex: "certifyingAuthority",
      ellipsis: true,
      render: dash,
    },
    statusColumn,
  ],
  cfsCertificates: [
    numberColumn("Số CFS"),
    nameColumn(),
    {
      title: "Quốc gia đích",
      dataIndex: "destinationCountryName",
      width: 150,
      render: dash,
    },
    issuedDateColumn("Ngày cấp"),
    expiryColumn,
    statusColumn,
  ],
  exportFoodCertificates: [
    numberColumn("Số GCN XK"),
    nameColumn(),
    { title: "Số lô", dataIndex: "lotNumber", width: 110, render: dash },
    {
      title: "Quốc gia đích",
      dataIndex: "destinationCountryName",
      width: 150,
      render: dash,
    },
    issuedDateColumn("Ngày cấp"),
    expiryColumn,
    statusColumn,
  ],
};

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
  kind: keyof typeof RELATED_COLUMNS;
}) {
  const { data, isLoading } = useQuery({
    queryKey: ["business-related", kind, businessId] as const,
    queryFn: () => businessRelatedApi[kind]({ businessId, ...PAGE }),
  });
  return (
    <Table
      rowKey="id"
      size="small"
      scroll={{ x: "max-content" }}
      loading={isLoading}
      columns={RELATED_COLUMNS[kind]}
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
  { title: "Tên mẫu", dataIndex: "sampleName", ellipsis: true },
  {
    title: "Cơ sở KN",
    dataIndex: "testingCenterName",
    width: 150,
    ellipsis: true,
    render: (v?: string) => v ?? "—",
  },
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
      scroll={{ x: "max-content" }}
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

const productColumns: ColumnsType<Product> = [
  { title: "Mã", dataIndex: "code", width: 120, render: (v?: string) => v ?? "—" },
  { title: "Tên sản phẩm", dataIndex: "name", ellipsis: true },
  { title: "Thương hiệu", dataIndex: "brandName", ellipsis: true, render: (v?: string) => v ?? "—" },
  { title: "Nhà sản xuất", dataIndex: "manufacturer", ellipsis: true, render: (v?: string) => v ?? "—" },
  {
    title: "Trạng thái",
    dataIndex: "status",
    width: 140,
    render: (status: number) => (
      <Tag color={status === PRODUCT_STATUS.Active ? "success" : "default"}>
        {status === PRODUCT_STATUS.Active ? "Đang kinh doanh" : "Ngừng"}
      </Tag>
    ),
  },
];

function ProductTable({ businessId }: { businessId: string }) {
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const { data, isLoading } = useProductList({
    businessId,
    skipCount: (page - 1) * pageSize,
    maxResultCount: pageSize,
  });
  return (
    <Table
      rowKey="id"
      size="small"
      loading={isLoading}
      columns={productColumns}
      dataSource={data?.items}
      pagination={{
        current: page,
        pageSize,
        total: data?.totalCount,
        onChange: setPage,
        showTotal: (total) => `${total} sản phẩm`,
        showSizeChanger: false,
      }}
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
              key: "products",
              label: "Sản phẩm",
              children: <ProductTable businessId={business.id} />,
            },
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
                <RelatedTable businessId={business.id} kind="cfsCertificates" />
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
