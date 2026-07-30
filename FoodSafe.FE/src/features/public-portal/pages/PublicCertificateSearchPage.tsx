import { useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Alert,
  Button,
  Descriptions,
  Divider,
  Drawer,
  Empty,
  Input,
  Select,
  Space,
  Spin,
  Table,
  Tabs,
  Tag,
  Typography,
} from "antd";
import { EyeOutlined, FilePdfOutlined } from "@ant-design/icons";
import { useTablePagination } from "@/hooks/useTablePagination";
import { matchesSearch } from "@/utils/textSearch";
import { PublicShell } from "../components/PublicShell";
import {
  usePublicAdRegistrations,
  usePublicCertificateDetail,
  usePublicCfsCertificates,
  usePublicEligibilityCertificates,
  usePublicExportFoodCertificates,
  usePublicProductRegistrations,
  usePublicSelfDeclarations,
} from "../api/publicPortalQueries";
import type {
  LicenseStatus,
  PublicCertificate,
  PublicCertificateDetail,
  PublicCertificateFilter,
} from "../types/publicPortal.types";
import {
  BUSINESS_STATUS_CONFIG,
  LICENSE_STATUS_CONFIG,
} from "../types/publicPortal.types";

const STATUS_OPTIONS = (
  Object.entries(LICENSE_STATUS_CONFIG) as [string, { label: string }][]
).map(([value, { label }]) => ({
  label,
  value: Number(value),
}));

const CERT_PATH_MAP: Record<string, string> = {
  eligibility: "eligibility-certificates",
  "self-declarations": "self-declarations",
  "product-registrations": "product-registrations",
  "ad-registrations": "ad-registrations",
  cfs: "cfs-certificates",
  "export-food": "export-food-certificates",
};

interface CertSearchPanelProps {
  tabKey: string;
  useHook: (filter: PublicCertificateFilter) => {
    data?: { items: PublicCertificate[]; totalCount: number };
    isFetching: boolean;
    isError: boolean;
  };
  placeholder: string;
  pdfPath?: string;
}

function CertSearchPanel({
  tabKey,
  useHook,
  placeholder,
  pdfPath,
}: CertSearchPanelProps) {
  const [keyword, setKeyword] = useState("");
  const [submittedKeyword, setSubmittedKeyword] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<LicenseStatus>();
  const [submittedStatus, setSubmittedStatus] = useState<LicenseStatus>();
  const [selectedId, setSelectedId] = useState<string>();
  const pagination = useTablePagination(20);

  const filter: PublicCertificateFilter = {
    Keyword: submittedKeyword || undefined,
    Status: submittedStatus,
    SkipCount: pagination.skipCount,
    MaxResultCount: pagination.maxResultCount,
  };

  const { data, isFetching, isError } = useHook(filter);

  const detailPath = CERT_PATH_MAP[tabKey];
  const { data: detail, isFetching: detailLoading } =
    usePublicCertificateDetail(detailPath, selectedId);

  const handleSearch = () => {
    pagination.resetToFirstPage();
    setSubmittedKeyword(keyword);
    setSubmittedStatus(selectedStatus);
  };

  return (
    <Space direction="vertical" style={{ width: "100%" }} size="middle">
      <Space wrap>
        <Input
          value={keyword}
          placeholder={placeholder}
          onChange={(e) => setKeyword(e.target.value)}
          onPressEnter={handleSearch}
          allowClear
          style={{ width: 350 }}
        />
        <Select
          value={selectedStatus}
          onChange={setSelectedStatus}
          placeholder="Trạng thái"
          showSearch
          filterOption={(input, option) =>
            matchesSearch((option?.label as string) ?? "", input)
          }
          allowClear
          style={{ minWidth: 180 }}
          options={STATUS_OPTIONS}
        />
        <Button type="primary" loading={isFetching} onClick={handleSearch}>
          Tìm kiếm
        </Button>
      </Space>

      {isError && (
        <Alert
          type="error"
          message="Không thể tải dữ liệu. Vui lòng thử lại."
          showIcon
        />
      )}

      <Spin spinning={isFetching}>
        <Table
          sticky
          dataSource={data?.items}
          rowKey={(row) => row.id}
          pagination={pagination.buildConfig(data?.totalCount)}
          locale={{ emptyText: <Empty description="Không có dữ liệu" /> }}
          size="middle"
          scroll={{ x: 900 }}
        >
          <Table.Column
            title="STT"
            render={(_v, _r, i) =>
              (pagination.page - 1) * pagination.pageSize + i + 1
            }
            width={60}
          />
          <Table.Column title="Số giấy phép" dataIndex="number" width={160} />
          <Table.Column title="Cơ sở" dataIndex="businessName" />
          <Table.Column title="Sản phẩm / Nội dung" dataIndex="productName" />
          <Table.Column
            title="Ngày cấp"
            dataIndex="issueDate"
            width={120}
            render={(v: string) =>
              v ? new Date(v).toLocaleDateString("vi-VN") : "-"
            }
          />
          <Table.Column
            title="Ngày hết hạn"
            dataIndex="expiryDate"
            width={120}
            render={(v: string | null) =>
              v ? new Date(v).toLocaleDateString("vi-VN") : "-"
            }
          />
          <Table.Column
            title="Cơ quan cấp"
            dataIndex="certifyingAuthority"
            width={180}
          />
          <Table.Column
            title="Trạng thái"
            dataIndex="statusLabel"
            width={120}
          />
          <Table.Column<PublicCertificate>
            title="Thao tác"
            key="actions"
            width={pdfPath ? 160 : 80}
            render={(_, row) => (
              <Space size="small">
                <Button
                  type="link"
                  size="small"
                  icon={<EyeOutlined />}
                  onClick={() => setSelectedId(row.id)}
                >
                  Xem
                </Button>
                {pdfPath && (
                  <Button
                    type="link"
                    size="small"
                    icon={<FilePdfOutlined />}
                    href={`/api/v1/public/${pdfPath}/${row.id}/pdf`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    PDF
                  </Button>
                )}
              </Space>
            )}
          />
        </Table>
      </Spin>

      <Drawer
        title="Chi tiết giấy phép"
        open={Boolean(selectedId)}
        onClose={() => setSelectedId(undefined)}
        width={600}
        destroyOnClose
      >
        <Spin spinning={detailLoading}>
          {detail && (
            <CertificateDetailContent detail={detail} pdfPath={pdfPath} />
          )}
        </Spin>
      </Drawer>
    </Space>
  );
}

function formatDate(v: string | null | undefined): string {
  return v ? new Date(v).toLocaleDateString("vi-VN") : "-";
}

function buildFullAddress(detail: PublicCertificateDetail): string | null {
  const parts = [
    detail.addressStreet,
    detail.communeName,
    detail.provinceName,
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : null;
}

const STATUS_TAG_COLOR: Record<string, string> = {
  "Còn hiệu lực": "green",
  "Hết hiệu lực": "default",
  "Đã thu hồi": "red",
};

function CertificateDetailContent({
  detail,
  pdfPath,
}: {
  detail: PublicCertificateDetail;
  pdfPath?: string;
}) {
  const fullAddress = buildFullAddress(detail);
  const businessStatusCfg = BUSINESS_STATUS_CONFIG[detail.businessStatus];

  return (
    <>
      <Typography.Title level={5} style={{ marginTop: 0 }}>
        Thông tin giấy phép
      </Typography.Title>
      <Descriptions column={1} bordered size="small">
        <Descriptions.Item label="Số giấy phép">
          {detail.number}
        </Descriptions.Item>
        <Descriptions.Item label="Trạng thái">
          <Tag color={STATUS_TAG_COLOR[detail.statusLabel] ?? "default"}>
            {detail.statusLabel}
          </Tag>
        </Descriptions.Item>
        {detail.certificationScope && (
          <Descriptions.Item label="Phạm vi chứng nhận">
            {detail.certificationScope}
          </Descriptions.Item>
        )}
        {detail.productName && (
          <Descriptions.Item label="Sản phẩm">
            {detail.productName}
          </Descriptions.Item>
        )}
        {detail.manufacturer && (
          <Descriptions.Item label="Nhà sản xuất">
            {detail.manufacturer}
          </Descriptions.Item>
        )}
        <Descriptions.Item label="Ngày cấp">
          {formatDate(detail.issueDate)}
        </Descriptions.Item>
        <Descriptions.Item label="Ngày hết hạn">
          {detail.expiryDate ? formatDate(detail.expiryDate) : "Không thời hạn"}
        </Descriptions.Item>
        {detail.certifyingAuthority && (
          <Descriptions.Item label="Cơ quan cấp">
            {detail.certifyingAuthority}
          </Descriptions.Item>
        )}
        {detail.revokeReason && (
          <Descriptions.Item label="Lý do thu hồi">
            <Typography.Text type="danger">
              {detail.revokeReason}
            </Typography.Text>
          </Descriptions.Item>
        )}
        {detail.revokedAt && (
          <Descriptions.Item label="Ngày thu hồi">
            <Typography.Text type="danger">
              {formatDate(detail.revokedAt)}
            </Typography.Text>
          </Descriptions.Item>
        )}
      </Descriptions>

      {pdfPath && (
        <div style={{ marginTop: 12 }}>
          <Button
            type="primary"
            icon={<FilePdfOutlined />}
            href={`/api/v1/public/${pdfPath}/${detail.id}/pdf`}
            target="_blank"
            rel="noopener noreferrer"
          >
            Tải giấy chứng nhận (PDF)
          </Button>
        </div>
      )}

      <Divider />

      <Typography.Title level={5}>Thông tin cơ sở</Typography.Title>
      <Descriptions column={1} bordered size="small">
        <Descriptions.Item label="Tên cơ sở">
          {detail.businessName}
        </Descriptions.Item>
        {detail.businessCode && (
          <Descriptions.Item label="Mã cơ sở">
            {detail.businessCode}
          </Descriptions.Item>
        )}
        <Descriptions.Item label="Trạng thái hoạt động">
          {businessStatusCfg ? (
            <Tag color={businessStatusCfg.color}>{businessStatusCfg.label}</Tag>
          ) : (
            "-"
          )}
        </Descriptions.Item>
        {detail.businessTypeName && (
          <Descriptions.Item label="Loại hình">
            {detail.businessTypeName}
          </Descriptions.Item>
        )}
        {detail.businessClassificationName && (
          <Descriptions.Item label="Phân loại">
            {detail.businessClassificationName}
          </Descriptions.Item>
        )}
        {detail.taxCode && (
          <Descriptions.Item label="Mã số thuế">
            {detail.taxCode}
          </Descriptions.Item>
        )}
        {detail.representativeName && (
          <Descriptions.Item label="Người đại diện">
            {detail.representativeName}
          </Descriptions.Item>
        )}
        {detail.contactPhone && (
          <Descriptions.Item label="Điện thoại">
            {detail.contactPhone}
          </Descriptions.Item>
        )}
        {detail.contactEmail && (
          <Descriptions.Item label="Email">
            {detail.contactEmail}
          </Descriptions.Item>
        )}
        {fullAddress && (
          <Descriptions.Item label="Địa chỉ">{fullAddress}</Descriptions.Item>
        )}
        {detail.establishedDate && (
          <Descriptions.Item label="Ngày thành lập">
            {formatDate(detail.establishedDate)}
          </Descriptions.Item>
        )}
        {detail.employeeCount != null && (
          <Descriptions.Item label="Số lao động">
            {detail.employeeCount}
          </Descriptions.Item>
        )}
        <Descriptions.Item label="Cam kết VSATTP">
          <Tag color={detail.hasVsattpCommitment ? "green" : "default"}>
            {detail.hasVsattpCommitment ? "Có" : "Chưa"}
          </Tag>
        </Descriptions.Item>
        <Descriptions.Item label="Giấy ĐĐK ATTP">
          <Tag color={detail.hasEligibilityCertificate ? "green" : "default"}>
            {detail.hasEligibilityCertificate ? "Có" : "Chưa"}
          </Tag>
        </Descriptions.Item>
      </Descriptions>
    </>
  );
}

const TAB_ITEMS = [
  {
    key: "eligibility",
    label: "Giấy đủ ĐK ATTP",
    placeholder: "Số giấy phép, tên cơ sở...",
    useHook: usePublicEligibilityCertificates,
    pdfPath: "eligibility-certificates",
  },
  {
    key: "self-declarations",
    label: "Hồ sơ tự công bố",
    placeholder: "Số hồ sơ, tên cơ sở...",
    useHook: usePublicSelfDeclarations,
    pdfPath: "self-declarations",
  },
  {
    key: "product-registrations",
    label: "Đăng ký công bố sản phẩm",
    placeholder: "Số đăng ký, tên sản phẩm...",
    useHook: usePublicProductRegistrations,
    pdfPath: "product-registrations",
  },
  {
    key: "ad-registrations",
    label: "Đăng ký quảng cáo",
    placeholder: "Số đăng ký, tên cơ sở...",
    useHook: usePublicAdRegistrations,
  },
  {
    key: "cfs",
    label: "Chứng nhận CFS",
    placeholder: "Số chứng nhận, tên cơ sở...",
    useHook: usePublicCfsCertificates,
    pdfPath: "cfs-certificates",
  },
  {
    key: "export-food",
    label: "GCN Xuất khẩu thực phẩm",
    placeholder: "Số giấy chứng nhận, tên cơ sở...",
    useHook: usePublicExportFoodCertificates,
    pdfPath: "export-food-certificates",
  },
];

const VALID_TAB_KEYS = new Set(TAB_ITEMS.map((t) => t.key));

export default function PublicCertificateSearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = useMemo(() => {
    const param = searchParams.get("tab");
    return param && VALID_TAB_KEYS.has(param) ? param : TAB_ITEMS[0].key;
  }, []);

  return (
    <PublicShell>
      <Typography.Title level={3} style={{ marginBottom: 24 }}>
        Tra cứu giấy phép & chứng nhận ATTP
      </Typography.Title>

      <Tabs
        defaultActiveKey={initialTab}
        onChange={(key) => setSearchParams({ tab: key }, { replace: true })}
        items={TAB_ITEMS.map((tab) => ({
          key: tab.key,
          label: tab.label,
          children: (
            <CertSearchPanel
              tabKey={tab.key}
              useHook={tab.useHook}
              placeholder={tab.placeholder}
              pdfPath={"pdfPath" in tab ? tab.pdfPath : undefined}
            />
          ),
        }))}
      />
    </PublicShell>
  );
}
