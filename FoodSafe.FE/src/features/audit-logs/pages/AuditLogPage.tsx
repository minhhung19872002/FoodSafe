import { useState } from "react";
import {
  Button,
  Table,
  Tag,
  Input,
  message,
  Select,
  DatePicker,
  Space,
  Switch,
  Tooltip,
} from "antd";
import { ExportOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { useMutation } from "@tanstack/react-query";
import dayjs from "dayjs";
import { PageHeader } from "@/components/PageHeader";
import { useTablePagination } from "@/hooks/useTablePagination";
import { saveDownload } from "@/utils/download";
import { auditLogApi } from "../api/auditLogApi";
import { useAuditLogs } from "../api/auditLogQueries";
import { AuditLogDetailDrawer } from "../components/AuditLogDetailDrawer";
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
  const [filter, setFilter] = useState<AuditLogFilter>({});
  const [searchDraft, setSearchDraft] = useState<{
    userName?: string;
    url?: string;
  }>({});
  const pagination = useTablePagination(20);

  const [detailId, setDetailId] = useState<string | null>(null);
  const { data, isLoading } = useAuditLogs({
    ...filter,
    skipCount: pagination.skipCount,
    maxResultCount: pagination.maxResultCount,
  });
  const exportMut = useMutation({
    mutationFn: (f: AuditLogFilter) => auditLogApi.exportExcel(f),
  });

  const commitSearchDraft = (overrides: { userName?: string; url?: string }) => {
    const next = { ...searchDraft, ...overrides };
    setSearchDraft(next);
    setFilter((p) => ({
      ...p,
      userName: next.userName || undefined,
      filter: next.url || undefined,
    }));
    pagination.resetToFirstPage();
  };

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
  ];

  return (
    <div>
      <PageHeader title="Nhật ký hoạt động" />

      <Space wrap style={{ marginBottom: 16 }}>
        <Input.Search
          placeholder="Tìm theo người dùng"
          allowClear
          style={{ width: 200 }}
          value={searchDraft.userName ?? ""}
          onChange={(e) =>
            setSearchDraft((d) => ({ ...d, userName: e.target.value }))
          }
          onSearch={(v) => commitSearchDraft({ userName: v })}
        />
        <Input.Search
          placeholder="Tìm theo URL"
          allowClear
          style={{ width: 240 }}
          value={searchDraft.url ?? ""}
          onChange={(e) =>
            setSearchDraft((d) => ({ ...d, url: e.target.value }))
          }
          onSearch={(v) => commitSearchDraft({ url: v })}
        />
        <Select
          placeholder="Phương thức"
          allowClear
          style={{ width: 120 }}
          options={["GET", "POST", "PUT", "DELETE", "PATCH"].map((m) => ({
            value: m,
            label: m,
          }))}
          onChange={(v) => {
            setFilter((p) => ({ ...p, httpMethod: v ?? undefined }));
            pagination.resetToFirstPage();
          }}
        />
        <RangePicker
          showTime
          format="DD/MM/YYYY HH:mm"
          onChange={(dates) => {
            setFilter((p) => ({
              ...p,
              startTime: dates?.[0]?.toISOString(),
              endTime: dates?.[1]?.toISOString(),
            }));
            pagination.resetToFirstPage();
          }}
        />
        <Space>
          <span style={{ fontSize: 13 }}>Chỉ lỗi:</span>
          <Switch
            size="small"
            onChange={(v) => {
              setFilter((p) => ({ ...p, hasException: v || undefined }));
              pagination.resetToFirstPage();
            }}
          />
        </Space>
        <Button
          icon={<ExportOutlined />}
          loading={exportMut.isPending}
          onClick={() =>
            exportMut.mutate(filter, {
              onSuccess: (file) => saveDownload(file.blob, file.fileName),
              onError: () => message.error("Không thể xuất nhật ký hệ thống."),
            })
          }
        >
          Xuất Excel
        </Button>
      </Space>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={data?.items}
        loading={isLoading}
        size="small"
        scroll={{ x: 1100 }}
        onRow={(record) => ({
          onClick: () => setDetailId(record.id),
          style: { cursor: "pointer" },
        })}
        pagination={pagination.buildConfig(data?.totalCount)}
      />

      <AuditLogDetailDrawer
        auditLogId={detailId}
        onClose={() => setDetailId(null)}
      />
    </div>
  );
}
