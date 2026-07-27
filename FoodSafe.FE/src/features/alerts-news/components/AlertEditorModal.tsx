import { useEffect } from "react";
import { Form, Input, Modal, Select } from "antd";
import {
  ALERT_CATEGORY,
  ALERT_CATEGORY_LABELS,
  ALERT_SEVERITY,
  ALERT_SEVERITY_CONFIG,
  ALERT_SOURCE,
  ALERT_SOURCE_LABELS,
  type AlertCategory,
  type AlertSeverity,
  type AlertSource,
  type AtpAlert,
  type CreateUpdateAlertInput,
} from "../types/alertsNews.types";

interface FormValues {
  title: string;
  content: string;
  category: AlertCategory;
  severity: AlertSeverity;
  source: AlertSource;
  alertNumber?: string;
  affectedArea?: string;
  affectedProducts?: string;
  reporterName?: string;
  reporterPhone?: string;
  reporterEmail?: string;
}

interface Props {
  open: boolean;
  item?: AtpAlert;
  saving: boolean;
  onCancel: () => void;
  onSubmit: (input: CreateUpdateAlertInput) => void;
}

export function AlertEditorModal(props: Props) {
  const [form] = Form.useForm<FormValues>();
  const { open, item } = props;

  useEffect(() => {
    if (!open) return;
    if (item) {
      form.setFieldsValue({
        title: item.title,
        content: item.content,
        category: item.category,
        severity: item.severity,
        source: item.source,
        alertNumber: item.alertNumber,
        affectedArea: item.affectedArea,
        affectedProducts: item.affectedProducts,
        reporterName: item.reporterName,
        reporterPhone: item.reporterPhone,
        reporterEmail: item.reporterEmail,
      });
    } else {
      form.setFieldsValue({
        category: ALERT_CATEGORY.FoodSafety,
        severity: ALERT_SEVERITY.Medium,
        source: ALERT_SOURCE.Internal,
      });
    }
  }, [form, open, item]);

  return (
    <Modal
      open={open}
      title={item ? "Sửa cảnh báo" : "Tạo cảnh báo mới"}
      width={800}
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
            category: values.category,
            severity: values.severity,
            source: values.source,
            alertNumber: values.alertNumber?.trim() || undefined,
            affectedArea: values.affectedArea?.trim() || undefined,
            affectedProducts: values.affectedProducts?.trim() || undefined,
            reporterName: values.reporterName?.trim() || undefined,
            reporterPhone: values.reporterPhone?.trim() || undefined,
            reporterEmail: values.reporterEmail?.trim() || undefined,
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

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: 16,
          }}
        >
          <Form.Item
            name="category"
            label="Loại cảnh báo"
            rules={[{ required: true }]}
          >
            <Select
              options={Object.entries(ALERT_CATEGORY_LABELS).map(
                ([value, label]) => ({ value: Number(value), label }),
              )}
            />
          </Form.Item>
          <Form.Item
            name="severity"
            label="Mức độ"
            rules={[{ required: true }]}
          >
            <Select
              options={Object.entries(ALERT_SEVERITY_CONFIG).map(
                ([value, cfg]) => ({ value: Number(value), label: cfg.label }),
              )}
            />
          </Form.Item>
          <Form.Item name="source" label="Nguồn" rules={[{ required: true }]}>
            <Select
              options={Object.entries(ALERT_SOURCE_LABELS).map(
                ([value, label]) => ({ value: Number(value), label }),
              )}
            />
          </Form.Item>
        </div>

        <Form.Item name="alertNumber" label="Số cảnh báo">
          <Input maxLength={100} />
        </Form.Item>

        <Form.Item
          name="content"
          label="Nội dung"
          rules={[{ required: true, message: "Vui lòng nhập nội dung." }]}
        >
          <Input.TextArea rows={4} />
        </Form.Item>

        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}
        >
          <Form.Item name="affectedArea" label="Khu vực ảnh hưởng">
            <Input />
          </Form.Item>
          <Form.Item name="affectedProducts" label="Sản phẩm liên quan">
            <Input />
          </Form.Item>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: 16,
          }}
        >
          <Form.Item name="reporterName" label="Người báo cáo">
            <Input maxLength={200} />
          </Form.Item>
          <Form.Item name="reporterPhone" label="SĐT người báo cáo">
            <Input maxLength={20} />
          </Form.Item>
          <Form.Item name="reporterEmail" label="Email người báo cáo">
            <Input maxLength={200} />
          </Form.Item>
        </div>
      </Form>
    </Modal>
  );
}
