import { useState } from "react";
import {
  Button,
  Card,
  DatePicker,
  Form,
  Input,
  message,
  Modal,
  Popconfirm,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  type TableColumnsType,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ExportOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { useAuthStore } from "@/features/auth/store/authStore";
import { RecordDetailDrawer } from "@/components/RecordDetailDrawer";
import { saveDownload } from "@/utils/download";
import {
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
  TESTING_OUTCOME,
  TESTING_OUTCOME_CONFIG,
  type TestingResult,
  type TestingResultFilter,
  type TestingOutcome,
} from "../types/testingResult.types";

const PAGE_SIZE = 15;

const formatDate = (v?: string | null) =>
  v ? dayjs(v).format("DD/MM/YYYY") : null;

export default function TestingResultsPage() {
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const [filter, setFilter] = useState<TestingResultFilter>({
    skipCount: 0,
    maxResultCount: PAGE_SIZE,
  });
  const { data, isLoading } = useTestingResults(filter);
  const testingCenters = useTestingCenterOptions();
  const testingServices = useTestingServiceOptions();
  const createMut = useCreateTestingResult();
  const updateMut = useUpdateTestingResult();
  const deleteMut = useDeleteTestingResult();
  const exportMut = useExportTestingResults();

  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<TestingResult | null>(null);
  const [detailResult, setDetailResult] = useState<TestingResult | null>(null);
  const [form] = Form.useForm();

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({
      outcome: TESTING_OUTCOME.Pass,
      isPublic: false,
    });
    setEditorOpen(true);
  };

  const openEdit = (record: TestingResult) => {
    setEditing(record);
    form.setFieldsValue({
      ...record,
      sampleDate: dayjs(record.sampleDate),
      submissionDate: record.submissionDate
        ? dayjs(record.submissionDate)
        : null,
      resultDate: record.resultDate ? dayjs(record.resultDate) : null,
    });
    setEditorOpen(true);
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
      render: (v: string) => dayjs(v).format("DD/MM/YYYY"),
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 100,
      render: (_, record) => (
        <Space size="small">
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
          placeholder="Kết quả"
          allowClear
          style={{ width: 140 }}
          options={Object.entries(TESTING_OUTCOME_CONFIG).map(([k, v]) => ({
            value: Number(k),
            label: v.label,
          }))}
          onChange={(v) =>
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
        onRow={(record) => ({
          onDoubleClick: () => setDetailResult(record),
          style: { cursor: "pointer" },
        })}
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
      <Modal
        title={editing ? "Sửa kết quả" : "Nhập kết quả kiểm nghiệm"}
        open={editorOpen}
        onCancel={() => setEditorOpen(false)}
        destroyOnHidden
        width={640}
        onOk={() => form.submit()}
        okText="Lưu"
        cancelText="Hủy"
        confirmLoading={createMut.isPending || updateMut.isPending}
      >
        <Form
          form={form}
          layout="vertical"
          preserve={false}
          onFinish={(values) => {
            const payload = {
              ...values,
              sampleDate: values.sampleDate?.toISOString(),
              submissionDate: values.submissionDate?.toISOString(),
              resultDate: values.resultDate?.toISOString(),
            };
            if (editing) {
              updateMut.mutate(
                { id: editing.id, input: payload },
                {
                  onSuccess: () => {
                    message.success("Đã cập nhật");
                    setEditorOpen(false);
                  },
                  onError: () => message.error("Cập nhật thất bại"),
                },
              );
            } else {
              createMut.mutate(payload, {
                onSuccess: () => {
                  message.success("Đã tạo");
                  setEditorOpen(false);
                },
                onError: () => message.error("Tạo thất bại"),
              });
            }
          }}
        >
          <Space style={{ width: "100%" }}>
            <Form.Item
              name="sampleCode"
              label="Mã mẫu"
              rules={[{ required: true }]}
            >
              <Input style={{ width: 200 }} />
            </Form.Item>
            <Form.Item
              name="sampleName"
              label="Tên mẫu"
              rules={[{ required: true }]}
            >
              <Input style={{ width: 380 }} />
            </Form.Item>
          </Space>
          <Form.Item name="description" label="Mô tả">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Space style={{ width: "100%" }}>
            <Form.Item
              name="testingCenterId"
              label="Cơ sở kiểm nghiệm"
              rules={[{ required: true, message: "Vui lòng chọn cơ sở KN" }]}
            >
              <Select
                style={{ width: 290 }}
                placeholder="Chọn cơ sở kiểm nghiệm"
                showSearch
                optionFilterProp="label"
                loading={testingCenters.isLoading}
                options={(testingCenters.data ?? []).map((x) => ({
                  value: x.id,
                  label: x.name,
                }))}
              />
            </Form.Item>
            <Form.Item name="testingServiceId" label="Dịch vụ KN">
              <Select
                style={{ width: 290 }}
                placeholder="Chọn dịch vụ kiểm nghiệm"
                allowClear
                showSearch
                optionFilterProp="label"
                loading={testingServices.isLoading}
                options={(testingServices.data ?? []).map((x) => ({
                  value: x.id,
                  label: x.name,
                }))}
              />
            </Form.Item>
          </Space>
          <Space style={{ width: "100%" }}>
            <Form.Item
              name="sampleDate"
              label="Ngày lấy mẫu"
              rules={[{ required: true }]}
            >
              <DatePicker format="DD/MM/YYYY" />
            </Form.Item>
            <Form.Item name="submissionDate" label="Ngày nộp">
              <DatePicker format="DD/MM/YYYY" />
            </Form.Item>
            <Form.Item name="resultDate" label="Ngày kết quả">
              <DatePicker format="DD/MM/YYYY" />
            </Form.Item>
          </Space>
          <Form.Item
            name="outcome"
            label="Kết quả"
            rules={[{ required: true }]}
          >
            <Select
              style={{ width: 200 }}
              options={Object.entries(TESTING_OUTCOME_CONFIG).map(([k, v]) => ({
                value: Number(k),
                label: v.label,
              }))}
            />
          </Form.Item>
          <Form.Item name="failedCriteria" label="Chỉ tiêu không đạt">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="certificateNumber" label="Số phiếu kiểm nghiệm">
            <Input />
          </Form.Item>
          <Form.Item name="isPublic" label="Công khai" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}
