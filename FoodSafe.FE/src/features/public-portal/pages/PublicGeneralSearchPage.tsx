import { useState } from "react";
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
import type { TablePaginationConfig } from "antd";
import { PublicShell } from "../components/PublicShell";
import {
  usePublicBusinessSearch,
  usePublicProductSearch,
} from "../api/publicPortalQueries";
import {
  BUSINESS_STATUS_CONFIG,
  type BusinessStatus,
} from "../types/publicPortal.types";

const PAGE_SIZE = 20;

function BusinessSearchTab() {
  const [keyword, setKeyword] = useState("");
  const [submittedKeyword, setSubmittedKeyword] = useState("");
  const [page, setPage] = useState(1);

  const filter = {
    Keyword: submittedKeyword || undefined,
    SkipCount: (page - 1) * PAGE_SIZE,
    MaxResultCount: PAGE_SIZE,
  };

  const { data, isFetching, isError } = usePublicBusinessSearch(filter);

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
          pagination={{
            current: page,
            pageSize: PAGE_SIZE,
            total: data?.totalCount ?? 0,
            showTotal: (total) => `Tổng ${total} cơ sở`,
            showSizeChanger: false,
          }}
          onChange={handleTableChange}
          locale={{ emptyText: <Empty description="Không có dữ liệu" /> }}
          size="middle"
        >
          <Table.Column
            title="STT"
            render={(_v, _r, i) => (page - 1) * PAGE_SIZE + i + 1}
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
  const [keyword, setKeyword] = useState("");
  const [submittedKeyword, setSubmittedKeyword] = useState("");
  const [page, setPage] = useState(1);

  const filter = {
    Keyword: submittedKeyword || undefined,
    SkipCount: (page - 1) * PAGE_SIZE,
    MaxResultCount: PAGE_SIZE,
  };

  const { data, isFetching, isError } = usePublicProductSearch(filter);

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
          pagination={{
            current: page,
            pageSize: PAGE_SIZE,
            total: data?.totalCount ?? 0,
            showTotal: (total) => `Tổng ${total} sản phẩm`,
            showSizeChanger: false,
          }}
          onChange={handleTableChange}
          locale={{ emptyText: <Empty description="Không có dữ liệu" /> }}
          size="middle"
        >
          <Table.Column
            title="STT"
            render={(_v, _r, i) => (page - 1) * PAGE_SIZE + i + 1}
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
