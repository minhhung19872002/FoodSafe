import { useState } from "react";
import {
  Alert,
  AutoComplete,
  Button,
  DatePicker,
  Form,
  Input,
  message,
  Modal,
  Popconfirm,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  type TableColumnsType,
} from "antd";
import type { SorterResult, SortOrder } from "antd/es/table/interface";
import { RowActions } from "@/components/RowActions";
import {
  DeleteOutlined,
  EditOutlined,
  KeyOutlined,
  PlusOutlined,
  StopOutlined,
  SwapOutlined,
} from "@ant-design/icons";
import dayjs, { type Dayjs } from "dayjs";
import { useAuthStore } from "@/features/auth/store/authStore";
import { useTablePagination } from "@/hooks/useTablePagination";
import {
  usePartnerAccounts,
  usePartnerKeys,
} from "../api/dataIntegrationQueries";
import {
  useCreatePartner,
  useDeletePartner,
  useIssuePartnerKey,
  useRevokePartnerKey,
  useTogglePartnerStatus,
  useUpdatePartner,
} from "../api/dataIntegrationMutations";
import {
  PARTNER_ACCOUNT_STATUS,
  PARTNER_ACCOUNT_STATUS_CONFIG,
  SHARED_DATA_TYPE,
  SHARED_DATA_TYPE_LABELS,
  type IssuedPartnerApiKey,
  type PartnerAccount,
  type PartnerAccountFilter,
  type PartnerAccountStatus,
  type SharedDataType,
} from "../types/dataIntegration.types";

const EXTERNAL_SYSTEMS = ["Bộ Y tế", "Sở Nông nghiệp", "Sở Công thương"];

function apiErrorMessage(error: unknown, fallback: string): string {
  const serverMessage = (
    error as { response?: { data?: { error?: { message?: string } } } }
  )?.response?.data?.error?.message;
  return serverMessage || fallback;
}

interface PartnerFormValues {
  code?: string;
  name: string;
  externalSystem: string;
  allowedDataTypes: SharedDataType[];
  description?: string;
}

/** Admin UI for inbound partner accounts + API keys (INT-03, FR-50). */
export function PartnersTab() {
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const [filter, setFilter] = useState<PartnerAccountFilter>({});
  const [sorting, setSorting] = useState<string | undefined>(undefined);
  const pagination = useTablePagination(15);
  const { data, isLoading } = usePartnerAccounts({
    ...filter,
    sorting,
    skipCount: pagination.skipCount,
    maxResultCount: pagination.maxResultCount,
  });

  const sortOrderFor = (field: string): SortOrder => {
    if (!sorting) return null;
    const [current, direction] = sorting.split(" ");
    if (current !== field) return null;
    return direction === "desc" ? "descend" : "ascend";
  };

  const handleSort = (
    sorter: SorterResult<PartnerAccount> | SorterResult<PartnerAccount>[],
  ) => {
    const active = Array.isArray(sorter) ? sorter[0] : sorter;
    const next =
      active?.order && typeof active.field === "string"
        ? `${active.field} ${active.order === "descend" ? "desc" : "asc"}`
        : undefined;
    if (next !== sorting) {
      setSorting(next);
      pagination.resetToFirstPage();
    }
  };
  const createMut = useCreatePartner();
  const updateMut = useUpdatePartner();
  const toggleMut = useTogglePartnerStatus();
  const deleteMut = useDeletePartner();

  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<PartnerAccount | null>(null);
  const [keysPartner, setKeysPartner] = useState<PartnerAccount | null>(null);
  const [form] = Form.useForm<PartnerFormValues>();

  const canCreate = hasPermission("FoodSafe.DataIntegration.Partners.Create");
  const canEdit = hasPermission("FoodSafe.DataIntegration.Partners.Edit");
  const canDelete = hasPermission("FoodSafe.DataIntegration.Partners.Delete");
  const canManageKeys = hasPermission(
    "FoodSafe.DataIntegration.Partners.ManageKeys",
  );

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    setEditorOpen(true);
  };
  const openEdit = (record: PartnerAccount) => {
    setEditing(record);
    form.setFieldsValue(record);
    setEditorOpen(true);
  };

  const submit = (values: PartnerFormValues) => {
    const onError = (error: unknown) =>
      void message.error(apiErrorMessage(error, "Không thể lưu đối tác."));
    const onSuccess = () => {
      setEditorOpen(false);
      message.success("Đã lưu đối tác liên thông.");
    };
    if (editing) {
      updateMut.mutate(
        {
          id: editing.id,
          input: {
            name: values.name,
            externalSystem: values.externalSystem,
            allowedDataTypes: values.allowedDataTypes,
            description: values.description,
          },
        },
        { onSuccess, onError },
      );
    } else {
      createMut.mutate(
        {
          code: values.code!,
          name: values.name,
          externalSystem: values.externalSystem,
          allowedDataTypes: values.allowedDataTypes,
          description: values.description,
        },
        { onSuccess, onError },
      );
    }
  };

  const columns: TableColumnsType<PartnerAccount> = [
    { title: "Mã", dataIndex: "code", width: 130, ellipsis: true },
    {
      title: "Tên đối tác",
      dataIndex: "name",
      ellipsis: true,
      sorter: true,
      sortOrder: sortOrderFor("name"),
    },
    {
      title: "Hệ thống",
      dataIndex: "externalSystem",
      width: 140,
      ellipsis: true,
    },
    {
      title: "Loại dữ liệu được phép",
      dataIndex: "allowedDataTypes",
      width: 260,
      render: (types: SharedDataType[]) => (
        <>
          {types.map((t) => (
            <Tag key={t}>{SHARED_DATA_TYPE_LABELS[t]}</Tag>
          ))}
        </>
      ),
    },
    {
      title: "Khóa",
      dataIndex: "activeKeyCount",
      width: 70,
      align: "center",
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      width: 110,
      render: (s: PartnerAccountStatus) => {
        const cfg = PARTNER_ACCOUNT_STATUS_CONFIG[s];
        return <Tag color={cfg.color}>{cfg.label}</Tag>;
      },
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 96,
      render: (_, record) => {
        const toggleLabel =
          record.status === PARTNER_ACCOUNT_STATUS.Active
            ? "Tạm ngưng"
            : "Kích hoạt";
        return (
          <RowActions
            overflowAriaLabel={`Thao tác ${record.code}`}
            actions={[
              {
                key: "keys",
                label: "Khóa API",
                ariaLabel: "Khóa API",
                icon: <KeyOutlined />,
                hidden: !canManageKeys,
                onClick: () => setKeysPartner(record),
              },
              {
                key: "edit",
                label: "Sửa",
                ariaLabel: `Sửa ${record.name}`,
                icon: <EditOutlined />,
                hidden: !canEdit,
                onClick: () => openEdit(record),
              },
              {
                key: "toggle",
                label: toggleLabel,
                ariaLabel: `${toggleLabel} ${record.name}`,
                icon: <SwapOutlined />,
                hidden: !canEdit,
                confirm:
                  record.status === PARTNER_ACCOUNT_STATUS.Active
                    ? "Tạm ngưng đối tác? Mọi khóa API sẽ bị từ chối."
                    : "Kích hoạt lại đối tác?",
                onClick: () =>
                  toggleMut.mutate(record.id, {
                    onSuccess: () => message.success("Đã cập nhật trạng thái."),
                    onError: (error) =>
                      void message.error(
                        apiErrorMessage(error, "Thao tác thất bại."),
                      ),
                  }),
              },
              {
                key: "delete",
                label: "Xóa đối tác",
                ariaLabel: `Xóa ${record.name}`,
                icon: <DeleteOutlined />,
                danger: true,
                hidden: !canDelete,
                confirm: "Xóa đối tác? Mọi khóa API sẽ bị thu hồi.",
                onClick: () =>
                  deleteMut.mutate(record.id, {
                    onSuccess: () => message.success("Đã xóa đối tác."),
                    onError: (error) =>
                      void message.error(
                        apiErrorMessage(error, "Xóa thất bại."),
                      ),
                  }),
              },
            ]}
          />
        );
      },
    },
  ];

  return (
    <>
      <Space style={{ marginBottom: 16 }} wrap>
        <Input.Search
          placeholder="Mã, tên, hệ thống"
          allowClear
          style={{ width: 240 }}
          onSearch={(v) => {
            setFilter((f) => ({ ...f, filter: v || undefined }));
            pagination.resetToFirstPage();
          }}
        />
        <Select
          placeholder="Trạng thái"
          allowClear
          style={{ width: 140 }}
          options={Object.entries(PARTNER_ACCOUNT_STATUS_CONFIG).map(
            ([k, v]) => ({ value: Number(k), label: v.label }),
          )}
          onChange={(v) => {
            setFilter((f) => ({ ...f, status: v }));
            pagination.resetToFirstPage();
          }}
        />
        {canCreate && (
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            Thêm đối tác
          </Button>
        )}
      </Space>
      <Table
        rowKey="id"
        columns={columns}
        dataSource={data?.items}
        loading={isLoading}
        size="small"
        pagination={pagination.buildConfig(data?.totalCount)}
        onChange={(_pagination, _filters, sorter) => handleSort(sorter)}
      />

      <Modal
        title={editing ? "Sửa đối tác liên thông" : "Thêm đối tác liên thông"}
        open={editorOpen}
        onCancel={() => setEditorOpen(false)}
        onOk={() => form.submit()}
        okText="Lưu"
        cancelText="Hủy"
        confirmLoading={createMut.isPending || updateMut.isPending}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" preserve={false} onFinish={submit}>
          {!editing && (
            <Form.Item
              name="code"
              label="Mã đối tác"
              rules={[
                { required: true, message: "Nhập mã đối tác" },
                {
                  pattern: /^[a-zA-Z0-9_-]+$/,
                  message: "Chỉ gồm chữ, số, gạch ngang, gạch dưới.",
                },
              ]}
            >
              <Input placeholder="vd: BYT-QN" maxLength={64} />
            </Form.Item>
          )}
          <Form.Item
            name="name"
            label="Tên đối tác"
            rules={[{ required: true, message: "Nhập tên đối tác" }]}
          >
            <Input maxLength={256} />
          </Form.Item>
          <Form.Item
            name="externalSystem"
            label="Hệ thống"
            rules={[{ required: true, message: "Chọn hoặc nhập hệ thống" }]}
          >
            <AutoComplete
              options={EXTERNAL_SYSTEMS.map((s) => ({ value: s }))}
              placeholder="Bộ Y tế / Sở Nông nghiệp / Sở Công thương / khác"
            />
          </Form.Item>
          <Form.Item
            name="allowedDataTypes"
            label="Loại dữ liệu được phép gửi"
            rules={[{ required: true, message: "Chọn ít nhất một loại" }]}
          >
            <Select
              mode="multiple"
              options={Object.entries(SHARED_DATA_TYPE_LABELS)
                .filter(([v]) => Number(v) !== SHARED_DATA_TYPE.Other)
                .map(([value, label]) => ({ value: Number(value), label }))}
            />
          </Form.Item>
          <Form.Item name="description" label="Mô tả">
            <Input.TextArea rows={2} maxLength={1000} />
          </Form.Item>
        </Form>
      </Modal>

      <PartnerKeysModal
        partner={keysPartner}
        onClose={() => setKeysPartner(null)}
      />
    </>
  );
}

function PartnerKeysModal({
  partner,
  onClose,
}: {
  partner: PartnerAccount | null;
  onClose: () => void;
}) {
  const keys = usePartnerKeys(partner?.id);
  const issueMut = useIssuePartnerKey();
  const revokeMut = useRevokePartnerKey();
  const [issued, setIssued] = useState<IssuedPartnerApiKey | null>(null);
  const [expiresAt, setExpiresAt] = useState<Dayjs | null>(null);
  const [description, setDescription] = useState("");

  const close = () => {
    setIssued(null);
    setExpiresAt(null);
    setDescription("");
    onClose();
  };

  return (
    <Modal
      title={`Khóa API — ${partner?.name ?? ""}`}
      open={Boolean(partner)}
      onCancel={close}
      footer={null}
      width={760}
      destroyOnHidden
    >
      {issued && (
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
          message="Khóa API chỉ hiển thị MỘT LẦN — sao chép và gửi cho đối tác ngay."
          description={
            <Typography.Text code copyable={{ text: issued.rawKey }}>
              {issued.rawKey}
            </Typography.Text>
          }
        />
      )}
      <Space style={{ marginBottom: 16 }} wrap>
        <DatePicker
          placeholder="Hạn dùng (tùy chọn)"
          format="DD/MM/YYYY"
          value={expiresAt}
          onChange={setExpiresAt}
        />
        <Input
          placeholder="Ghi chú khóa"
          style={{ width: 220 }}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={256}
        />
        <Button
          type="primary"
          icon={<KeyOutlined />}
          loading={issueMut.isPending}
          onClick={() =>
            partner &&
            issueMut.mutate(
              {
                id: partner.id,
                input: {
                  expiresAt: expiresAt?.endOf("day").toISOString(),
                  description: description || undefined,
                },
              },
              {
                onSuccess: (key) => {
                  setIssued(key);
                  message.success("Đã cấp khóa API mới.");
                },
                onError: (error) =>
                  void message.error(
                    apiErrorMessage(error, "Không thể cấp khóa."),
                  ),
              },
            )
          }
        >
          Cấp khóa mới
        </Button>
      </Space>
      <Table
        rowKey="id"
        size="small"
        loading={keys.isLoading}
        dataSource={keys.data}
        pagination={false}
        columns={[
          {
            title: "Tiền tố",
            dataIndex: "keyPrefix",
            width: 130,
            render: (v: string) => <Typography.Text code>{v}…</Typography.Text>,
          },
          { title: "Ghi chú", dataIndex: "description", ellipsis: true },
          {
            title: "Cấp lúc",
            dataIndex: "creationTime",
            width: 130,
            render: (v: string) => dayjs(v).format("DD/MM/YYYY HH:mm"),
          },
          {
            title: "Hết hạn",
            dataIndex: "expiresAt",
            width: 110,
            render: (v?: string) => (v ? dayjs(v).format("DD/MM/YYYY") : "—"),
          },
          {
            title: "Dùng lần cuối",
            dataIndex: "lastUsedAt",
            width: 130,
            render: (v?: string) =>
              v ? dayjs(v).format("DD/MM/YYYY HH:mm") : "—",
          },
          {
            title: "Trạng thái",
            key: "state",
            width: 110,
            render: (_, key) =>
              key.revokedAt ? (
                <Tag color="red">Đã thu hồi</Tag>
              ) : key.expiresAt && dayjs(key.expiresAt).isBefore(dayjs()) ? (
                <Tag color="orange">Hết hạn</Tag>
              ) : (
                <Tag color="green">Hoạt động</Tag>
              ),
          },
          {
            title: "",
            key: "actions",
            width: 100,
            render: (_, key) =>
              !key.revokedAt && (
                <Popconfirm
                  title="Thu hồi khóa? Đối tác sẽ không gọi được nữa."
                  okText="Thu hồi"
                  cancelText="Hủy"
                  onConfirm={() =>
                    partner &&
                    revokeMut.mutate(
                      { id: partner.id, keyId: key.id },
                      {
                        onSuccess: () =>
                          message.success("Đã thu hồi khóa API."),
                        onError: (error) =>
                          void message.error(
                            apiErrorMessage(error, "Không thể thu hồi."),
                          ),
                      },
                    )
                  }
                >
                  <Button size="small" danger icon={<StopOutlined />}>
                    Thu hồi
                  </Button>
                </Popconfirm>
              ),
          },
        ]}
      />
    </Modal>
  );
}
