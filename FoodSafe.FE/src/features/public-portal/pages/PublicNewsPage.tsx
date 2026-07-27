import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Alert,
  Button,
  Card,
  Col,
  Divider,
  Empty,
  Input,
  Row,
  Space,
  Spin,
  Table,
  Tag,
  Tabs,
  Typography,
} from "antd";
import type { TablePaginationConfig } from "antd";
import {
  ArrowLeftOutlined,
  EyeOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import { PublicShell } from "../components/PublicShell";
import {
  usePublicAlerts,
  usePublicNews,
  usePublicNewsDetail,
  usePublicRiskAnalyses,
} from "../api/publicPortalQueries";
import {
  ALERT_CATEGORY_CONFIG,
  ALERT_SEVERITY_CONFIG,
  RISK_LEVEL_CONFIG,
  type AlertCategory,
  type AlertSeverity,
  type RiskLevel,
} from "../types/publicPortal.types";

const PAGE_SIZE = 20;

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("vi-VN");
}

// ── News detail view (used via /tin-tuc/:id) ──────────────────────────────────

function NewsDetailView({ id }: { id: string }) {
  const navigate = useNavigate();
  const { data, isLoading, isError } = usePublicNewsDetail(id);

  if (isLoading) {
    return (
      <div style={{ textAlign: "center", padding: 64 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <Alert
        type="error"
        message="Không thể tải bài viết. Vui lòng thử lại."
        showIcon
      />
    );
  }

  return (
    <Space direction="vertical" style={{ width: "100%" }} size="large">
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate("/tin-tuc")}
        type="text"
      >
        Quay lại danh sách
      </Button>

      <Typography.Title level={2}>{data.title}</Typography.Title>

      <Space>
        <Tag color="blue">{data.category}</Tag>
        <Typography.Text type="secondary">
          <ClockCircleOutlined style={{ marginRight: 4 }} />
          {formatDate(data.publishedAt)}
        </Typography.Text>
        <Typography.Text type="secondary">
          <EyeOutlined style={{ marginRight: 4 }} />
          {data.viewCount.toLocaleString("vi-VN")} lượt xem
        </Typography.Text>
      </Space>

      <Divider />

      <div
        style={{ lineHeight: 1.8, whiteSpace: "pre-wrap" }}
        dangerouslySetInnerHTML={undefined}
      >
        <Typography.Paragraph style={{ whiteSpace: "pre-wrap" }}>
          {data.content}
        </Typography.Paragraph>
      </div>

      {data.linkedAlerts && data.linkedAlerts.length > 0 && (
        <>
          <Divider />
          <Typography.Title level={4}>Cảnh báo liên quan</Typography.Title>
          <Space direction="vertical" style={{ width: "100%" }} size="small">
            {data.linkedAlerts.map((alert) => {
              const severityCfg = ALERT_SEVERITY_CONFIG[alert.severity as AlertSeverity];
              const categoryCfg = ALERT_CATEGORY_CONFIG[alert.category as AlertCategory];
              return (
                <Card key={alert.id} size="small">
                  <Space>
                    {severityCfg && <Tag color={severityCfg.color}>{severityCfg.label}</Tag>}
                    {categoryCfg && <Tag>{categoryCfg.label}</Tag>}
                    <Typography.Text strong>{alert.alertNumber}</Typography.Text>
                    <Typography.Text>{alert.title}</Typography.Text>
                    <Typography.Text type="secondary">{formatDate(alert.publishedAt)}</Typography.Text>
                  </Space>
                </Card>
              );
            })}
          </Space>
        </>
      )}
    </Space>
  );
}

// ── News list tab ─────────────────────────────────────────────────────────────

function NewsListTab() {
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState("");
  const [submittedKeyword, setSubmittedKeyword] = useState("");
  const [page, setPage] = useState(1);

  const { data, isFetching, isError } = usePublicNews({
    Keyword: submittedKeyword || undefined,
    SkipCount: (page - 1) * PAGE_SIZE,
    MaxResultCount: PAGE_SIZE,
  });

  const handleSearch = () => {
    setPage(1);
    setSubmittedKeyword(keyword);
  };

  return (
    <Space direction="vertical" style={{ width: "100%" }} size="middle">
      <Space.Compact style={{ width: "100%", maxWidth: 500 }}>
        <Input
          value={keyword}
          placeholder="Tìm kiếm tin tức..."
          onChange={(e) => setKeyword(e.target.value)}
          onPressEnter={handleSearch}
          allowClear
        />
        <Input.Search enterButton="Tìm" loading={isFetching} onSearch={handleSearch} />
      </Space.Compact>

      {isError && (
        <Alert type="error" message="Không thể tải dữ liệu." showIcon />
      )}

      {isFetching ? (
        <div style={{ textAlign: "center", padding: 32 }}>
          <Spin />
        </div>
      ) : (
        <>
          <Row gutter={[16, 16]}>
            {(data?.items ?? []).map((item) => (
              <Col key={item.id} xs={24} md={12} lg={8}>
                <Card
                  hoverable
                  onClick={() => navigate(`/tin-tuc/${item.id}`)}
                  style={{ height: "100%" }}
                >
                  {item.isFeatured && (
                    <Tag color="red" style={{ marginBottom: 8 }}>
                      Nổi bật
                    </Tag>
                  )}
                  <Tag color="blue" style={{ marginBottom: 8 }}>
                    {item.category}
                  </Tag>
                  <Typography.Title level={5} style={{ marginBottom: 8 }}>
                    {item.title}
                  </Typography.Title>
                  <Typography.Paragraph
                    type="secondary"
                    ellipsis={{ rows: 3 }}
                    style={{ marginBottom: 12, fontSize: 13 }}
                  >
                    {item.summary}
                  </Typography.Paragraph>
                  <Space>
                    <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                      <ClockCircleOutlined style={{ marginRight: 4 }} />
                      {formatDate(item.publishedAt)}
                    </Typography.Text>
                    <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                      <EyeOutlined style={{ marginRight: 4 }} />
                      {item.viewCount.toLocaleString("vi-VN")}
                    </Typography.Text>
                  </Space>
                </Card>
              </Col>
            ))}
          </Row>

          {!data?.items.length && !isFetching && (
            <Empty description="Không có tin tức nào" />
          )}

          {(data?.totalCount ?? 0) > PAGE_SIZE && (
            <div style={{ textAlign: "center", marginTop: 16 }}>
              <Button
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                style={{ marginRight: 8 }}
              >
                Trang trước
              </Button>
              <Typography.Text type="secondary">
                Trang {page} / {Math.ceil((data?.totalCount ?? 0) / PAGE_SIZE)}
              </Typography.Text>
              <Button
                disabled={page * PAGE_SIZE >= (data?.totalCount ?? 0)}
                onClick={() => setPage((p) => p + 1)}
                style={{ marginLeft: 8 }}
              >
                Trang sau
              </Button>
            </div>
          )}
        </>
      )}
    </Space>
  );
}

// ── Alerts tab ────────────────────────────────────────────────────────────────

function AlertsTab() {
  const [page, setPage] = useState(1);

  const { data, isFetching, isError } = usePublicAlerts({
    SkipCount: (page - 1) * PAGE_SIZE,
    MaxResultCount: PAGE_SIZE,
  });

  const handleTableChange = (pagination: TablePaginationConfig) => {
    setPage(pagination.current ?? 1);
  };

  return (
    <Space direction="vertical" style={{ width: "100%" }} size="middle">
      {isError && (
        <Alert type="error" message="Không thể tải dữ liệu." showIcon />
      )}

      <Spin spinning={isFetching}>
        <Table
          dataSource={data?.items}
          rowKey="id"
          pagination={{
            current: page,
            pageSize: PAGE_SIZE,
            total: data?.totalCount ?? 0,
            showTotal: (total) => `Tổng ${total} cảnh báo`,
            showSizeChanger: false,
          }}
          onChange={handleTableChange}
          locale={{ emptyText: <Empty description="Không có cảnh báo nào" /> }}
          size="middle"
          expandable={{
            expandedRowRender: (row) => (
              <Typography.Paragraph
                style={{ margin: 0, whiteSpace: "pre-wrap", padding: "12px 0" }}
              >
                {row.content}
              </Typography.Paragraph>
            ),
            rowExpandable: (row) => Boolean(row.content),
          }}
        >
          <Table.Column title="Số cảnh báo" dataIndex="alertNumber" width={150} />
          <Table.Column title="Tiêu đề" dataIndex="title" />
          <Table.Column
            title="Danh mục"
            dataIndex="category"
            width={150}
            render={(cat: AlertCategory) => {
              const cfg = ALERT_CATEGORY_CONFIG[cat];
              return cfg ? <Tag>{cfg.label}</Tag> : <Tag>{cat}</Tag>;
            }}
          />
          <Table.Column
            title="Mức độ"
            dataIndex="severity"
            width={110}
            render={(sev: AlertSeverity) => {
              const cfg = ALERT_SEVERITY_CONFIG[sev];
              return cfg ? <Tag color={cfg.color}>{cfg.label}</Tag> : <Tag>{sev}</Tag>;
            }}
          />
          <Table.Column title="Địa bàn" dataIndex="affectedArea" width={160} />
          <Table.Column
            title="Ngày đăng"
            dataIndex="publishedAt"
            width={120}
            render={(v: string) => formatDate(v)}
          />
        </Table>
      </Spin>
    </Space>
  );
}

// ── Risk analysis tab ─────────────────────────────────────────────────────────

function RiskAnalysisTab() {
  const [page, setPage] = useState(1);

  const { data, isFetching, isError } = usePublicRiskAnalyses({
    SkipCount: (page - 1) * PAGE_SIZE,
    MaxResultCount: PAGE_SIZE,
  });

  const handleTableChange = (pagination: TablePaginationConfig) => {
    setPage(pagination.current ?? 1);
  };

  return (
    <Space direction="vertical" style={{ width: "100%" }} size="middle">
      {isError && (
        <Alert type="error" message="Không thể tải dữ liệu." showIcon />
      )}

      <Spin spinning={isFetching}>
        <Table
          dataSource={data?.items}
          rowKey="id"
          pagination={{
            current: page,
            pageSize: PAGE_SIZE,
            total: data?.totalCount ?? 0,
            showTotal: (total) => `Tổng ${total} phân tích`,
            showSizeChanger: false,
          }}
          onChange={handleTableChange}
          locale={{ emptyText: <Empty description="Không có dữ liệu" /> }}
          size="middle"
          expandable={{
            expandedRowRender: (row) => (
              <Space direction="vertical" style={{ width: "100%", padding: "12px 0" }} size="small">
                <Typography.Text strong>Nội dung phân tích:</Typography.Text>
                <Typography.Paragraph style={{ margin: 0, whiteSpace: "pre-wrap" }}>
                  {row.content}
                </Typography.Paragraph>
                {row.recommendations && (
                  <>
                    <Typography.Text strong>Khuyến nghị:</Typography.Text>
                    <Typography.Paragraph style={{ margin: 0, whiteSpace: "pre-wrap" }}>
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
              return cfg ? <Tag color={cfg.color}>{cfg.label}</Tag> : <Tag>{lvl}</Tag>;
            }}
          />
          <Table.Column title="Sản phẩm liên quan" dataIndex="relatedProducts" width={200} />
          <Table.Column
            title="Ngày đăng"
            dataIndex="publishedAt"
            width={120}
            render={(v: string) => formatDate(v)}
          />
        </Table>
      </Spin>
    </Space>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function PublicNewsPage() {
  const { id } = useParams<{ id?: string }>();

  if (id) {
    return (
      <PublicShell>
        <NewsDetailView id={id} />
      </PublicShell>
    );
  }

  return (
    <PublicShell>
      <Typography.Title level={3} style={{ marginBottom: 24 }}>
        Tin tức, Cảnh báo & Phân tích nguy cơ
      </Typography.Title>

      <Tabs
        items={[
          { key: "news", label: "Tin tức", children: <NewsListTab /> },
          { key: "alerts", label: "Cảnh báo", children: <AlertsTab /> },
          {
            key: "risk",
            label: "Phân tích nguy cơ",
            children: <RiskAnalysisTab />,
          },
        ]}
      />
    </PublicShell>
  );
}
