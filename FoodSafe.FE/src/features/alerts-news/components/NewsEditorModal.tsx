import { useEffect, useState } from "react";
import { Checkbox, Form, Input, Modal, Select } from "antd";
import { useAlertOptions } from "../api/alertsNewsQueries";
import type { AtpNews, CreateUpdateNewsInput } from "../types/alertsNews.types";

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

const NEWS_CATEGORIES = [
  "Hoạt động ATTP",
  "Cảnh báo",
  "Văn bản pháp luật",
  "Tuyên truyền",
  "Khác",
];

export function NewsEditorModal(props: Props) {
  const [form] = Form.useForm<FormValues>();
  const { open, item } = props;
  const [alertSearch, setAlertSearch] = useState<string | undefined>();
  const { data: alertOptions } = useAlertOptions(alertSearch);

  useEffect(() => {
    if (!open) return;
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
    } else {
      form.setFieldsValue({
        isFeatured: false,
        linkedAlertIds: [],
      });
    }
  }, [form, open, item]);

  return (
    <Modal
      open={open}
      title={item ? "Sửa tin tức" : "Tạo tin tức mới"}
      width={860}
      okText="Lưu"
      cancelText="Hủy"
      confirmLoading={props.saving}
      onCancel={props.onCancel}
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
          rules={[{ required: true, message: "Vui lòng nhập nội dung." }]}
        >
          <Input.TextArea rows={6} />
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
            <Input placeholder="tag1, tag2, tag3" />
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
}
