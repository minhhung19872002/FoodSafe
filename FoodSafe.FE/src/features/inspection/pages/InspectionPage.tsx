import { useState } from "react";
import {
  AuditOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  DeleteOutlined,
  EditOutlined,
  ExportOutlined,
  LockOutlined,
  PaperClipOutlined,
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
import dayjs from "dayjs";
import { useAuthStore } from "@/features/auth/store/authStore";
import { PageHeader } from "@/components/PageHeader";
import { RecordDetailDrawer } from "@/components/RecordDetailDrawer";
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
  useFinalizeInspectionResult,
  useRejectInspectionPlan,
  useSubmitInspectionPlan,
  useUpdateInspectionPlan,
  useUpdateInspectionResult,
  useUpdatePlanItemStatus,
} from "../api/inspectionMutations";
import {
  useInspectionBusinesses,
  useInspectionPlans,
  useInspectionResults,
} from "../api/inspectionQueries";
import { InspectionAttachmentsModal } from "../components/InspectionAttachmentsModal";
import { InspectionFollowUpModal } from "../components/InspectionFollowUpModal";
import { InspectionPlanEditorModal } from "../components/InspectionPlanEditorModal";
import { InspectionResultEditorModal } from "../components/InspectionResultEditorModal";
import {
  FOLLOW_UP_RESULT,
  INSPECTION_OVERALL_RESULT_CONFIG,
  INSPECTION_PLAN_ITEM_STATUS,
  INSPECTION_PLAN_ITEM_STATUS_CONFIG,
  INSPECTION_PLAN_STATUS,
  INSPECTION_PLAN_STATUS_CONFIG,
  INSPECTION_PLAN_TYPE_LABELS,
  INSPECTION_TYPE_LABELS,
  type CreateUpdateInspectionPlanInput,
  type CreateUpdateInspectionResultInput,
  type InspectionOverallResult,
  type InspectionPlan,
  type InspectionPlanItem,
  type InspectionPlanStatus,
  type InspectionPlanType,
  type InspectionResult,
  type InspectionType,
} from "../types/inspection.types";

const PAGE_SIZE = 20;

const formatDate = (value?: string) =>
  value ? dayjs(value).format("DD/MM/YYYY") : null;

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
  const [attachmentsPlan, setAttachmentsPlan] = useState<InspectionPlan>();
  const [detailPlan, setDetailPlan] = useState<InspectionPlan | null>(null);

  const queryFilter = {
    filter: filter || undefined,
    status: statusFilter,
    planType: planTypeFilter,
    year: yearFilter,
    skipCount: (page - 1) * PAGE_SIZE,
    maxResultCount: PAGE_SIZE,
  };
  const plans = useInspectionPlans(queryFilter);
  const [businessSearch, setBusinessSearch] = useState("");
  const businesses = useInspectionBusinesses(businessSearch);

  const createMutation = useCreateInspectionPlan();
  const updateMutation = useUpdateInspectionPlan();
  const deleteMutation = useDeleteInspectionPlan();
  const submitMutation = useSubmitInspectionPlan();
  const approveMutation = useApproveInspectionPlan();
  const rejectMutation = useRejectInspectionPlan();
  const completeMutation = useCompleteInspectionPlan();
  const cancelMutation = useCancelInspectionPlan();
  const exportMutation = useExportInspectionPlans();
  const itemStatusMutation = useUpdatePlanItemStatus();

  const changeItemStatus = (
    plan: InspectionPlan,
    item: InspectionPlanItem,
    status: typeof INSPECTION_PLAN_ITEM_STATUS.InProgress
      | typeof INSPECTION_PLAN_ITEM_STATUS.Skipped,
  ) => {
    itemStatusMutation.mutate(
      { id: plan.id, itemId: item.id, status },
      {
        onSuccess: (updated) => {
          setDetailPlan(updated as InspectionPlan);
          void message.success("Đã cập nhật trạng thái cơ sở.");
        },
        onError: () => void message.error("Không thể cập nhật trạng thái."),
      },
    );
  };

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
      render: (v: InspectionPlanType) => INSPECTION_PLAN_TYPE_LABELS[v] ?? v,
    },
    { title: "Năm", dataIndex: "year", width: 70 },
    {
      title: "Tiến độ",
      width: 100,
      render: (_, item) => `${item.completedItems}/${item.totalItems}`,
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
          <Button
            size="small"
            type="text"
            aria-label={`Tài liệu ${item.planCode}`}
            icon={<PaperClipOutlined />}
            onClick={() => setAttachmentsPlan(item)}
          />
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
              >
                Sửa
              </Button>
              <Popconfirm
                title="Gửi duyệt kế hoạch này?"
                okText="Gửi"
                cancelText="Hủy"
                onConfirm={() =>
                  submitMutation.mutate(item.id, {
                    onSuccess: () => void message.success("Đã gửi duyệt."),
                    onError: () => void message.error("Không thể gửi duyệt."),
                  })
                }
              >
                <Button size="small" type="text" icon={<SendOutlined />}>
                  Gửi
                </Button>
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
                    onSuccess: () => void message.success("Đã phê duyệt."),
                    onError: () => void message.error("Không thể phê duyệt."),
                  })
                }
              >
                <Button
                  size="small"
                  type="text"
                  icon={<CheckCircleOutlined />}
                  style={{ color: "#52c41a" }}
                >
                  Duyệt
                </Button>
              </Popconfirm>
              <Button
                size="small"
                type="text"
                danger
                icon={<CloseCircleOutlined />}
                onClick={() => setRejecting(item)}
              >
                Từ chối
              </Button>
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
                    onSuccess: () => void message.success("Đã hoàn thành."),
                    onError: () => void message.error("Không thể hoàn thành."),
                  })
                }
              >
                <Button size="small" type="text" icon={<CheckCircleOutlined />}>
                  Hoàn thành
                </Button>
              </Popconfirm>
            )}
          {canEdit &&
            item.status !== INSPECTION_PLAN_STATUS.Completed &&
            item.status !== INSPECTION_PLAN_STATUS.Cancelled && (
              <Button
                size="small"
                type="text"
                danger
                icon={<StopOutlined />}
                onClick={() => setCancelling(item)}
              >
                Hủy
              </Button>
            )}
          {canDelete && item.status === INSPECTION_PLAN_STATUS.Draft && (
            <Popconfirm
              title="Xóa kế hoạch này?"
              okText="Xóa"
              cancelText="Hủy"
              onConfirm={() =>
                deleteMutation.mutate(item.id, {
                  onSuccess: () => void message.success("Đã xóa kế hoạch."),
                  onError: () => void message.error("Không thể xóa kế hoạch."),
                })
              }
            >
              <Button size="small" type="text" danger icon={<DeleteOutlined />}>
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
              onError: () => void message.error("Không thể xuất danh sách."),
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
        onRow={(record) => ({
          onDoubleClick: () => setDetailPlan(record),
          style: { cursor: "pointer" },
        })}
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
        onBusinessSearch={setBusinessSearch}
      />
      <RecordDetailDrawer
        title="Chi tiết kế hoạch thanh kiểm tra"
        record={detailPlan}
        onClose={() => setDetailPlan(null)}
        fields={[
          { label: "Mã kế hoạch", render: (r) => r.planCode },
          { label: "Năm", render: (r) => r.year },
          { label: "Tên kế hoạch", render: (r) => r.title, span: 2 },
          {
            label: "Loại kế hoạch",
            render: (r) => INSPECTION_PLAN_TYPE_LABELS[r.planType],
          },
          {
            label: "Trạng thái",
            render: (r) => {
              const cfg = INSPECTION_PLAN_STATUS_CONFIG[r.status];
              return <Tag color={cfg.color}>{cfg.label}</Tag>;
            },
          },
          { label: "Từ ngày", render: (r) => formatDate(r.startDate) },
          { label: "Đến ngày", render: (r) => formatDate(r.endDate) },
          {
            label: "Tiến độ",
            render: (r) => `${r.completedItems}/${r.totalItems}`,
          },
          { label: "Ngày tạo", render: (r) => formatDate(r.creationTime) },
          { label: "Mô tả", render: (r) => r.description, span: 2 },
          { label: "Mục tiêu", render: (r) => r.objectives, span: 2 },
          { label: "Ngày gửi duyệt", render: (r) => formatDate(r.submittedAt) },
          { label: "Ngày phê duyệt", render: (r) => formatDate(r.approvedAt) },
          { label: "Lý do từ chối", render: (r) => r.rejectedReason, span: 2 },
          { label: "Lý do hủy", render: (r) => r.cancelledReason, span: 2 },
        ]}
      >
        {detailPlan && (
          <>
            <h4 style={{ margin: "16px 0 8px" }}>
              Danh sách cơ sở trong kế hoạch
            </h4>
            <Table<InspectionPlanItem>
              rowKey="id"
              size="small"
              dataSource={detailPlan.items}
              pagination={false}
              locale={{ emptyText: "Chưa có cơ sở nào" }}
              columns={[
                { title: "STT", dataIndex: "sequenceNumber", width: 50 },
                { title: "Cơ sở", dataIndex: "businessName", ellipsis: true },
                {
                  title: "Ngày dự kiến",
                  dataIndex: "plannedDate",
                  width: 110,
                  render: (v?: string) => formatDate(v),
                },
                {
                  title: "Trạng thái",
                  dataIndex: "status",
                  width: 120,
                  render: (s: InspectionPlanItem["status"]) => {
                    const cfg = INSPECTION_PLAN_ITEM_STATUS_CONFIG[s];
                    return <Tag color={cfg.color}>{cfg.label}</Tag>;
                  },
                },
                {
                  title: "",
                  key: "itemActions",
                  width: 150,
                  render: (_: unknown, item: InspectionPlanItem) => {
                    const planActive =
                      detailPlan.status === INSPECTION_PLAN_STATUS.Approved ||
                      detailPlan.status === INSPECTION_PLAN_STATUS.InProgress;
                    if (!planActive || !canEdit) return null;
                    return (
                      <Space size="small">
                        {item.status ===
                          INSPECTION_PLAN_ITEM_STATUS.Pending && (
                          <Button
                            size="small"
                            loading={itemStatusMutation.isPending}
                            onClick={() =>
                              changeItemStatus(
                                detailPlan,
                                item,
                                INSPECTION_PLAN_ITEM_STATUS.InProgress,
                              )
                            }
                          >
                            Bắt đầu
                          </Button>
                        )}
                        {(item.status ===
                          INSPECTION_PLAN_ITEM_STATUS.Pending ||
                          item.status ===
                            INSPECTION_PLAN_ITEM_STATUS.InProgress) && (
                          <Popconfirm
                            title="Bỏ qua cơ sở này?"
                            okText="Bỏ qua"
                            cancelText="Hủy"
                            onConfirm={() =>
                              changeItemStatus(
                                detailPlan,
                                item,
                                INSPECTION_PLAN_ITEM_STATUS.Skipped,
                              )
                            }
                          >
                            <Button size="small" danger>
                              Bỏ qua
                            </Button>
                          </Popconfirm>
                        )}
                      </Space>
                    );
                  },
                },
              ]}
            />
          </>
        )}
      </RecordDetailDrawer>
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
              onError: () => void message.error("Không thể từ chối."),
            },
          );
        }}
      />
      <InspectionAttachmentsModal
        ownerId={attachmentsPlan?.id}
        ownerKind="plan"
        title={`Tài liệu kế hoạch ${attachmentsPlan?.planCode ?? ""}`}
        canEdit={canEdit}
        onClose={() => setAttachmentsPlan(undefined)}
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
              onError: () => void message.error("Không thể hủy."),
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
  const [overallResult, setOverallResult] = useState<InspectionOverallResult>();
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<InspectionResult>();
  const [attachmentsResult, setAttachmentsResult] =
    useState<InspectionResult>();
  const [followUpResult, setFollowUpResultRow] = useState<InspectionResult>();
  const [detailResult, setDetailResult] = useState<InspectionResult | null>(
    null,
  );

  const queryFilter = {
    filter: filter || undefined,
    inspectionType,
    overallResult,
    skipCount: (page - 1) * PAGE_SIZE,
    maxResultCount: PAGE_SIZE,
  };
  const results = useInspectionResults(queryFilter);
  const [businessSearch, setBusinessSearch] = useState("");
  const businesses = useInspectionBusinesses(businessSearch);

  const createMutation = useCreateInspectionResult();
  const updateMutation = useUpdateInspectionResult();
  const deleteMutation = useDeleteInspectionResult();
  const exportMutation = useExportInspectionResults();
  const finalizeMutation = useFinalizeInspectionResult();

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
    {
      title: "Trưởng đoàn",
      dataIndex: "teamLeader",
      width: 160,
      ellipsis: true,
    },
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
      render: (v?: number) => (v ? v.toLocaleString("vi-VN") : "—"),
    },
    {
      title: "Thao tác",
      fixed: "right",
      width: 230,
      render: (_, item) => (
        <Space size={2}>
          <Button
            size="small"
            type="text"
            aria-label={`Tài liệu kết quả ${item.businessName ?? item.id}`}
            icon={<PaperClipOutlined />}
            onClick={() => setAttachmentsResult(item)}
          />
          {(item.hasViolation || item.followUpRequired) && (
            <Button
              size="small"
              type="text"
              aria-label={`Theo dõi khắc phục ${item.businessName ?? item.id}`}
              icon={<AuditOutlined />}
              onClick={() => setFollowUpResultRow(item)}
            >Theo dõi</Button>
          )}
          {canEdit && !item.isFinalized && (
            <Button
              size="small"
              type="text"
              icon={<EditOutlined />}
              onClick={() => {
                setEditing(item);
                setEditorOpen(true);
              }}
            >
              Sửa
            </Button>
          )}
          {canEdit && !item.isFinalized && (
            <Popconfirm
              title="Chốt kết quả? Sau khi chốt sẽ không thể chỉnh sửa."
              okText="Chốt"
              cancelText="Hủy"
              onConfirm={() =>
                finalizeMutation.mutate(item.id, {
                  onSuccess: () =>
                    void message.success("Đã chốt kết quả."),
                  onError: () =>
                    void message.error("Không thể chốt kết quả."),
                })
              }
            >
              <Button
                size="small"
                type="text"
                icon={<LockOutlined />}
              >Chốt</Button>
            </Popconfirm>
          )}
          {item.isFinalized && (
            <Tag icon={<LockOutlined />} color="default">
              Đã chốt
            </Tag>
          )}
          {canDelete && !item.followUpRequired && !item.isFinalized && (
            <Popconfirm
              title="Xóa kết quả này?"
              okText="Xóa"
              cancelText="Hủy"
              onConfirm={() =>
                deleteMutation.mutate(item.id, {
                  onSuccess: () => void message.success("Đã xóa kết quả."),
                  onError: () => void message.error("Không thể xóa kết quả."),
                })
              }
            >
              <Button size="small" type="text" danger icon={<DeleteOutlined />}>
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
              onError: () => void message.error("Không thể xuất danh sách."),
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
        onRow={(record) => ({
          onDoubleClick: () => setDetailResult(record),
          style: { cursor: "pointer" },
        })}
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
        onBusinessSearch={setBusinessSearch}
      />
      <InspectionAttachmentsModal
        ownerId={attachmentsResult?.id}
        ownerKind="result"
        title={`Tài liệu kết quả — ${attachmentsResult?.businessName ?? ""}`}
        canEdit={canEdit && !attachmentsResult?.isFinalized}
        onClose={() => setAttachmentsResult(undefined)}
      />
      <InspectionFollowUpModal
        result={followUpResult}
        canEdit={canEdit}
        onClose={() => setFollowUpResultRow(undefined)}
      />
      <RecordDetailDrawer
        title="Chi tiết kết quả thanh kiểm tra"
        record={detailResult}
        onClose={() => setDetailResult(null)}
        fields={[
          { label: "Cơ sở SXKD", render: (r) => r.businessName, span: 2 },
          {
            label: "Ngày kiểm tra",
            render: (r) => formatDate(r.inspectionDate),
          },
          {
            label: "Loại kiểm tra",
            render: (r) => INSPECTION_TYPE_LABELS[r.inspectionType],
          },
          { label: "Trưởng đoàn", render: (r) => r.teamLeader },
          {
            label: "Kết quả",
            render: (r) => {
              const cfg = INSPECTION_OVERALL_RESULT_CONFIG[r.overallResult];
              return <Tag color={cfg.color}>{cfg.label}</Tag>;
            },
          },
          {
            label: "Thành viên đoàn",
            render: (r) => r.teamMembersText,
            span: 2,
          },
          {
            label: "Vi phạm",
            render: (r) =>
              r.hasViolation ? <Tag color="error">Có</Tag> : <Tag>Không</Tag>,
          },
          { label: "Số vi phạm", render: (r) => r.violations.length },
          {
            label: "Mô tả vi phạm",
            render: (r) => r.violationDescription,
            span: 2,
          },
          {
            label: "Số tiền phạt",
            render: (r) =>
              r.fineAmount != null
                ? `${r.fineAmount.toLocaleString("vi-VN")} đ`
                : null,
          },
          { label: "Số QĐ xử phạt", render: (r) => r.adminDecisionNumber },
          {
            label: "Ngày QĐ xử phạt",
            render: (r) => formatDate(r.adminDecisionDate),
          },
          {
            label: "Tái kiểm tra",
            render: (r) => (r.followUpRequired ? "Có" : "Không"),
          },
          {
            label: "Ngày tái kiểm tra",
            render: (r) => formatDate(r.followUpDate),
          },
          {
            label: "KQ tái kiểm tra",
            render: (r) =>
              r.followUpResultValue == null
                ? null
                : r.followUpResultValue === FOLLOW_UP_RESULT.Passed
                  ? "Đạt"
                  : "Chưa đạt",
          },
          { label: "Kiến nghị", render: (r) => r.recommendations, span: 2 },
          { label: "Ghi chú", render: (r) => r.notes, span: 2 },
          {
            label: "Trạng thái chốt",
            render: (r) =>
              r.isFinalized ? (
                <Tag icon={<LockOutlined />} color="default">
                  Đã chốt
                </Tag>
              ) : (
                <Tag>Chưa chốt</Tag>
              ),
          },
          { label: "Ngày chốt", render: (r) => formatDate(r.finalizedAt) },
          { label: "Ngày tạo", render: (r) => formatDate(r.creationTime) },
        ]}
      />
    </>
  );
}
