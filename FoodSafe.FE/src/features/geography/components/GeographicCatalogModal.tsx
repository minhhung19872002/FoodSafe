import { useEffect } from "react";
import { Form, Input, Modal, Select, Switch } from "antd";
import type {
  CommuneItem,
  GeographicItem,
  GeographicUpsert,
} from "@/lib/geographyApi";

export type GeographicKind = "province" | "commune";

type EditableItem = GeographicItem | CommuneItem;

interface FormValues {
  code: string;
  name: string;
  type?: number;
  isActive: boolean;
}

interface Props {
  open: boolean;
  kind: GeographicKind;
  item?: EditableItem;
  provinceId?: string;
  provinceName?: string;
  submitting: boolean;
  onCancel: () => void;
  onSubmit: (input: GeographicUpsert) => void;
}

const labels: Record<GeographicKind, string> = {
  province: "tỉnh/thành phố",
  commune: "xã/phường",
};

// Thị trấn (3) không còn là loại ĐVHC hợp lệ sau 01/07/2025 (Luật 72/2025/QH15)
// nên không cho tạo mới; bản ghi cũ vẫn hiển thị qua communeTypes map.
const communeTypeOptions = [
  { value: 1, label: "Xã" },
  { value: 2, label: "Phường" },
  { value: 4, label: "Đặc khu" },
];

export function GeographicCatalogModal({
  open,
  kind,
  item,
  provinceId,
  provinceName,
  submitting,
  onCancel,
  onSubmit,
}: Props) {
  const [form] = Form.useForm<FormValues>();

  useEffect(() => {
    if (!open) {
      return;
    }

    form.setFieldsValue({
      code: item?.code ?? "",
      name: item?.name ?? "",
      type: "type" in (item ?? {}) ? (item as CommuneItem).type : undefined,
      isActive: item?.isActive ?? true,
    });
  }, [form, item, open]);

  const submit = (values: FormValues) => {
    onSubmit({
      ...values,
      code: values.code.trim(),
      name: values.name.trim(),
      ...(kind === "commune" ? { provinceId } : {}),
    });
  };

  return (
    <Modal
      open={open}
      title={`${item ? "Sửa" : "Thêm"} ${labels[kind]}`}
      okText="Lưu"
      cancelText="Hủy"
      confirmLoading={submitting}
      onCancel={onCancel}
      onOk={() => form.submit()}
      destroyOnHidden
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={submit}
        initialValues={{ isActive: true }}
      >
        <Form.Item
          name="code"
          label="Mã"
          rules={[
            { required: true, message: "Vui lòng nhập mã" },
            { max: 10, message: "Mã tối đa 10 ký tự" },
          ]}
        >
          <Input autoFocus />
        </Form.Item>
        <Form.Item
          name="name"
          label="Tên"
          rules={[
            { required: true, message: "Vui lòng nhập tên" },
            { max: 200, message: "Tên tối đa 200 ký tự" },
          ]}
        >
          <Input />
        </Form.Item>
        {kind === "commune" && (
          <>
            <Form.Item label="Thuộc tỉnh/thành phố">
              <Input value={provinceName ?? ""} disabled />
            </Form.Item>
            <Form.Item
              name="type"
              label="Loại địa bàn"
              rules={[
                { required: true, message: "Vui lòng chọn loại địa bàn" },
              ]}
            >
              <Select options={communeTypeOptions} />
            </Form.Item>
          </>
        )}
        <Form.Item name="isActive" label="Trạng thái" valuePropName="checked">
          <Switch
            checkedChildren="Hoạt động"
            unCheckedChildren="Ngừng hoạt động"
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}
