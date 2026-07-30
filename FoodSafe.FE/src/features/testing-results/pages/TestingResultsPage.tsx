import { useState } from "react";
import {
  App,
  Button,
  Card,
  Input,
  Select,
  Space,
  Table,
  Tag,
  type TableColumnsType,
} from "antd";
import type { SorterResult, SortOrder } from "antd/es/table/interface";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ExportOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { useAuthStore } from "@/features/auth/store/authStore";
import { ClearFiltersButton } from "@/components/ClearFiltersButton";
import { RefreshListButton } from "@/components/RefreshListButton";
import { extractApiError } from "@/lib/apiError";
import { RecordDetailDrawer } from "@/components/RecordDetailDrawer";
import { RowActions } from "@/components/RowActions";
import { saveDownload } from "@/utils/download";
import { useDebounce } from "@/hooks/useDebounce";
import { useTablePagination } from "@/hooks/useTablePagination";
import {
  useRelatedInspectionResultOptions,
  useSampledBusinessOptions,
  useSampledProductOptions,
  useTestingCenterOptions,
  useTestingResults,
  useTestingServiceOptions,
} from "../api/testingResultQueries";
import {
  useCreateTestingResult,
  useUpdateTestingResult,
  useDeleteTestingResult,
  useExportTestingResults,
} from "../api/testingResultMutations";
import { TestingResultEditorModal } from "../components/TestingResultEditorModal";
import {
  TESTING_OUTCOME_CONFIG,
  type CreateUpdateTestingResultInput,
  type TestingResult,
  type TestingResultFilter,
  type TestingOutcome,
} from "../types/testingResult.types";

const INSPECTION_RESULTS_VIEW = "FoodSafe.Inspection.Results.View";

const OUTCOME_OPTIONS = Object.entries(TESTING_OUTCOME_CONFIG).map(
  ([value, config]) => ({ value: Number(value), label: config.label }),
);

const formatDate = (v?: string | null) =>
  v ? dayjs(v).format("DD/MM/YYYY") : null;

export default function TestingResultsPage() {
  const { message } = App.useApp();
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const canPickInspectionResult = hasPermission(INSPECTION_RESULTS_VIEW);
  const [filter, setFilter] = useState<TestingResultFilter>({});
  const [searchText, setSearchText] = useState("");
  const debouncedSearchText = useDebounce(searchText);
  const [filterResetKey, setFilterResetKey] = useState(0);
  const [sorting, setSorting] = useState<string | undefined>(undefined);
  const pagination = useTablePagination(15);
  const results = useTestingResults({
    ...filter,
    filter: debouncedSearchText.trim() || undefined,
    sorting,
    skipCount: pagination.skipCount,
    maxResultCount: pagination.maxResultCount,
  });

  // Server-side sorting: reflect the active sort in the column header and
  // translate AntD SorterResult into the "<field> <asc|desc>" string the
  // backend's ApplySorting whitelist parses.
  const sortOrderFor = (field: string): SortOrder => {
    if (!sorting) return null;
    const [current, direction] = sorting.split(" ");
    if (current !== field) return null;
    return direction === "desc" ? "descend" : "ascend";
  };

  const handleSort = (
    sorter: SorterResult<TestingResult> | SorterResult<TestingResult>[],
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

  const testingCenters = useTestingCenterOptions();
  const testingServices = useTestingServiceOptions();
  const businesses = useSampledBusinessOptions();
  const createMut = useCreateTestingResult();
  const updateMut = useUpdateTestingResult();
  const deleteMut = useDeleteTestingResult();
  const exportMut = useExportTestingResults();

  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<TestingResult | null>(null);
  const [detailResult, setDetailResult] = useState<TestingResult | null>(null);
  // Facility currently driving the cascading product / inspection lookups.
  const [editorBusinessId, setEditorBusinessId] = useState<
    string | undefined
  >();
  const products = useSampledProductOptions(editorBusinessId);
  const inspectionResults = useRelatedInspectionResultOptions(
    editorBusinessId,
    canPickInspectionResult,
  );

  const openCreate = () => {
    setEditing(null);
    setEditorBusinessId(undefined);
    setEditorOpen(true);
  };

  const openEdit = (record: TestingResult) => {
    setEditing(record);
    setEditorBusinessId(record.businessId ?? undefined);
    setEditorOpen(true);
  };

  const submitEditor = (input: CreateUpdateTestingResultInput) => {
    const options = {
      onSuccess: () => {
        void message.success(editing ? "Đã cập nhật" : "Đã tạo");
        setEditorOpen(false);
      },
      onError: (error: unknown) => void message.error(extractApiError(error)),
    };
    if (editing) updateMut.mutate({ id: editing.id, input }, options);
    else createMut.mutate(input, options);
  };

  const columns: TableColumnsType<TestingResult> = [
    {
      title: "Mã mẫu",
      dataIndex: "sampleCode",
      width: 120,
    },
    {
      title: "Tên mẫu",
      dataIndex: "sampleName",
      ellipsis: true,
    },
    {
      title: "Cơ sở KN",
      dataIndex: "testingCenterName",
      width: 150,
      ellipsis: true,
    },
    {
      title: "Cơ sở lấy mẫu",
      dataIndex: "businessName",
      width: 150,
      ellipsis: true,
    },
    {
      title: "Kết quả",
      dataIndex: "outcome",
      width: 110,
      render: (o: TestingOutcome) => {
        const cfg = TESTING_OUTCOME_CONFIG[o];
        return <Tag color={cfg.color}>{cfg.label}</Tag>;
      },
    },
    {
      title: "Ngày lấy mẫu",
      dataIndex: "sampleDate",
      width: 110,
      sorter: true,
      sortOrder: sortOrderFor("sampleDate"),
      render: (v: string) => dayjs(v).format("DD/MM/YYYY"),
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 96,
      render: (_, record) => (
        <RowActions
          overflowAriaLabel={`Thao tác ${record.sampleCode}`}
          actions={[
            {
              key: "edit",
              label: "Sửa",
              icon: <EditOutlined />,
              hidden: !hasPermission(
                "FoodSafe.AlertsAndTesting.TestingResults.Edit",
              ),
              onClick: () => openEdit(record),
            },
            {
              key: "delete",
              label: "Xóa",
              icon: <DeleteOutlined />,
              danger: true,
              hidden: !hasPermission(
                "FoodSafe.AlertsAndTesting.TestingResults.Delete",
              ),
              confirm: "Xóa kết quả kiểm nghiệm?",
              onClick: () =>
                deleteMut.mutate(record.id, {
                  onSuccess: () => void message.success("Đã xóa"),
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
    <Card>
      <Space style={{ marginBottom: 16 }} wrap key={filterResetKey}>
        <Input.Search
          placeholder="Mã mẫu, tên mẫu"
          allowClear
          style={{ width: 200 }}
          value={searchText}
          onChange={(e) => {
            setSearchText(e.target.value);
            pagination.resetToFirstPage();
          }}
        />
        <Select
          placeholder="Cơ sở lấy mẫu"
          aria-label="Lọc theo cơ sở lấy mẫu"
          allowClear
          showSearch
          optionFilterProp="label"
          style={{ width: 220 }}
          loading={businesses.isLoading}
          options={businesses.data ?? []}
          onChange={(v?: string) => {
            setFilter((f) => ({ ...f, businessId: v }));
            pagination.resetToFirstPage();
          }}
        />
        <Select
          placeholder="Trung tâm kiểm nghiệm"
          aria-label="Lọc theo trung tâm kiểm nghiệm"
          allowClear
          showSearch
          optionFilterProp="label"
          style={{ width: 220 }}
          loading={testingCenters.isLoading}
          options={testingCenters.data ?? []}
          onChange={(v?: string) => {
            setFilter((f) => ({ ...f, testingCenterId: v }));
            pagination.resetToFirstPage();
          }}
        />
        <Select
          placeholder="Kết quả"
          aria-label="Lọc theo kết quả"
          allowClear
          style={{ width: 140 }}
          options={OUTCOME_OPTIONS}
          onChange={(v?: TestingOutcome) => {
            setFilter((f) => ({ ...f, outcome: v }));
            pagination.resetToFirstPage();
          }}
        />
        <ClearFiltersButton
          active={Boolean(
            searchText.trim() ||
            filter.businessId ||
            filter.testingCenterId ||
            filter.outcome !== undefined,
          )}
          onClick={() => {
            setFilter({});
            setSearchText("");
            setFilterResetKey((key) => key + 1);
            pagination.resetToFirstPage();
          }}
        />
        <RefreshListButton
          loading={results.isFetching}
          onClick={() => void results.refetch()}
        />
        <Button
          icon={<ExportOutlined />}
          loading={exportMut.isPending}
          onClick={() =>
            exportMut.mutate(
              {
                ...filter,
                filter: debouncedSearchText.trim() || undefined,
                sorting,
              },
              {
                onSuccess: (file) => saveDownload(file.blob, file.fileName),
                onError: (error) => void message.error(extractApiError(error)),
              },
            )
          }
        >
          Xuất Excel
        </Button>
        {hasPermission("FoodSafe.AlertsAndTesting.TestingResults.Create") && (
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            Nhập kết quả
          </Button>
        )}
      </Space>
      <Table
        rowKey="id"
        columns={columns}
        dataSource={results.data?.items}
        loading={results.isFetching}
        size="small"
        onRow={(record) => ({
          onDoubleClick: () => setDetailResult(record),
          style: { cursor: "pointer" },
        })}
        pagination={pagination.buildConfig(results.data?.totalCount)}
        onChange={(_, __, sorter) => handleSort(sorter)}
      />
      <RecordDetailDrawer
        title="Chi tiết kết quả kiểm nghiệm"
        record={detailResult}
        onClose={() => setDetailResult(null)}
        fields={[
          { label: "Mã mẫu", render: (r) => r.sampleCode },
          { label: "Tên mẫu", render: (r) => r.sampleName },
          { label: "Mô tả", render: (r) => r.description, span: 2 },
          { label: "Cơ sở kiểm nghiệm", render: (r) => r.testingCenterName },
          { label: "Dịch vụ KN", render: (r) => r.testingServiceName },
          { label: "Cơ sở lấy mẫu", render: (r) => r.businessName },
          { label: "Sản phẩm", render: (r) => r.productName },
          { label: "Ngày lấy mẫu", render: (r) => formatDate(r.sampleDate) },
          { label: "Ngày nộp", render: (r) => formatDate(r.submissionDate) },
          { label: "Ngày kết quả", render: (r) => formatDate(r.resultDate) },
          {
            label: "Kết quả",
            render: (r) => {
              const cfg = TESTING_OUTCOME_CONFIG[r.outcome];
              return <Tag color={cfg.color}>{cfg.label}</Tag>;
            },
          },
          {
            label: "Chỉ tiêu không đạt",
            render: (r) => r.failedCriteria,
            span: 2,
          },
          { label: "Số phiếu kiểm nghiệm", render: (r) => r.certificateNumber },
          { label: "Công khai", render: (r) => (r.isPublic ? "Có" : "Không") },
          { label: "Ngày tạo", render: (r) => formatDate(r.creationTime) },
        ]}
      />
      <TestingResultEditorModal
        open={editorOpen}
        item={editing}
        saving={createMut.isPending || updateMut.isPending}
        testingCenters={{
          items: testingCenters.data ?? [],
          loading: testingCenters.isLoading,
        }}
        testingServices={{
          items: testingServices.data ?? [],
          loading: testingServices.isLoading,
        }}
        businesses={{
          items: businesses.data ?? [],
          loading: businesses.isLoading,
        }}
        products={{
          items: products.data ?? [],
          loading: products.isFetching,
        }}
        inspectionResults={
          canPickInspectionResult
            ? {
                items: inspectionResults.data ?? [],
                loading: inspectionResults.isFetching,
              }
            : null
        }
        onBusinessChange={setEditorBusinessId}
        onCancel={() => setEditorOpen(false)}
        onSubmit={submitEditor}
      />
    </Card>
  );
}
