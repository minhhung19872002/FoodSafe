import { useEffect } from "react";
import { Form, Input, InputNumber, Modal, Select, Switch } from "antd";
import type {
  CommuneItem,
  DistrictItem,
  GeographicItem,
  GeographicUpsert,
} from "@/lib/geographyApi";

export type GeographicKind = "province" | "district" | "commune";

type EditableItem = GeographicItem | DistrictItem | CommuneItem;

interface FormValues {
  code: string;
  name: string;
  type?: number;
  sortOrder: number;
  isActive: boolean;
}

interface Props {
  open: boolean;
  kind: GeographicKind;
  item?: EditableItem;
  parentId?: string;
  submitting: boolean;
  onCancel: () => void;
  onSubmit: (input: GeographicUpsert) => void;
}

const labels: Record<GeographicKind, string> = {
  province: "tỉnh/thành phố",
  district: "huyện/quận",
  commune: "xã/phường",
};

const typeOptions: Record<
  Exclude<GeographicKind, "province">,
  Array<{
    value: number;
    label: string;
  }>
> = {
  district: [
    { value: 1, label: "Huyện" },
    { value: 2, label: "Quận" },
    { value: 3, label: "Thị xã" },
    { value: 4, label: "Thành phố" },
  ],
  commune: [
    { value: 1, label: "Xã" },
    { value: 2, label: "Phường" },
    { value: 3, label: "Thị trấn" },
  ],
};

export function GeographicCatalogModal({
  open,
  kind,
  item,
  parentId,
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
      type:
        "type" in (item ?? {})
          ? (item as DistrictItem | CommuneItem).type
          : undefined,
      sortOrder: item?.sortOrder ?? 0,
      isActive: item?.isActive ?? true,
    });
  }, [form, item, open]);

  const submit = (values: FormValues) => {
    onSubmit({
      ...values,
      code: values.code.trim(),
      name: values.name.trim(),
      ...(kind === "district" ? { provinceId: parentId } : {}),
      ...(kind === "commune" ? { districtId: parentId } : {}),
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
        initialValues={{ sortOrder: 0, isActive: true }}
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
        {kind !== "province" && (
          <Form.Item
            name="type"
            label="Loại địa bàn"
            rules={[{ required: true, message: "Vui lòng chọn loại địa bàn" }]}
          >
            <Select options={typeOptions[kind]} />
          </Form.Item>
        )}
        <Form.Item name="sortOrder" label="Thứ tự">
          <InputNumber min={0} precision={0} style={{ width: "100%" }} />
        </Form.Item>
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
