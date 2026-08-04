import { useState } from "react";
import {
  Alert,
  Button,
  Empty,
  Input,
  Space,
  Spin,
  Table,
  Tag,
  Typography,
} from "antd";
import { DownloadOutlined } from "@ant-design/icons";
import { useTablePagination } from "@/hooks/useTablePagination";
import { PublicShell } from "../components/PublicShell";
import {
  publicTestingResultCertificateUrl,
  usePublicTestingResults,
} from "../api/publicPortalQueries";
import {
  TESTING_OUTCOME_CONFIG,
  type PublicTestingResult,
  type TestingOutcome,
} from "../types/publicPortal.types";

export default function PublicTestingResultSearchPage() {
  const [keyword, setKeyword] = useState("");
  const [submittedKeyword, setSubmittedKeyword] = useState("");
  const pagination = useTablePagination(20);

  const { data, isFetching, isError } = usePublicTestingResults({
    Keyword: submittedKeyword || undefined,
    SkipCount: pagination.skipCount,
    MaxResultCount: pagination.maxResultCount,
  });

  const handleSearch = () => {
    pagination.resetToFirstPage();
    setSubmittedKeyword(keyword);
  };

  return (
    <PublicShell>
      <Typography.Title level={3} style={{ marginBottom: 24 }}>
        Tra cứu kết quả kiểm nghiệm
      </Typography.Title>

      <Space direction="vertical" style={{ width: "100%" }} size="middle">
        <Space>
          <Input
            value={keyword}
            placeholder="Tên hoặc mã mẫu kiểm nghiệm..."
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
            sticky
            dataSource={data?.items}
            rowKey="id"
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
            <Table.Column
              title="Phiếu kiểm nghiệm"
              width={160}
              render={(_v, row: PublicTestingResult) =>
                row.hasCertificateFile ? (
                  <Button
                    type="link"
                    icon={<DownloadOutlined />}
                    href={publicTestingResultCertificateUrl(row.id)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Tải phiếu
                  </Button>
                ) : (
                  <Typography.Text type="secondary">
                    Không công khai
                  </Typography.Text>
                )
              }
            />
          </Table>
        </Spin>
      </Space>
    </PublicShell>
  );
}
