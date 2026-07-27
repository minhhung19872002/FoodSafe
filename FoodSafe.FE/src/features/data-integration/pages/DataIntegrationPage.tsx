import { useState } from "react";
import {
  Button,
  Card,
  Form,
  Input,
  message,
  Modal,
  Popconfirm,
  Select,
  Space,
  Table,
  Tabs,
  Tag,
  Descriptions,
  type TableColumnsType,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SwapOutlined,
  EyeOutlined,
  ExportOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { useAuthStore } from "@/features/auth/store/authStore";
import { saveDownload } from "@/utils/download";
import {
  useApiEndpoints,
  useApiCallLogs,
  useApiCallLogDetail,
} from "../api/dataIntegrationQueries";
import {
  useCreateEndpoint,
  useUpdateEndpoint,
  useToggleEndpointStatus,
  useDeleteEndpoint,
  useExportEndpoints,
  useExportCallLogs,
} from "../api/dataIntegrationMutations";
import {
  API_ENDPOINT_STATUS,
  API_ENDPOINT_STATUS_CONFIG,
  API_AUTH_TYPE,
  API_AUTH_TYPE_LABELS,
  API_CALL_DIRECTION_CONFIG,
  type ApiEndpoint,
  type ApiEndpointFilter,
  type ApiEndpointStatus,
  type ApiAuthType,
  type ApiCallLog,
  type ApiCallLogFilter,
  type ApiCallDirection,
} from "../types/dataIntegration.types";

const PAGE_SIZE = 15;
const HTTP_METHODS = ["GET", "POST", "PUT", "DELETE", "PATCH"];
const EXTERNAL_SYSTEMS = ["Bộ Y tế", "Sở Nông nghiệp", "Sở Công thương"];

function EndpointsTab() {
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const [filter, setFilter] = useState<ApiEndpointFilter>({
    skipCount: 0,
    maxResultCount: PAGE_SIZE,
  });
  const { data, isLoading } = useApiEndpoints(filter);
  const createMut = useCreateEndpoint();
  const updateMut = useUpdateEndpoint();
  const toggleMut = useToggleEndpointStatus();
  const deleteMut = useDeleteEndpoint();
  const exportMut = useExportEndpoints();

  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<ApiEndpoint | null>(null);
  const [form] = Form.useForm();

  const canCreate = hasPermission(
    "FoodSafe.DataIntegration.ApiEndpoints.Create",
  );
  const canEdit = hasPermission("FoodSafe.DataIntegration.ApiEndpoints.Edit");
  const canDelete = hasPermission(
    "FoodSafe.DataIntegration.ApiEndpoints.Delete",
  );

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({
      httpMethod: "GET",
      authType: API_AUTH_TYPE.None,
    });
    setEditorOpen(true);
  };
  const openEdit = (record: ApiEndpoint) => {
    setEditing(record);
    form.setFieldsValue(record);
    setEditorOpen(true);
  };

  const columns: TableColumnsType<ApiEndpoint> = [
    { title: "Tên", dataIndex: "name", ellipsis: true },
    { title: "URL", dataIndex: "url", width: 250, ellipsis: true },
    { title: "Method", dataIndex: "httpMethod", width: 80 },
    {
      title: "Hệ thống",
      dataIndex: "externalSystem",
      width: 150,
      ellipsis: true,
    },
    {
      title: "Xác thực",
      dataIndex: "authType",
      width: 120,
      render: (v: ApiAuthType) => API_AUTH_TYPE_LABELS[v],
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      width: 110,
      render: (s: ApiEndpointStatus) => {
        const cfg = API_ENDPOINT_STATUS_CONFIG[s];
        return <Tag color={cfg.color}>{cfg.label}</Tag>;
      },
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 140,
      render: (_, record) => (
        <Space size="small">
          {canEdit && (
            <>
              <Button
                size="small"
                icon={<EditOutlined />}
                onClick={() => openEdit(record)}
              >
                Sửa
              </Button>
              <Popconfirm
                title={
                  record.status === API_ENDPOINT_STATUS.Active
                    ? "Tắt endpoint?"
                    : "Bật endpoint?"
                }
                okText={
                  record.status === API_ENDPOINT_STATUS.Active ? "Tắt" : "Bật"
                }
                cancelText="Hủy"
                onConfirm={() =>
                  toggleMut.mutate(record.id, {
                    onSuccess: () => message.success("Đã cập nhật"),
                    onError: () => message.error("Thao tác thất bại"),
                  })
                }
              >
                <Button size="small" icon={<SwapOutlined />}>
                  Bật/Tắt
                </Button>
              </Popconfirm>
            </>
          )}
          {canDelete && (
            <Popconfirm
              title="Xóa endpoint?"
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
    <>
      <Space style={{ marginBottom: 16 }} wrap>
        <Input.Search
          placeholder="Tên, URL, hệ thống"
          allowClear
          style={{ width: 240 }}
          onSearch={(v) =>
            setFilter((f) => ({ ...f, filter: v || undefined, skipCount: 0 }))
          }
        />
        <Select
          placeholder="Trạng thái"
          allowClear
          style={{ width: 140 }}
          options={Object.entries(API_ENDPOINT_STATUS_CONFIG).map(([k, v]) => ({
            value: Number(k),
            label: v.label,
          }))}
          onChange={(v) =>
            setFilter((f) => ({ ...f, status: v, skipCount: 0 }))
          }
        />
        <Button
          icon={<ExportOutlined />}
          loading={exportMut.isPending}
          onClick={() =>
            exportMut.mutate(filter, {
              onSuccess: (file) => saveDownload(file.blob, file.fileName),
              onError: () => void message.error("Không thể xuất danh sách."),
            })
          }
        >
          Xuất Excel
        </Button>
        {canCreate && (
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            Thêm endpoint
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
      <Modal
        title={editing ? "Sửa endpoint" : "Thêm endpoint"}
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
            if (editing) {
              updateMut.mutate(
                { id: editing.id, input: values },
                {
                  onSuccess: () => {
                    message.success("Đã cập nhật");
                    setEditorOpen(false);
                  },
                  onError: () => message.error("Cập nhật thất bại"),
                },
              );
            } else {
              createMut.mutate(values, {
                onSuccess: () => {
                  message.success("Đã tạo");
                  setEditorOpen(false);
                },
                onError: () => message.error("Tạo thất bại"),
              });
            }
          }}
        >
          <Form.Item
            name="name"
            label="Tên endpoint"
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>
          <Form.Item name="url" label="URL" rules={[{ required: true }]}>
            <Input placeholder="https://..." />
          </Form.Item>
          <Space style={{ width: "100%" }}>
            <Form.Item
              name="httpMethod"
              label="Phương thức"
              rules={[{ required: true }]}
            >
              <Select
                style={{ width: 120 }}
                options={HTTP_METHODS.map((m) => ({ value: m, label: m }))}
              />
            </Form.Item>
            <Form.Item
              name="externalSystem"
              label="Hệ thống"
              rules={[{ required: true }]}
            >
              <Select
                style={{ width: 200 }}
                showSearch
                options={EXTERNAL_SYSTEMS.map((s) => ({
                  value: s,
                  label: s,
                }))}
              />
            </Form.Item>
            <Form.Item
              name="authType"
              label="Xác thực"
              rules={[{ required: true }]}
            >
              <Select
                style={{ width: 160 }}
                options={Object.entries(API_AUTH_TYPE_LABELS).map(([k, v]) => ({
                  value: Number(k),
                  label: v,
                }))}
              />
            </Form.Item>
          </Space>
          <Form.Item name="description" label="Mô tả">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}

function CallHistoryTab() {
  const [filter, setFilter] = useState<ApiCallLogFilter>({
    skipCount: 0,
    maxResultCount: PAGE_SIZE,
  });
  const { data, isLoading } = useApiCallLogs(filter);
  const exportMut = useExportCallLogs();
  const [detailId, setDetailId] = useState<string>();
  const detail = useApiCallLogDetail(detailId);

  const columns: TableColumnsType<ApiCallLog> = [
    {
      title: "Hướng",
      dataIndex: "direction",
      width: 70,
      render: (d: ApiCallDirection) => {
        const cfg = API_CALL_DIRECTION_CONFIG[d];
        return <Tag color={cfg.color}>{cfg.label}</Tag>;
      },
    },
    {
      title: "Hệ thống",
      dataIndex: "externalSystemName",
      width: 150,
      ellipsis: true,
    },
    { title: "URL", dataIndex: "endpointUrl", ellipsis: true },
    { title: "Method", dataIndex: "httpMethod", width: 70 },
    {
      title: "Status",
      dataIndex: "responseStatusCode",
      width: 70,
      render: (v?: number) =>
        v ? <Tag color={v < 400 ? "green" : "red"}>{v}</Tag> : "—",
    },
    {
      title: "Thời gian",
      dataIndex: "calledAt",
      width: 140,
      render: (v: string) => dayjs(v).format("DD/MM/YYYY HH:mm:ss"),
    },
    {
      title: "ms",
      dataIndex: "durationMs",
      width: 70,
      align: "right",
    },
    {
      title: "KQ",
      dataIndex: "isSuccess",
      width: 60,
      render: (v: boolean) => (
        <Tag color={v ? "green" : "red"}>{v ? "OK" : "Lỗi"}</Tag>
      ),
    },
    {
      title: "",
      key: "actions",
      width: 50,
      render: (_, record) => (
        <Button
          size="small"
          icon={<EyeOutlined />}
          onClick={() => setDetailId(record.id)}
        />
      ),
    },
  ];

  return (
    <>
      <Space style={{ marginBottom: 16 }} wrap>
        <Input.Search
          placeholder="URL, hệ thống"
          allowClear
          style={{ width: 240 }}
          onSearch={(v) =>
            setFilter((f) => ({ ...f, filter: v || undefined, skipCount: 0 }))
          }
        />
        <Select
          placeholder="Hướng"
          allowClear
          style={{ width: 120 }}
          options={Object.entries(API_CALL_DIRECTION_CONFIG).map(([k, v]) => ({
            value: Number(k),
            label: v.label,
          }))}
          onChange={(v) =>
            setFilter((f) => ({ ...f, direction: v, skipCount: 0 }))
          }
        />
        <Select
          placeholder="Kết quả"
          allowClear
          style={{ width: 120 }}
          options={[
            { value: true, label: "Thành công" },
            { value: false, label: "Thất bại" },
          ]}
          onChange={(v) =>
            setFilter((f) => ({
              ...f,
              isSuccess: v as boolean | undefined,
              skipCount: 0,
            }))
          }
        />
        <Button
          icon={<ExportOutlined />}
          loading={exportMut.isPending}
          onClick={() =>
            exportMut.mutate(filter, {
              onSuccess: (file) => saveDownload(file.blob, file.fileName),
              onError: () => void message.error("Không thể xuất danh sách."),
            })
          }
        >
          Xuất Excel
        </Button>
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
      <Modal
        title="Chi tiết lịch sử gọi API"
        open={Boolean(detailId)}
        footer={null}
        onCancel={() => setDetailId(undefined)}
        width={720}
        destroyOnHidden
      >
        {detail.data && (
          <Descriptions column={2} size="small" bordered>
            <Descriptions.Item label="Hướng">
              <Tag
                color={API_CALL_DIRECTION_CONFIG[detail.data.direction]?.color}
              >
                {API_CALL_DIRECTION_CONFIG[detail.data.direction]?.label}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Kết quả">
              <Tag color={detail.data.isSuccess ? "green" : "red"}>
                {detail.data.isSuccess ? "Thành công" : "Thất bại"}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Hệ thống" span={2}>
              {detail.data.externalSystemName}
            </Descriptions.Item>
            <Descriptions.Item label="URL" span={2}>
              {detail.data.endpointUrl}
            </Descriptions.Item>
            <Descriptions.Item label="Method">
              {detail.data.httpMethod}
            </Descriptions.Item>
            <Descriptions.Item label="HTTP Status">
              {detail.data.responseStatusCode ?? "—"}
            </Descriptions.Item>
            <Descriptions.Item label="Thời gian gọi">
              {dayjs(detail.data.calledAt).format("DD/MM/YYYY HH:mm:ss")}
            </Descriptions.Item>
            <Descriptions.Item label="Thời gian xử lý">
              {detail.data.durationMs} ms
            </Descriptions.Item>
            {detail.data.errorMessage && (
              <Descriptions.Item label="Lỗi" span={2}>
                <span style={{ color: "#ff4d4f" }}>
                  {detail.data.errorMessage}
                </span>
              </Descriptions.Item>
            )}
            {detail.data.requestHeaders && (
              <Descriptions.Item label="Request Headers" span={2}>
                <pre
                  style={{
                    maxHeight: 120,
                    overflow: "auto",
                    fontSize: 12,
                    margin: 0,
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {detail.data.requestHeaders}
                </pre>
              </Descriptions.Item>
            )}
            {detail.data.requestBody && (
              <Descriptions.Item label="Request Body" span={2}>
                <pre
                  style={{
                    maxHeight: 200,
                    overflow: "auto",
                    fontSize: 12,
                    margin: 0,
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {detail.data.requestBody}
                </pre>
              </Descriptions.Item>
            )}
            {detail.data.responseBody && (
              <Descriptions.Item label="Response Body" span={2}>
                <pre
                  style={{
                    maxHeight: 200,
                    overflow: "auto",
                    fontSize: 12,
                    margin: 0,
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {detail.data.responseBody}
                </pre>
              </Descriptions.Item>
            )}
          </Descriptions>
        )}
      </Modal>
    </>
  );
}

export default function DataIntegrationPage() {
  return (
    <Card>
      <Tabs
        items={[
          {
            key: "endpoints",
            label: "Cấu hình API",
            children: <EndpointsTab />,
          },
          {
            key: "history",
            label: "Lịch sử gọi API",
            children: <CallHistoryTab />,
          },
        ]}
      />
    </Card>
  );
}
