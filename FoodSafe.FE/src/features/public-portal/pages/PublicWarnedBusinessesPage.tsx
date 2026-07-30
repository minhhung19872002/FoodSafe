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
import { useTablePagination } from "@/hooks/useTablePagination";
import { PublicShell } from "../components/PublicShell";
import { usePublicWarnedBusinesses } from "../api/publicPortalQueries";
import {
  ALERT_SEVERITY_CONFIG,
  type AlertSeverity,
  type PublicWarnedBusiness,
} from "../types/publicPortal.types";

export default function PublicWarnedBusinessesPage() {
  const [keyword, setKeyword] = useState("");
  const [submittedKeyword, setSubmittedKeyword] = useState("");
  const pagination = useTablePagination(20);

  const filter = {
    Keyword: submittedKeyword || undefined,
    SkipCount: pagination.skipCount,
    MaxResultCount: pagination.maxResultCount,
  };

  const { data, isFetching, isError } = usePublicWarnedBusinesses(filter);

  const handleSearch = () => {
    pagination.resetToFirstPage();
    setSubmittedKeyword(keyword);
  };

  return (
    <PublicShell>
      <Typography.Title level={3} style={{ marginBottom: 8 }}>
        Danh sách cơ sở đang bị cảnh báo
      </Typography.Title>
      <Typography.Paragraph type="secondary" style={{ marginBottom: 24 }}>
        Danh sách các cơ sở sản xuất kinh doanh thực phẩm đang bị cơ quan quản
        lý cảnh báo vi phạm an toàn thực phẩm.
      </Typography.Paragraph>

      <Space wrap style={{ marginBottom: 16 }}>
        <Input
          value={keyword}
          placeholder="Tên hoặc mã cơ sở..."
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
          message={`Không thể tải dữ liệu. Vui lòng thử lại.`+ isError}
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      <Spin spinning={isFetching}>
        <Table<PublicWarnedBusiness>
          dataSource={data?.items}
          rowKey={(row) => `${row.businessCode}-${row.alertNumber}`}
          pagination={pagination.buildConfig(data?.totalCount)}
          locale={{
            emptyText: (
              <Empty description="Không có cơ sở nào đang bị cảnh báo" />
            ),
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
            title="STT"
            render={(_v, _r, i) =>
              (pagination.page - 1) * pagination.pageSize + i + 1
            }
            width={60}
          />
          <Table.Column title="Tên cơ sở" dataIndex="businessName" />
          <Table.Column title="Mã cơ sở" dataIndex="businessCode" width={130} />
          <Table.Column title="Địa chỉ" dataIndex="addressText" />
          <Table.Column
            title="Số cảnh báo"
            dataIndex="alertNumber"
            width={140}
          />
          <Table.Column title="Tiêu đề cảnh báo" dataIndex="alertTitle" />
          <Table.Column
            title="Mức độ"
            dataIndex="severity"
            width={110}
            render={(severity: AlertSeverity) => {
              const cfg = ALERT_SEVERITY_CONFIG[severity];
              return cfg ? (
                <Tag color={cfg.color}>{cfg.label}</Tag>
              ) : (
                <Tag>{severity}</Tag>
              );
            }}
          />
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
