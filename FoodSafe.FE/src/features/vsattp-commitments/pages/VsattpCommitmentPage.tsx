import { useState } from "react";
import {
  CheckOutlined,
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import {
  App,
  Button,
  DatePicker,
  Form,
  Input,
  Modal,
  Select,
  Space,
  Table,
  Tag,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import { useAuthStore } from "@/features/auth/store/authStore";
import { ClearFiltersButton } from "@/components/ClearFiltersButton";
import { RefreshListButton } from "@/components/RefreshListButton";
import { useBusinessList } from "@/features/businesses/api/businessQueries";
import { useTablePagination } from "@/hooks/useTablePagination";
import { PageHeader } from "@/components/PageHeader";
import { extractApiError } from "@/lib/apiError";
import { formatDate } from "@/utils/format";
import {
  useConfirmVsattpCommitment,
  useCreateVsattpCommitment,
  useDeleteVsattpCommitment,
  useUpdateVsattpCommitment,
} from "../api/vsattpCommitmentMutations";
import { useVsattpCommitments } from "../api/vsattpCommitmentQueries";
import type {
  CreateVsattpCommitmentInput,
  UpdateVsattpCommitmentInput,
  VsattpCommitment,
  VsattpCommitmentStatus,
} from "../types/vsattpCommitment.types";
import {
  VSATTP_COMMITMENT_STATUS,
  VSATTP_STATUS_CONFIG,
} from "../types/vsattpCommitment.types";

interface FormValues {
  businessId: string;
  commitmentDate: dayjs.Dayjs;
  notes?: string;
}

export default function VsattpCommitmentPage() {
  const { message, modal } = App.useApp();
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const canCreate = hasPermission(
    "FoodSafe.Licensing.VsattpCommitments.Create",
  );
  const canEdit = hasPermission("FoodSafe.Licensing.VsattpCommitments.Edit");
  const canDelete = hasPermission(
    "FoodSafe.Licensing.VsattpCommitments.Delete",
  );
  const canConfirm = hasPermission(
    "FoodSafe.Licensing.VsattpCommitments.Confirm",
  );

  const pagination = useTablePagination(20);
  const [filterBizId, setFilterBizId] = useState<string>();
  const [filterStatus, setFilterStatus] = useState<VsattpCommitmentStatus>();
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<VsattpCommitment>();
  const [bizSearch, setBizSearch] = useState("");

  const { data: bizData, isFetching: bizFetching } = useBusinessList(
    { filter: bizSearch || undefined, skipCount: 0, maxResultCount: 30 },
    true,
  );

  const filter = {
    businessId: filterBizId,
    status: filterStatus,
    skipCount: pagination.skipCount,
    maxResultCount: pagination.maxResultCount,
  };
  const commitments = useVsattpCommitments(filter);
  const { data, isLoading } = commitments;

  const createMutation = useCreateVsattpCommitment();
  const updateMutation = useUpdateVsattpCommitment();
  const deleteMutation = useDeleteVsattpCommitment();
  const confirmMutation = useConfirmVsattpCommitment();

  const [form] = Form.useForm<FormValues>();

  function openCreate() {
    setEditing(undefined);
    form.resetFields();
    setEditorOpen(true);
  }

  function openEdit(record: VsattpCommitment) {
    setEditing(record);
    form.setFieldsValue({
      businessId: record.businessId,
      commitmentDate: dayjs(record.commitmentDate),
      notes: record.notes,
    });
    setEditorOpen(true);
  }

  async function handleSubmit() {
    const values = await form.validateFields();
    const dateStr = values.commitmentDate.format("YYYY-MM-DD");
    try {
      if (editing) {
        const input: UpdateVsattpCommitmentInput = {
          commitmentDate: dateStr,
          notes: values.notes || undefined,
        };
        await updateMutation.mutateAsync({ id: editing.id, input });
        message.success("Cập nhật cam kết VSATTP thành công");
      } else {
        const input: CreateVsattpCommitmentInput = {
          businessId: values.businessId,
          commitmentDate: dateStr,
          notes: values.notes || undefined,
        };
        await createMutation.mutateAsync(input);
        message.success("Thêm cam kết VSATTP thành công");
      }
      setEditorOpen(false);
    } catch (err) {
      message.error(extractApiError(err) ?? "Có lỗi xảy ra");
    }
  }

  function handleDelete(record: VsattpCommitment) {
    modal.confirm({
      title: "Xác nhận xóa",
      content: `Bạn có chắc muốn xóa cam kết VSATTP ngày ${formatDate(record.commitmentDate)}?`,
      okText: "Xóa",
      okType: "danger",
      cancelText: "Hủy",
      onOk: async () => {
        try {
          await deleteMutation.mutateAsync(record.id);
          message.success("Xóa thành công");
        } catch (err) {
          message.error(extractApiError(err) ?? "Có lỗi xảy ra");
        }
      },
    });
  }

  function handleConfirm(record: VsattpCommitment) {
    modal.confirm({
      title: "Xác nhận cam kết VSATTP",
      content: `Xác nhận cam kết VSATTP ngày ${formatDate(record.commitmentDate)}? Hành động này không thể hoàn tác.`,
      okText: "Xác nhận",
      cancelText: "Hủy",
      onOk: async () => {
        try {
          await confirmMutation.mutateAsync(record.id);
          message.success("Xác nhận cam kết thành công");
        } catch (err) {
          message.error(extractApiError(err) ?? "Có lỗi xảy ra");
        }
      },
    });
  }

  const columns: ColumnsType<VsattpCommitment> = [
    {
      title: "Cơ sở",
      dataIndex: "businessId",
      width: 220,
      ellipsis: true,
      render: (v: string) => v,
    },
    {
      title: "Ngày cam kết",
      dataIndex: "commitmentDate",
      width: 130,
      render: (v: string) => formatDate(v),
    },
    {
      title: "Ghi chú",
      dataIndex: "notes",
      render: (v?: string) => v ?? "—",
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      width: 130,
      render: (v: VsattpCommitmentStatus) => {
        const cfg = VSATTP_STATUS_CONFIG[v];
        return <Tag color={cfg.color}>{cfg.label}</Tag>;
      },
    },
    {
      title: "Ngày tạo",
      dataIndex: "creationTime",
      width: 130,
      render: (v: string) => formatDate(v),
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 160,
      render: (_: unknown, record: VsattpCommitment) => {
        const confirmed = record.status === VSATTP_COMMITMENT_STATUS.Confirmed;
        return (
          <Space size="small">
            {canEdit && (
              <Button
                type="link"
                size="small"
                icon={<EditOutlined />}
                disabled={confirmed}
                onClick={() => openEdit(record)}
              >
                Sửa
              </Button>
            )}
            {canConfirm && !confirmed && (
              <Button
                type="link"
                size="small"
                icon={<CheckOutlined />}
                onClick={() => handleConfirm(record)}
              >
                Xác nhận
              </Button>
            )}
            {canDelete && (
              <Button
                type="link"
                size="small"
                danger
                icon={<DeleteOutlined />}
                disabled={confirmed}
                onClick={() => handleDelete(record)}
              >
                Xóa
              </Button>
            )}
          </Space>
        );
      },
    },
  ];

  const bizOptions = (bizData?.items ?? []).map((b) => ({
    value: b.id,
    label: b.code ? `${b.name} (${b.code})` : b.name,
  }));

  const statusOptions = Object.entries(VSATTP_STATUS_CONFIG).map(([k, v]) => ({
    value: Number(k),
    label: v.label,
  }));

  return (
    <>
      <PageHeader title="Cam kết VSATTP" />

      <Space style={{ marginBottom: 16 }} wrap>
        <Select
          placeholder="Lọc theo cơ sở…"
          allowClear
          showSearch
          loading={bizFetching}
          filterOption={false}
          onSearch={setBizSearch}
          value={filterBizId}
          onChange={setFilterBizId}
          style={{ width: 280 }}
          options={bizOptions}
        />
        <Select
          placeholder="Trạng thái"
          allowClear
          value={filterStatus}
          onChange={setFilterStatus}
          style={{ width: 160 }}
          options={statusOptions}
        />
        <ClearFiltersButton
          active={Boolean(filterBizId || filterStatus !== undefined)}
          onClick={() => {
            setFilterBizId(undefined);
            setFilterStatus(undefined);
            pagination.resetToFirstPage();
          }}
        />
        <RefreshListButton
          loading={commitments.isFetching}
          onClick={() => void commitments.refetch()}
        />
        {canCreate && (
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            Thêm mới
          </Button>
        )}
      </Space>

      <Table
        rowKey="id"
        size="small"
        loading={isLoading}
        columns={columns}
        dataSource={data?.items}
        pagination={pagination.buildConfig(data?.totalCount ?? 0)}
      />

      <Modal
        title={editing ? "Cập nhật cam kết VSATTP" : "Thêm cam kết VSATTP"}
        open={editorOpen}
        onOk={handleSubmit}
        onCancel={() => setEditorOpen(false)}
        okText={editing ? "Cập nhật" : "Thêm"}
        cancelText="Hủy"
        confirmLoading={createMutation.isPending || updateMutation.isPending}
        destroyOnHidden
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="businessId"
            label="Cơ sở"
            rules={[{ required: true, message: "Vui lòng chọn cơ sở" }]}
          >
            <Select
              disabled={Boolean(editing)}
              showSearch
              loading={bizFetching}
              filterOption={false}
              onSearch={setBizSearch}
              placeholder="Tìm theo tên cơ sở…"
              options={bizOptions}
            />
          </Form.Item>
          <Form.Item
            name="commitmentDate"
            label="Ngày cam kết"
            rules={[{ required: true, message: "Vui lòng chọn ngày cam kết" }]}
          >
            <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
          </Form.Item>
          <Form.Item name="notes" label="Ghi chú">
            <Input.TextArea rows={3} placeholder="Ghi chú (không bắt buộc)" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
