import { useState } from "react";
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  DeleteOutlined,
  EditOutlined,
  ExportOutlined,
  PlusOutlined,
  SendOutlined,
  StopOutlined,
} from "@ant-design/icons";
import {
  App,
  Button,
  Input,
  InputNumber,
  Popconfirm,
  Select,
  Space,
  Table,
  Tabs,
  Tag,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { useAuthStore } from "@/features/auth/store/authStore";
import { PageHeader } from "@/components/PageHeader";
import { RevokeModal } from "@/components/RevokeModal";
import { saveDownload } from "@/utils/download";
import {
  useApproveInspectionPlan,
  useCancelInspectionPlan,
  useCompleteInspectionPlan,
  useCreateInspectionPlan,
  useCreateInspectionResult,
  useDeleteInspectionPlan,
  useDeleteInspectionResult,
  useExportInspectionPlans,
  useExportInspectionResults,
  useRejectInspectionPlan,
  useSubmitInspectionPlan,
  useUpdateInspectionPlan,
  useUpdateInspectionResult,
} from "../api/inspectionMutations";
import {
  useInspectionBusinesses,
  useInspectionPlans,
  useInspectionResults,
} from "../api/inspectionQueries";
import { InspectionPlanEditorModal } from "../components/InspectionPlanEditorModal";
import { InspectionResultEditorModal } from "../components/InspectionResultEditorModal";
import {
  INSPECTION_OVERALL_RESULT_CONFIG,
  INSPECTION_PLAN_STATUS,
  INSPECTION_PLAN_STATUS_CONFIG,
  INSPECTION_PLAN_TYPE_LABELS,
  INSPECTION_TYPE_LABELS,
  type CreateUpdateInspectionPlanInput,
  type CreateUpdateInspectionResultInput,
  type InspectionOverallResult,
  type InspectionPlan,
  type InspectionPlanStatus,
  type InspectionPlanType,
  type InspectionResult,
  type InspectionType,
} from "../types/inspection.types";

const PAGE_SIZE = 20;

export default function InspectionPage() {
  return (
    <div className="page-container">
      <PageHeader
        title="Thanh tra - Kiểm tra ATTP"
        subtitle="Kế hoạch và kết quả kiểm tra an toàn thực phẩm"
      />
      <div className="page-card">
        <Tabs
          defaultActiveKey="plans"
          items={[
            { key: "plans", label: "Kế hoạch", children: <PlansTab /> },
            { key: "results", label: "Kết quả", children: <ResultsTab /> },
          ]}
        />
      </div>
    </div>
  );
}

function PlansTab() {
  const { message } = App.useApp();
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const canCreate = hasPermission("FoodSafe.Inspection.Plans.Create");
  const canEdit = hasPermission("FoodSafe.Inspection.Plans.Edit");
  const canDelete = hasPermission("FoodSafe.Inspection.Plans.Delete");
  const canApprove = hasPermission("FoodSafe.Inspection.Plans.Approve");

  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<InspectionPlanStatus>();
  const [planTypeFilter, setPlanTypeFilter] = useState<InspectionPlanType>();
  const [yearFilter, setYearFilter] = useState<number>();
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<InspectionPlan>();
  const [rejecting, setRejecting] = useState<InspectionPlan>();
  const [cancelling, setCancelling] = useState<InspectionPlan>();

  const queryFilter = {
    filter: filter || undefined,
    status: statusFilter,
    planType: planTypeFilter,
    year: yearFilter,
    skipCount: (page - 1) * PAGE_SIZE,
    maxResultCount: PAGE_SIZE,
  };
  const plans = useInspectionPlans(queryFilter);
  const businesses = useInspectionBusinesses();

  const createMutation = useCreateInspectionPlan();
  const updateMutation = useUpdateInspectionPlan();
  const deleteMutation = useDeleteInspectionPlan();
  const submitMutation = useSubmitInspectionPlan();
  const approveMutation = useApproveInspectionPlan();
  const rejectMutation = useRejectInspectionPlan();
  const completeMutation = useCompleteInspectionPlan();
  const cancelMutation = useCancelInspectionPlan();
  const exportMutation = useExportInspectionPlans();

  const closeEditor = () => {
    setEditorOpen(false);
    setEditing(undefined);
  };

  const save = (input: CreateUpdateInspectionPlanInput) => {
    const options = {
      onSuccess: () => {
        void message.success("Đã lưu kế hoạch.");
        closeEditor();
      },
      onError: () =>
        void message.error("Không thể lưu kế hoạch. Kiểm tra dữ liệu."),
    };
    if (editing) updateMutation.mutate({ id: editing.id, input }, options);
    else createMutation.mutate(input, options);
  };

  const columns: ColumnsType<InspectionPlan> = [
    { title: "Mã KH", dataIndex: "planCode", width: 120 },
    { title: "Tên kế hoạch", dataIndex: "title", ellipsis: true },
    {
      title: "Loại",
      dataIndex: "planType",
      width: 120,
      render: (v: InspectionPlanType) =>
        INSPECTION_PLAN_TYPE_LABELS[v] ?? v,
    },
    { title: "Năm", dataIndex: "year", width: 70 },
    {
      title: "Tiến độ",
      width: 100,
      render: (_, item) =>
        `${item.completedItems}/${item.totalItems}`,
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      width: 140,
      render: (v: InspectionPlanStatus) => {
        const cfg = INSPECTION_PLAN_STATUS_CONFIG[v];
        return <Tag color={cfg.color}>{cfg.label}</Tag>;
      },
    },
    {
      title: "Thao tác",
      fixed: "right",
      width: 220,
      render: (_, item) => (
        <Space size={2}>
          {canEdit && item.status === INSPECTION_PLAN_STATUS.Draft && (
            <>
              <Button
                size="small"
                type="text"
                icon={<EditOutlined />}
                onClick={() => {
                  setEditing(item);
                  setEditorOpen(true);
                }}
              >Sửa</Button>
              <Popconfirm
                title="Gửi duyệt kế hoạch này?"
                okText="Gửi"
                cancelText="Hủy"
                onConfirm={() =>
                  submitMutation.mutate(item.id, {
                    onSuccess: () =>
                      void message.success("Đã gửi duyệt."),
                    onError: () =>
                      void message.error("Không thể gửi duyệt."),
                  })
                }
              >
                <Button
                  size="small"
                  type="text"
                  icon={<SendOutlined />}
                >Gửi</Button>
              </Popconfirm>
            </>
          )}
          {canApprove && item.status === INSPECTION_PLAN_STATUS.Submitted && (
            <>
              <Popconfirm
                title="Phê duyệt kế hoạch này?"
                okText="Duyệt"
                cancelText="Hủy"
                onConfirm={() =>
                  approveMutation.mutate(item.id, {
                    onSuccess: () =>
                      void message.success("Đã phê duyệt."),
                    onError: () =>
                      void message.error("Không thể phê duyệt."),
                  })
                }
              >
                <Button
                  size="small"
                  type="text"
                  icon={<CheckCircleOutlined />}
                  style={{ color: "#52c41a" }}
                >Duyệt</Button>
              </Popconfirm>
              <Button
                size="small"
                type="text"
                danger
                icon={<CloseCircleOutlined />}
                onClick={() => setRejecting(item)}
              >Từ chối</Button>
            </>
          )}
          {canEdit &&
            (item.status === INSPECTION_PLAN_STATUS.InProgress ||
              item.status === INSPECTION_PLAN_STATUS.Approved) && (
              <Popconfirm
                title="Hoàn thành kế hoạch này?"
                okText="Hoàn thành"
                cancelText="Hủy"
                onConfirm={() =>
                  completeMutation.mutate(item.id, {
                    onSuccess: () =>
                      void message.success("Đã hoàn thành."),
                    onError: () =>
                      void message.error("Không thể hoàn thành."),
                  })
                }
              >
                <Button
                  size="small"
                  type="text"
                  icon={<CheckCircleOutlined />}
                >Hoàn thành</Button>
              </Popconfirm>
            )}
          {canEdit && item.status !== INSPECTION_PLAN_STATUS.Completed &&
            item.status !== INSPECTION_PLAN_STATUS.Cancelled && (
              <Button
                size="small"
                type="text"
                danger
                icon={<StopOutlined />}
                onClick={() => setCancelling(item)}
              >Hủy</Button>
            )}
          {canDelete && item.status === INSPECTION_PLAN_STATUS.Draft && (
            <Popconfirm
              title="Xóa kế hoạch này?"
              okText="Xóa"
              cancelText="Hủy"
              onConfirm={() =>
                deleteMutation.mutate(item.id, {
                  onSuccess: () =>
                    void message.success("Đã xóa kế hoạch."),
                  onError: () =>
                    void message.error("Không thể xóa kế hoạch."),
                })
              }
            >
              <Button
                size="small"
                type="text"
                danger
                icon={<DeleteOutlined />}
              >Xóa</Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <>
      <div
        className="filter-toolbar"
        style={{
          marginBottom: 16,
          display: "flex",
          flexWrap: "wrap",
          gap: 8,
          alignItems: "center",
        }}
      >
        <Input.Search
          allowClear
          placeholder="Mã kế hoạch, tên kế hoạch"
          style={{ width: 260 }}
          onSearch={(v) => {
            setFilter(v.trim());
            setPage(1);
          }}
        />
        <Select
          allowClear
          placeholder="Loại"
          style={{ width: 140 }}
          options={Object.entries(INSPECTION_PLAN_TYPE_LABELS).map(
            ([value, label]) => ({ value: Number(value), label }),
          )}
          onChange={(v) => {
            setPlanTypeFilter(v);
            setPage(1);
          }}
        />
        <Select
          allowClear
          placeholder="Trạng thái"
          style={{ width: 160 }}
          options={Object.entries(INSPECTION_PLAN_STATUS_CONFIG).map(
            ([value, cfg]) => ({ value: Number(value), label: cfg.label }),
          )}
          onChange={(v) => {
            setStatusFilter(v);
            setPage(1);
          }}
        />
        <InputNumber
          placeholder="Năm"
          style={{ width: 100 }}
          min={2020}
          max={2099}
          onChange={(v) => {
            setYearFilter(v ?? undefined);
            setPage(1);
          }}
        />
        <div style={{ flex: 1 }} />
        <Button
          icon={<ExportOutlined />}
          loading={exportMutation.isPending}
          onClick={() =>
            exportMutation.mutate(queryFilter, {
              onSuccess: (file) => saveDownload(file.blob, file.fileName),
              onError: () =>
                void message.error("Không thể xuất danh sách."),
            })
          }
        >
          Xuất Excel
        </Button>
        {canCreate && (
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setEditorOpen(true)}
          >
            Tạo kế hoạch
          </Button>
        )}
      </div>
      <Table
        size="middle"
        rowKey="id"
        scroll={{ x: 1000 }}
        loading={plans.isLoading}
        columns={columns}
        dataSource={plans.data?.items ?? []}
        pagination={{
          current: page,
          pageSize: PAGE_SIZE,
          total: plans.data?.totalCount ?? 0,
          showSizeChanger: false,
          showTotal: (total) => `Tổng ${total} bản ghi`,
          onChange: setPage,
        }}
      />
      <InspectionPlanEditorModal
        open={editorOpen}
        item={editing}
        businesses={businesses.data ?? []}
        saving={createMutation.isPending || updateMutation.isPending}
        onCancel={closeEditor}
        onSubmit={save}
      />
      <RevokeModal
        open={Boolean(rejecting)}
        title={`Từ chối kế hoạch ${rejecting?.planCode ?? ""}`}
        confirmLoading={rejectMutation.isPending}
        onCancel={() => setRejecting(undefined)}
        onConfirm={(reason) => {
          if (!rejecting) return;
          rejectMutation.mutate(
            { id: rejecting.id, reason },
            {
              onSuccess: () => {
                void message.success("Đã từ chối kế hoạch.");
                setRejecting(undefined);
              },
              onError: () =>
                void message.error("Không thể từ chối."),
            },
          );
        }}
      />
      <RevokeModal
        open={Boolean(cancelling)}
        title={`Hủy kế hoạch ${cancelling?.planCode ?? ""}`}
        confirmLoading={cancelMutation.isPending}
        onCancel={() => setCancelling(undefined)}
        onConfirm={(reason) => {
          if (!cancelling) return;
          cancelMutation.mutate(
            { id: cancelling.id, reason },
            {
              onSuccess: () => {
                void message.success("Đã hủy kế hoạch.");
                setCancelling(undefined);
              },
              onError: () =>
                void message.error("Không thể hủy."),
            },
          );
        }}
      />
    </>
  );
}

function ResultsTab() {
  const { message } = App.useApp();
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const canCreate = hasPermission("FoodSafe.Inspection.Results.Create");
  const canEdit = hasPermission("FoodSafe.Inspection.Results.Edit");
  const canDelete = hasPermission("FoodSafe.Inspection.Results.Delete");

  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState("");
  const [inspectionType, setInspectionType] = useState<InspectionType>();
  const [overallResult, setOverallResult] =
    useState<InspectionOverallResult>();
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<InspectionResult>();

  const queryFilter = {
    filter: filter || undefined,
    inspectionType,
    overallResult,
    skipCount: (page - 1) * PAGE_SIZE,
    maxResultCount: PAGE_SIZE,
  };
  const results = useInspectionResults(queryFilter);
  const businesses = useInspectionBusinesses();

  const createMutation = useCreateInspectionResult();
  const updateMutation = useUpdateInspectionResult();
  const deleteMutation = useDeleteInspectionResult();
  const exportMutation = useExportInspectionResults();

  const closeEditor = () => {
    setEditorOpen(false);
    setEditing(undefined);
  };

  const save = (input: CreateUpdateInspectionResultInput) => {
    const options = {
      onSuccess: () => {
        void message.success("Đã lưu kết quả.");
        closeEditor();
      },
      onError: () =>
        void message.error("Không thể lưu kết quả. Kiểm tra dữ liệu."),
    };
    if (editing) updateMutation.mutate({ id: editing.id, input }, options);
    else createMutation.mutate(input, options);
  };

  const columns: ColumnsType<InspectionResult> = [
    {
      title: "Ngày KT",
      dataIndex: "inspectionDate",
      width: 115,
      render: (v: string) => new Date(v).toLocaleDateString("vi-VN"),
    },
    { title: "Cơ sở SXKD", dataIndex: "businessName", ellipsis: true },
    {
      title: "Loại",
      dataIndex: "inspectionType",
      width: 130,
      render: (v: InspectionType) => INSPECTION_TYPE_LABELS[v] ?? v,
    },
    { title: "Trưởng đoàn", dataIndex: "teamLeader", width: 160, ellipsis: true },
    {
      title: "Kết quả",
      dataIndex: "overallResult",
      width: 140,
      render: (v: InspectionOverallResult) => {
        const cfg = INSPECTION_OVERALL_RESULT_CONFIG[v];
        return <Tag color={cfg.color}>{cfg.label}</Tag>;
      },
    },
    {
      title: "Vi phạm",
      dataIndex: "hasViolation",
      width: 90,
      render: (v: boolean) =>
        v ? <Tag color="error">Có</Tag> : <Tag>Không</Tag>,
    },
    {
      title: "Phạt (VND)",
      dataIndex: "fineAmount",
      width: 120,
      render: (v?: number) =>
        v ? v.toLocaleString("vi-VN") : "—",
    },
    {
      title: "Thao tác",
      fixed: "right",
      width: 120,
      render: (_, item) => (
        <Space size={2}>
          {canEdit && (
            <Button
              size="small"
              type="text"
              icon={<EditOutlined />}
              onClick={() => {
                setEditing(item);
                setEditorOpen(true);
              }}
            >Sửa</Button>
          )}
          {canDelete && !item.followUpRequired && (
            <Popconfirm
              title="Xóa kết quả này?"
              okText="Xóa"
              cancelText="Hủy"
              onConfirm={() =>
                deleteMutation.mutate(item.id, {
                  onSuccess: () =>
                    void message.success("Đã xóa kết quả."),
                  onError: () =>
                    void message.error("Không thể xóa kết quả."),
                })
              }
            >
              <Button
                size="small"
                type="text"
                danger
                icon={<DeleteOutlined />}
              >Xóa</Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <>
      <div
        className="filter-toolbar"
        style={{
          marginBottom: 16,
          display: "flex",
          flexWrap: "wrap",
          gap: 8,
          alignItems: "center",
        }}
      >
        <Input.Search
          allowClear
          placeholder="Trưởng đoàn, số QĐ"
          style={{ width: 260 }}
          onSearch={(v) => {
            setFilter(v.trim());
            setPage(1);
          }}
        />
        <Select
          allowClear
          placeholder="Loại kiểm tra"
          style={{ width: 160 }}
          options={Object.entries(INSPECTION_TYPE_LABELS).map(
            ([value, label]) => ({ value: Number(value), label }),
          )}
          onChange={(v) => {
            setInspectionType(v);
            setPage(1);
          }}
        />
        <Select
          allowClear
          placeholder="Kết quả"
          style={{ width: 160 }}
          options={Object.entries(INSPECTION_OVERALL_RESULT_CONFIG).map(
            ([value, cfg]) => ({ value: Number(value), label: cfg.label }),
          )}
          onChange={(v) => {
            setOverallResult(v);
            setPage(1);
          }}
        />
        <div style={{ flex: 1 }} />
        <Button
          icon={<ExportOutlined />}
          loading={exportMutation.isPending}
          onClick={() =>
            exportMutation.mutate(queryFilter, {
              onSuccess: (file) => saveDownload(file.blob, file.fileName),
              onError: () =>
                void message.error("Không thể xuất danh sách."),
            })
          }
        >
          Xuất Excel
        </Button>
        {canCreate && (
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setEditorOpen(true)}
          >
            Ghi nhận kết quả
          </Button>
        )}
      </div>
      <Table
        size="middle"
        rowKey="id"
        scroll={{ x: 1000 }}
        loading={results.isLoading}
        columns={columns}
        dataSource={results.data?.items ?? []}
        pagination={{
          current: page,
          pageSize: PAGE_SIZE,
          total: results.data?.totalCount ?? 0,
          showSizeChanger: false,
          showTotal: (total) => `Tổng ${total} bản ghi`,
          onChange: setPage,
        }}
      />
      <InspectionResultEditorModal
        open={editorOpen}
        item={editing}
        businesses={businesses.data ?? []}
        saving={createMutation.isPending || updateMutation.isPending}
        onCancel={closeEditor}
        onSubmit={save}
      />
    </>
  );
}
