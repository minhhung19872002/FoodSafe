import { Alert, Descriptions, Drawer, Spin, Table, Tag, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import { useAuditLogDetail } from "../api/auditLogQueries";
import type {
  AuditLogAction,
  AuditLogEntityChange,
} from "../types/auditLog.types";

interface Props {
  auditLogId: string | null;
  onClose: () => void;
}

const actionColumns: ColumnsType<AuditLogAction> = [
  {
    title: "Service",
    dataIndex: "serviceName",
    ellipsis: true,
    render: (v?: string) => v?.split(".").pop() ?? "—",
  },
  { title: "Method", dataIndex: "methodName", width: 180, ellipsis: true },
  {
    title: "Thời lượng (ms)",
    dataIndex: "executionDuration",
    width: 120,
    align: "right",
  },
];

const changeColumns: ColumnsType<AuditLogEntityChange> = [
  {
    title: "Entity",
    dataIndex: "entityTypeFullName",
    ellipsis: true,
    render: (v?: string) => v?.split(".").pop() ?? "—",
  },
  { title: "ID", dataIndex: "entityId", width: 290, ellipsis: true },
  {
    title: "Thay đổi",
    dataIndex: "changeType",
    width: 100,
    render: (v: string) => <Tag>{v}</Tag>,
  },
];

export function AuditLogDetailDrawer({ auditLogId, onClose }: Props) {
  const { data, isLoading } = useAuditLogDetail(auditLogId);

  return (
    <Drawer
      title="Chi tiết thao tác"
      open={auditLogId !== null}
      onClose={onClose}
      width={720}
    >
      {isLoading && <Spin />}
      {data && (
        <>
          <Descriptions column={2} size="small" bordered>
            <Descriptions.Item label="Thời gian" span={2}>
              {dayjs(data.executionTime).format("DD/MM/YYYY HH:mm:ss")}
            </Descriptions.Item>
            <Descriptions.Item label="Người dùng">
              {data.userName ?? "—"}
            </Descriptions.Item>
            <Descriptions.Item label="Địa chỉ IP">
              {data.clientIpAddress ?? "—"}
            </Descriptions.Item>
            <Descriptions.Item label="Phương thức">
              {data.httpMethod ?? "—"}
            </Descriptions.Item>
            <Descriptions.Item label="Mã trạng thái">
              {data.httpStatusCode ?? "—"}
            </Descriptions.Item>
            <Descriptions.Item label="URL" span={2}>
              <Typography.Text code>{data.url ?? "—"}</Typography.Text>
            </Descriptions.Item>
            <Descriptions.Item label="Thời lượng">
              {data.executionDuration} ms
            </Descriptions.Item>
            <Descriptions.Item label="Correlation ID">
              <Typography.Text copyable style={{ fontSize: 12 }}>
                {data.correlationId ?? "—"}
              </Typography.Text>
            </Descriptions.Item>
            <Descriptions.Item label="Trình duyệt" span={2}>
              <span style={{ fontSize: 12 }}>{data.browserInfo ?? "—"}</span>
            </Descriptions.Item>
          </Descriptions>

          {data.exceptions && (
            <Alert
              type="error"
              style={{ marginTop: 16 }}
              message="Lỗi phát sinh"
              description={
                <pre
                  style={{
                    whiteSpace: "pre-wrap",
                    fontSize: 12,
                    maxHeight: 240,
                    overflow: "auto",
                    margin: 0,
                  }}
                >
                  {data.exceptions}
                </pre>
              }
            />
          )}

          {data.actions.length > 0 && (
            <>
              <Typography.Title level={5} style={{ marginTop: 16 }}>
                Hành động ({data.actions.length})
              </Typography.Title>
              <Table
                rowKey={(row) => `${row.methodName}-${row.executionTime}`}
                columns={actionColumns}
                dataSource={data.actions}
                size="small"
                pagination={false}
              />
            </>
          )}

          {data.entityChanges.length > 0 && (
            <>
              <Typography.Title level={5} style={{ marginTop: 16 }}>
                Thay đổi dữ liệu ({data.entityChanges.length})
              </Typography.Title>
              <Table
                rowKey={(row) => `${row.entityId}-${row.changeTime}`}
                columns={changeColumns}
                dataSource={data.entityChanges}
                size="small"
                pagination={false}
              />
            </>
          )}
        </>
      )}
    </Drawer>
  );
}
