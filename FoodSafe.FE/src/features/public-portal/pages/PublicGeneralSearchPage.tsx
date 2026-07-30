import { useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Alert,
  Button,
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
import { useTablePagination } from "@/hooks/useTablePagination";
import { matchesSearch } from "@/utils/textSearch";
import { PublicShell } from "../components/PublicShell";
import {
  usePublicBusinessMapData,
  usePublicBusinessSearch,
  usePublicBusinessTypeOptions,
  usePublicInspectionResults,
  usePublicProductGroupOptions,
  usePublicProductSearch,
  usePublicTestingResults,
} from "../api/publicPortalQueries";
import { PublicBusinessMap } from "../components/PublicBusinessMap";
import {
  BUSINESS_STATUS_CONFIG,
  INSPECTION_OVERALL_RESULT_CONFIG,
  INSPECTION_TYPE_CONFIG,
  TESTING_OUTCOME_CONFIG,
  type BusinessStatus,
  type InspectionOverallResult,
  type InspectionType,
  type TestingOutcome,
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
  const [selectedTypeIds, setSelectedTypeIds] = useState<string[]>([]);
  const [submittedTypeIds, setSubmittedTypeIds] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<string>("list");
  const pagination = useTablePagination(20);

  const { data: businessTypes } = usePublicBusinessTypeOptions();

  const listFilter = {
    Keyword: submittedKeyword || undefined,
    BusinessTypeIds: submittedTypeIds.length > 0 ? submittedTypeIds : undefined,
    SkipCount: pagination.skipCount,
    MaxResultCount: pagination.maxResultCount,
  };

  const { data, isFetching, isError } = usePublicBusinessSearch(listFilter);

  const { data: mapData, isFetching: isMapFetching } = usePublicBusinessMapData(
    submittedKeyword || undefined,
  );

  const handleSearch = () => {
    pagination.resetToFirstPage();
    setSubmittedKeyword(keyword);
    setSubmittedTypeIds(selectedTypeIds);
  };

  return (
    <Space direction="vertical" style={{ width: "100%" }} size="middle">
      <Space wrap>
        <Input
          value={keyword}
          placeholder="Tên hoặc mã cơ sở..."
          onChange={(e) => setKeyword(e.target.value)}
          onPressEnter={handleSearch}
          allowClear
          style={{ width: 350 }}
        />
        <Select
          mode="multiple"
          value={selectedTypeIds}
          onChange={setSelectedTypeIds}
          placeholder="Loại hình"
          showSearch
          filterOption={(input, option) =>
            matchesSearch((option?.label as string) ?? "", input)
          }
          allowClear
          style={{ minWidth: 220 }}
          maxTagCount="responsive"
          options={businessTypes?.map((t) => ({ label: t.name, value: t.id }))}
        />
        <Button
          type="primary"
          loading={isFetching || isMapFetching}
          onClick={handleSearch}
        >
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

      <Tabs
        activeKey={viewMode}
        onChange={setViewMode}
        size="small"
        items={[
          {
            key: "list",
            label: "Danh sách",
            children: (
              <Spin spinning={isFetching}>
                <Table
                  dataSource={data?.items}
                  rowKey={(row) => row.code || row.name}
                  pagination={pagination.buildConfig(data?.totalCount)}
                  locale={{
                    emptyText: <Empty description="Không có dữ liệu" />,
                  }}
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
                      <Tag color={v ? "green" : "default"}>
                        {v ? "Có" : "Chưa"}
                      </Tag>
                    )}
                  />
                  <Table.Column
                    title="Giấy ĐĐK ATTP"
                    dataIndex="hasEligibilityCertificate"
                    width={130}
                    render={(v: boolean) => (
                      <Tag color={v ? "green" : "default"}>
                        {v ? "Có" : "Chưa"}
                      </Tag>
                    )}
                  />
                </Table>
              </Spin>
            ),
          },
          {
            key: "map",
            label: "Bản đồ",
            children: (
              <Spin spinning={isMapFetching}>
                <PublicBusinessMap
                  businesses={mapData?.items ?? []}
                  height={480}
                />
              </Spin>
            ),
          },
        ]}
      />
    </Space>
  );
}

function ProductSearchTab() {
  const initialKeyword = useInitialKeyword();
  const [keyword, setKeyword] = useState(initialKeyword);
  const [submittedKeyword, setSubmittedKeyword] = useState(initialKeyword);
  const [selectedGroupId, setSelectedGroupId] = useState<string>();
  const [submittedGroupId, setSubmittedGroupId] = useState<string>();
  const pagination = useTablePagination(20);

  const { data: productGroups } = usePublicProductGroupOptions();

  const filter = {
    Keyword: submittedKeyword || undefined,
    ProductGroupId: submittedGroupId,
    SkipCount: pagination.skipCount,
    MaxResultCount: pagination.maxResultCount,
  };

  const { data, isFetching, isError } = usePublicProductSearch(filter);

  const handleSearch = () => {
    pagination.resetToFirstPage();
    setSubmittedKeyword(keyword);
    setSubmittedGroupId(selectedGroupId);
  };

  return (
    <Space direction="vertical" style={{ width: "100%" }} size="middle">
      <Space wrap>
        <Input
          value={keyword}
          placeholder="Tên hoặc mã sản phẩm..."
          onChange={(e) => setKeyword(e.target.value)}
          onPressEnter={handleSearch}
          allowClear
          style={{ width: 350 }}
        />
        <Select
          value={selectedGroupId}
          onChange={setSelectedGroupId}
          placeholder="Nhóm sản phẩm"
          showSearch
          filterOption={(input, option) =>
            matchesSearch((option?.label as string) ?? "", input)
          }
          allowClear
          style={{ minWidth: 220 }}
          options={productGroups?.map((g) => ({ label: g.name, value: g.id }))}
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
          <Table.Column
            title="Nhà sản xuất"
            dataIndex="manufacturer"
            width={180}
          />
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

const TESTING_OUTCOME_OPTIONS = Object.entries(TESTING_OUTCOME_CONFIG).map(
  ([value, cfg]) => ({ label: cfg.label, value: Number(value) }),
);

function TestingResultSearchTab() {
  const initialKeyword = useInitialKeyword();
  const [keyword, setKeyword] = useState(initialKeyword);
  const [submittedKeyword, setSubmittedKeyword] = useState(initialKeyword);
  const [selectedOutcome, setSelectedOutcome] = useState<TestingOutcome>();
  const [submittedOutcome, setSubmittedOutcome] = useState<TestingOutcome>();
  const pagination = useTablePagination(20);

  const filter = {
    Keyword: submittedKeyword || undefined,
    Outcome: submittedOutcome,
    SkipCount: pagination.skipCount,
    MaxResultCount: pagination.maxResultCount,
  };

  const { data, isFetching, isError } = usePublicTestingResults(filter);

  const handleSearch = () => {
    pagination.resetToFirstPage();
    setSubmittedKeyword(keyword);
    setSubmittedOutcome(selectedOutcome);
  };

  return (
    <Space direction="vertical" style={{ width: "100%" }} size="middle">
      <Space wrap>
        <Input
          value={keyword}
          placeholder="Tên hoặc mã mẫu kiểm nghiệm..."
          onChange={(e) => setKeyword(e.target.value)}
          onPressEnter={handleSearch}
          allowClear
          style={{ width: 350 }}
        />
        <Select
          value={selectedOutcome}
          onChange={setSelectedOutcome}
          placeholder="Kết quả"
          showSearch
          filterOption={(input, option) =>
            matchesSearch((option?.label as string) ?? "", input)
          }
          allowClear
          style={{ minWidth: 180 }}
          options={TESTING_OUTCOME_OPTIONS}
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
          dataSource={data?.items}
          rowKey={(row) => row.id}
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
          <Table.Column title="Mã mẫu" dataIndex="sampleCode" width={140} />
          <Table.Column title="Tên mẫu" dataIndex="sampleName" />
          <Table.Column title="Cơ sở" dataIndex="businessName" />
          <Table.Column
            title="Đơn vị kiểm nghiệm"
            dataIndex="testingCenterName"
            width={200}
          />
          <Table.Column
            title="Ngày lấy mẫu"
            dataIndex="sampleDate"
            width={130}
            render={(v: string) =>
              v ? new Date(v).toLocaleDateString("vi-VN") : "-"
            }
          />
          <Table.Column
            title="Ngày có kết quả"
            dataIndex="resultDate"
            width={140}
            render={(v: string | null) =>
              v ? new Date(v).toLocaleDateString("vi-VN") : "-"
            }
          />
          <Table.Column
            title="Kết quả"
            dataIndex="outcome"
            width={160}
            render={(outcome: TestingOutcome) => {
              const cfg = TESTING_OUTCOME_CONFIG[outcome];
              return cfg ? (
                <Tag color={cfg.color}>{cfg.label}</Tag>
              ) : (
                <Tag>{outcome}</Tag>
              );
            }}
          />
          <Table.Column
            title="Chỉ tiêu không đạt"
            dataIndex="hasFailedIndicators"
            width={150}
            render={(v: boolean) => (
              <Tag color={v ? "red" : "default"}>{v ? "Có" : "Không"}</Tag>
            )}
          />
        </Table>
      </Spin>
    </Space>
  );
}

function InspectionResultSearchTab() {
  const initialKeyword = useInitialKeyword();
  const [keyword, setKeyword] = useState(initialKeyword);
  const [submittedKeyword, setSubmittedKeyword] = useState(initialKeyword);
  const pagination = useTablePagination(20);

  const filter = {
    Keyword: submittedKeyword || undefined,
    SkipCount: pagination.skipCount,
    MaxResultCount: pagination.maxResultCount,
  };

  const { data, isFetching, isError } = usePublicInspectionResults(filter);

  const handleSearch = () => {
    pagination.resetToFirstPage();
    setSubmittedKeyword(keyword);
  };

  return (
    <Space direction="vertical" style={{ width: "100%" }} size="middle">
      <Space>
        <Input
          value={keyword}
          placeholder="Tên cơ sở hoặc địa chỉ..."
          onChange={(e) => setKeyword(e.target.value)}
          onPressEnter={handleSearch}
          allowClear
          style={{ width: 350 }}
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
          dataSource={data?.items}
          rowKey={(row) => row.id}
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
          <Table.Column title="Tên cơ sở" dataIndex="businessName" />
          <Table.Column title="Địa chỉ" dataIndex="businessAddress" />
          <Table.Column
            title="Ngày kiểm tra"
            dataIndex="inspectionDate"
            width={130}
            render={(v: string) =>
              v ? new Date(v).toLocaleDateString("vi-VN") : "-"
            }
          />
          <Table.Column
            title="Hình thức"
            dataIndex="inspectionType"
            width={150}
            render={(t: InspectionType) => {
              const cfg = INSPECTION_TYPE_CONFIG[t];
              return cfg ? <Tag>{cfg.label}</Tag> : <Tag>{t}</Tag>;
            }}
          />
          <Table.Column
            title="Kết quả"
            dataIndex="overallResult"
            width={160}
            render={(r: InspectionOverallResult) => {
              const cfg = INSPECTION_OVERALL_RESULT_CONFIG[r];
              return cfg ? (
                <Tag color={cfg.color}>{cfg.label}</Tag>
              ) : (
                <Tag>{r}</Tag>
              );
            }}
          />
          <Table.Column
            title="Vi phạm"
            dataIndex="hasViolation"
            width={100}
            render={(v: boolean) => (
              <Tag color={v ? "red" : "green"}>{v ? "Có" : "Không"}</Tag>
            )}
          />
        </Table>
      </Spin>
    </Space>
  );
}

const GENERAL_TAB_KEYS = new Set([
  "businesses",
  "products",
  "testing-results",
  "inspection-results",
]);

export default function PublicGeneralSearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = useMemo(() => {
    const param = searchParams.get("tab");
    return param && GENERAL_TAB_KEYS.has(param) ? param : "businesses";
  }, []);

  return (
    <PublicShell>
      <Typography.Title level={3} style={{ marginBottom: 24 }}>
        Tra cứu thông tin an toàn thực phẩm
      </Typography.Title>

      <Tabs
        defaultActiveKey={initialTab}
        onChange={(key) => setSearchParams({ tab: key }, { replace: true })}
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
          {
            key: "testing-results",
            label: "Kết quả kiểm nghiệm",
            children: <TestingResultSearchTab />,
          },
          {
            key: "inspection-results",
            label: "Kết quả thanh kiểm tra",
            children: <InspectionResultSearchTab />,
          },
        ]}
      />
    </PublicShell>
  );
}
