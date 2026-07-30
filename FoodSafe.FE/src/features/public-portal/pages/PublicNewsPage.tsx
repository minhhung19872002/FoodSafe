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
  Pagination,
  Row,
  Select,
  Space,
  Spin,
  Table,
  Tag,
  Tabs,
  Typography,
} from "antd";
import { useTablePagination } from "@/hooks/useTablePagination";
import { SafeHtmlContent } from "@/components/RichTextEditor/SafeHtmlContent";
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
  NEWS_CATEGORIES,
  RISK_LEVEL_CONFIG,
  type AlertCategory,
  type AlertSeverity,
  type RiskLevel,
} from "../types/publicPortal.types";

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

      <SafeHtmlContent html={data.content} className="public-news-content" />

      {data.linkedAlerts && data.linkedAlerts.length > 0 && (
        <>
          <Divider />
          <Typography.Title level={4}>Cảnh báo liên quan</Typography.Title>
          <Space direction="vertical" style={{ width: "100%" }} size="small">
            {data.linkedAlerts.map((alert) => {
              const severityCfg =
                ALERT_SEVERITY_CONFIG[alert.severity as AlertSeverity];
              const categoryCfg =
                ALERT_CATEGORY_CONFIG[alert.category as AlertCategory];
              return (
                <Card key={alert.id} size="small">
                  <Space>
                    {severityCfg && (
                      <Tag color={severityCfg.color}>{severityCfg.label}</Tag>
                    )}
                    {categoryCfg && <Tag>{categoryCfg.label}</Tag>}
                    <Typography.Text strong>
                      {alert.alertNumber}
                    </Typography.Text>
                    <Typography.Text>{alert.title}</Typography.Text>
                    <Typography.Text type="secondary">
                      {formatDate(alert.publishedAt)}
                    </Typography.Text>
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

const CATEGORY_OPTIONS = NEWS_CATEGORIES.map((c) => ({ value: c, label: c }));

function NewsListTab() {
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState("");
  const [submittedKeyword, setSubmittedKeyword] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const pagination = useTablePagination(20);

  const { data, isFetching, isError } = usePublicNews({
    Keyword: submittedKeyword || undefined,
    Categories: categories.length > 0 ? categories : undefined,
    SkipCount: pagination.skipCount,
    MaxResultCount: pagination.maxResultCount,
  });

  const handleSearch = () => {
    pagination.resetToFirstPage();
    setSubmittedKeyword(keyword);
  };

  const handleCategoryChange = (values: string[]) => {
    setCategories(values);
    pagination.resetToFirstPage();
  };

  return (
    <Space direction="vertical" style={{ width: "100%" }} size="middle">
      <Space wrap>
        <Input
          value={keyword}
          placeholder="Tìm kiếm tin tức..."
          onChange={(e) => setKeyword(e.target.value)}
          onPressEnter={handleSearch}
          allowClear
          style={{ width: 260 }}
        />
        <Select
          mode="multiple"
          allowClear
          placeholder="Chọn chuyên mục"
          value={categories}
          onChange={handleCategoryChange}
          options={CATEGORY_OPTIONS}
          style={{ minWidth: 220 }}
          maxTagCount="responsive"
        />
        <Button type="primary" loading={isFetching} onClick={handleSearch}>
          Tìm
        </Button>
      </Space>

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

          {(data?.totalCount ?? 0) > 0 && (
            <Row justify="center" style={{ marginTop: 16 }}>
              <Pagination {...pagination.buildConfig(data?.totalCount)} />
            </Row>
          )}
        </>
      )}
    </Space>
  );
}

// ── Alerts tab ────────────────────────────────────────────────────────────────

const ALERT_SEVERITY_OPTIONS = Object.entries(ALERT_SEVERITY_CONFIG).map(
  ([value, cfg]) => ({ value: Number(value), label: cfg.label }),
);

function AlertsTab() {
  const [keyword, setKeyword] = useState("");
  const [submittedKeyword, setSubmittedKeyword] = useState("");
  const [alertSeverities, setAlertSeverities] = useState<AlertSeverity[]>([]);
  const pagination = useTablePagination(20);

  const { data, isFetching, isError } = usePublicAlerts({
    Keyword: submittedKeyword || undefined,
    Severities: alertSeverities.length > 0 ? alertSeverities : undefined,
    SkipCount: pagination.skipCount,
    MaxResultCount: pagination.maxResultCount,
  });

  const handleSearch = () => {
    pagination.resetToFirstPage();
    setSubmittedKeyword(keyword);
  };

  const handleSeverityChange = (values: AlertSeverity[]) => {
    setAlertSeverities(values);
    pagination.resetToFirstPage();
  };

  return (
    <Space direction="vertical" style={{ width: "100%" }} size="middle">
      <Space wrap>
        <Input
          value={keyword}
          placeholder="Tìm kiếm cảnh báo..."
          onChange={(e) => setKeyword(e.target.value)}
          onPressEnter={handleSearch}
          allowClear
          style={{ width: 260 }}
        />
        <Select
          mode="multiple"
          allowClear
          placeholder="Mức độ"
          value={alertSeverities}
          onChange={handleSeverityChange}
          options={ALERT_SEVERITY_OPTIONS}
          style={{ minWidth: 200 }}
          maxTagCount="responsive"
        />
        <Button type="primary" loading={isFetching} onClick={handleSearch}>
          Tìm
        </Button>
      </Space>

      {isError && (
        <Alert type="error" message="Không thể tải dữ liệu." showIcon />
      )}

      <Spin spinning={isFetching}>
        <Table
          dataSource={data?.items}
          rowKey="id"
          pagination={pagination.buildConfig(data?.totalCount)}
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
          <Table.Column
            title="Số cảnh báo"
            dataIndex="alertNumber"
            width={150}
          />
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
              return cfg ? (
                <Tag color={cfg.color}>{cfg.label}</Tag>
              ) : (
                <Tag>{sev}</Tag>
              );
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

const RISK_LEVEL_OPTIONS = Object.entries(RISK_LEVEL_CONFIG).map(
  ([value, cfg]) => ({ value: Number(value), label: cfg.label }),
);

function RiskAnalysisTab() {
  const [keyword, setKeyword] = useState("");
  const [submittedKeyword, setSubmittedKeyword] = useState("");
  const [riskLevels, setRiskLevels] = useState<RiskLevel[]>([]);
  const pagination = useTablePagination(20);

  const { data, isFetching, isError } = usePublicRiskAnalyses({
    Keyword: submittedKeyword || undefined,
    Severities: riskLevels.length > 0 ? riskLevels : undefined,
    SkipCount: pagination.skipCount,
    MaxResultCount: pagination.maxResultCount,
  });

  const handleSearch = () => {
    pagination.resetToFirstPage();
    setSubmittedKeyword(keyword);
  };

  const handleRiskLevelChange = (values: RiskLevel[]) => {
    setRiskLevels(values);
    pagination.resetToFirstPage();
  };

  return (
    <Space direction="vertical" style={{ width: "100%" }} size="middle">
      <Space wrap>
        <Input
          value={keyword}
          placeholder="Tìm kiếm phân tích nguy cơ..."
          onChange={(e) => setKeyword(e.target.value)}
          onPressEnter={handleSearch}
          allowClear
          style={{ width: 260 }}
        />
        <Select
          mode="multiple"
          allowClear
          placeholder="Mức nguy cơ"
          value={riskLevels}
          onChange={handleRiskLevelChange}
          options={RISK_LEVEL_OPTIONS}
          style={{ minWidth: 220 }}
          maxTagCount="responsive"
        />
        <Button type="primary" loading={isFetching} onClick={handleSearch}>
          Tìm
        </Button>
      </Space>

      {isError && (
        <Alert type="error" message="Không thể tải dữ liệu." showIcon />
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
