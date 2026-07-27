import { useState } from "react";
import {
  Button,
  Card,
  Input,
  message,
  Popconfirm,
  Select,
  Space,
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

const PAGE_SIZE = 15;

function AlertsTab() {
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const [filter, setFilter] = useState<AlertFilter>({
    skipCount: 0,
    maxResultCount: PAGE_SIZE,
  });
  const { data, isLoading } = useAlerts(filter);
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
      width: 200,
      render: (_: unknown, record: AtpAlert) => (
        <Space size="small">
          {record.status === ALERT_STATUS.Draft && canEdit && (
            <Button
              size="small"
              icon={<EditOutlined />}
              onClick={() => openEdit(record)}
            >
              Sửa
            </Button>
          )}
          {record.status === ALERT_STATUS.Draft && canPublish && (
            <Popconfirm
              title="Xuất bản cảnh báo này?"
              okText="Xuất bản"
              cancelText="Hủy"
              onConfirm={async () => {
                await publishMut.mutateAsync({
                  id: record.id,
                  isPublic: true,
                });
                message.success("Đã xuất bản.");
              }}
            >
              <Button size="small" type="primary" icon={<SendOutlined />}>
                Xuất bản
              </Button>
            </Popconfirm>
          )}
          {record.status === ALERT_STATUS.Published && canPublish && (
            <Button
              size="small"
              danger
              icon={<UndoOutlined />}
              onClick={() => {
                setRecallingId(record.id);
                setRecallOpen(true);
              }}
            >
              Thu hồi
            </Button>
          )}
          {record.status === ALERT_STATUS.Draft && canDelete && (
            <Popconfirm
              title="Xóa cảnh báo này?"
              okText="Xóa"
              cancelText="Hủy"
              onConfirm={async () => {
                await deleteMut.mutateAsync(record.id);
                message.success("Đã xóa.");
              }}
            >
              <Button size="small" danger icon={<DeleteOutlined />}>
                Xóa
              </Button>
            </Popconfirm>
          )}
        </Space>
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
          onSearch={(v) =>
            setFilter((f) => ({
              ...f,
              filter: v || undefined,
              skipCount: 0,
            }))
          }
        />
        <Select
          allowClear
          placeholder="Trạng thái"
          style={{ width: 150 }}
          onChange={(v) =>
            setFilter((f) => ({ ...f, status: v, skipCount: 0 }))
          }
          options={Object.entries(ALERT_STATUS_CONFIG).map(([value, cfg]) => ({
            value: Number(value),
            label: cfg.label,
          }))}
        />
        <Select
          allowClear
          placeholder="Mức độ"
          style={{ width: 150 }}
          onChange={(v) =>
            setFilter((f) => ({ ...f, severity: v, skipCount: 0 }))
          }
          options={Object.entries(ALERT_SEVERITY_CONFIG).map(
            ([value, cfg]) => ({ value: Number(value), label: cfg.label }),
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
        pagination={{
          current: Math.floor(filter.skipCount / PAGE_SIZE) + 1,
          pageSize: PAGE_SIZE,
          total: data?.totalCount,
          showSizeChanger: false,
          onChange: (page) =>
            setFilter((f) => ({
              ...f,
              skipCount: (page - 1) * PAGE_SIZE,
            })),
        }}
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
    </>
  );
}

function NewsTab() {
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const [filter, setFilter] = useState<NewsFilter>({
    skipCount: 0,
    maxResultCount: PAGE_SIZE,
  });
  const { data, isLoading } = useNews(filter);
  const createMut = useCreateNews();
  const updateMut = useUpdateNews();
  const deleteMut = useDeleteNews();
  const publishMut = usePublishNews();
  const recallMut = useRecallNews();
  const exportMut = useExportNews();

  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<AtpNews | undefined>();

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
      width: 200,
      render: (_: unknown, record: AtpNews) => (
        <Space size="small">
          {record.status === NEWS_STATUS.Draft && canEdit && (
            <Button
              size="small"
              icon={<EditOutlined />}
              onClick={() => openEdit(record)}
            >
              Sửa
            </Button>
          )}
          {record.status === NEWS_STATUS.Draft && canPublish && (
            <Popconfirm
              title="Xuất bản tin tức này?"
              okText="Xuất bản"
              cancelText="Hủy"
              onConfirm={async () => {
                await publishMut.mutateAsync({
                  id: record.id,
                  isPublic: true,
                });
                message.success("Đã xuất bản.");
              }}
            >
              <Button size="small" type="primary" icon={<SendOutlined />}>
                Xuất bản
              </Button>
            </Popconfirm>
          )}
          {record.status === NEWS_STATUS.Published && canPublish && (
            <Popconfirm
              title="Thu hồi tin tức này?"
              okText="Thu hồi"
              cancelText="Hủy"
              onConfirm={async () => {
                await recallMut.mutateAsync(record.id);
                message.success("Đã thu hồi.");
              }}
            >
              <Button size="small" danger icon={<UndoOutlined />}>
                Thu hồi
              </Button>
            </Popconfirm>
          )}
          {record.status === NEWS_STATUS.Draft && canDelete && (
            <Popconfirm
              title="Xóa tin tức này?"
              okText="Xóa"
              cancelText="Hủy"
              onConfirm={async () => {
                await deleteMut.mutateAsync(record.id);
                message.success("Đã xóa.");
              }}
            >
              <Button size="small" danger icon={<DeleteOutlined />}>
                Xóa
              </Button>
            </Popconfirm>
          )}
        </Space>
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
          onSearch={(v) =>
            setFilter((f) => ({
              ...f,
              filter: v || undefined,
              skipCount: 0,
            }))
          }
        />
        <Select
          allowClear
          placeholder="Trạng thái"
          style={{ width: 150 }}
          onChange={(v) =>
            setFilter((f) => ({ ...f, status: v, skipCount: 0 }))
          }
          options={Object.entries(NEWS_STATUS_CONFIG).map(([value, cfg]) => ({
            value: Number(value),
            label: cfg.label,
          }))}
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
        pagination={{
          current: Math.floor(filter.skipCount / PAGE_SIZE) + 1,
          pageSize: PAGE_SIZE,
          total: data?.totalCount,
          showSizeChanger: false,
          onChange: (page) =>
            setFilter((f) => ({
              ...f,
              skipCount: (page - 1) * PAGE_SIZE,
            })),
        }}
      />

      <NewsEditorModal
        open={editorOpen}
        item={editing}
        saving={createMut.isPending || updateMut.isPending}
        onCancel={() => setEditorOpen(false)}
        onSubmit={handleSubmit}
      />
    </>
  );
}

export default function AlertsNewsPage() {
  return (
    <Card>
      <Tabs
        items={[
          { key: "alerts", label: "Cảnh báo VSATTP", children: <AlertsTab /> },
          {
            key: "news",
            label: "Tin tức ATTP",
            children: <NewsTab />,
          },
        ]}
      />
    </Card>
  );
}
