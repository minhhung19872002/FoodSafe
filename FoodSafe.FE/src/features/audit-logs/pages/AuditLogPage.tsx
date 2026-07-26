import { useState } from "react";
import {
  Table,
  Tag,
  Input,
  Select,
  DatePicker,
  Space,
  Switch,
  Tooltip,
} from "antd";
import type { ColumnsType, TablePaginationConfig } from "antd/es/table";
import dayjs from "dayjs";
import { PageHeader } from "@/components/PageHeader";
import { useAuditLogs } from "../api/auditLogQueries";
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

  const { data, isLoading } = useAuditLogs(filter);

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
      render: (v?: number) =>
        v ? <Tag color={statusColor(v)}>{v}</Tag> : "—",
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
      render: (v: boolean) =>
        v ? <Tag color="error">Có</Tag> : null,
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
      <PageHeader title="Nhật ký hoạt động" />

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
        scroll={{ x: 1100 }}
        onChange={handleTableChange}
        pagination={{
          total: data?.totalCount ?? 0,
          current:
            Math.floor(filter.skipCount / filter.maxResultCount) + 1,
          pageSize: filter.maxResultCount,
          showSizeChanger: true,
          showTotal: (total) => `Tổng: ${total} bản ghi`,
        }}
      />
    </div>
  );
}
