import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  App,
  Button,
  Card,
  Input,
  Select,
  Space,
  Table,
  Tabs,
  Tag,
  type TableColumnsType,
} from "antd";
import type { SorterResult, SortOrder } from "antd/es/table/interface";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SendOutlined,
  StopOutlined,
  UndoOutlined,
  EyeOutlined,
  ExportOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { useAuthStore } from "@/features/auth/store/authStore";
import { RevokeModal } from "@/components/RevokeModal";
import { RecordDetailDrawer } from "@/components/RecordDetailDrawer";
import { RichTextEditor } from "@/components/RichTextEditor/RichTextEditor";
import { EmptyState } from "@/components/EmptyState";
import { extractApiError } from "@/lib/apiError";
import { saveDownload } from "@/utils/download";
import { useAlerts, useNews } from "../api/alertsNewsQueries";
import {
  useCreateAlert,
  useUpdateAlert,
  useDeleteAlert,
  usePublishAlert,
  useRecallAlert,
  useRejectAlert,
  useCreateNews,
  useUpdateNews,
  useDeleteNews,
  usePublishNews,
  useRecallNews,
  useRejectNews,
  useExportAlerts,
  useExportNews,
} from "../api/alertsNewsMutations";
import { AlertEditorModal } from "../components/AlertEditorModal";
import { NewsEditorModal } from "../components/NewsEditorModal";
import { CitizenReportModerationQueue } from "../components/CitizenReportModerationQueue";
import {
  ALERT_CATEGORY_LABELS,
  ALERT_SEVERITY_CONFIG,
  ALERT_SOURCE_LABELS,
  ALERT_STATUS,
  ALERT_STATUS_CONFIG,
  NEWS_CATEGORIES,
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

function useServerSorting<T>(onChangePage: () => void) {
  const [sorting, setSorting] = useState<string>();

  const sortOrderFor = (field: string): SortOrder => {
    if (!sorting) return null;
    const [current, direction] = sorting.split(" ");
    if (current !== field) return null;
    return direction === "desc" ? "descend" : "ascend";
  };

  const handleSort = (sorter: SorterResult<T> | SorterResult<T>[]) => {
    const active = Array.isArray(sorter) ? sorter[0] : sorter;
    const next =
      active?.order && typeof active.field === "string"
        ? `${active.field} ${active.order === "descend" ? "desc" : "asc"}`
        : undefined;
    if (next !== sorting) {
      setSorting(next);
      onChangePage();
    }
  };

  return { sorting, sortOrderFor, handleSort };
}

function AlertsTab() {
  const { message } = App.useApp();
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const [filter, setFilter] = useState<AlertFilter>({});
  const pagination = useTablePagination(15);
  const { sorting, sortOrderFor, handleSort } = useServerSorting<AtpAlert>(
    pagination.resetToFirstPage,
  );
  const queryFilter = {
    ...filter,
    sorting,
    skipCount: pagination.skipCount,
    maxResultCount: pagination.maxResultCount,
  };
  const { data, isFetching } = useAlerts(queryFilter);
  const createMut = useCreateAlert();
  const updateMut = useUpdateAlert();
  const deleteMut = useDeleteAlert();
  const publishMut = usePublishAlert();
  const recallMut = useRecallAlert();
  const rejectMut = useRejectAlert();
  const exportMut = useExportAlerts();

  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<AtpAlert | undefined>();
  const [recallOpen, setRecallOpen] = useState(false);
  const [recallingId, setRecallingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [detailAlert, setDetailAlert] = useState<AtpAlert | null>(null);

  const canCreate = hasPermission("FoodSafe.AlertsAndTesting.Alerts.Create");
  const canEdit = hasPermission("FoodSafe.AlertsAndTesting.Alerts.Edit");
  const canDelete = hasPermission("FoodSafe.AlertsAndTesting.Alerts.Delete");
  const canPublish = hasPermission("FoodSafe.AlertsAndTesting.Alerts.Publish");

  const hasActiveFilter = Boolean(
    filter.filter ||
    filter.category ||
    filter.severity ||
    filter.source ||
    filter.status,
  );

  function openCreate() {
    setEditing(undefined);
    setEditorOpen(true);
  }
  function openEdit(item: AtpAlert) {
    setEditing(item);
    setEditorOpen(true);
  }

  function handleSubmit(input: CreateUpdateAlertInput) {
    const options = {
      onSuccess: () => {
        void message.success(
          editing
            ? "Cập nhật cảnh báo thành công."
            : "Tạo cảnh báo thành công.",
        );
        setEditorOpen(false);
      },
      onError: (error: unknown) => void message.error(extractApiError(error)),
    };
    if (editing) updateMut.mutate({ id: editing.id, input }, options);
    else createMut.mutate(input, options);
  }

  const columns: TableColumnsType<AtpAlert> = [
    {
      title: "Tiêu đề",
      dataIndex: "title",
      ellipsis: true,
      width: 280,
      sorter: true,
      sortOrder: sortOrderFor("title"),
      showSorterTooltip: false,
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
      sorter: true,
      sortOrder: sortOrderFor("severity"),
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
      sorter: true,
      sortOrder: sortOrderFor("creationTime"),
      render: (v: string) => dayjs(v).format("DD/MM/YYYY"),
    },
    {
      title: "Thao tác",
      key: "actions",
      fixed: "right",
      width: 120,
      render: (_: unknown, record: AtpAlert) => (
        <RowActions
          overflowAriaLabel={`Thao tác ${record.title}`}
          actions={[
            {
              key: "edit",
              label: "Sửa",
              ariaLabel: `Sửa ${record.title}`,
              icon: <EditOutlined />,
              hidden: !(record.status === ALERT_STATUS.Draft && canEdit),
              onClick: () => openEdit(record),
            },
            {
              key: "publish",
              label: "Xuất bản",
              ariaLabel: `Xuất bản ${record.title}`,
              icon: <SendOutlined />,
              hidden: !(record.status === ALERT_STATUS.Draft && canPublish),
              confirm: "Xuất bản cảnh báo này?",
              onClick: () =>
                publishMut.mutate(
                  { id: record.id, isPublic: true },
                  {
                    onSuccess: () => void message.success("Đã xuất bản."),
                    onError: (error) =>
                      void message.error(extractApiError(error)),
                  },
                ),
            },
            {
              key: "reject",
              label: "Từ chối",
              ariaLabel: `Từ chối ${record.title}`,
              icon: <StopOutlined />,
              danger: true,
              hidden: !(record.status === ALERT_STATUS.Draft && canPublish),
              onClick: () => setRejectingId(record.id),
            },
            {
              key: "recall",
              label: "Thu hồi",
              ariaLabel: `Thu hồi ${record.title}`,
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
              ariaLabel: `Xóa ${record.title}`,
              icon: <DeleteOutlined />,
              danger: true,
              hidden: !(record.status === ALERT_STATUS.Draft && canDelete),
              confirm: "Xóa cảnh báo này?",
              onClick: () =>
                deleteMut.mutate(record.id, {
                  onSuccess: () => void message.success("Đã xóa."),
                  onError: (error) =>
                    void message.error(extractApiError(error)),
                }),
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
          justifyContent: "space-between",
          gap: 12,
          marginBottom: 16,
          flexWrap: "wrap",
        }}
      >
        <Space wrap>
          <Input.Search
            allowClear
            placeholder="Tìm theo tiêu đề, số cảnh báo..."
            style={{ width: 260 }}
            onSearch={(v) => {
              setFilter((f) => ({ ...f, filter: v || undefined }));
              pagination.resetToFirstPage();
            }}
          />
          <Select
            allowClear
            placeholder="Loại cảnh báo"
            style={{ width: 160 }}
            onChange={(v) => {
              setFilter((f) => ({ ...f, category: v }));
              pagination.resetToFirstPage();
            }}
            options={Object.entries(ALERT_CATEGORY_LABELS).map(
              ([value, label]) => ({ value: Number(value), label }),
            )}
          />
          <Select
            allowClear
            placeholder="Trạng thái"
            style={{ width: 140 }}
            onChange={(v) => {
              setFilter((f) => ({ ...f, status: v }));
              pagination.resetToFirstPage();
            }}
            options={Object.entries(ALERT_STATUS_CONFIG).map(
              ([value, cfg]) => ({ value: Number(value), label: cfg.label }),
            )}
          />
          <Select
            allowClear
            placeholder="Mức độ"
            style={{ width: 130 }}
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
            style={{ width: 140 }}
            onChange={(v) => {
              setFilter((f) => ({ ...f, source: v }));
              pagination.resetToFirstPage();
            }}
            options={Object.entries(ALERT_SOURCE_LABELS).map(
              ([value, label]) => ({ value: Number(value), label }),
            )}
          />
        </Space>
        <Space>
          <Button
            icon={<ExportOutlined />}
            loading={exportMut.isPending}
            onClick={() =>
              exportMut.mutate(
                { ...filter, sorting },
                {
                  onSuccess: (file) => saveDownload(file.blob, file.fileName),
                  onError: (error) =>
                    void message.error(extractApiError(error)),
                },
              )
            }
          >
            Xuất Excel
          </Button>
          {canCreate && (
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
              Tạo cảnh báo
            </Button>
          )}
        </Space>
      </div>

      <Table
        rowKey="id"
        dataSource={data?.items}
        columns={columns}
        loading={isFetching}
        size="small"
        scroll={{ x: 1000 }}
        locale={{
          emptyText: (
            <EmptyState
              title={
                hasActiveFilter
                  ? "Không tìm thấy kết quả phù hợp"
                  : "Chưa có cảnh báo nào"
              }
              description={
                hasActiveFilter
                  ? "Thử thay đổi từ khóa hoặc bộ lọc."
                  : undefined
              }
            />
          ),
        }}
        onRow={(record) => ({
          onDoubleClick: () => setDetailAlert(record),
          style: { cursor: "pointer" },
        })}
        onChange={(_, __, sorter) => handleSort(sorter)}
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
        onConfirm={(reason) => {
          if (!recallingId) return;
          recallMut.mutate(
            { id: recallingId, reason },
            {
              onSuccess: () => {
                void message.success("Đã thu hồi cảnh báo.");
                setRecallOpen(false);
                setRecallingId(null);
              },
              onError: (error) => void message.error(extractApiError(error)),
            },
          );
        }}
      />

      <RevokeModal
        open={Boolean(rejectingId)}
        title="Từ chối cảnh báo"
        okText="Từ chối"
        description="Cảnh báo bị từ chối vẫn được lưu lại kèm lý do để phục vụ tra cứu, và không hiển thị trên cổng công khai."
        placeholder="Lý do từ chối"
        confirmLoading={rejectMut.isPending}
        onCancel={() => setRejectingId(null)}
        onConfirm={(reason) => {
          if (!rejectingId) return;
          rejectMut.mutate(
            { id: rejectingId, reason },
            {
              onSuccess: () => {
                void message.success("Đã từ chối cảnh báo.");
                setRejectingId(null);
              },
              onError: (error) => void message.error(extractApiError(error)),
            },
          );
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
          {
            label: "Ngày từ chối",
            render: (r) =>
              r.rejectedAt ? dayjs(r.rejectedAt).format("DD/MM/YYYY") : null,
          },
          { label: "Lý do từ chối", span: 2, render: (r) => r.rejectedReason },
        ]}
      />
    </>
  );
}

function NewsTab() {
  const { message } = App.useApp();
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const [filter, setFilter] = useState<NewsFilter>({});
  const pagination = useTablePagination(15);
  const { sorting, sortOrderFor, handleSort } = useServerSorting<AtpNews>(
    pagination.resetToFirstPage,
  );
  const queryFilter = {
    ...filter,
    sorting,
    skipCount: pagination.skipCount,
    maxResultCount: pagination.maxResultCount,
  };
  const { data, isFetching } = useNews(queryFilter);
  const createMut = useCreateNews();
  const updateMut = useUpdateNews();
  const deleteMut = useDeleteNews();
  const publishMut = usePublishNews();
  const recallMut = useRecallNews();
  const rejectMut = useRejectNews();
  const exportMut = useExportNews();

  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<AtpNews | undefined>();
  const [detailNews, setDetailNews] = useState<AtpNews | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);

  const canCreate = hasPermission("FoodSafe.AlertsAndTesting.News.Create");
  const canEdit = hasPermission("FoodSafe.AlertsAndTesting.News.Edit");
  const canDelete = hasPermission("FoodSafe.AlertsAndTesting.News.Delete");
  const canPublish = hasPermission("FoodSafe.AlertsAndTesting.News.Publish");

  const hasActiveFilter = Boolean(
    filter.filter || filter.category || filter.status || filter.source,
  );

  function openCreate() {
    setEditing(undefined);
    setEditorOpen(true);
  }
  function openEdit(item: AtpNews) {
    setEditing(item);
    setEditorOpen(true);
  }

  function handleSubmit(input: CreateUpdateNewsInput) {
    const options = {
      onSuccess: () => {
        void message.success(
          editing ? "Cập nhật tin tức thành công." : "Tạo tin tức thành công.",
        );
        setEditorOpen(false);
      },
      onError: (error: unknown) => void message.error(extractApiError(error)),
    };
    if (editing) updateMut.mutate({ id: editing.id, input }, options);
    else createMut.mutate(input, options);
  }

  const columns: TableColumnsType<AtpNews> = [
    {
      title: "Tiêu đề",
      dataIndex: "title",
      ellipsis: true,
      width: 280,
      sorter: true,
      showSorterTooltip: false,
      sortOrder: sortOrderFor("title"),
    },
    {
      title: "Chuyên mục",
      dataIndex: "category",
      width: 150,
    },
    {
      title: "Nguồn",
      dataIndex: "source",
      width: 110,
      render: (s: AlertSource) => ALERT_SOURCE_LABELS[s],
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
      width: 100,
      sorter: true,
      sortOrder: sortOrderFor("viewCount"),
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
      sorter: true,
      sortOrder: sortOrderFor("creationTime"),
      render: (v: string) => dayjs(v).format("DD/MM/YYYY"),
    },
    {
      title: "Nổi bật",
      dataIndex: "isFeatured",
      width: 80,
      render: (v: boolean) => (v ? <Tag color="gold">NB</Tag> : null),
    },
    {
      title: "Thao tác",
      key: "actions",
      fixed: "right",
      width: 120,
      render: (_: unknown, record: AtpNews) => (
        <RowActions
          overflowAriaLabel={`Thao tác ${record.title}`}
          actions={[
            {
              key: "edit",
              label: "Sửa",
              ariaLabel: `Sửa ${record.title}`,
              icon: <EditOutlined />,
              hidden: !(record.status === NEWS_STATUS.Draft && canEdit),
              onClick: () => openEdit(record),
            },
            {
              key: "publish",
              label: "Xuất bản",
              ariaLabel: `Xuất bản ${record.title}`,
              icon: <SendOutlined />,
              hidden: !(record.status === NEWS_STATUS.Draft && canPublish),
              confirm: "Xuất bản tin tức này?",
              onClick: () =>
                publishMut.mutate(
                  { id: record.id, isPublic: true },
                  {
                    onSuccess: () => void message.success("Đã xuất bản."),
                    onError: (error) =>
                      void message.error(extractApiError(error)),
                  },
                ),
            },
            {
              key: "reject",
              label: "Từ chối",
              ariaLabel: `Từ chối ${record.title}`,
              icon: <StopOutlined />,
              danger: true,
              hidden: !(record.status === NEWS_STATUS.Draft && canPublish),
              onClick: () => setRejectingId(record.id),
            },
            {
              key: "recall",
              label: "Thu hồi",
              ariaLabel: `Thu hồi ${record.title}`,
              icon: <UndoOutlined />,
              danger: true,
              hidden: !(record.status === NEWS_STATUS.Published && canPublish),
              confirm: "Thu hồi tin tức này?",
              onClick: () =>
                recallMut.mutate(record.id, {
                  onSuccess: () => void message.success("Đã thu hồi."),
                  onError: (error) =>
                    void message.error(extractApiError(error)),
                }),
            },
            {
              key: "delete",
              label: "Xóa",
              ariaLabel: `Xóa ${record.title}`,
              icon: <DeleteOutlined />,
              danger: true,
              hidden: !(record.status === NEWS_STATUS.Draft && canDelete),
              confirm: "Xóa tin tức này?",
              onClick: () =>
                deleteMut.mutate(record.id, {
                  onSuccess: () => void message.success("Đã xóa."),
                  onError: (error) =>
                    void message.error(extractApiError(error)),
                }),
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
          justifyContent: "space-between",
          gap: 12,
          marginBottom: 16,
          flexWrap: "wrap",
        }}
      >
        <Space wrap>
          <Input.Search
            allowClear
            placeholder="Tìm theo tiêu đề..."
            style={{ width: 260 }}
            onSearch={(v) => {
              setFilter((f) => ({ ...f, filter: v || undefined }));
              pagination.resetToFirstPage();
            }}
          />
          <Select
            allowClear
            placeholder="Chuyên mục"
            style={{ width: 170 }}
            onChange={(v) => {
              setFilter((f) => ({ ...f, category: v }));
              pagination.resetToFirstPage();
            }}
            options={NEWS_CATEGORIES.map((c) => ({ value: c, label: c }))}
          />
          <Select
            allowClear
            placeholder="Trạng thái"
            style={{ width: 140 }}
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
            style={{ width: 140 }}
            onChange={(v) => {
              setFilter((f) => ({ ...f, source: v }));
              pagination.resetToFirstPage();
            }}
            options={Object.entries(ALERT_SOURCE_LABELS).map(
              ([value, label]) => ({ value: Number(value), label }),
            )}
          />
        </Space>
        <Space>
          <Button
            icon={<ExportOutlined />}
            loading={exportMut.isPending}
            onClick={() =>
              exportMut.mutate(
                { ...filter, sorting },
                {
                  onSuccess: (file) => saveDownload(file.blob, file.fileName),
                  onError: (error) =>
                    void message.error(extractApiError(error)),
                },
              )
            }
          >
            Xuất Excel
          </Button>
          {canCreate && (
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
              Tạo tin tức
            </Button>
          )}
        </Space>
      </div>

      <Table
        rowKey="id"
        dataSource={data?.items}
        columns={columns}
        loading={isFetching}
        size="small"
        scroll={{ x: 1060 }}
        locale={{
          emptyText: (
            <EmptyState
              title={
                hasActiveFilter
                  ? "Không tìm thấy kết quả phù hợp"
                  : "Chưa có tin tức nào"
              }
              description={
                hasActiveFilter
                  ? "Thử thay đổi từ khóa hoặc bộ lọc."
                  : undefined
              }
            />
          ),
        }}
        onRow={(record) => ({
          onDoubleClick: () => setDetailNews(record),
          style: { cursor: "pointer" },
        })}
        onChange={(_, __, sorter) => handleSort(sorter)}
        pagination={pagination.buildConfig(data?.totalCount)}
      />

      <NewsEditorModal
        open={editorOpen}
        item={editing}
        saving={createMut.isPending || updateMut.isPending}
        onCancel={() => setEditorOpen(false)}
        onSubmit={handleSubmit}
      />

      <RevokeModal
        open={Boolean(rejectingId)}
        title="Từ chối tin tức"
        okText="Từ chối"
        description="Tin tức bị từ chối vẫn được lưu lại kèm lý do để phục vụ tra cứu, và không hiển thị trên cổng công khai."
        placeholder="Lý do từ chối"
        confirmLoading={rejectMut.isPending}
        onCancel={() => setRejectingId(null)}
        onConfirm={(reason) => {
          if (!rejectingId) return;
          rejectMut.mutate(
            { id: rejectingId, reason },
            {
              onSuccess: () => {
                void message.success("Đã từ chối tin tức.");
                setRejectingId(null);
              },
              onError: (error) => void message.error(extractApiError(error)),
            },
          );
        }}
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
            label: "Nguồn",
            render: (r) => ALERT_SOURCE_LABELS[r.source],
          },
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
          { label: "Người phản ánh", render: (r) => r.reporterName },
          { label: "Liên hệ phản ánh", render: (r) => r.reporterContact },
          { label: "Tóm tắt", span: 2, render: (r) => r.summary },
          {
            label: "Nội dung",
            span: 2,
            render: (r) => <RichTextEditor value={r.content} readonly />,
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
          {
            label: "Ngày từ chối",
            render: (r) =>
              r.rejectedAt ? dayjs(r.rejectedAt).format("DD/MM/YYYY") : null,
          },
          { label: "Lý do từ chối", span: 2, render: (r) => r.rejectedReason },
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

const TAB_KEYS = ["alerts", "news", "moderation"] as const;
type TabKey = (typeof TAB_KEYS)[number];

export default function AlertsNewsPage() {
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const [searchParams, setSearchParams] = useSearchParams();
  const canViewAlerts = hasPermission("FoodSafe.AlertsAndTesting.Alerts.View");
  const canViewNews = hasPermission("FoodSafe.AlertsAndTesting.News.View");
  // Moderation queue is visible to anyone who can view alerts and either assign or publish/reject
  const canModerate =
    canViewAlerts &&
    (hasPermission("FoodSafe.AlertsAndTesting.Alerts.Publish") ||
      hasPermission("FoodSafe.AlertsAndTesting.Alerts.Assign"));

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
    ...(canModerate
      ? [
          {
            key: "moderation",
            label: "Hàng chờ phản ánh công dân",
            children: <CitizenReportModerationQueue />,
          },
        ]
      : []),
  ];

  const requestedTab = searchParams.get("tab") as TabKey | null;
  const activeKey =
    requestedTab && tabItems.some((t) => t.key === requestedTab)
      ? requestedTab
      : tabItems[0]?.key;

  return (
    <Card>
      <Tabs
        activeKey={activeKey}
        items={tabItems}
        onChange={(key) => {
          setSearchParams({ tab: key }, { replace: true });
        }}
      />
    </Card>
  );
}
