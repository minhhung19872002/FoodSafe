import { useState } from "react";
import {
  Alert,
  Button,
  Empty,
  Input,
  Select,
  Space,
  Spin,
  Table,
  Tag,
  Typography,
} from "antd";
import { useTablePagination } from "@/hooks/useTablePagination";
import { PublicShell } from "../components/PublicShell";
import { usePublicAlerts } from "../api/publicPortalQueries";
import {
  ALERT_CATEGORY_CONFIG,
  ALERT_SEVERITY_CONFIG,
  type AlertCategory,
  type AlertSeverity,
  type PublicAlert,
} from "../types/publicPortal.types";

const ALERT_SEVERITY_OPTIONS = Object.entries(ALERT_SEVERITY_CONFIG).map(
  ([value, cfg]) => ({ value: Number(value), label: cfg.label }),
);

export default function PublicWarnedBusinessesPage() {
  const [keyword, setKeyword] = useState("");
  const [submittedKeyword, setSubmittedKeyword] = useState("");
  const [severities, setSeverities] = useState<AlertSeverity[]>([]);
  const pagination = useTablePagination(20);

  const { data, isFetching, isError } = usePublicAlerts({
    Keyword: submittedKeyword || undefined,
    Severities: severities.length > 0 ? severities : undefined,
    SkipCount: pagination.skipCount,
    MaxResultCount: pagination.maxResultCount,
  });

  const handleSearch = () => {
    pagination.resetToFirstPage();
    setSubmittedKeyword(keyword);
  };

  const handleSeverityChange = (values: AlertSeverity[]) => {
    setSeverities(values);
    pagination.resetToFirstPage();
  };

  return (
    <PublicShell>
      <Typography.Title level={3} style={{ marginBottom: 8 }}>
        Danh sách cảnh báo
      </Typography.Title>
      <Typography.Paragraph type="secondary" style={{ marginBottom: 24 }}>
        Danh sách cảnh báo an toàn thực phẩm được cơ quan quản lý công khai.
      </Typography.Paragraph>

      <Space wrap style={{ marginBottom: 16 }}>
        <Input
          value={keyword}
          placeholder="Tìm kiếm cảnh báo..."
          onChange={(e) => setKeyword(e.target.value)}
          onPressEnter={handleSearch}
          allowClear
          style={{ width: 350 }}
        />
        <Select
          mode="multiple"
          allowClear
          placeholder="Mức độ"
          value={severities}
          onChange={handleSeverityChange}
          options={ALERT_SEVERITY_OPTIONS}
          style={{ minWidth: 200 }}
          maxTagCount="responsive"
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
          style={{ marginBottom: 16 }}
        />
      )}

      <Spin spinning={isFetching}>
        <Table<PublicAlert>
          dataSource={data?.items}
          rowKey="id"
          pagination={pagination.buildConfig(data?.totalCount)}
          locale={{
            emptyText: <Empty description="Không có cảnh báo nào" />,
          }}
          size="middle"
          expandable={{
            expandedRowRender: (row) => (
              <Space
                direction="vertical"
                style={{ width: "100%", padding: "12px 0" }}
              >
                <Typography.Text strong>Nội dung cảnh báo:</Typography.Text>
                <Typography.Paragraph
                  style={{ margin: 0, whiteSpace: "pre-wrap" }}
                >
                  {row.content || "Không có nội dung chi tiết."}
                </Typography.Paragraph>
              </Space>
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
            render={(v: string) =>
              v ? new Date(v).toLocaleDateString("vi-VN") : "—"
            }
          />
        </Table>
      </Spin>
    </PublicShell>
  );
}
