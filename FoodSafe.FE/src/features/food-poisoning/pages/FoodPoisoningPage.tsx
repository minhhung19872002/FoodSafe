import { useState } from "react";
import {
  Button,
  Card,
  Input,
  message,
  Modal,
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
  CheckCircleOutlined,
  SolutionOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { useAuthStore } from "@/features/auth/store/authStore";
import {
  usePoisoningCases,
  usePoisoningIncidents,
} from "../api/foodPoisoningQueries";
import {
  useCreateCase,
  useUpdateCase,
  useDeleteCase,
  useSubmitCase,
  useVerifyCase,
  useCreateIncident,
  useUpdateIncident,
  useDeleteIncident,
  useSubmitIncident,
  useVerifyIncident,
  useConcludeIncident,
} from "../api/foodPoisoningMutations";
import { CaseEditorModal } from "../components/CaseEditorModal";
import { IncidentEditorModal } from "../components/IncidentEditorModal";
import {
  POISONING_CASE_STATUS,
  POISONING_CASE_STATUS_CONFIG,
  POISONING_INCIDENT_STATUS,
  POISONING_INCIDENT_STATUS_CONFIG,
  TREATMENT_RESULT_CONFIG,
  VICTIM_GENDER_CONFIG,
  type CaseFilter,
  type CreateUpdateCaseInput,
  type CreateUpdateIncidentInput,
  type FoodPoisoningCase,
  type FoodPoisoningIncident,
  type IncidentFilter,
  type PoisoningCaseStatus,
  type PoisoningIncidentStatus,
  type TreatmentResult,
  type VictimGender,
} from "../types/foodPoisoning.types";

const PAGE_SIZE = 15;

function CasesTab() {
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const [filter, setFilter] = useState<CaseFilter>({
    skipCount: 0,
    maxResultCount: PAGE_SIZE,
  });
  const { data, isLoading } = usePoisoningCases(filter);
  const createMut = useCreateCase();
  const updateMut = useUpdateCase();
  const deleteMut = useDeleteCase();
  const submitMut = useSubmitCase();
  const verifyMut = useVerifyCase();

  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<FoodPoisoningCase | undefined>();

  const canCreate = hasPermission("FoodSafe.FoodPoisoning.Cases.Create");
  const canEdit = hasPermission("FoodSafe.FoodPoisoning.Cases.Edit");
  const canDelete = hasPermission("FoodSafe.FoodPoisoning.Cases.Delete");
  const canVerify = hasPermission("FoodSafe.FoodPoisoning.Cases.Verify");

  function openCreate() {
    setEditing(undefined);
    setEditorOpen(true);
  }
  function openEdit(item: FoodPoisoningCase) {
    setEditing(item);
    setEditorOpen(true);
  }

  async function handleSubmit(input: CreateUpdateCaseInput) {
    try {
      if (editing) {
        await updateMut.mutateAsync({ id: editing.id, input });
        message.success("Cập nhật ca ngộ độc thành công.");
      } else {
        await createMut.mutateAsync(input);
        message.success("Tạo ca ngộ độc thành công.");
      }
      setEditorOpen(false);
    } catch {
      message.error("Thao tác thất bại. Vui lòng thử lại.");
    }
  }

  const columns: TableColumnsType<FoodPoisoningCase> = [
    {
      title: "Mã ca",
      dataIndex: "caseCode",
      width: 140,
    },
    {
      title: "Ngày báo cáo",
      dataIndex: "reportDate",
      width: 120,
      render: (v: string) => dayjs(v).format("DD/MM/YYYY"),
    },
    {
      title: "Nạn nhân",
      dataIndex: "victimName",
      width: 160,
      ellipsis: true,
    },
    {
      title: "Giới tính",
      dataIndex: "victimGender",
      width: 80,
      render: (v?: VictimGender) =>
        v ? VICTIM_GENDER_CONFIG[v]?.label : "—",
    },
    {
      title: "Tuổi",
      dataIndex: "victimAge",
      width: 60,
      render: (v?: number) => v ?? "—",
    },
    {
      title: "Thực phẩm nghi ngờ",
      dataIndex: "suspectedFood",
      width: 180,
      ellipsis: true,
    },
    {
      title: "Kết quả",
      dataIndex: "treatmentResult",
      width: 120,
      render: (v?: TreatmentResult) => {
        if (!v) return "—";
        const cfg = TREATMENT_RESULT_CONFIG[v];
        return <Tag color={cfg.color}>{cfg.label}</Tag>;
      },
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      width: 120,
      render: (s: PoisoningCaseStatus) => {
        const cfg = POISONING_CASE_STATUS_CONFIG[s];
        return <Tag color={cfg.color}>{cfg.label}</Tag>;
      },
    },
    {
      title: "",
      key: "actions",
      width: 240,
      render: (_: unknown, record: FoodPoisoningCase) => (
        <Space size="small">
          {record.status === POISONING_CASE_STATUS.Draft && canEdit && (
            <Button
              size="small"
              icon={<EditOutlined />}
              onClick={() => openEdit(record)}
            >
              Sửa
            </Button>
          )}
          {record.status === POISONING_CASE_STATUS.Draft && canEdit && (
            <Popconfirm
              title="Gửi báo cáo ca ngộ độc này?"
              onConfirm={async () => {
                await submitMut.mutateAsync(record.id);
                message.success("Đã gửi báo cáo.");
              }}
            >
              <Button size="small" type="primary" icon={<SendOutlined />}>
                Gửi
              </Button>
            </Popconfirm>
          )}
          {record.status === POISONING_CASE_STATUS.Reported && canVerify && (
            <Popconfirm
              title="Xác minh ca ngộ độc này?"
              onConfirm={async () => {
                await verifyMut.mutateAsync(record.id);
                message.success("Đã xác minh.");
              }}
            >
              <Button
                size="small"
                type="primary"
                icon={<CheckCircleOutlined />}
              >
                Xác minh
              </Button>
            </Popconfirm>
          )}
          {record.status === POISONING_CASE_STATUS.Draft && canDelete && (
            <Popconfirm
              title="Xóa ca ngộ độc này?"
              onConfirm={async () => {
                await deleteMut.mutateAsync(record.id);
                message.success("Đã xóa.");
              }}
            >
              <Button size="small" danger icon={<DeleteOutlined />} />
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
          placeholder="Tìm theo mã ca, tên nạn nhân..."
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
          options={Object.entries(POISONING_CASE_STATUS_CONFIG).map(
            ([value, cfg]) => ({
              value: Number(value),
              label: cfg.label,
            }),
          )}
        />
        <div style={{ flex: 1 }} />
        {canCreate && (
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            Tạo ca ngộ độc
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

      <CaseEditorModal
        open={editorOpen}
        item={editing}
        saving={createMut.isPending || updateMut.isPending}
        onCancel={() => setEditorOpen(false)}
        onSubmit={handleSubmit}
      />
    </>
  );
}

function IncidentsTab() {
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const [filter, setFilter] = useState<IncidentFilter>({
    skipCount: 0,
    maxResultCount: PAGE_SIZE,
  });
  const { data, isLoading } = usePoisoningIncidents(filter);
  const createMut = useCreateIncident();
  const updateMut = useUpdateIncident();
  const deleteMut = useDeleteIncident();
  const submitMut = useSubmitIncident();
  const verifyMut = useVerifyIncident();
  const concludeMut = useConcludeIncident();

  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<FoodPoisoningIncident | undefined>();
  const [concludeOpen, setConcludeOpen] = useState(false);
  const [concludingId, setConcludingId] = useState<string | null>(null);

  const canCreate = hasPermission("FoodSafe.FoodPoisoning.Incidents.Create");
  const canEdit = hasPermission("FoodSafe.FoodPoisoning.Incidents.Edit");
  const canDelete = hasPermission("FoodSafe.FoodPoisoning.Incidents.Delete");
  const canVerify = hasPermission("FoodSafe.FoodPoisoning.Incidents.Verify");
  const canConclude = hasPermission(
    "FoodSafe.FoodPoisoning.Incidents.Conclude",
  );

  function openCreate() {
    setEditing(undefined);
    setEditorOpen(true);
  }
  function openEdit(item: FoodPoisoningIncident) {
    setEditing(item);
    setEditorOpen(true);
  }

  async function handleSubmit(input: CreateUpdateIncidentInput) {
    try {
      if (editing) {
        await updateMut.mutateAsync({ id: editing.id, input });
        message.success("Cập nhật vụ ngộ độc thành công.");
      } else {
        await createMut.mutateAsync(input);
        message.success("Tạo vụ ngộ độc thành công.");
      }
      setEditorOpen(false);
    } catch {
      message.error("Thao tác thất bại. Vui lòng thử lại.");
    }
  }

  const columns: TableColumnsType<FoodPoisoningIncident> = [
    {
      title: "Mã vụ",
      dataIndex: "incidentCode",
      width: 140,
    },
    {
      title: "Ngày xảy ra",
      dataIndex: "occurrenceDate",
      width: 130,
      render: (v?: string) =>
        v ? dayjs(v).format("DD/MM/YYYY HH:mm") : "—",
    },
    {
      title: "Địa điểm",
      dataIndex: "locationDescription",
      width: 200,
      ellipsis: true,
    },
    {
      title: "Mắc",
      dataIndex: "affectedCount",
      width: 70,
      align: "right",
    },
    {
      title: "Nhập viện",
      dataIndex: "hospitalizedCount",
      width: 90,
      align: "right",
    },
    {
      title: "Tử vong",
      dataIndex: "deathCount",
      width: 80,
      align: "right",
      render: (v: number) =>
        v > 0 ? <Tag color="red">{v}</Tag> : v,
    },
    {
      title: "Số ca",
      dataIndex: "caseCount",
      width: 70,
      align: "right",
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      width: 120,
      render: (s: PoisoningIncidentStatus) => {
        const cfg = POISONING_INCIDENT_STATUS_CONFIG[s];
        return <Tag color={cfg.color}>{cfg.label}</Tag>;
      },
    },
    {
      title: "",
      key: "actions",
      width: 280,
      render: (_: unknown, record: FoodPoisoningIncident) => (
        <Space size="small">
          {record.status === POISONING_INCIDENT_STATUS.Draft && canEdit && (
            <Button
              size="small"
              icon={<EditOutlined />}
              onClick={() => openEdit(record)}
            >
              Sửa
            </Button>
          )}
          {record.status === POISONING_INCIDENT_STATUS.Draft && canEdit && (
            <Popconfirm
              title="Gửi báo cáo vụ ngộ độc này?"
              onConfirm={async () => {
                await submitMut.mutateAsync(record.id);
                message.success("Đã gửi báo cáo.");
              }}
            >
              <Button size="small" type="primary" icon={<SendOutlined />}>
                Gửi
              </Button>
            </Popconfirm>
          )}
          {record.status === POISONING_INCIDENT_STATUS.Reported &&
            canVerify && (
              <Popconfirm
                title="Xác minh vụ ngộ độc này?"
                onConfirm={async () => {
                  await verifyMut.mutateAsync(record.id);
                  message.success("Đã xác minh.");
                }}
              >
                <Button
                  size="small"
                  type="primary"
                  icon={<CheckCircleOutlined />}
                >
                  Xác minh
                </Button>
              </Popconfirm>
            )}
          {record.status === POISONING_INCIDENT_STATUS.Verified &&
            canConclude && (
              <Button
                size="small"
                type="primary"
                icon={<SolutionOutlined />}
                onClick={() => {
                  setConcludingId(record.id);
                  setConcludeOpen(true);
                }}
              >
                Kết luận
              </Button>
            )}
          {record.status === POISONING_INCIDENT_STATUS.Draft && canDelete && (
            <Popconfirm
              title="Xóa vụ ngộ độc này?"
              onConfirm={async () => {
                await deleteMut.mutateAsync(record.id);
                message.success("Đã xóa.");
              }}
            >
              <Button size="small" danger icon={<DeleteOutlined />} />
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
          placeholder="Tìm theo mã vụ, địa điểm..."
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
          options={Object.entries(POISONING_INCIDENT_STATUS_CONFIG).map(
            ([value, cfg]) => ({
              value: Number(value),
              label: cfg.label,
            }),
          )}
        />
        <div style={{ flex: 1 }} />
        {canCreate && (
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            Tạo vụ ngộ độc
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

      <IncidentEditorModal
        open={editorOpen}
        item={editing}
        saving={createMut.isPending || updateMut.isPending}
        onCancel={() => setEditorOpen(false)}
        onSubmit={handleSubmit}
      />

      <ConcludeModal
        open={concludeOpen}
        loading={concludeMut.isPending}
        onCancel={() => setConcludeOpen(false)}
        onConfirm={async (conclusion) => {
          if (concludingId) {
            await concludeMut.mutateAsync({
              id: concludingId,
              input: { conclusion },
            });
            message.success("Đã kết luận vụ ngộ độc.");
          }
          setConcludeOpen(false);
          setConcludingId(null);
        }}
      />
    </>
  );
}

function ConcludeModal(props: {
  open: boolean;
  loading: boolean;
  onCancel: () => void;
  onConfirm: (conclusion: string) => void;
}) {
  const [value, setValue] = useState("");

  return (
    <Modal
      open={props.open}
      title="Kết luận vụ ngộ độc"
      okText="Xác nhận"
      cancelText="Hủy"
      confirmLoading={props.loading}
      onCancel={() => {
        setValue("");
        props.onCancel();
      }}
      onOk={() => {
        if (!value.trim()) {
          message.warning("Vui lòng nhập nội dung kết luận.");
          return;
        }
        props.onConfirm(value.trim());
        setValue("");
      }}
      destroyOnHidden
    >
      <Input.TextArea
        rows={4}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Nhập nội dung kết luận vụ ngộ độc..."
      />
    </Modal>
  );
}

export default function FoodPoisoningPage() {
  return (
    <Card>
      <Tabs
        items={[
          {
            key: "cases",
            label: "Ca ngộ độc nhỏ lẻ",
            children: <CasesTab />,
          },
          {
            key: "incidents",
            label: "Vụ ngộ độc thực phẩm",
            children: <IncidentsTab />,
          },
        ]}
      />
    </Card>
  );
}
