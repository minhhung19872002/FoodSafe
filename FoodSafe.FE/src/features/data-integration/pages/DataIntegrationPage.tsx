import { useState } from "react";
import {
  Button,
  Card,
  Checkbox,
  DatePicker,
  Form,
  Input,
  message,
  Modal,
  Select,
  Space,
  Table,
  Tabs,
  Tag,
  Descriptions,
  type TableColumnsType,
} from "antd";
import { RowActions } from "@/components/RowActions";
import {
  ApiOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SwapOutlined,
  EyeOutlined,
  ExportOutlined,
  RedoOutlined,
  ShareAltOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { useAuthStore } from "@/features/auth/store/authStore";
import { useTablePagination } from "@/hooks/useTablePagination";
import { saveDownload } from "@/utils/download";
import { RecordDetailDrawer } from "@/components/RecordDetailDrawer";
import { PartnersTab } from "../components/PartnersTab";
import { InboundSubmissionsTab } from "../components/InboundSubmissionsTab";
import { ApiSpecsTab } from "../components/ApiSpecsTab";
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
  useRetryCallLog,
  useShareData,
  useTestConnection,
} from "../api/dataIntegrationMutations";
import {
  API_ENDPOINT_STATUS,
  API_ENDPOINT_STATUS_CONFIG,
  API_AUTH_TYPE,
  API_AUTH_TYPE_LABELS,
  API_CALL_DIRECTION,
  API_CALL_DIRECTION_CONFIG,
  SHARED_DATA_TYPE,
  SHARED_DATA_TYPE_LABELS,
  type ApiEndpoint,
  type ApiEndpointFilter,
  type ApiEndpointStatus,
  type ApiAuthType,
  type ApiCallLog,
  type ApiCallLogFilter,
  type ApiCallDirection,
  type SharedDataType,
} from "../types/dataIntegration.types";

const HTTP_METHODS = ["GET", "POST", "PUT", "DELETE", "PATCH"];
const EXTERNAL_SYSTEMS = ["Bộ Y tế", "Sở Nông nghiệp", "Sở Công thương"];

/** Surfaces the server's Vietnamese business message when one exists. */
function apiErrorMessage(error: unknown, fallback: string): string {
  const serverMessage = (
    error as {
      response?: { data?: { error?: { message?: string } } };
    }
  )?.response?.data?.error?.message;
  return serverMessage || fallback;
}

function EndpointsTab() {
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const [filter, setFilter] = useState<ApiEndpointFilter>({});
  const pagination = useTablePagination(15);
  const { data, isLoading } = useApiEndpoints({
    ...filter,
    skipCount: pagination.skipCount,
    maxResultCount: pagination.maxResultCount,
  });
  const createMut = useCreateEndpoint();
  const updateMut = useUpdateEndpoint();
  const toggleMut = useToggleEndpointStatus();
  const deleteMut = useDeleteEndpoint();
  const exportMut = useExportEndpoints();
  const testMut = useTestConnection();

  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<ApiEndpoint | null>(null);
  const [detailRecord, setDetailRecord] = useState<ApiEndpoint | null>(null);
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
      width: 96,
      render: (_, record) => (
        <RowActions
          overflowAriaLabel={`Thao tác ${record.name}`}
          actions={[
            {
              key: "test",
              label: "Test kết nối",
              ariaLabel: `Test kết nối ${record.name}`,
              icon: <ApiOutlined />,
              onClick: () =>
                testMut.mutate(record.id, {
                  onSuccess: (result) =>
                    result.isSuccess
                      ? message.success(
                          `Kết nối thành công (HTTP ${result.statusCode ?? "—"}, ${result.durationMs}ms)`,
                        )
                      : message.warning(
                          `Không kết nối được: ${result.errorMessage ?? "lỗi không xác định"}`,
                        ),
                  onError: () => message.error("Không thể kiểm tra kết nối."),
                }),
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
              label:
                record.status === API_ENDPOINT_STATUS.Active ? "Tắt" : "Bật",
              ariaLabel:
                record.status === API_ENDPOINT_STATUS.Active
                  ? `Tắt ${record.name}`
                  : `Bật ${record.name}`,
              icon: <SwapOutlined />,
              hidden: !canEdit,
              confirm:
                record.status === API_ENDPOINT_STATUS.Active
                  ? "Tắt endpoint?"
                  : "Bật endpoint?",
              onClick: () =>
                toggleMut.mutate(record.id, {
                  onSuccess: () => message.success("Đã cập nhật"),
                  onError: () => message.error("Thao tác thất bại"),
                }),
            },
            {
              key: "delete",
              label: "Xóa",
              ariaLabel: `Xóa ${record.name}`,
              icon: <DeleteOutlined />,
              danger: true,
              hidden: !canDelete,
              confirm: "Xóa endpoint?",
              onClick: () =>
                deleteMut.mutate(record.id, {
                  onSuccess: () => message.success("Đã xóa"),
                  onError: () => message.error("Xóa thất bại"),
                }),
            },
          ]}
        />
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
          onSearch={(v) => {
            setFilter((f) => ({ ...f, filter: v || undefined }));
            pagination.resetToFirstPage();
          }}
        />
        <Select
          placeholder="Trạng thái"
          allowClear
          style={{ width: 140 }}
          options={Object.entries(API_ENDPOINT_STATUS_CONFIG).map(([k, v]) => ({
            value: Number(k),
            label: v.label,
          }))}
          onChange={(v) => {
            setFilter((f) => ({ ...f, status: v }));
            pagination.resetToFirstPage();
          }}
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
        onRow={(record) => ({
          onDoubleClick: () => setDetailRecord(record),
          style: { cursor: "pointer" },
        })}
        pagination={pagination.buildConfig(data?.totalCount)}
      />
      <RecordDetailDrawer
        title="Chi tiết endpoint"
        record={detailRecord}
        onClose={() => setDetailRecord(null)}
        fields={[
          { label: "Tên", render: (r) => r.name, span: 2 },
          { label: "URL", render: (r) => r.url, span: 2 },
          { label: "Phương thức", render: (r) => r.httpMethod },
          { label: "Hệ thống", render: (r) => r.externalSystem },
          {
            label: "Xác thực",
            render: (r) => API_AUTH_TYPE_LABELS[r.authType],
          },
          {
            label: "Thông tin xác thực",
            render: (r) =>
              r.hasCredential ? (
                <Tag color="green">Đã cấu hình</Tag>
              ) : r.authType === API_AUTH_TYPE.None ? (
                "—"
              ) : (
                <Tag color="orange">Chưa cấu hình</Tag>
              ),
          },
          {
            label: "Trạng thái",
            render: (r) => {
              const cfg = API_ENDPOINT_STATUS_CONFIG[r.status];
              return <Tag color={cfg.color}>{cfg.label}</Tag>;
            },
          },
          { label: "Mô tả", render: (r) => r.description, span: 2 },
        ]}
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
          <Form.Item
            noStyle
            shouldUpdate={(prev, cur) => prev.authType !== cur.authType}
          >
            {({ getFieldValue }) => {
              const authType = getFieldValue("authType") as ApiAuthType;
              if (authType === API_AUTH_TYPE.None) return null;
              const isBasic = authType === API_AUTH_TYPE.BasicAuth;
              const editingWithCredential = editing?.hasCredential ?? false;
              return (
                <>
                  <Form.Item
                    name="credential"
                    label="Thông tin xác thực"
                    rules={
                      editing
                        ? []
                        : [
                            {
                              required: true,
                              message: "Vui lòng nhập thông tin xác thực",
                            },
                          ]
                    }
                    extra={
                      editingWithCredential
                        ? "Đã lưu và mã hóa. Để trống nếu giữ nguyên."
                        : undefined
                    }
                  >
                    <Input.Password
                      autoComplete="new-password"
                      placeholder={
                        isBasic
                          ? "vd: doi_tac:M@tKhau"
                          : "Dán khóa API hoặc token"
                      }
                    />
                  </Form.Item>
                  {editingWithCredential && (
                    <Form.Item name="clearCredential" valuePropName="checked">
                      <Checkbox>Xóa thông tin xác thực đã lưu</Checkbox>
                    </Form.Item>
                  )}
                </>
              );
            }}
          </Form.Item>
          <Form.Item name="description" label="Mô tả">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}

function CallHistoryTab() {
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const [filter, setFilter] = useState<ApiCallLogFilter>({});
  const pagination = useTablePagination(15);
  const { data, isLoading } = useApiCallLogs({
    ...filter,
    skipCount: pagination.skipCount,
    maxResultCount: pagination.maxResultCount,
  });
  const exportMut = useExportCallLogs();
  const shareMut = useShareData();
  const retryMut = useRetryCallLog();
  const [detailId, setDetailId] = useState<string>();
  const [shareOpen, setShareOpen] = useState(false);
  const [shareForm] = Form.useForm();
  const detail = useApiCallLogDetail(detailId);
  const canViewEndpoints = hasPermission(
    "FoodSafe.DataIntegration.ApiEndpoints.View",
  );
  const endpoints = useApiEndpoints(
    {
      skipCount: 0,
      maxResultCount: 100,
      status: API_ENDPOINT_STATUS.Active,
    },
    canViewEndpoints,
  );
  const canShare = hasPermission("FoodSafe.DataIntegration.Share");

  const columns: TableColumnsType<ApiCallLog> = [
    {
      title: "Loại dữ liệu",
      dataIndex: "dataType",
      width: 150,
      render: (v: SharedDataType) => SHARED_DATA_TYPE_LABELS[v] ?? "Khác",
    },
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
      title: "Lần",
      dataIndex: "attemptNumber",
      width: 60,
      align: "center",
      render: (attempt: number) =>
        attempt > 1 ? <Tag color="orange">#{attempt}</Tag> : attempt,
    },
    {
      title: "",
      key: "actions",
      width: 96,
      render: (_, record) => (
        <RowActions
          actions={[
            {
              key: "view",
              label: "Xem chi tiết",
              ariaLabel: "Xem chi tiết",
              icon: <EyeOutlined />,
              onClick: () => setDetailId(record.id),
            },
            {
              key: "retry",
              label: "Thử lại",
              ariaLabel: "Thử lại",
              icon: <RedoOutlined />,
              hidden: !(
                canShare &&
                !record.isSuccess &&
                record.direction === API_CALL_DIRECTION.Outbound &&
                record.endpointId
              ),
              confirm: "Thử lại giao tiếp này?",
              onClick: () =>
                retryMut.mutate(record.id, {
                  onSuccess: (result) => {
                    if (result.isSuccess) {
                      message.success("Đã thử lại thành công.");
                    } else {
                      message.warning(
                        `Đã thử lại nhưng hệ thống nhận vẫn trả lỗi: ${result.errorMessage ?? "không xác định"}`,
                      );
                    }
                  },
                  onError: (error) =>
                    void message.error(
                      apiErrorMessage(error, "Không thể thử lại giao tiếp."),
                    ),
                }),
            },
          ]}
        />
      ),
    },
  ];

  return (
    <>
      <Tabs
        size="small"
        activeKey={String(filter.dataType ?? "all")}
        onChange={(key) => {
          setFilter((f) => ({
            ...f,
            dataType:
              key === "all" ? undefined : (Number(key) as SharedDataType),
          }));
          pagination.resetToFirstPage();
        }}
        items={[
          { key: "all", label: "Tất cả" },
          ...Object.entries(SHARED_DATA_TYPE_LABELS)
            .filter(([value]) => Number(value) !== SHARED_DATA_TYPE.Other)
            .map(([value, label]) => ({ key: value, label })),
        ]}
      />
      <Space style={{ marginBottom: 16 }} wrap>
        <Input.Search
          placeholder="URL, hệ thống"
          allowClear
          style={{ width: 240 }}
          onSearch={(v) => {
            setFilter((f) => ({ ...f, filter: v || undefined }));
            pagination.resetToFirstPage();
          }}
        />
        <Select
          placeholder="Hướng"
          allowClear
          style={{ width: 120 }}
          options={Object.entries(API_CALL_DIRECTION_CONFIG).map(([k, v]) => ({
            value: Number(k),
            label: v.label,
          }))}
          onChange={(v) => {
            setFilter((f) => ({ ...f, direction: v }));
            pagination.resetToFirstPage();
          }}
        />
        <Select
          placeholder="Kết quả"
          allowClear
          style={{ width: 120 }}
          options={[
            { value: true, label: "Thành công" },
            { value: false, label: "Thất bại" },
          ]}
          onChange={(v) => {
            setFilter((f) => ({ ...f, isSuccess: v as boolean | undefined }));
            pagination.resetToFirstPage();
          }}
        />
        <DatePicker.RangePicker
          placeholder={["Từ ngày", "Đến ngày"]}
          format="DD/MM/YYYY"
          onChange={(range) => {
            setFilter((f) => ({
              ...f,
              fromDate: range?.[0]?.format("YYYY-MM-DD"),
              toDate: range?.[1]?.format("YYYY-MM-DD"),
            }));
            pagination.resetToFirstPage();
          }}
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
        {canShare && (
          <Button
            type="primary"
            icon={<ShareAltOutlined />}
            onClick={() => {
              shareForm.setFieldsValue({
                dataType: filter.dataType ?? SHARED_DATA_TYPE.Alert,
              });
              setShareOpen(true);
            }}
          >
            Chia sẻ dữ liệu
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
          onDoubleClick: () => setDetailId(record.id),
          style: { cursor: "pointer" },
        })}
        pagination={pagination.buildConfig(data?.totalCount)}
      />
      <Modal
        title="Chia sẻ dữ liệu đến hệ thống bên ngoài"
        open={shareOpen}
        onCancel={() => setShareOpen(false)}
        onOk={() => shareForm.submit()}
        okText="Gửi"
        cancelText="Hủy"
        confirmLoading={shareMut.isPending}
        destroyOnHidden
      >
        <Form
          form={shareForm}
          layout="vertical"
          preserve={false}
          onFinish={(values) =>
            shareMut.mutate(values, {
              onSuccess: (result) => {
                setShareOpen(false);
                if (result.isSuccess) {
                  message.success("Đã chia sẻ dữ liệu thành công.");
                } else {
                  message.warning(
                    `Đã ghi nhận lần gửi nhưng hệ thống nhận trả lỗi: ${result.errorMessage ?? "không xác định"}`,
                  );
                }
              },
              onError: () => message.error("Không thể chia sẻ dữ liệu."),
            })
          }
        >
          <Form.Item
            name="endpointId"
            label="Điểm kết nối"
            rules={[{ required: true, message: "Chọn điểm kết nối" }]}
          >
            <Select
              placeholder="Chọn API endpoint"
              options={(endpoints.data?.items ?? []).map((endpoint) => ({
                value: endpoint.id,
                label: `${endpoint.externalSystem} — ${endpoint.name}`,
              }))}
            />
          </Form.Item>
          <Form.Item
            name="dataType"
            label="Loại dữ liệu"
            rules={[{ required: true, message: "Chọn loại dữ liệu" }]}
          >
            <Select
              options={Object.entries(SHARED_DATA_TYPE_LABELS).map(
                ([value, label]) => ({ value: Number(value), label }),
              )}
            />
          </Form.Item>
          <Form.Item name="note" label="Ghi chú / mô tả dữ liệu">
            <Input.TextArea
              rows={3}
              maxLength={2000}
              placeholder="Mô tả nội dung dữ liệu được chia sẻ"
            />
          </Form.Item>
        </Form>
      </Modal>
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
            <Descriptions.Item label="Lần gửi">
              #{detail.data.attemptNumber}
              {detail.data.correlationId ? " (thử lại)" : ""}
            </Descriptions.Item>
            <Descriptions.Item label="Checksum nội dung">
              <span style={{ fontSize: 12, wordBreak: "break-all" }}>
                {detail.data.payloadChecksum ?? "—"}
              </span>
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
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const canViewEndpoints = hasPermission(
    "FoodSafe.DataIntegration.ApiEndpoints.View",
  );
  const canViewCallHistory = hasPermission(
    "FoodSafe.DataIntegration.CallHistory.View",
  );
  const canViewPartners = hasPermission(
    "FoodSafe.DataIntegration.Partners.View",
  );
  const canViewApiSpecs = hasPermission(
    "FoodSafe.DataIntegration.ApiSpecs.View",
  );

  const tabItems = [
    ...(canViewEndpoints
      ? [
          {
            key: "endpoints",
            label: "Cấu hình API",
            children: <EndpointsTab />,
          },
        ]
      : []),
    ...(canViewCallHistory
      ? [
          {
            key: "history",
            label: "Lịch sử gọi API",
            children: <CallHistoryTab />,
          },
        ]
      : []),
    ...(canViewPartners
      ? [
          {
            key: "partners",
            label: "Đối tác liên thông",
            children: <PartnersTab />,
          },
          {
            key: "inbound",
            label: "Dữ liệu nhận về",
            children: <InboundSubmissionsTab />,
          },
        ]
      : []),
    ...(canViewApiSpecs
      ? [
          {
            key: "api-specs",
            label: "Đặc tả API",
            children: <ApiSpecsTab />,
          },
        ]
      : []),
  ];

  return (
    <Card>
      <Tabs defaultActiveKey={tabItems[0]?.key} items={tabItems} />
    </Card>
  );
}
