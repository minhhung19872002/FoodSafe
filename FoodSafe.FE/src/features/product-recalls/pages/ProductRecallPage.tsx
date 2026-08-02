import { useState } from "react";
import {
  CheckCircleOutlined,
  DeleteOutlined,
  EditOutlined,
  PlayCircleOutlined,
  PlusOutlined,
  StopOutlined,
} from "@ant-design/icons";
import { App, Button, Input, Select, Table, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import type { SorterResult, SortOrder } from "antd/es/table/interface";
import { useAuthStore } from "@/features/auth/store/authStore";
import { ClearFiltersButton } from "@/components/ClearFiltersButton";
import { RefreshListButton } from "@/components/RefreshListButton";
import { extractApiError } from "@/lib/apiError";
import { PageHeader } from "@/components/PageHeader";
import { RevokeModal } from "@/components/RevokeModal";
import { RecordDetailDrawer } from "@/components/RecordDetailDrawer";
import { RowActions } from "@/components/RowActions";
import { useDebounce } from "@/hooks/useDebounce";
import { useTablePagination } from "@/hooks/useTablePagination";
import {
  useCancelProductRecall,
  useCompleteProductRecall,
  useCreateProductRecall,
  useDeleteProductRecall,
  useStartProductRecall,
  useUpdateProductRecall,
} from "../api/productRecallMutations";
import {
  useProductRecallBusinesses,
  useProductRecalls,
} from "../api/productRecallQueries";
import { CompleteRecallModal } from "../components/CompleteRecallModal";
import { ProductRecallEditorModal } from "../components/ProductRecallEditorModal";
import {
  POST_RECALL_ACTION_LABELS,
  PRODUCT_RECALL_STATUS,
  RECALL_STATUS_CONFIG,
  RECALL_STATUS_OPTIONS,
  RECALL_TYPE_CONFIG,
  RECALL_TYPE_OPTIONS,
  type ProductRecall,
  type ProductRecallInput,
  type ProductRecallStatus,
  type RecallType,
} from "../types/productRecall.types";

function RecallTypeTag({ type }: { type: RecallType }) {
  const { color, label } = RECALL_TYPE_CONFIG[type];
  return <Tag color={color}>{label}</Tag>;
}

function RecallStatusTag({ status }: { status: ProductRecallStatus }) {
  const { color, label } = RECALL_STATUS_CONFIG[status];
  return <Tag color={color}>{label}</Tag>;
}

export default function ProductRecallPage() {
  const { message } = App.useApp();
  const hasPermission = useAuthStore((state) => state.hasPermission);
  const canCreate = hasPermission("FoodSafe.ProductRecalls.Create");
  const canEdit = hasPermission("FoodSafe.ProductRecalls.Edit");
  const canDelete = hasPermission("FoodSafe.ProductRecalls.Delete");
  const canManage = hasPermission("FoodSafe.ProductRecalls.Manage");
  const pagination = useTablePagination(20);
  const [filter, setFilter] = useState("");
  const debouncedFilter = useDebounce(filter);
  const [recallType, setRecallType] = useState<RecallType>();
  const [status, setStatus] = useState<ProductRecallStatus>();
  const [sorting, setSorting] = useState<string | undefined>(undefined);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<ProductRecall>();
  const [completing, setCompleting] = useState<ProductRecall>();
  const [cancelling, setCancelling] = useState<ProductRecall>();
  const [detailRecord, setDetailRecord] = useState<ProductRecall | null>(null);

  const queryFilter = {
    filter: debouncedFilter.trim() || undefined,
    recallType,
    status,
    sorting,
    skipCount: pagination.skipCount,
    maxResultCount: pagination.maxResultCount,
  };

  // Server-side sorting: translate column-header clicks into the
  // "<field> <asc|desc>" string the backend's ApplySorting whitelist parses.
  const sortOrderFor = (field: string): SortOrder => {
    if (!sorting) return null;
    const [current, direction] = sorting.split(" ");
    if (current !== field) return null;
    return direction === "desc" ? "descend" : "ascend";
  };

  const handleSort = (
    sorter: SorterResult<ProductRecall> | SorterResult<ProductRecall>[],
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

  const recalls = useProductRecalls(queryFilter);
  const businesses = useProductRecallBusinesses();
  const createMutation = useCreateProductRecall();
  const updateMutation = useUpdateProductRecall();
  const deleteMutation = useDeleteProductRecall();
  const startMutation = useStartProductRecall();
  const completeMutation = useCompleteProductRecall();
  const cancelMutation = useCancelProductRecall();

  const closeEditor = () => {
    setEditorOpen(false);
    setEditing(undefined);
  };

  const resetFilters = () => {
    setFilter("");
    setRecallType(undefined);
    setStatus(undefined);
    pagination.resetToFirstPage();
  };

  const save = (input: ProductRecallInput) => {
    const options = {
      onSuccess: () => {
        void message.success("Đã lưu hồ sơ thu hồi sản phẩm.");
        closeEditor();
      },
      onError: (error: unknown) => void message.error(extractApiError(error)),
    };
    if (editing) updateMutation.mutate({ id: editing.id, input }, options);
    else createMutation.mutate(input, options);
  };

  const isEditable = (item: ProductRecall) =>
    item.status === PRODUCT_RECALL_STATUS.Draft ||
    item.status === PRODUCT_RECALL_STATUS.InProgress;

  const columns: ColumnsType<ProductRecall> = [
    {
      title: "Sản phẩm",
      dataIndex: "productName",
      ellipsis: true,
      render: (_, item) => (
        <>
          {item.productName}
          {item.batchInfo && (
            <div style={{ fontSize: 12, color: "#888" }}>{item.batchInfo}</div>
          )}
        </>
      ),
    },
    {
      title: "Cơ sở SXKD",
      dataIndex: "businessName",
      ellipsis: true,
    },
    {
      title: "Hình thức",
      dataIndex: "recallType",
      width: 110,
      render: (type: RecallType) => <RecallTypeTag type={type} />,
    },
    {
      title: "Lý do",
      dataIndex: "reason",
      ellipsis: true,
    },
    {
      title: "Ngày bắt đầu",
      dataIndex: "startDate",
      width: 130,
      sorter: true,
      sortOrder: sortOrderFor("startDate"),
      render: (value: string) => new Date(value).toLocaleDateString("vi-VN"),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      width: 125,
      render: (s: ProductRecallStatus) => <RecallStatusTag status={s} />,
    },
    {
      title: "Thao tác",
      fixed: "right",
      width: 120,
      render: (_, item) => (
        <RowActions
          overflowAriaLabel={`Thao tác ${item.productName}`}
          actions={[
            {
              key: "start",
              label: "Bắt đầu thu hồi",
              ariaLabel: `Bắt đầu thu hồi ${item.productName}`,
              icon: <PlayCircleOutlined />,
              hidden:
                !canManage || item.status !== PRODUCT_RECALL_STATUS.Draft,
              onClick: () =>
                startMutation.mutate(item.id, {
                  onSuccess: () =>
                    void message.success("Đã bắt đầu thu hồi."),
                  onError: (error) =>
                    void message.error(extractApiError(error)),
                }),
            },
            {
              key: "complete",
              label: "Hoàn thành",
              ariaLabel: `Hoàn thành thu hồi ${item.productName}`,
              icon: <CheckCircleOutlined />,
              hidden:
                !canManage ||
                item.status !== PRODUCT_RECALL_STATUS.InProgress,
              onClick: () => setCompleting(item),
            },
            {
              key: "edit",
              label: "Sửa",
              ariaLabel: `Sửa ${item.productName}`,
              icon: <EditOutlined />,
              hidden: !canEdit || !isEditable(item),
              onClick: () => {
                setEditing(item);
                setEditorOpen(true);
              },
            },
            {
              key: "cancel",
              label: "Hủy thu hồi",
              ariaLabel: `Hủy thu hồi ${item.productName}`,
              icon: <StopOutlined />,
              danger: true,
              hidden: !canManage || !isEditable(item),
              onClick: () => setCancelling(item),
            },
            {
              key: "delete",
              label: "Xóa",
              ariaLabel: `Xóa ${item.productName}`,
              icon: <DeleteOutlined />,
              danger: true,
              hidden: !canDelete,
              confirm: "Xóa hồ sơ thu hồi này?",
              onClick: () =>
                deleteMutation.mutate(item.id, {
                  onSuccess: () =>
                    void message.success("Đã xóa hồ sơ thu hồi."),
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
    <div className="page-container">
      <PageHeader
        title="Thu hồi sản phẩm"
        subtitle="Quản lý thu hồi sản phẩm không bảo đảm an toàn theo Thông tư 23/2018/TT-BYT"
        actions={
          canCreate && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setEditing(undefined);
                setEditorOpen(true);
              }}
            >
              Thêm hồ sơ thu hồi
            </Button>
          )
        }
      />

      <div className="page-card">
        <div className="filter-toolbar" style={{ marginBottom: 16 }}>
          <Input.Search
            allowClear
            placeholder="Tên sản phẩm, số quyết định, số lô"
            style={{ width: 280 }}
            value={filter}
            onChange={(event) => {
              setFilter(event.target.value);
              pagination.resetToFirstPage();
            }}
          />
          <Select
            allowClear
            placeholder="Hình thức thu hồi"
            style={{ width: 170 }}
            value={recallType}
            options={[...RECALL_TYPE_OPTIONS]}
            onChange={(value) => {
              setRecallType(value);
              pagination.resetToFirstPage();
            }}
          />
          <Select
            allowClear
            placeholder="Trạng thái"
            style={{ width: 160 }}
            value={status}
            options={[...RECALL_STATUS_OPTIONS]}
            onChange={(value) => {
              setStatus(value);
              pagination.resetToFirstPage();
            }}
          />
          <div className="filter-toolbar-actions">
            <ClearFiltersButton
              active={Boolean(
                filter.trim() ||
                  recallType !== undefined ||
                  status !== undefined,
              )}
              onClick={resetFilters}
            />
            <RefreshListButton
              loading={recalls.isFetching}
              onClick={() => void recalls.refetch()}
            />
          </div>
        </div>

        <Table
          sticky
          rowKey="id"
          size="middle"
          scroll={{ x: 1100 }}
          loading={recalls.isFetching}
          columns={columns}
          dataSource={recalls.data?.items ?? []}
          onRow={(record) => ({
            onDoubleClick: () => setDetailRecord(record),
            style: { cursor: "pointer" },
          })}
          onChange={(_pagination, _filters, sorter) => handleSort(sorter)}
          pagination={pagination.buildConfig(recalls.data?.totalCount ?? 0)}
        />
      </div>

      <RecordDetailDrawer
        title="Chi tiết thu hồi sản phẩm"
        record={detailRecord}
        onClose={() => setDetailRecord(null)}
        fields={[
          { label: "Sản phẩm", render: (r) => r.productName, span: 2 },
          { label: "Cơ sở SXKD", render: (r) => r.businessName, span: 2 },
          { label: "Số lô / hạn dùng", render: (r) => r.batchInfo, span: 2 },
          {
            label: "Hình thức",
            render: (r) => <RecallTypeTag type={r.recallType} />,
          },
          {
            label: "Trạng thái",
            render: (r) => <RecallStatusTag status={r.status} />,
          },
          { label: "Lý do thu hồi", render: (r) => r.reason, span: 2 },
          { label: "Số quyết định", render: (r) => r.decisionNumber },
          {
            label: "Ngày quyết định",
            render: (r) =>
              r.decisionDate
                ? new Date(r.decisionDate).toLocaleDateString("vi-VN")
                : null,
          },
          {
            label: "Ngày bắt đầu",
            render: (r) => new Date(r.startDate).toLocaleDateString("vi-VN"),
          },
          {
            label: "Ngày hoàn thành",
            render: (r) =>
              r.completedDate
                ? new Date(r.completedDate).toLocaleDateString("vi-VN")
                : null,
          },
          {
            label: "Số lượng thu hồi",
            render: (r) =>
              r.quantityRecalled != null
                ? `${r.quantityRecalled.toLocaleString("vi-VN")}${
                    r.quantityUnit ? ` ${r.quantityUnit}` : ""
                  }`
                : null,
            span: 2,
          },
          {
            label: "Biện pháp xử lý sau thu hồi",
            render: (r) =>
              r.postRecallAction != null
                ? POST_RECALL_ACTION_LABELS[r.postRecallAction]
                : null,
            span: 2,
          },
          {
            label: "Mô tả biện pháp xử lý",
            render: (r) => r.actionDescription,
            span: 2,
          },
          { label: "Lý do hủy", render: (r) => r.cancelReason, span: 2 },
        ]}
      />

      <ProductRecallEditorModal
        open={editorOpen}
        recall={editing}
        businesses={businesses.data ?? []}
        businessesLoading={businesses.isLoading}
        saving={createMutation.isPending || updateMutation.isPending}
        onCancel={closeEditor}
        onSubmit={save}
      />

      <CompleteRecallModal
        recall={completing}
        confirmLoading={completeMutation.isPending}
        onCancel={() => setCompleting(undefined)}
        onConfirm={(input) => {
          if (!completing) return;
          completeMutation.mutate(
            { id: completing.id, input },
            {
              onSuccess: () => {
                void message.success("Đã hoàn thành thu hồi.");
                setCompleting(undefined);
              },
              onError: (error) => void message.error(extractApiError(error)),
            },
          );
        }}
      />

      <RevokeModal
        open={Boolean(cancelling)}
        title={`Hủy thu hồi: ${cancelling?.productName ?? ""}`}
        okText="Hủy thu hồi"
        description="Hồ sơ thu hồi đã hủy không thể tiếp tục xử lý. Vui lòng ghi rõ lý do."
        placeholder="Lý do hủy thu hồi"
        confirmLoading={cancelMutation.isPending}
        onCancel={() => setCancelling(undefined)}
        onConfirm={(reason) => {
          if (!cancelling) return;
          cancelMutation.mutate(
            { id: cancelling.id, reason },
            {
              onSuccess: () => {
                void message.success("Đã hủy thu hồi.");
                setCancelling(undefined);
              },
              onError: (error) => void message.error(extractApiError(error)),
            },
          );
        }}
      />
    </div>
  );
}
