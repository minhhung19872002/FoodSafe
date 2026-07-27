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
  Tag,
  type TableColumnsType,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ExportOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { useAuthStore } from "@/features/auth/store/authStore";
import { saveDownload } from "@/utils/download";
import { TestingResultDetailDrawer } from "../components/TestingResultDetailDrawer";
import { TestingResultEditorModal } from "../components/TestingResultEditorModal";
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
import {
  TESTING_OUTCOME_CONFIG,
  type CreateUpdateTestingResultInput,
  type TestingResult,
  type TestingResultFilter,
  type TestingOutcome,
} from "../types/testingResult.types";

const PAGE_SIZE = 15;
const INSPECTION_RESULTS_VIEW = "FoodSafe.Inspection.Results.View";

const OUTCOME_OPTIONS = Object.entries(TESTING_OUTCOME_CONFIG).map(
  ([value, config]) => ({ value: Number(value), label: config.label }),
);

export default function TestingResultsPage() {
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const canPickInspectionResult = hasPermission(INSPECTION_RESULTS_VIEW);
  const [filter, setFilter] = useState<TestingResultFilter>({
    skipCount: 0,
    maxResultCount: PAGE_SIZE,
  });
  const { data, isLoading } = useTestingResults(filter);
  const testingCenters = useTestingCenterOptions();
  const testingServices = useTestingServiceOptions();
  const businesses = useSampledBusinessOptions();
  const createMut = useCreateTestingResult();
  const updateMut = useUpdateTestingResult();
  const deleteMut = useDeleteTestingResult();
  const exportMut = useExportTestingResults();

  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<TestingResult | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
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
    if (editing) {
      updateMut.mutate(
        { id: editing.id, input },
        {
          onSuccess: () => {
            message.success("Đã cập nhật");
            setEditorOpen(false);
          },
          onError: () => message.error("Cập nhật thất bại"),
        },
      );
      return;
    }
    createMut.mutate(input, {
      onSuccess: () => {
        message.success("Đã tạo");
        setEditorOpen(false);
      },
      onError: () => message.error("Tạo thất bại"),
    });
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
      render: (value: string | null) => value ?? "—",
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
      render: (v: string) => dayjs(v).format("DD/MM/YYYY"),
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 140,
      render: (_, record) => (
        <Space size="small">
          <Button
            size="small"
            aria-label="Xem chi tiết"
            icon={<EyeOutlined />}
            onClick={() => setDetailId(record.id)}
          />
          {hasPermission("FoodSafe.AlertsAndTesting.TestingResults.Edit") && (
            <Button
              size="small"
              icon={<EditOutlined />}
              onClick={() => openEdit(record)}
            >
              Sửa
            </Button>
          )}
          {hasPermission("FoodSafe.AlertsAndTesting.TestingResults.Delete") && (
            <Popconfirm
              title="Xóa kết quả kiểm nghiệm?"
              okText="Xóa"
              cancelText="Hủy"
              onConfirm={() =>
                deleteMut.mutate(record.id, {
                  onSuccess: () => message.success("Đã xóa"),
                  onError: () => message.error("Xóa thất bại"),
                })
              }
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
    <Card>
      <Space style={{ marginBottom: 16 }} wrap>
        <Input.Search
          placeholder="Mã mẫu, tên mẫu"
          allowClear
          style={{ width: 200 }}
          onSearch={(v) =>
            setFilter((f) => ({
              ...f,
              filter: v || undefined,
              skipCount: 0,
            }))
          }
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
          onChange={(v?: string) =>
            setFilter((f) => ({ ...f, businessId: v, skipCount: 0 }))
          }
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
          onChange={(v?: string) =>
            setFilter((f) => ({ ...f, testingCenterId: v, skipCount: 0 }))
          }
        />
        <Select
          placeholder="Kết quả"
          aria-label="Lọc theo kết quả"
          allowClear
          style={{ width: 140 }}
          options={OUTCOME_OPTIONS}
          onChange={(v?: TestingOutcome) =>
            setFilter((f) => ({ ...f, outcome: v, skipCount: 0 }))
          }
        />
        <Button
          icon={<ExportOutlined />}
          loading={exportMut.isPending}
          onClick={() =>
            exportMut.mutate(filter, {
              onSuccess: (file) => saveDownload(file.blob, file.fileName),
              onError: () => message.error("Không thể xuất danh sách."),
            })
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
        dataSource={data?.items}
        loading={isLoading}
        size="small"
        pagination={{
          total: data?.totalCount,
          pageSize: PAGE_SIZE,
          current: (filter.skipCount ?? 0) / PAGE_SIZE + 1,
          onChange: (page) =>
            setFilter((f) => ({ ...f, skipCount: (page - 1) * PAGE_SIZE })),
          showTotal: (total) => `Tổng: ${total}`,
          showSizeChanger: false,
        }}
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
      <TestingResultDetailDrawer
        testingResultId={detailId}
        onClose={() => setDetailId(null)}
      />
    </Card>
  );
}
