import { useState } from "react";
import {
  Alert,
  Button,
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
  Upload,
  type TableColumnsType,
  type UploadProps,
} from "antd";
import {
  CloudUploadOutlined,
  DeleteOutlined,
  DownloadOutlined,
  EditOutlined,
  InboxOutlined,
  StopOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { useAuthStore } from "@/features/auth/store/authStore";
import { useTablePagination } from "@/hooks/useTablePagination";
import { saveDownload } from "@/utils/download";
import { RecordDetailDrawer } from "@/components/RecordDetailDrawer";
import { useApiSpecs } from "../api/dataIntegrationQueries";
import {
  useDeleteApiSpec,
  useDownloadApiSpec,
  usePublishApiSpec,
  useUnpublishApiSpec,
  useUpdateApiSpecMetadata,
  useUploadApiSpec,
} from "../api/dataIntegrationMutations";
import {
  API_SPEC_FORMAT_CONFIG,
  type ApiSpecFormat,
  type ApiSpecification,
  type ApiSpecificationFilter,
} from "../types/dataIntegration.types";

const MAX_CONTENT_BYTES = 2 * 1024 * 1024;
const ACCEPTED_EXTENSIONS = ".json,.yaml,.yml";

function apiErrorMessage(error: unknown, fallback: string): string {
  const serverMessage = (
    error as { response?: { data?: { error?: { message?: string } } } }
  )?.response?.data?.error?.message;
  return serverMessage || fallback;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/** Absolute partner download URL for a published spec (same origin, via nginx). */
function partnerUrl(name: string): string {
  return `${window.location.origin}/api/v1/partner/api-spec/${encodeURIComponent(name)}`;
}

/** Admin UI for versioned partner API specifications (FR-50-05). */
export function ApiSpecsTab() {
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const [filter, setFilter] = useState<ApiSpecificationFilter>({});
  const pagination = useTablePagination(15);
  const { data, isLoading } = useApiSpecs({
    ...filter,
    skipCount: pagination.skipCount,
    maxResultCount: pagination.maxResultCount,
  });
  const publishMut = usePublishApiSpec();
  const unpublishMut = useUnpublishApiSpec();
  const deleteMut = useDeleteApiSpec();
  const downloadMut = useDownloadApiSpec();

  const [uploadOpen, setUploadOpen] = useState(false);
  const [editing, setEditing] = useState<ApiSpecification | null>(null);
  const [detailRecord, setDetailRecord] = useState<ApiSpecification | null>(
    null,
  );

  const canCreate = hasPermission("FoodSafe.DataIntegration.ApiSpecs.Create");
  const canPublish = hasPermission("FoodSafe.DataIntegration.ApiSpecs.Publish");
  const canDelete = hasPermission("FoodSafe.DataIntegration.ApiSpecs.Delete");

  const download = (record: ApiSpecification) =>
    downloadMut.mutate(record.id, {
      onSuccess: (file) =>
        saveDownload(
          new Blob([file.content], { type: file.contentType }),
          file.fileName,
        ),
      onError: (error) =>
        void message.error(apiErrorMessage(error, "Không thể tải đặc tả.")),
    });

  const columns: TableColumnsType<ApiSpecification> = [
    { title: "Tên đặc tả", dataIndex: "name", width: 180, ellipsis: true },
    {
      title: "Phiên bản",
      dataIndex: "versionNumber",
      width: 90,
      align: "center",
      render: (v: number) => <Tag>v{v}</Tag>,
    },
    { title: "Tiêu đề", dataIndex: "title", ellipsis: true },
    {
      title: "API",
      dataIndex: "specVersion",
      width: 90,
      ellipsis: true,
    },
    {
      title: "OpenAPI",
      dataIndex: "openApiVersion",
      width: 90,
      ellipsis: true,
    },
    {
      title: "Định dạng",
      dataIndex: "format",
      width: 100,
      render: (f: ApiSpecFormat) => {
        const cfg = API_SPEC_FORMAT_CONFIG[f];
        return <Tag color={cfg.color}>{cfg.label}</Tag>;
      },
    },
    {
      title: "Dung lượng",
      dataIndex: "sizeBytes",
      width: 100,
      align: "right",
      render: (v: number) => formatBytes(v),
    },
    {
      title: "Xuất bản",
      dataIndex: "isPublished",
      width: 110,
      render: (published: boolean) =>
        published ? (
          <Tag color="green">Đã xuất bản</Tag>
        ) : (
          <Tag color="default">Nháp</Tag>
        ),
    },
    {
      title: "Ngày tải lên",
      dataIndex: "creationTime",
      width: 130,
      render: (v: string) => dayjs(v).format("DD/MM/YYYY HH:mm"),
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 260,
      render: (_, record) => (
        <Space size="small" wrap>
          <Button
            size="small"
            icon={<DownloadOutlined />}
            loading={
              downloadMut.isPending && downloadMut.variables === record.id
            }
            onClick={() => download(record)}
          >
            Tải
          </Button>
          {canPublish &&
            (record.isPublished ? (
              <Popconfirm
                title="Gỡ xuất bản đặc tả này? Đối tác sẽ không tải được nữa."
                okText="Gỡ"
                cancelText="Hủy"
                onConfirm={() =>
                  unpublishMut.mutate(record.id, {
                    onSuccess: () => message.success("Đã gỡ xuất bản."),
                    onError: (error) =>
                      void message.error(
                        apiErrorMessage(error, "Thao tác thất bại."),
                      ),
                  })
                }
              >
                <Button size="small" icon={<StopOutlined />}>
                  Gỡ
                </Button>
              </Popconfirm>
            ) : (
              <Popconfirm
                title="Xuất bản phiên bản này?"
                description="Phiên bản đang xuất bản của cùng tên (nếu có) sẽ tự động bị thay thế."
                okText="Xuất bản"
                cancelText="Hủy"
                onConfirm={() =>
                  publishMut.mutate(record.id, {
                    onSuccess: () => message.success("Đã xuất bản."),
                    onError: (error) =>
                      void message.error(
                        apiErrorMessage(error, "Không thể xuất bản."),
                      ),
                  })
                }
              >
                <Button
                  size="small"
                  type="primary"
                  icon={<CloudUploadOutlined />}
                >
                  Xuất bản
                </Button>
              </Popconfirm>
            ))}
          {canCreate && (
            <Button
              size="small"
              icon={<EditOutlined />}
              onClick={() => setEditing(record)}
            >
              Sửa
            </Button>
          )}
          {canDelete && (
            <Popconfirm
              title="Xóa phiên bản đặc tả này?"
              okText="Xóa"
              cancelText="Hủy"
              onConfirm={() =>
                deleteMut.mutate(record.id, {
                  onSuccess: () => message.success("Đã xóa."),
                  onError: (error) =>
                    void message.error(apiErrorMessage(error, "Xóa thất bại.")),
                })
              }
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
      <Space style={{ marginBottom: 16 }} wrap>
        <Input.Search
          placeholder="Tên, tiêu đề đặc tả"
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
          style={{ width: 160 }}
          options={[
            { value: true, label: "Đã xuất bản" },
            { value: false, label: "Nháp" },
          ]}
          onChange={(v) => {
            setFilter((f) => ({
              ...f,
              isPublished: v as boolean | undefined,
            }));
            pagination.resetToFirstPage();
          }}
        />
        {canCreate && (
          <Button
            type="primary"
            icon={<CloudUploadOutlined />}
            onClick={() => setUploadOpen(true)}
          >
            Tải lên đặc tả
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

      <UploadApiSpecModal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
      />
      <EditMetadataModal editing={editing} onClose={() => setEditing(null)} />

      <RecordDetailDrawer
        title="Chi tiết đặc tả API"
        record={detailRecord}
        onClose={() => setDetailRecord(null)}
        fields={[
          { label: "Tên đặc tả", render: (r) => r.name },
          { label: "Phiên bản", render: (r) => `v${r.versionNumber}` },
          { label: "Tiêu đề", render: (r) => r.title, span: 2 },
          { label: "Phiên bản API", render: (r) => r.specVersion },
          { label: "Phiên bản OpenAPI", render: (r) => r.openApiVersion },
          {
            label: "Định dạng",
            render: (r) => {
              const cfg = API_SPEC_FORMAT_CONFIG[r.format];
              return <Tag color={cfg.color}>{cfg.label}</Tag>;
            },
          },
          { label: "Dung lượng", render: (r) => formatBytes(r.sizeBytes) },
          {
            label: "Trạng thái",
            render: (r) =>
              r.isPublished ? (
                <Tag color="green">Đã xuất bản</Tag>
              ) : (
                <Tag color="default">Nháp</Tag>
              ),
          },
          {
            label: "Xuất bản lúc",
            render: (r) =>
              r.publishedAt
                ? dayjs(r.publishedAt).format("DD/MM/YYYY HH:mm")
                : "—",
          },
          {
            label: "Checksum (SHA-256)",
            span: 2,
            render: (r) => (
              <Typography.Text
                code
                copyable={{ text: r.checksum }}
                style={{ fontSize: 12, wordBreak: "break-all" }}
              >
                {r.checksum}
              </Typography.Text>
            ),
          },
          { label: "Mô tả", span: 2, render: (r) => r.description },
          {
            label: "Đường dẫn đối tác",
            span: 2,
            render: (r) =>
              r.isPublished ? (
                <Typography.Text
                  copyable={{ text: partnerUrl(r.name) }}
                  style={{ fontSize: 12, wordBreak: "break-all" }}
                >
                  {partnerUrl(r.name)}
                </Typography.Text>
              ) : (
                "Chưa xuất bản"
              ),
          },
        ]}
      />
    </>
  );
}

interface UploadFormValues {
  name: string;
  description?: string;
}

function UploadApiSpecModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const uploadMut = useUploadApiSpec();
  const [form] = Form.useForm<UploadFormValues>();
  const [content, setContent] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);

  const reset = () => {
    form.resetFields();
    setContent("");
    setFileName(null);
  };

  const close = () => {
    reset();
    onClose();
  };

  const beforeUpload: UploadProps["beforeUpload"] = (file) => {
    if (file.size > MAX_CONTENT_BYTES) {
      void message.error("Tệp vượt quá 2 MB.");
      return Upload.LIST_IGNORE;
    }
    void file.text().then((text) => {
      setContent(text);
      setFileName(file.name);
      // Suggest a spec name from the file stem when the field is still empty.
      if (!form.getFieldValue("name")) {
        const stem = file.name
          .replace(/\.[^.]+$/, "")
          .replace(/[^a-zA-Z0-9_-]/g, "-");
        if (stem) form.setFieldValue("name", stem);
      }
    });
    return false;
  };

  const submit = (values: UploadFormValues) => {
    if (!content.trim()) {
      void message.error("Vui lòng chọn tệp hoặc dán nội dung đặc tả.");
      return;
    }
    uploadMut.mutate(
      {
        name: values.name,
        content,
        description: values.description,
      },
      {
        onSuccess: (spec) => {
          message.success(
            `Đã tải lên đặc tả "${spec.name}" (v${spec.versionNumber}).`,
          );
          close();
        },
        onError: (error) =>
          void message.error(
            apiErrorMessage(
              error,
              "Không thể tải lên. Kiểm tra nội dung OpenAPI hợp lệ.",
            ),
          ),
      },
    );
  };

  return (
    <Modal
      title="Tải lên đặc tả API (OpenAPI)"
      open={open}
      onCancel={close}
      onOk={() => form.submit()}
      okText="Tải lên"
      cancelText="Hủy"
      confirmLoading={uploadMut.isPending}
      width={720}
      destroyOnHidden
    >
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        message="Chấp nhận tài liệu OpenAPI 2.0 hoặc 3.x, định dạng JSON hoặc YAML (tối đa 2 MB). Nội dung được kiểm tra tính hợp lệ trên máy chủ."
      />
      <Form form={form} layout="vertical" preserve={false} onFinish={submit}>
        <Form.Item
          name="name"
          label="Tên đặc tả"
          rules={[
            { required: true, message: "Nhập tên đặc tả" },
            {
              pattern: /^[a-zA-Z0-9_-]+$/,
              message: "Chỉ gồm chữ, số, gạch ngang, gạch dưới.",
            },
          ]}
          extra="Định danh nhóm phiên bản; đối tác tải theo tên này."
        >
          <Input placeholder="vd: partner-sharing-api" maxLength={128} />
        </Form.Item>
        <Form.Item label="Tài liệu OpenAPI" required>
          <Upload.Dragger
            accept={ACCEPTED_EXTENSIONS}
            beforeUpload={beforeUpload}
            maxCount={1}
            showUploadList={false}
          >
            <p className="ant-upload-drag-icon">
              <InboxOutlined />
            </p>
            <p className="ant-upload-text">
              Kéo thả hoặc chọn tệp .json / .yaml / .yml
            </p>
            {fileName && (
              <p className="ant-upload-hint">
                Đã chọn: <strong>{fileName}</strong> ({content.length} ký tự)
              </p>
            )}
          </Upload.Dragger>
        </Form.Item>
        <Form.Item label="Hoặc dán nội dung trực tiếp">
          <Input.TextArea
            rows={6}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder='{ "openapi": "3.0.3", "info": { "title": "...", "version": "..." }, "paths": {} }'
            style={{ fontFamily: "monospace", fontSize: 12 }}
          />
        </Form.Item>
        <Form.Item name="description" label="Mô tả">
          <Input.TextArea rows={2} maxLength={1024} />
        </Form.Item>
      </Form>
    </Modal>
  );
}

function EditMetadataModal({
  editing,
  onClose,
}: {
  editing: ApiSpecification | null;
  onClose: () => void;
}) {
  const updateMut = useUpdateApiSpecMetadata();
  const [form] = Form.useForm<{ description?: string }>();

  return (
    <Modal
      title={`Sửa mô tả — ${editing?.name ?? ""} v${editing?.versionNumber ?? ""}`}
      open={editing !== null}
      onCancel={onClose}
      onOk={() => form.submit()}
      okText="Lưu"
      cancelText="Hủy"
      confirmLoading={updateMut.isPending}
      destroyOnHidden
    >
      <Form
        form={form}
        layout="vertical"
        preserve={false}
        initialValues={{ description: editing?.description }}
        onFinish={(values) =>
          editing &&
          updateMut.mutate(
            { id: editing.id, input: { description: values.description } },
            {
              onSuccess: () => {
                message.success("Đã cập nhật mô tả.");
                onClose();
              },
              onError: (error) =>
                void message.error(
                  apiErrorMessage(error, "Cập nhật thất bại."),
                ),
            },
          )
        }
      >
        <Form.Item name="description" label="Mô tả">
          <Input.TextArea rows={3} maxLength={1024} />
        </Form.Item>
      </Form>
    </Modal>
  );
}
