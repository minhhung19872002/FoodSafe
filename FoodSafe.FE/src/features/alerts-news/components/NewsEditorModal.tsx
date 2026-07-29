import { useCallback, useEffect, useRef, useState } from "react";
import {
  App,
  Button,
  Checkbox,
  Form,
  Input,
  Modal,
  Select,
  Space,
  Upload,
} from "antd";
import {
  DeleteOutlined,
  PictureOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import { RichTextEditor } from "@/components/RichTextEditor/RichTextEditor";
import { extractApiError } from "@/lib/apiError";
import { newsApi } from "../api/alertsNewsApi";
import { useAlertOptions } from "../api/alertsNewsQueries";
import {
  NEWS_CATEGORIES,
  type AtpNews,
  type CreateUpdateNewsInput,
} from "../types/alertsNews.types";

const MAX_THUMBNAIL_BYTES = 5 * 1024 * 1024; // 5 MB
const ACCEPTED_IMAGE_TYPES = "image/jpeg,image/png,image/gif,image/webp";

interface FormValues {
  title: string;
  content: string;
  summary?: string;
  category?: string;
  tags?: string;
  isFeatured: boolean;
  linkedAlertIds: string[];
}

interface Props {
  open: boolean;
  item?: AtpNews;
  saving: boolean;
  onCancel: () => void;
  onSubmit: (input: CreateUpdateNewsInput) => void;
}

export function NewsEditorModal(props: Props) {
  const [form] = Form.useForm<FormValues>();
  const { open, item } = props;
  const { message } = App.useApp();

  const [alertSearch, setAlertSearch] = useState<string | undefined>();
  const { data: alertOptions } = useAlertOptions(alertSearch);

  // Thumbnail state — kept outside the Ant Design form because the value
  // comes from a server upload response, not from a standard form control.
  const [thumbnailStoragePath, setThumbnailStoragePath] = useState<
    string | undefined
  >();
  const [thumbnailPreviewUrl, setThumbnailPreviewUrl] = useState<
    string | undefined
  >();
  const [uploading, setUploading] = useState(false);

  // Track locally created object-URLs so we can revoke them on cleanup.
  const objectUrlRef = useRef<string | undefined>(undefined);

  // Stable function (reads only from a ref) — safe to list as an effect dep.
  const revokePendingObjectUrl = useCallback(() => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = undefined;
    }
  }, []);

  useEffect(() => {
    if (!open) return;

    // Reset thumbnail state on each open.
    revokePendingObjectUrl();
    setUploading(false);

    if (item) {
      form.setFieldsValue({
        title: item.title,
        content: item.content,
        summary: item.summary,
        category: item.category,
        tags: item.tags,
        isFeatured: item.isFeatured,
        linkedAlertIds: item.linkedAlerts.map((la) => la.alertId),
      });
      setThumbnailStoragePath(item.thumbnailStoragePath);
      setThumbnailPreviewUrl(
        item.thumbnailStoragePath
          ? newsApi.thumbnailUrl(item.thumbnailStoragePath)
          : undefined,
      );
    } else {
      form.setFieldsValue({
        isFeatured: false,
        linkedAlertIds: [],
      });
      setThumbnailStoragePath(undefined);
      setThumbnailPreviewUrl(undefined);
    }

    return revokePendingObjectUrl;
  }, [form, open, item, revokePendingObjectUrl]);

  const handleRemoveThumbnail = () => {
    revokePendingObjectUrl();
    setThumbnailStoragePath(undefined);
    setThumbnailPreviewUrl(undefined);
  };

  return (
    <Modal
      open={open}
      title={item ? "Sửa tin tức" : "Tạo tin tức mới"}
      width={860}
      okText="Lưu"
      cancelText="Hủy"
      confirmLoading={props.saving}
      onCancel={props.onCancel}
      okButtonProps={{ disabled: uploading }}
      onOk={() => form.submit()}
      destroyOnHidden
    >
      <Form
        form={form}
        layout="vertical"
        preserve={false}
        onFinish={(values) =>
          props.onSubmit({
            title: values.title.trim(),
            content: values.content.trim(),
            summary: values.summary?.trim() || undefined,
            thumbnailStoragePath,
            category: values.category || undefined,
            tags: values.tags?.trim() || undefined,
            isFeatured: values.isFeatured,
            linkedAlertIds: values.linkedAlertIds ?? [],
          })
        }
      >
        <Form.Item
          name="title"
          label="Tiêu đề"
          rules={[{ required: true, message: "Vui lòng nhập tiêu đề." }]}
        >
          <Input maxLength={500} />
        </Form.Item>

        <Form.Item name="summary" label="Tóm tắt">
          <Input.TextArea rows={2} maxLength={1000} />
        </Form.Item>

        <Form.Item
          name="content"
          label="Nội dung"
          rules={[
            {
              validator: (_, value: string | undefined) => {
                // Strip all HTML tags and check that meaningful text remains.
                const text = (value ?? "").replace(/<[^>]*>/g, "").trim();
                if (!text) {
                  return Promise.reject(new Error("Vui lòng nhập nội dung."));
                }
                return Promise.resolve();
              },
            },
          ]}
        >
          <RichTextEditor placeholder="Nhập nội dung bài viết..." />
        </Form.Item>

        {/* Thumbnail upload */}
        <Form.Item
          label="Ảnh đại diện"
          extra="Chấp nhận JPEG, PNG, GIF, WEBP — tối đa 5MB"
        >
          <Space direction="vertical" style={{ width: "100%" }}>
            {thumbnailPreviewUrl ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 12,
                }}
              >
                <img
                  src={thumbnailPreviewUrl}
                  alt="Ảnh đại diện"
                  style={{
                    width: 180,
                    height: 120,
                    objectFit: "cover",
                    borderRadius: 4,
                    border: "1px solid #d9d9d9",
                  }}
                />
                <Space direction="vertical">
                  <Upload
                    accept={ACCEPTED_IMAGE_TYPES}
                    maxCount={1}
                    showUploadList={false}
                    beforeUpload={(file) => {
                      handleUpload(file);
                      return false;
                    }}
                  >
                    <Button
                      size="small"
                      icon={<UploadOutlined />}
                      loading={uploading}
                    >
                      Đổi ảnh
                    </Button>
                  </Upload>
                  <Button
                    size="small"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={handleRemoveThumbnail}
                    disabled={uploading}
                  >
                    Xóa ảnh
                  </Button>
                </Space>
              </div>
            ) : (
              <Upload
                accept={ACCEPTED_IMAGE_TYPES}
                maxCount={1}
                showUploadList={false}
                beforeUpload={(file) => {
                  handleUpload(file);
                  return false;
                }}
              >
                <Button icon={<PictureOutlined />} loading={uploading}>
                  Chọn ảnh đại diện
                </Button>
              </Upload>
            )}
          </Space>
        </Form.Item>

        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}
        >
          <Form.Item name="category" label="Chuyên mục">
            <Select
              allowClear
              options={NEWS_CATEGORIES.map((c) => ({ value: c, label: c }))}
            />
          </Form.Item>
          <Form.Item name="tags" label="Thẻ (tags)">
            <Input maxLength={500} placeholder="tag1, tag2, tag3" />
          </Form.Item>
        </div>

        <Form.Item name="linkedAlertIds" label="Liên kết cảnh báo">
          <Select
            mode="multiple"
            showSearch
            filterOption={false}
            onSearch={setAlertSearch}
            options={(alertOptions ?? []).map((a) => ({
              value: a.id,
              label: a.alertNumber ? `${a.alertNumber} — ${a.title}` : a.title,
            }))}
            placeholder="Tìm và chọn cảnh báo liên quan"
          />
        </Form.Item>

        <Form.Item name="isFeatured" valuePropName="checked">
          <Checkbox>Tin nổi bật</Checkbox>
        </Form.Item>
      </Form>
    </Modal>
  );

  function handleUpload(file: File) {
    if (file.size > MAX_THUMBNAIL_BYTES) {
      void message.error("Ảnh đại diện không được vượt quá 5MB.");
      return;
    }

    // Show local preview immediately before the upload completes.
    revokePendingObjectUrl();
    const localUrl = URL.createObjectURL(file);
    objectUrlRef.current = localUrl;
    setThumbnailPreviewUrl(localUrl);
    setThumbnailStoragePath(undefined); // clear old path until server confirms
    setUploading(true);

    newsApi
      .uploadThumbnail(file)
      .then((result) => {
        setThumbnailStoragePath(result.storagePath);
        void message.success("Đã tải lên ảnh đại diện.");
      })
      .catch((err: unknown) => {
        // Roll back the preview on failure.
        revokePendingObjectUrl();
        setThumbnailPreviewUrl(
          item?.thumbnailStoragePath
            ? newsApi.thumbnailUrl(item.thumbnailStoragePath)
            : undefined,
        );
        setThumbnailStoragePath(item?.thumbnailStoragePath);
        void message.error(
          extractApiError(err) || "Không thể tải lên ảnh đại diện.",
        );
      })
      .finally(() => {
        setUploading(false);
      });
  }
}
