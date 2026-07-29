import { useState } from "react";
import { Alert, Button, Empty, Input, Space, Spin, Table, Tag, Typography } from "antd";
import { useTablePagination } from "@/hooks/useTablePagination";
import { PublicShell } from "../components/PublicShell";
import { usePublicRiskAnalyses } from "../api/publicPortalQueries";
import { RISK_LEVEL_CONFIG, type RiskLevel } from "../types/publicPortal.types";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("vi-VN");
}

export default function PublicRiskAnalysisSearchPage() {
  const [keyword, setKeyword] = useState("");
  const [submittedKeyword, setSubmittedKeyword] = useState("");
  const pagination = useTablePagination(20);

  const { data, isFetching, isError } = usePublicRiskAnalyses({
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
        Tra cứu kết quả phân tích nguy cơ
      </Typography.Title>

      <Space direction="vertical" style={{ width: "100%" }} size="middle">
        <Space>
          <Input
            value={keyword}
            placeholder="Tìm kiếm theo tiêu đề, danh mục, sản phẩm..."
            onChange={(e) => setKeyword(e.target.value)}
            onPressEnter={handleSearch}
            allowClear
            style={{ width: 400 }}
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
            rowKey="id"
            pagination={pagination.buildConfig(data?.totalCount)}
            locale={{ emptyText: <Empty description="Không có dữ liệu" /> }}
            size="middle"
            expandable={{
              expandedRowRender: (row) => (
                <Space
                  direction="vertical"
                  style={{ width: "100%", padding: "12px 0" }}
                  size="small"
                >
                  <Typography.Text strong>Nội dung phân tích:</Typography.Text>
                  <Typography.Paragraph
                    style={{ margin: 0, whiteSpace: "pre-wrap" }}
                  >
                    {row.content}
                  </Typography.Paragraph>
                  {row.recommendations && (
                    <>
                      <Typography.Text strong>Khuyến nghị:</Typography.Text>
                      <Typography.Paragraph
                        style={{ margin: 0, whiteSpace: "pre-wrap" }}
                      >
                        {row.recommendations}
                      </Typography.Paragraph>
                    </>
                  )}
                </Space>
              ),
              rowExpandable: () => true,
            }}
          >
            <Table.Column title="Tiêu đề" dataIndex="title" />
            <Table.Column title="Danh mục" dataIndex="category" width={160} />
            <Table.Column
              title="Mức nguy cơ"
              dataIndex="riskLevel"
              width={120}
              render={(lvl: RiskLevel) => {
                const cfg = RISK_LEVEL_CONFIG[lvl];
                return cfg ? (
                  <Tag color={cfg.color}>{cfg.label}</Tag>
                ) : (
                  <Tag>{lvl}</Tag>
                );
              }}
            />
            <Table.Column
              title="Sản phẩm liên quan"
              dataIndex="relatedProducts"
              width={200}
            />
            <Table.Column
              title="Ngày đăng"
              dataIndex="publishedAt"
              width={120}
              render={(v: string) => formatDate(v)}
            />
          </Table>
        </Spin>
      </Space>
    </PublicShell>
  );
}
