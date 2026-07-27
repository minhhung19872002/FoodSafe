import { useState } from "react";
import {
  Alert,
  Empty,
  Space,
  Spin,
  Table,
  Tag,
  Typography,
} from "antd";
import type { TablePaginationConfig } from "antd";
import { PublicShell } from "../components/PublicShell";
import { usePublicWarnedBusinesses } from "../api/publicPortalQueries";
import {
  ALERT_SEVERITY_CONFIG,
  type AlertSeverity,
  type PublicWarnedBusiness,
} from "../types/publicPortal.types";

const PAGE_SIZE = 20;

export default function PublicWarnedBusinessesPage() {
  const [page, setPage] = useState(1);

  const filter = {
    SkipCount: (page - 1) * PAGE_SIZE,
    MaxResultCount: PAGE_SIZE,
  };

  const { data, isFetching, isError } = usePublicWarnedBusinesses(filter);

  const handleTableChange = (pagination: TablePaginationConfig) => {
    setPage(pagination.current ?? 1);
  };

  return (
    <PublicShell>
      <Typography.Title level={3} style={{ marginBottom: 8 }}>
        Cơ sở đang bị cảnh báo
      </Typography.Title>
      <Typography.Paragraph type="secondary" style={{ marginBottom: 24 }}>
        Danh sách các cơ sở sản xuất kinh doanh thực phẩm đang bị cơ quan quản
        lý cảnh báo vi phạm an toàn thực phẩm.
      </Typography.Paragraph>

      {isError && (
        <Alert
          type="error"
          message="Không thể tải dữ liệu. Vui lòng thử lại."
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      <Spin spinning={isFetching}>
        <Table<PublicWarnedBusiness>
          dataSource={data?.items}
          rowKey={(row) => `${row.businessCode}-${row.alertNumber}`}
          pagination={{
            current: page,
            pageSize: PAGE_SIZE,
            total: data?.totalCount ?? 0,
            showTotal: (total) => `Tổng ${total} cơ sở bị cảnh báo`,
            showSizeChanger: false,
          }}
          onChange={handleTableChange}
          locale={{ emptyText: <Empty description="Không có cơ sở nào đang bị cảnh báo" /> }}
          size="middle"
          expandable={{
            expandedRowRender: (row) => (
              <Space direction="vertical" style={{ width: "100%", padding: "12px 0" }}>
                <Typography.Text strong>Nội dung cảnh báo:</Typography.Text>
                <Typography.Paragraph style={{ margin: 0, whiteSpace: "pre-wrap" }}>
                  {row.content || "Không có nội dung chi tiết."}
                </Typography.Paragraph>
              </Space>
            ),
            rowExpandable: (row) => Boolean(row.content),
          }}
        >
          <Table.Column
            title="STT"
            render={(_v, _r, i) => (page - 1) * PAGE_SIZE + i + 1}
            width={60}
          />
          <Table.Column title="Tên cơ sở" dataIndex="businessName" />
          <Table.Column title="Mã cơ sở" dataIndex="businessCode" width={130} />
          <Table.Column title="Địa chỉ" dataIndex="addressText" />
          <Table.Column title="Số cảnh báo" dataIndex="alertNumber" width={140} />
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
            render={(v: string) => v ? new Date(v).toLocaleDateString("vi-VN") : "—"}
          />
        </Table>
      </Spin>
    </PublicShell>
  );
}
