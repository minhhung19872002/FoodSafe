import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Alert,
  Empty,
  Input,
  Space,
  Spin,
  Table,
  Tabs,
  Tag,
  Typography,
} from "antd";
import { useTablePagination } from "@/hooks/useTablePagination";
import { PublicShell } from "../components/PublicShell";
import {
  usePublicBusinessSearch,
  usePublicProductSearch,
} from "../api/publicPortalQueries";
import {
  BUSINESS_STATUS_CONFIG,
  type BusinessStatus,
} from "../types/publicPortal.types";

/** Từ khóa chuyển sang từ ô tra cứu ngoài trang chủ: /tra-cuu-chung?q=... */
function useInitialKeyword(): string {
  const [searchParams] = useSearchParams();
  return searchParams.get("q") ?? "";
}

function BusinessSearchTab() {
  const initialKeyword = useInitialKeyword();
  const [keyword, setKeyword] = useState(initialKeyword);
  const [submittedKeyword, setSubmittedKeyword] = useState(initialKeyword);
  const pagination = useTablePagination(20);

  const filter = {
    Keyword: submittedKeyword || undefined,
    SkipCount: pagination.skipCount,
    MaxResultCount: pagination.maxResultCount,
  };

  const { data, isFetching, isError } = usePublicBusinessSearch(filter);

  const handleSearch = () => {
    pagination.resetToFirstPage();
    setSubmittedKeyword(keyword);
  };

  return (
    <Space direction="vertical" style={{ width: "100%" }} size="middle">
      <Space.Compact style={{ width: "100%", maxWidth: 600 }}>
        <Input
          value={keyword}
          placeholder="Tên hoặc mã cơ sở..."
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
          rowKey={(row) => row.code || row.name}
          pagination={pagination.buildConfig(data?.totalCount)}
          locale={{ emptyText: <Empty description="Không có dữ liệu" /> }}
          size="middle"
        >
          <Table.Column
            title="STT"
            render={(_v, _r, i) =>
              (pagination.page - 1) * pagination.pageSize + i + 1
            }
            width={60}
          />
          <Table.Column title="Tên cơ sở" dataIndex="name" />
          <Table.Column title="Mã cơ sở" dataIndex="code" width={140} />
          <Table.Column
            title="Loại hình"
            dataIndex="businessTypeName"
            width={160}
          />
          <Table.Column title="Địa chỉ" dataIndex="addressText" />
          <Table.Column
            title="Trạng thái"
            dataIndex="status"
            width={140}
            render={(status: BusinessStatus) => {
              const cfg = BUSINESS_STATUS_CONFIG[status];
              return cfg ? (
                <Tag color={cfg.color}>{cfg.label}</Tag>
              ) : (
                <Tag>{status}</Tag>
              );
            }}
          />
          <Table.Column
            title="Cam kết VSATTP"
            dataIndex="hasVsattpCommitment"
            width={130}
            render={(v: boolean) => (
              <Tag color={v ? "green" : "default"}>{v ? "Có" : "Chưa"}</Tag>
            )}
          />
          <Table.Column
            title="Giấy ĐĐK ATTP"
            dataIndex="hasEligibilityCertificate"
            width={130}
            render={(v: boolean) => (
              <Tag color={v ? "green" : "default"}>{v ? "Có" : "Chưa"}</Tag>
            )}
          />
        </Table>
      </Spin>
    </Space>
  );
}

function ProductSearchTab() {
  const initialKeyword = useInitialKeyword();
  const [keyword, setKeyword] = useState(initialKeyword);
  const [submittedKeyword, setSubmittedKeyword] = useState(initialKeyword);
  const pagination = useTablePagination(20);

  const filter = {
    Keyword: submittedKeyword || undefined,
    SkipCount: pagination.skipCount,
    MaxResultCount: pagination.maxResultCount,
  };

  const { data, isFetching, isError } = usePublicProductSearch(filter);

  const handleSearch = () => {
    pagination.resetToFirstPage();
    setSubmittedKeyword(keyword);
  };

  return (
    <Space direction="vertical" style={{ width: "100%" }} size="middle">
      <Space.Compact style={{ width: "100%", maxWidth: 600 }}>
        <Input
          value={keyword}
          placeholder="Tên hoặc mã sản phẩm..."
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
          rowKey={(row) => row.code || row.name}
          pagination={pagination.buildConfig(data?.totalCount)}
          locale={{ emptyText: <Empty description="Không có dữ liệu" /> }}
          size="middle"
        >
          <Table.Column
            title="STT"
            render={(_v, _r, i) =>
              (pagination.page - 1) * pagination.pageSize + i + 1
            }
            width={60}
          />
          <Table.Column title="Tên sản phẩm" dataIndex="name" />
          <Table.Column title="Mã sản phẩm" dataIndex="code" width={140} />
          <Table.Column title="Nhãn hiệu" dataIndex="brandName" width={140} />
          <Table.Column title="Cơ sở sản xuất" dataIndex="businessName" />
          <Table.Column
            title="Nhóm sản phẩm"
            dataIndex="productGroupName"
            width={160}
          />
        </Table>
      </Spin>
    </Space>
  );
}

export default function PublicGeneralSearchPage() {
  return (
    <PublicShell>
      <Typography.Title level={3} style={{ marginBottom: 24 }}>
        Tra cứu cơ sở sản xuất kinh doanh & sản phẩm
      </Typography.Title>

      <Tabs
        items={[
          {
            key: "businesses",
            label: "Cơ sở SXKD",
            children: <BusinessSearchTab />,
          },
          {
            key: "products",
            label: "Sản phẩm",
            children: <ProductSearchTab />,
          },
        ]}
      />
    </PublicShell>
  );
}
