import { useState } from "react";
import {
  App,
  Button,
  Form,
  Input,
  Modal,
  Select,
  Space,
  Table,
  Tag,
  Tooltip,
  type TableColumnsType,
} from "antd";
import {
  CheckCircleOutlined,
  ReloadOutlined,
  StopOutlined,
  UserAddOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { useAuthStore } from "@/features/auth/store/authStore";
import { RevokeModal } from "@/components/RevokeModal";
import { EmptyState } from "@/components/EmptyState";
import { extractApiError } from "@/lib/apiError";
import { matchesSearch } from "@/utils/textSearch";
import { useAlerts } from "../api/alertsNewsQueries";
import { useStaffUsers } from "../api/alertsNewsQueries";
import {
  useAssignAlert,
  usePublishAlert,
  useRejectAlert,
} from "../api/alertsNewsMutations";
import {
  ALERT_CATEGORY_LABELS,
  ALERT_SOURCE,
  ALERT_STATUS,
  ALERT_STATUS_CONFIG,
  type AlertCategory,
  type AlertStatus,
  type AtpAlert,
} from "../types/alertsNews.types";
import { useTablePagination } from "@/hooks/useTablePagination";
import { RowActions } from "@/components/RowActions";

interface AssignFormValues {
  assigneeId: string;
}

interface AssignModalState {
  open: boolean;
  alertId: string | null;
  currentAssigneeId?: string;
}

export function CitizenReportModerationQueue() {
  const { message } = App.useApp();
  const hasPermission = useAuthStore((s) => s.hasPermission);

  const canPublish = hasPermission("FoodSafe.AlertsAndTesting.Alerts.Publish");
  const canAssign = hasPermission("FoodSafe.AlertsAndTesting.Alerts.Assign");

  const pagination = useTablePagination(15);
  const [statusFilter, setStatusFilter] = useState<AlertStatus | undefined>();
  const [keywordFilter, setKeywordFilter] = useState<string | undefined>();

  const queryFilter = {
    source: ALERT_SOURCE.PublicReport,
    status: statusFilter,
    filter: keywordFilter,
    skipCount: pagination.skipCount,
    maxResultCount: pagination.maxResultCount,
  };
  const { data, isFetching } = useAlerts(queryFilter);

  const { data: staffData } = useStaffUsers();
  const staffUsers = staffData?.items ?? [];
  const staffOptions = staffUsers.map((u) => ({
    value: u.id,
    label: u.fullName?.trim() || u.userName,
  }));

  const publishMut = usePublishAlert();
  const rejectMut = useRejectAlert();
  const assignMut = useAssignAlert();

  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [assignModal, setAssignModal] = useState<AssignModalState>({
    open: false,
    alertId: null,
  });
  const [assignForm] = Form.useForm<AssignFormValues>();

  function openAssignModal(record: AtpAlert) {
    setAssignModal({
      open: true,
      alertId: record.id,
      currentAssigneeId: record.assigneeId,
    });
    assignForm.setFieldsValue({ assigneeId: record.assigneeId });
  }

  function closeAssignModal() {
    setAssignModal({ open: false, alertId: null });
    assignForm.resetFields();
  }

  function handleAssign(values: AssignFormValues) {
    if (!assignModal.alertId) return;
    assignMut.mutate(
      { id: assignModal.alertId, input: { assigneeId: values.assigneeId } },
      {
        onSuccess: () => {
          void message.success("Đã phân công thành công.");
          closeAssignModal();
        },
        onError: (error) => void message.error(extractApiError(error)),
      },
    );
  }

  const hasActiveFilter = Boolean(keywordFilter);

  const columns: TableColumnsType<AtpAlert> = [
    {
      title: "Ngày tiếp nhận",
      dataIndex: "creationTime",
      width: 130,
      render: (v: string) => dayjs(v).format("DD/MM/YYYY HH:mm"),
    },
    {
      title: "Người phản ánh",
      dataIndex: "reporterName",
      width: 150,
      render: (name?: string) =>
        name ? (
          name
        ) : (
          <span style={{ color: "var(--ant-color-text-tertiary)" }}>
            Ẩn danh
          </span>
        ),
    },
    {
      title: "Tiêu đề / Nội dung",
      key: "content",
      ellipsis: true,
      render: (_: unknown, record: AtpAlert) => (
        <div>
          <div style={{ fontWeight: 500 }}>{record.title}</div>
          <div
            style={{
              color: "var(--ant-color-text-secondary)",
              fontSize: 12,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              maxWidth: 320,
            }}
          >
            {record.content}
          </div>
        </div>
      ),
    },
    {
      title: "Loại",
      dataIndex: "category",
      width: 140,
      render: (c: AlertCategory) => ALERT_CATEGORY_LABELS[c],
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
      title: "Cán bộ xử lý",
      dataIndex: "assigneeName",
      width: 160,
      render: (name?: string) =>
        name ? (
          <Tag icon={<CheckCircleOutlined />} color="blue">
            {name}
          </Tag>
        ) : (
          <span style={{ color: "var(--ant-color-text-tertiary)" }}>
            Chưa phân công
          </span>
        ),
    },
    {
      title: "Thao tác",
      key: "actions",
      fixed: "right",
      width: 96,
      render: (_: unknown, record: AtpAlert) => (
        <RowActions
          overflowAriaLabel={`Thao tác phản ánh ${record.title}`}
          actions={[
            {
              key: "assign",
              label: "Phân công",
              ariaLabel: `Phân công ${record.title}`,
              icon: <UserAddOutlined />,
              hidden: !(record.status === ALERT_STATUS.Draft && canAssign),
              onClick: () => openAssignModal(record),
            },
            {
              key: "publish",
              label: "Xử lý (xuất bản)",
              ariaLabel: `Xử lý ${record.title}`,
              icon: <CheckCircleOutlined />,
              hidden: !(record.status === ALERT_STATUS.Draft && canPublish),
              confirm: "Xuất bản cảnh báo này lên hệ thống?",
              onClick: () =>
                publishMut.mutate(
                  { id: record.id, isPublic: true },
                  {
                    onSuccess: () =>
                      void message.success("Đã xuất bản cảnh báo."),
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
            placeholder="Tìm theo tiêu đề, nội dung..."
            style={{ width: 280 }}
            onSearch={(v) => {
              setKeywordFilter(v || undefined);
              pagination.resetToFirstPage();
            }}
          />
          <Select
            allowClear
            placeholder="Tất cả trạng thái"
            value={statusFilter}
            style={{ width: 160 }}
            onChange={(v) => {
              setStatusFilter(v as AlertStatus | undefined);
              pagination.resetToFirstPage();
            }}
            options={Object.entries(ALERT_STATUS_CONFIG).map(([value, cfg]) => ({
              value: Number(value) as AlertStatus,
              label: cfg.label,
            }))}
          />
        </Space>
        <Tooltip title="Tải lại danh sách">
          <Button
            icon={<ReloadOutlined />}
            onClick={() => pagination.resetToFirstPage()}
          />
        </Tooltip>
      </div>

      <Table
        rowKey="id"
        dataSource={data?.items}
        columns={columns}
        loading={isFetching}
        size="small"
        scroll={{ x: 1080 }}
        locale={{
          emptyText: (
            <EmptyState
              title={
                hasActiveFilter
                  ? "Không tìm thấy phản ánh phù hợp"
                  : "Chưa có phản ánh từ công dân"
              }
              description={
                hasActiveFilter
                  ? "Thử thay đổi từ khóa hoặc bộ lọc."
                  : undefined
              }
            />
          ),
        }}
        pagination={pagination.buildConfig(data?.totalCount)}
      />

      {/* Assign modal */}
      <Modal
        title="Phân công cán bộ xử lý"
        open={assignModal.open}
        onCancel={closeAssignModal}
        onOk={() => assignForm.submit()}
        okText="Phân công"
        confirmLoading={assignMut.isPending}
        destroyOnClose
      >
        <Form
          form={assignForm}
          layout="vertical"
          onFinish={handleAssign}
          style={{ marginTop: 12 }}
        >
          <Form.Item
            name="assigneeId"
            label="Cán bộ xử lý"
            rules={[{ required: true, message: "Vui lòng chọn cán bộ xử lý" }]}
          >
            <Select
              showSearch
              placeholder="Chọn cán bộ..."
              filterOption={(input, option) =>
                matchesSearch((option?.label as string) ?? "", input)
              }
              options={staffOptions}
              style={{ width: "100%" }}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* Reject modal */}
      <RevokeModal
        open={Boolean(rejectingId)}
        title="Từ chối phản ánh"
        okText="Từ chối"
        description="Phản ánh bị từ chối sẽ được lưu lại kèm lý do để phục vụ tra cứu, và không hiển thị trên cổng công khai."
        placeholder="Lý do từ chối"
        confirmLoading={rejectMut.isPending}
        onCancel={() => setRejectingId(null)}
        onConfirm={(reason) => {
          if (!rejectingId) return;
          rejectMut.mutate(
            { id: rejectingId, reason },
            {
              onSuccess: () => {
                void message.success("Đã từ chối phản ánh.");
                setRejectingId(null);
              },
              onError: (error) => void message.error(extractApiError(error)),
            },
          );
        }}
      />
    </>
  );
}
