import { useState } from "react";
import { Alert, Empty, Input, Space, Spin, Table, Tabs, Typography } from "antd";
import type { TablePaginationConfig } from "antd";
import { PublicShell } from "../components/PublicShell";
import {
  usePublicAdRegistrations,
  usePublicCfsCertificates,
  usePublicEligibilityCertificates,
  usePublicExportFoodCertificates,
  usePublicProductRegistrations,
  usePublicSelfDeclarations,
} from "../api/publicPortalQueries";
import type { PagedFilter, PublicCertificate } from "../types/publicPortal.types";

const PAGE_SIZE = 20;

interface CertSearchPanelProps {
  useHook: (filter: PagedFilter) => {
    data?: { items: PublicCertificate[]; totalCount: number };
    isFetching: boolean;
    isError: boolean;
  };
  placeholder: string;
  totalLabel: string;
}

function CertSearchPanel({ useHook, placeholder, totalLabel }: CertSearchPanelProps) {
  const [keyword, setKeyword] = useState("");
  const [submittedKeyword, setSubmittedKeyword] = useState("");
  const [page, setPage] = useState(1);

  const filter: PagedFilter = {
    Keyword: submittedKeyword || undefined,
    SkipCount: (page - 1) * PAGE_SIZE,
    MaxResultCount: PAGE_SIZE,
  };

  const { data, isFetching, isError } = useHook(filter);

  const handleSearch = () => {
    setPage(1);
    setSubmittedKeyword(keyword);
  };

  const handleTableChange = (pagination: TablePaginationConfig) => {
    setPage(pagination.current ?? 1);
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
          pagination={{
            current: page,
            pageSize: PAGE_SIZE,
            total: data?.totalCount ?? 0,
            showTotal: (total) => `Tổng ${total} ${totalLabel}`,
            showSizeChanger: false,
          }}
          onChange={handleTableChange}
          locale={{ emptyText: <Empty description="Không có dữ liệu" /> }}
          size="middle"
          scroll={{ x: 900 }}
        >
          <Table.Column
            title="STT"
            render={(_v, _r, i) => (page - 1) * PAGE_SIZE + i + 1}
            width={60}
          />
          <Table.Column title="Số giấy phép" dataIndex="number" width={160} />
          <Table.Column title="Cơ sở" dataIndex="businessName" />
          <Table.Column title="Sản phẩm / Nội dung" dataIndex="productName" />
          <Table.Column title="Ngày cấp" dataIndex="issueDate" width={120} />
          <Table.Column title="Ngày hết hạn" dataIndex="expiryDate" width={120} />
          <Table.Column
            title="Cơ quan cấp"
            dataIndex="certifyingAuthority"
            width={180}
          />
          <Table.Column title="Trạng thái" dataIndex="statusLabel" width={120} />
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
    totalLabel: "giấy phép",
    useHook: usePublicEligibilityCertificates,
  },
  {
    key: "self-declarations",
    label: "Hồ sơ tự công bố",
    placeholder: "Số hồ sơ, tên cơ sở...",
    totalLabel: "hồ sơ",
    useHook: usePublicSelfDeclarations,
  },
  {
    key: "product-registrations",
    label: "Đăng ký công bố sản phẩm",
    placeholder: "Số đăng ký, tên sản phẩm...",
    totalLabel: "đăng ký",
    useHook: usePublicProductRegistrations,
  },
  {
    key: "ad-registrations",
    label: "Đăng ký quảng cáo",
    placeholder: "Số đăng ký, tên cơ sở...",
    totalLabel: "đăng ký",
    useHook: usePublicAdRegistrations,
  },
  {
    key: "cfs",
    label: "Chứng nhận CFS",
    placeholder: "Số chứng nhận, tên cơ sở...",
    totalLabel: "chứng nhận",
    useHook: usePublicCfsCertificates,
  },
  {
    key: "export-food",
    label: "GCN Xuất khẩu thực phẩm",
    placeholder: "Số giấy chứng nhận, tên cơ sở...",
    totalLabel: "giấy chứng nhận",
    useHook: usePublicExportFoodCertificates,
  },
] as const;

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
              totalLabel={tab.totalLabel}
            />
          ),
        }))}
      />
    </PublicShell>
  );
}
