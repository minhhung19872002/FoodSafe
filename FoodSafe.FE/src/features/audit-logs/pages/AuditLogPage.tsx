import { useState } from "react";
import {
  Button,
  Descriptions,
  Drawer,
  Input,
  message,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  Tooltip,
  Typography,
  DatePicker,
} from "antd";
import type { ColumnsType, TablePaginationConfig } from "antd/es/table";
import { ExportOutlined, EyeOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { PageHeader } from "@/components/PageHeader";
import { saveDownload } from "@/utils/download";
import {
  useAuditLogs,
  useAuditLogDetail,
  useExportAuditLogs,
} from "../api/auditLogQueries";
import type { AuditLog, AuditLogFilter } from "../types/auditLog.types";

const { RangePicker } = DatePicker;

const HTTP_METHOD_COLORS: Record<string, string> = {
  GET: "blue",
  POST: "green",
  PUT: "orange",
  DELETE: "red",
  PATCH: "purple",
};

function statusColor(code?: number) {
  if (!code) return "default";
  if (code < 300) return "success";
  if (code < 400) return "warning";
  return "error";
}

export default function AuditLogPage() {
  const [filter, setFilter] = useState<AuditLogFilter>({
    skipCount: 0,
    maxResultCount: 20,
  });
  const [detailId, setDetailId] = useState<string>();

  const { data, isLoading } = useAuditLogs(filter);
  const { data: detail, isLoading: detailLoading } =
    useAuditLogDetail(detailId);
  const exportMut = useExportAuditLogs();

  const columns: ColumnsType<AuditLog> = [
    {
      title: "Thời gian",
      dataIndex: "executionTime",
      width: 170,
      render: (v: string) => dayjs(v).format("DD/MM/YYYY HH:mm:ss"),
    },
    {
      title: "Người dùng",
      dataIndex: "userName",
      width: 140,
      render: (v?: string) => v ?? "—",
    },
    {
      title: "Phương thức",
      dataIndex: "httpMethod",
      width: 90,
      render: (v?: string) =>
        v ? <Tag color={HTTP_METHOD_COLORS[v] ?? "default"}>{v}</Tag> : "—",
    },
    {
      title: "URL",
      dataIndex: "url",
      ellipsis: true,
      render: (v?: string) => (
        <Tooltip title={v}>
          <span style={{ fontFamily: "monospace", fontSize: 12 }}>
            {v ?? "—"}
          </span>
        </Tooltip>
      ),
    },
    {
      title: "Mã trạng thái",
      dataIndex: "httpStatusCode",
      width: 110,
      align: "center",
      render: (v?: number) => (v ? <Tag color={statusColor(v)}>{v}</Tag> : "—"),
    },
    {
      title: "Thời gian (ms)",
      dataIndex: "executionDuration",
      width: 110,
      align: "right",
      render: (v: number) => (
        <span style={{ color: v > 1000 ? "#CF1322" : undefined }}>
          {v.toLocaleString("vi-VN")}
        </span>
      ),
    },
    {
      title: "IP",
      dataIndex: "clientIpAddress",
      width: 130,
      render: (v?: string) => (
        <span style={{ fontFamily: "monospace", fontSize: 12 }}>
          {v ?? "—"}
        </span>
      ),
    },
    {
      title: "Lỗi",
      dataIndex: "hasException",
      width: 60,
      align: "center",
      render: (v: boolean) => (v ? <Tag color="error">Có</Tag> : null),
    },
    {
      title: "",
      key: "detail",
      width: 50,
      render: (_, record) => (
        <Button
          size="small"
          icon={<EyeOutlined />}
          onClick={() => setDetailId(record.id)}
        />
      ),
    },
  ];

  const handleTableChange = (pagination: TablePaginationConfig) => {
    setFilter((prev) => ({
      ...prev,
      skipCount: ((pagination.current ?? 1) - 1) * (pagination.pageSize ?? 20),
      maxResultCount: pagination.pageSize ?? 20,
    }));
  };

  return (
    <div>
      <PageHeader
        title="Nhật ký hoạt động"
        actions={
          <Button
            icon={<ExportOutlined />}
            loading={exportMut.isPending}
            onClick={() =>
              exportMut.mutate(filter, {
                onSuccess: (file) => saveDownload(file.blob, file.fileName),
                onError: () => void message.error("Không thể xuất nhật ký."),
              })
            }
          >
            Xuất Excel
          </Button>
        }
      />

      <Space wrap style={{ marginBottom: 16 }}>
        <Input.Search
          placeholder="Tìm theo URL"
          allowClear
          style={{ width: 240 }}
          onSearch={(v) =>
            setFilter((p) => ({ ...p, filter: v || undefined, skipCount: 0 }))
          }
        />
        <Select
          placeholder="Phương thức"
          allowClear
          style={{ width: 120 }}
          options={["GET", "POST", "PUT", "DELETE", "PATCH"].map((m) => ({
            value: m,
            label: m,
          }))}
          onChange={(v) =>
            setFilter((p) => ({
              ...p,
              httpMethod: v ?? undefined,
              skipCount: 0,
            }))
          }
        />
        <RangePicker
          showTime
          format="DD/MM/YYYY HH:mm"
          onChange={(dates) =>
            setFilter((p) => ({
              ...p,
              startTime: dates?.[0]?.toISOString(),
              endTime: dates?.[1]?.toISOString(),
              skipCount: 0,
            }))
          }
        />
        <Space>
          <span style={{ fontSize: 13 }}>Chỉ lỗi:</span>
          <Switch
            size="small"
            onChange={(v) =>
              setFilter((p) => ({
                ...p,
                hasException: v || undefined,
                skipCount: 0,
              }))
            }
          />
        </Space>
      </Space>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={data?.items}
        loading={isLoading}
        size="small"
        scroll={{ x: 1150 }}
        onChange={handleTableChange}
        pagination={{
          total: data?.totalCount ?? 0,
          current: Math.floor(filter.skipCount / filter.maxResultCount) + 1,
          pageSize: filter.maxResultCount,
          showSizeChanger: true,
          showTotal: (total) => `Tổng: ${total} bản ghi`,
        }}
      />

      <Drawer
        title="Chi tiết nhật ký"
        open={Boolean(detailId)}
        onClose={() => setDetailId(undefined)}
        width={720}
        loading={detailLoading}
      >
        {detail && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <Descriptions column={2} size="small" bordered>
              <Descriptions.Item label="Thời gian">
                {dayjs(detail.executionTime).format("DD/MM/YYYY HH:mm:ss")}
              </Descriptions.Item>
              <Descriptions.Item label="Người dùng">
                {detail.userName ?? "—"}
              </Descriptions.Item>
              <Descriptions.Item label="Phương thức">
                {detail.httpMethod ? (
                  <Tag
                    color={HTTP_METHOD_COLORS[detail.httpMethod] ?? "default"}
                  >
                    {detail.httpMethod}
                  </Tag>
                ) : (
                  "—"
                )}
              </Descriptions.Item>
              <Descriptions.Item label="Trạng thái HTTP">
                {detail.httpStatusCode ? (
                  <Tag color={statusColor(detail.httpStatusCode)}>
                    {detail.httpStatusCode}
                  </Tag>
                ) : (
                  "—"
                )}
              </Descriptions.Item>
              <Descriptions.Item label="URL" span={2}>
                <Typography.Text
                  code
                  style={{ fontSize: 12, wordBreak: "break-all" }}
                >
                  {detail.url ?? "—"}
                </Typography.Text>
              </Descriptions.Item>
              <Descriptions.Item label="Thời gian xử lý">
                {detail.executionDuration.toLocaleString("vi-VN")} ms
              </Descriptions.Item>
              <Descriptions.Item label="Địa chỉ IP">
                {detail.clientIpAddress ?? "—"}
              </Descriptions.Item>
              {detail.correlationId && (
                <Descriptions.Item label="Correlation ID" span={2}>
                  <Typography.Text code style={{ fontSize: 11 }}>
                    {detail.correlationId}
                  </Typography.Text>
                </Descriptions.Item>
              )}
            </Descriptions>

            {detail.exceptions && (
              <div>
                <Typography.Text strong style={{ color: "#CF1322" }}>
                  Thông tin lỗi
                </Typography.Text>
                <pre
                  style={{
                    marginTop: 4,
                    padding: 8,
                    background: "#fff2f0",
                    border: "1px solid #ffccc7",
                    borderRadius: 4,
                    maxHeight: 200,
                    overflow: "auto",
                    fontSize: 12,
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-all",
                  }}
                >
                  {detail.exceptions}
                </pre>
              </div>
            )}

            {detail.actions.length > 0 && (
              <div>
                <Typography.Text strong>Các thao tác</Typography.Text>
                <Table
                  size="small"
                  style={{ marginTop: 4 }}
                  dataSource={detail.actions}
                  rowKey={(r, i) => `${r.methodName}-${i}`}
                  pagination={false}
                  columns={[
                    {
                      title: "Service",
                      dataIndex: "serviceName",
                      ellipsis: true,
                    },
                    {
                      title: "Method",
                      dataIndex: "methodName",
                      ellipsis: true,
                    },
                    {
                      title: "ms",
                      dataIndex: "executionDuration",
                      width: 70,
                      align: "right",
                    },
                  ]}
                />
              </div>
            )}

            {detail.entityChanges.length > 0 && (
              <div>
                <Typography.Text strong>Thay đổi dữ liệu</Typography.Text>
                {detail.entityChanges.map((ec, idx) => (
                  <div
                    key={idx}
                    style={{
                      marginTop: 8,
                      padding: 8,
                      border: "1px solid #d9d9d9",
                      borderRadius: 4,
                    }}
                  >
                    <div style={{ marginBottom: 4, fontSize: 12 }}>
                      <Tag color="blue">{ec.changeType}</Tag>
                      <Typography.Text code style={{ fontSize: 11 }}>
                        {ec.entityTypeFullName.split(".").pop()}
                        {ec.entityId ? ` #${ec.entityId.slice(0, 8)}` : ""}
                      </Typography.Text>
                    </div>
                    {ec.propertyChanges.length > 0 && (
                      <Table
                        size="small"
                        dataSource={ec.propertyChanges}
                        rowKey="propertyName"
                        pagination={false}
                        columns={[
                          {
                            title: "Thuộc tính",
                            dataIndex: "propertyName",
                            width: 160,
                          },
                          {
                            title: "Giá trị cũ",
                            dataIndex: "originalValue",
                            render: (v?: string) => v ?? <em>—</em>,
                            ellipsis: true,
                          },
                          {
                            title: "Giá trị mới",
                            dataIndex: "newValue",
                            render: (v?: string) => v ?? <em>—</em>,
                            ellipsis: true,
                          },
                        ]}
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
}
