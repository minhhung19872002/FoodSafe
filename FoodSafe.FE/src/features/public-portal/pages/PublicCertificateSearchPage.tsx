import { useState } from "react";
import {
  Alert,
  Button,
  Empty,
  Input,
  Space,
  Spin,
  Table,
  Tabs,
  Typography,
} from "antd";
import { FilePdfOutlined } from "@ant-design/icons";
import { useTablePagination } from "@/hooks/useTablePagination";
import { PublicShell } from "../components/PublicShell";
import {
  usePublicAdRegistrations,
  usePublicCfsCertificates,
  usePublicEligibilityCertificates,
  usePublicExportFoodCertificates,
  usePublicProductRegistrations,
  usePublicSelfDeclarations,
} from "../api/publicPortalQueries";
import type {
  PagedFilter,
  PublicCertificate,
} from "../types/publicPortal.types";

interface CertSearchPanelProps {
  useHook: (filter: PagedFilter) => {
    data?: { items: PublicCertificate[]; totalCount: number };
    isFetching: boolean;
    isError: boolean;
  };
  placeholder: string;
  pdfPath?: string;
}

function CertSearchPanel({
  useHook,
  placeholder,
  pdfPath,
}: CertSearchPanelProps) {
  const [keyword, setKeyword] = useState("");
  const [submittedKeyword, setSubmittedKeyword] = useState("");
  const pagination = useTablePagination(20);

  const filter: PagedFilter = {
    Keyword: submittedKeyword || undefined,
    SkipCount: pagination.skipCount,
    MaxResultCount: pagination.maxResultCount,
  };

  const { data, isFetching, isError } = useHook(filter);

  const handleSearch = () => {
    pagination.resetToFirstPage();
    setSubmittedKeyword(keyword);
  };

  return (
    <Space direction="vertical" style={{ width: "100%" }} size="middle">
      <Space.Compact style={{ width: "100%", maxWidth: 600 }}>
        <Input
          value={keyword}
          placeholder={placeholder}
          onChange={(e) => setKeyword(e.target.value)}
          onPressEnter={handleSearch}
          allowClear
        />
        <Input.Search
          enterButton="Tìm kiếm"
          loading={isFetching}
          onSearch={handleSearch}
        />
      </Space.Compact>

      {isError && (
        <Alert
          type="error"
          message="Không thể tải dữ liệu. Vui lòng thử lại."
          showIcon
        />
      )}

      <Spin spinning={isFetching}>
        <Table
          dataSource={data?.items}
          rowKey={(row) => row.number || row.businessName}
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
          <Table.Column title="Ngày cấp" dataIndex="issueDate" width={120} />
          <Table.Column
            title="Ngày hết hạn"
            dataIndex="expiryDate"
            width={120}
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
          {pdfPath && (
            <Table.Column<PublicCertificate>
              title=""
              key="pdf"
              width={100}
              render={(_, row) => (
                <Button
                  type="link"
                  size="small"
                  icon={<FilePdfOutlined />}
                  href={`/api/v1/public/${pdfPath}/${row.id}/pdf`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Tải PDF
                </Button>
              )}
            />
          )}
        </Table>
      </Spin>
    </Space>
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

export default function PublicCertificateSearchPage() {
  return (
    <PublicShell>
      <Typography.Title level={3} style={{ marginBottom: 24 }}>
        Tra cứu giấy phép & chứng nhận ATTP
      </Typography.Title>

      <Tabs
        items={TAB_ITEMS.map((tab) => ({
          key: tab.key,
          label: tab.label,
          children: (
            <CertSearchPanel
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
