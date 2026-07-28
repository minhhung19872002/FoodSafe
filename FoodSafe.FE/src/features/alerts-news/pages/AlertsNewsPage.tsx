import { useState } from "react";
import {
  Button,
  Card,
  Input,
  message,
  Select,
  Table,
  Tabs,
  Tag,
  type TableColumnsType,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SendOutlined,
  UndoOutlined,
  EyeOutlined,
  ExportOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { useAuthStore } from "@/features/auth/store/authStore";
import { RevokeModal } from "@/components/RevokeModal";
import { RecordDetailDrawer } from "@/components/RecordDetailDrawer";
import { saveDownload } from "@/utils/download";
import { useAlerts, useNews } from "../api/alertsNewsQueries";
import {
  useCreateAlert,
  useUpdateAlert,
  useDeleteAlert,
  usePublishAlert,
  useRecallAlert,
  useCreateNews,
  useUpdateNews,
  useDeleteNews,
  usePublishNews,
  useRecallNews,
  useExportAlerts,
  useExportNews,
} from "../api/alertsNewsMutations";
import { AlertEditorModal } from "../components/AlertEditorModal";
import { NewsEditorModal } from "../components/NewsEditorModal";
import {
  ALERT_CATEGORY_LABELS,
  ALERT_SEVERITY_CONFIG,
  ALERT_SOURCE_LABELS,
  ALERT_STATUS,
  ALERT_STATUS_CONFIG,
  NEWS_STATUS,
  NEWS_STATUS_CONFIG,
  type AlertCategory,
  type AlertFilter,
  type AlertSeverity,
  type AlertSource,
  type AlertStatus,
  type AtpAlert,
  type AtpNews,
  type CreateUpdateAlertInput,
  type CreateUpdateNewsInput,
  type NewsFilter,
  type NewsStatus,
} from "../types/alertsNews.types";
import { useTablePagination } from "@/hooks/useTablePagination";
import { RowActions } from "@/components/RowActions";

function AlertsTab() {
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const [filter, setFilter] = useState<AlertFilter>({});
  const pagination = useTablePagination(15);
  const { data, isLoading } = useAlerts({
    ...filter,
    skipCount: pagination.skipCount,
    maxResultCount: pagination.maxResultCount,
  });
  const createMut = useCreateAlert();
  const updateMut = useUpdateAlert();
  const deleteMut = useDeleteAlert();
  const publishMut = usePublishAlert();
  const recallMut = useRecallAlert();
  const exportMut = useExportAlerts();

  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<AtpAlert | undefined>();
  const [recallOpen, setRecallOpen] = useState(false);
  const [recallingId, setRecallingId] = useState<string | null>(null);
  const [detailAlert, setDetailAlert] = useState<AtpAlert | null>(null);

  const canCreate = hasPermission("FoodSafe.AlertsAndTesting.Alerts.Create");
  const canEdit = hasPermission("FoodSafe.AlertsAndTesting.Alerts.Edit");
  const canDelete = hasPermission("FoodSafe.AlertsAndTesting.Alerts.Delete");
  const canPublish = hasPermission("FoodSafe.AlertsAndTesting.Alerts.Publish");

  function openCreate() {
    setEditing(undefined);
    setEditorOpen(true);
  }
  function openEdit(item: AtpAlert) {
    setEditing(item);
    setEditorOpen(true);
  }

  async function handleSubmit(input: CreateUpdateAlertInput) {
    try {
      if (editing) {
        await updateMut.mutateAsync({ id: editing.id, input });
        message.success("Cập nhật cảnh báo thành công.");
      } else {
        await createMut.mutateAsync(input);
        message.success("Tạo cảnh báo thành công.");
      }
      setEditorOpen(false);
    } catch {
      message.error("Thao tác thất bại. Vui lòng thử lại.");
    }
  }

  const columns: TableColumnsType<AtpAlert> = [
    {
      title: "Tiêu đề",
      dataIndex: "title",
      ellipsis: true,
      width: 280,
    },
    {
      title: "Loại",
      dataIndex: "category",
      width: 140,
      render: (c: AlertCategory) => ALERT_CATEGORY_LABELS[c],
    },
    {
      title: "Mức độ",
      dataIndex: "severity",
      width: 120,
      render: (s: AlertSeverity) => {
        const cfg = ALERT_SEVERITY_CONFIG[s];
        return <Tag color={cfg.color}>{cfg.label}</Tag>;
      },
    },
    {
      title: "Nguồn",
      dataIndex: "source",
      width: 120,
      render: (s: AlertSource) => ALERT_SOURCE_LABELS[s],
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      width: 120,
      render: (s: AlertStatus) => {
        const cfg = ALERT_STATUS_CONFIG[s];
        return <Tag color={cfg.color}>{cfg.label}</Tag>;
      },
    },
    {
      title: "Ngày tạo",
      dataIndex: "creationTime",
      width: 120,
      render: (v: string) => dayjs(v).format("DD/MM/YYYY"),
    },
    {
      title: "",
      key: "actions",
      width: 96,
      render: (_: unknown, record: AtpAlert) => (
        <RowActions
          overflowAriaLabel={`Thao tác ${record.title}`}
          actions={[
            {
              key: "edit",
              label: "Sửa",
              icon: <EditOutlined />,
              hidden: !(record.status === ALERT_STATUS.Draft && canEdit),
              onClick: () => openEdit(record),
            },
            {
              key: "publish",
              label: "Xuất bản",
              icon: <SendOutlined />,
              hidden: !(record.status === ALERT_STATUS.Draft && canPublish),
              confirm: "Xuất bản cảnh báo này?",
              onClick: async () => {
                await publishMut.mutateAsync({ id: record.id, isPublic: true });
                message.success("Đã xuất bản.");
              },
            },
            {
              key: "recall",
              label: "Thu hồi",
              icon: <UndoOutlined />,
              danger: true,
              hidden: !(record.status === ALERT_STATUS.Published && canPublish),
              onClick: () => {
                setRecallingId(record.id);
                setRecallOpen(true);
              },
            },
            {
              key: "delete",
              label: "Xóa",
              icon: <DeleteOutlined />,
              danger: true,
              hidden: !(record.status === ALERT_STATUS.Draft && canDelete),
              confirm: "Xóa cảnh báo này?",
              onClick: async () => {
                await deleteMut.mutateAsync(record.id);
                message.success("Đã xóa.");
              },
            },
          ]}
        />
      ),
    },
  ];

  return (
    <>
      <div
        style={{
          display: "flex",
          gap: 12,
          marginBottom: 16,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <Input.Search
          allowClear
          placeholder="Tìm theo tiêu đề, số cảnh báo..."
          style={{ width: 280 }}
          onSearch={(v) => {
            setFilter((f) => ({ ...f, filter: v || undefined }));
            pagination.resetToFirstPage();
          }}
        />
        <Select
          allowClear
          placeholder="Trạng thái"
          style={{ width: 150 }}
          onChange={(v) => {
            setFilter((f) => ({ ...f, status: v }));
            pagination.resetToFirstPage();
          }}
          options={Object.entries(ALERT_STATUS_CONFIG).map(([value, cfg]) => ({
            value: Number(value),
            label: cfg.label,
          }))}
        />
        <Select
          allowClear
          placeholder="Mức độ"
          style={{ width: 150 }}
          onChange={(v) => {
            setFilter((f) => ({ ...f, severity: v }));
            pagination.resetToFirstPage();
          }}
          options={Object.entries(ALERT_SEVERITY_CONFIG).map(
            ([value, cfg]) => ({ value: Number(value), label: cfg.label }),
          )}
        />
        <Select
          allowClear
          placeholder="Nguồn"
          style={{ width: 160 }}
          onChange={(v) => {
            setFilter((f) => ({ ...f, source: v }));
            pagination.resetToFirstPage();
          }}
          options={Object.entries(ALERT_SOURCE_LABELS).map(
            ([value, label]) => ({ value: Number(value), label }),
          )}
        />
        <div style={{ flex: 1 }} />
        <Button
          icon={<ExportOutlined />}
          loading={exportMut.isPending}
          onClick={() =>
            exportMut.mutate(filter, {
              onSuccess: (file) => saveDownload(file.blob, file.fileName),
              onError: () => void message.error("Không thể xuất danh sách."),
            })
          }
        >
          Xuất Excel
        </Button>
        {canCreate && (
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            Tạo cảnh báo
          </Button>
        )}
      </div>

      <Table
        rowKey="id"
        dataSource={data?.items}
        columns={columns}
        loading={isLoading}
        size="small"
        onRow={(record) => ({
          onDoubleClick: () => setDetailAlert(record),
          style: { cursor: "pointer" },
        })}
        pagination={pagination.buildConfig(data?.totalCount)}
      />

      <AlertEditorModal
        open={editorOpen}
        item={editing}
        saving={createMut.isPending || updateMut.isPending}
        onCancel={() => setEditorOpen(false)}
        onSubmit={handleSubmit}
      />

      <RevokeModal
        open={recallOpen}
        title="Thu hồi cảnh báo"
        confirmLoading={recallMut.isPending}
        onCancel={() => setRecallOpen(false)}
        onConfirm={async (reason) => {
          if (recallingId) {
            await recallMut.mutateAsync({ id: recallingId, reason });
            message.success("Đã thu hồi cảnh báo.");
          }
          setRecallOpen(false);
          setRecallingId(null);
        }}
      />

      <RecordDetailDrawer
        title="Chi tiết cảnh báo"
        record={detailAlert}
        onClose={() => setDetailAlert(null)}
        fields={[
          { label: "Số cảnh báo", render: (r) => r.alertNumber },
          { label: "Tiêu đề", render: (r) => r.title },
          {
            label: "Loại",
            render: (r) => ALERT_CATEGORY_LABELS[r.category],
          },
          {
            label: "Mức độ",
            render: (r) => {
              const cfg = ALERT_SEVERITY_CONFIG[r.severity];
              return <Tag color={cfg.color}>{cfg.label}</Tag>;
            },
          },
          {
            label: "Nguồn",
            render: (r) => ALERT_SOURCE_LABELS[r.source],
          },
          {
            label: "Trạng thái",
            render: (r) => {
              const cfg = ALERT_STATUS_CONFIG[r.status];
              return <Tag color={cfg.color}>{cfg.label}</Tag>;
            },
          },
          { label: "Nội dung", span: 2, render: (r) => r.content },
          { label: "Khu vực ảnh hưởng", render: (r) => r.affectedArea },
          {
            label: "Sản phẩm ảnh hưởng",
            render: (r) => r.affectedProducts,
          },
          { label: "Cơ sở liên quan", render: (r) => r.businessName },
          { label: "Người báo cáo", render: (r) => r.reporterName },
          { label: "SĐT người báo cáo", render: (r) => r.reporterPhone },
          { label: "Email người báo cáo", render: (r) => r.reporterEmail },
          {
            label: "Công khai",
            render: (r) => (r.isPublic ? "Có" : "Không"),
          },
          {
            label: "Ngày tạo",
            render: (r) => dayjs(r.creationTime).format("DD/MM/YYYY"),
          },
          {
            label: "Ngày xuất bản",
            render: (r) =>
              r.publishedAt ? dayjs(r.publishedAt).format("DD/MM/YYYY") : null,
          },
          {
            label: "Ngày thu hồi",
            render: (r) =>
              r.recalledAt ? dayjs(r.recalledAt).format("DD/MM/YYYY") : null,
          },
          { label: "Lý do thu hồi", span: 2, render: (r) => r.recallReason },
        ]}
      />
    </>
  );
}

function NewsTab() {
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const [filter, setFilter] = useState<NewsFilter>({});
  const pagination = useTablePagination(15);
  const { data, isLoading } = useNews({
    ...filter,
    skipCount: pagination.skipCount,
    maxResultCount: pagination.maxResultCount,
  });
  const createMut = useCreateNews();
  const updateMut = useUpdateNews();
  const deleteMut = useDeleteNews();
  const publishMut = usePublishNews();
  const recallMut = useRecallNews();
  const exportMut = useExportNews();

  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<AtpNews | undefined>();
  const [detailNews, setDetailNews] = useState<AtpNews | null>(null);

  const canCreate = hasPermission("FoodSafe.AlertsAndTesting.News.Create");
  const canEdit = hasPermission("FoodSafe.AlertsAndTesting.News.Edit");
  const canDelete = hasPermission("FoodSafe.AlertsAndTesting.News.Delete");
  const canPublish = hasPermission("FoodSafe.AlertsAndTesting.News.Publish");

  function openCreate() {
    setEditing(undefined);
    setEditorOpen(true);
  }
  function openEdit(item: AtpNews) {
    setEditing(item);
    setEditorOpen(true);
  }

  async function handleSubmit(input: CreateUpdateNewsInput) {
    try {
      if (editing) {
        await updateMut.mutateAsync({ id: editing.id, input });
        message.success("Cập nhật tin tức thành công.");
      } else {
        await createMut.mutateAsync(input);
        message.success("Tạo tin tức thành công.");
      }
      setEditorOpen(false);
    } catch {
      message.error("Thao tác thất bại. Vui lòng thử lại.");
    }
  }

  const columns: TableColumnsType<AtpNews> = [
    {
      title: "Tiêu đề",
      dataIndex: "title",
      ellipsis: true,
      width: 300,
    },
    {
      title: "Chuyên mục",
      dataIndex: "category",
      width: 150,
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      width: 120,
      render: (s: NewsStatus) => {
        const cfg = NEWS_STATUS_CONFIG[s];
        return <Tag color={cfg.color}>{cfg.label}</Tag>;
      },
    },
    {
      title: "Lượt xem",
      dataIndex: "viewCount",
      width: 90,
      render: (v: number) => (
        <span>
          <EyeOutlined style={{ marginRight: 4 }} />
          {v}
        </span>
      ),
    },
    {
      title: "Ngày tạo",
      dataIndex: "creationTime",
      width: 120,
      render: (v: string) => dayjs(v).format("DD/MM/YYYY"),
    },
    {
      title: "Nổi bật",
      dataIndex: "isFeatured",
      width: 80,
      render: (v: boolean) => (v ? <Tag color="gold">NB</Tag> : null),
    },
    {
      title: "",
      key: "actions",
      width: 96,
      render: (_: unknown, record: AtpNews) => (
        <RowActions
          overflowAriaLabel={`Thao tác ${record.title}`}
          actions={[
            {
              key: "edit",
              label: "Sửa",
              icon: <EditOutlined />,
              hidden: !(record.status === NEWS_STATUS.Draft && canEdit),
              onClick: () => openEdit(record),
            },
            {
              key: "publish",
              label: "Xuất bản",
              icon: <SendOutlined />,
              hidden: !(record.status === NEWS_STATUS.Draft && canPublish),
              confirm: "Xuất bản tin tức này?",
              onClick: async () => {
                await publishMut.mutateAsync({ id: record.id, isPublic: true });
                message.success("Đã xuất bản.");
              },
            },
            {
              key: "recall",
              label: "Thu hồi",
              icon: <UndoOutlined />,
              danger: true,
              hidden: !(record.status === NEWS_STATUS.Published && canPublish),
              confirm: "Thu hồi tin tức này?",
              onClick: async () => {
                await recallMut.mutateAsync(record.id);
                message.success("Đã thu hồi.");
              },
            },
            {
              key: "delete",
              label: "Xóa",
              icon: <DeleteOutlined />,
              danger: true,
              hidden: !(record.status === NEWS_STATUS.Draft && canDelete),
              confirm: "Xóa tin tức này?",
              onClick: async () => {
                await deleteMut.mutateAsync(record.id);
                message.success("Đã xóa.");
              },
            },
          ]}
        />
      ),
    },
  ];

  return (
    <>
      <div
        style={{
          display: "flex",
          gap: 12,
          marginBottom: 16,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <Input.Search
          allowClear
          placeholder="Tìm theo tiêu đề..."
          style={{ width: 280 }}
          onSearch={(v) => {
            setFilter((f) => ({ ...f, filter: v || undefined }));
            pagination.resetToFirstPage();
          }}
        />
        <Select
          allowClear
          placeholder="Trạng thái"
          style={{ width: 150 }}
          onChange={(v) => {
            setFilter((f) => ({ ...f, status: v }));
            pagination.resetToFirstPage();
          }}
          options={Object.entries(NEWS_STATUS_CONFIG).map(([value, cfg]) => ({
            value: Number(value),
            label: cfg.label,
          }))}
        />
        <Select
          allowClear
          placeholder="Nguồn"
          style={{ width: 160 }}
          onChange={(v) => {
            setFilter((f) => ({ ...f, source: v }));
            pagination.resetToFirstPage();
          }}
          options={Object.entries(ALERT_SOURCE_LABELS).map(
            ([value, label]) => ({ value: Number(value), label }),
          )}
        />
        <div style={{ flex: 1 }} />
        <Button
          icon={<ExportOutlined />}
          loading={exportMut.isPending}
          onClick={() =>
            exportMut.mutate(filter, {
              onSuccess: (file) => saveDownload(file.blob, file.fileName),
              onError: () => void message.error("Không thể xuất danh sách."),
            })
          }
        >
          Xuất Excel
        </Button>
        {canCreate && (
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            Tạo tin tức
          </Button>
        )}
      </div>

      <Table
        rowKey="id"
        dataSource={data?.items}
        columns={columns}
        loading={isLoading}
        size="small"
        onRow={(record) => ({
          onDoubleClick: () => setDetailNews(record),
          style: { cursor: "pointer" },
        })}
        pagination={pagination.buildConfig(data?.totalCount)}
      />

      <NewsEditorModal
        open={editorOpen}
        item={editing}
        saving={createMut.isPending || updateMut.isPending}
        onCancel={() => setEditorOpen(false)}
        onSubmit={handleSubmit}
      />

      <RecordDetailDrawer
        title="Chi tiết tin tức"
        record={detailNews}
        onClose={() => setDetailNews(null)}
        fields={[
          { label: "Tiêu đề", span: 2, render: (r) => r.title },
          { label: "Chuyên mục", render: (r) => r.category },
          { label: "Thẻ", render: (r) => r.tags },
          {
            label: "Trạng thái",
            render: (r) => {
              const cfg = NEWS_STATUS_CONFIG[r.status];
              return <Tag color={cfg.color}>{cfg.label}</Tag>;
            },
          },
          { label: "Lượt xem", render: (r) => r.viewCount },
          {
            label: "Nổi bật",
            render: (r) =>
              r.isFeatured ? <Tag color="gold">NB</Tag> : "Không",
          },
          {
            label: "Công khai",
            render: (r) => (r.isPublic ? "Có" : "Không"),
          },
          { label: "Tóm tắt", span: 2, render: (r) => r.summary },
          { label: "Nội dung", span: 2, render: (r) => r.content },
          {
            label: "Ngày tạo",
            render: (r) => dayjs(r.creationTime).format("DD/MM/YYYY"),
          },
          {
            label: "Ngày xuất bản",
            render: (r) =>
              r.publishedAt ? dayjs(r.publishedAt).format("DD/MM/YYYY") : null,
          },
          {
            label: "Cảnh báo liên kết",
            span: 2,
            render: (r) =>
              r.linkedAlerts.length > 0
                ? r.linkedAlerts
                    .map((a) => a.alertTitle ?? a.alertId)
                    .join(", ")
                : null,
          },
        ]}
      />
    </>
  );
}

export default function AlertsNewsPage() {
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const canViewAlerts = hasPermission("FoodSafe.AlertsAndTesting.Alerts.View");
  const canViewNews = hasPermission("FoodSafe.AlertsAndTesting.News.View");

  const tabItems = [
    ...(canViewAlerts
      ? [
          {
            key: "alerts",
            label: "Cảnh báo VSATTP",
            children: <AlertsTab />,
          },
        ]
      : []),
    ...(canViewNews
      ? [
          {
            key: "news",
            label: "Tin tức ATTP",
            children: <NewsTab />,
          },
        ]
      : []),
  ];

  return (
    <Card>
      <Tabs defaultActiveKey={tabItems[0]?.key} items={tabItems} />
    </Card>
  );
}
