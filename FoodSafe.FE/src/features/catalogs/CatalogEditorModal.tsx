import { useEffect } from "react";
import {
  DatePicker,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Switch,
} from "antd";
import dayjs from "dayjs";
import { useCommunes, useDistricts, useProvinces } from "@/hooks/useGeography";
import type { CatalogInput, CatalogItem, CatalogKind } from "./catalogApi";

interface Props {
  kind: CatalogKind;
  item?: CatalogItem;
  productGroups: CatalogItem[];
  testingCenters: CatalogItem[];
  open: boolean;
  saving: boolean;
  onCancel: () => void;
  onSave: (input: CatalogInput) => void;
}

export function CatalogEditorModal({
  kind,
  item,
  productGroups,
  testingCenters,
  open,
  saving,
  onCancel,
  onSave,
}: Props) {
  const [form] = Form.useForm<CatalogInput>();
  const provinceId = Form.useWatch("provinceId", form);
  const districtId = Form.useWatch("districtId", form);
  const provinces = useProvinces(true);
  const districts = useDistricts(provinceId ?? "", true);
  const communes = useCommunes(districtId ?? "", true);

  useEffect(() => {
    if (!open) return;
    form.setFieldsValue({
      code: "",
      name: "",
      description: "",
      isActive: true,
      sortOrder: 0,
      ...item,
      accreditationExpiresAt: item?.accreditationExpiresAt
        ? (dayjs(item.accreditationExpiresAt) as unknown as string)
        : undefined,
    });
  }, [form, item, open]);

  const submit = (values: CatalogInput) => {
    const expiry = values.accreditationExpiresAt as unknown;
    onSave({
      ...values,
      accreditationExpiresAt:
        expiry && typeof expiry === "object" && "toISOString" in expiry
          ? (expiry as { toISOString: () => string }).toISOString()
          : values.accreditationExpiresAt,
    });
  };

  return (
    <Modal
      title={`${item ? "Cập nhật" : "Thêm"} danh mục`}
      open={open}
      confirmLoading={saving}
      okText="Lưu"
      cancelText="Hủy"
      onCancel={onCancel}
      onOk={() => form.submit()}
      width={720}
      destroyOnHidden
    >
      <Form form={form} layout="vertical" onFinish={submit}>
        <Form.Item
          name="code"
          label={kind === "country" ? "Mã ISO Alpha-2" : "Mã"}
          rules={[
            { required: true },
            ...(kind === "country" ? [{ len: 2 }] : []),
          ]}
        >
          <Input maxLength={kind === "country" ? 2 : 50} />
        </Form.Item>
        {kind === "country" && (
          <>
            <Form.Item
              name="codeAlpha3"
              label="Mã ISO Alpha-3"
              rules={[{ len: 3 }]}
            >
              <Input maxLength={3} />
            </Form.Item>
            <Form.Item name="nameEn" label="Tên tiếng Anh">
              <Input maxLength={200} />
            </Form.Item>
          </>
        )}
        <Form.Item
          name="name"
          label={kind === "country" ? "Tên tiếng Việt" : "Tên"}
          rules={[{ required: true }]}
        >
          <Input maxLength={200} />
        </Form.Item>
        {kind !== "country" && (
          <Form.Item name="description" label="Mô tả">
            <Input.TextArea rows={2} maxLength={2000} />
          </Form.Item>
        )}
        {kind === "product-group" && (
          <>
            <Form.Item name="level" label="Cấp" rules={[{ required: true }]}>
              <Select
                options={[
                  { value: 1, label: "Cấp 1" },
                  { value: 2, label: "Cấp 2" },
                ]}
              />
            </Form.Item>
            <Form.Item noStyle shouldUpdate={(a, b) => a.level !== b.level}>
              {({ getFieldValue }) =>
                getFieldValue("level") === 2 && (
                  <Form.Item
                    name="parentId"
                    label="Nhóm cha"
                    rules={[{ required: true }]}
                  >
                    <Select
                      options={productGroups
                        .filter((x) => x.level === 1)
                        .map((x) => ({
                          value: x.id,
                          label: `${x.code} — ${x.name}`,
                        }))}
                    />
                  </Form.Item>
                )
              }
            </Form.Item>
          </>
        )}
        {kind === "business-classification" && (
          <>
            <Form.Item
              name="criteria"
              label="Tiêu chí phân loại"
              rules={[{ required: true }]}
            >
              <Input.TextArea rows={3} maxLength={2000} />
            </Form.Item>
            <Form.Item
              name="riskLevel"
              label="Mức rủi ro"
              rules={[{ required: true }]}
            >
              <Select
                options={[
                  { value: 1, label: "Cao" },
                  { value: 2, label: "Trung bình" },
                  { value: 3, label: "Thấp" },
                ]}
              />
            </Form.Item>
          </>
        )}
        {kind === "testing-center" && (
          <>
            <Form.Item
              name="address"
              label="Địa chỉ"
              rules={[{ required: true }]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              name="provinceId"
              label="Tỉnh/Thành phố"
              rules={[{ required: true }]}
            >
              <Select
                showSearch
                optionFilterProp="label"
                options={(provinces.data?.items ?? []).map((x) => ({
                  value: x.id,
                  label: x.name,
                }))}
              />
            </Form.Item>
            <Form.Item name="districtId" label="Huyện/Quận">
              <Select
                allowClear
                options={(districts.data?.items ?? []).map((x) => ({
                  value: x.id,
                  label: x.name,
                }))}
              />
            </Form.Item>
            <Form.Item name="communeId" label="Xã/Phường">
              <Select
                allowClear
                options={(communes.data?.items ?? []).map((x) => ({
                  value: x.id,
                  label: x.name,
                }))}
              />
            </Form.Item>
            <Form.Item name="contactPerson" label="Người liên hệ">
              <Input />
            </Form.Item>
            <Form.Item name="phone" label="Điện thoại">
              <Input />
            </Form.Item>
            <Form.Item name="email" label="Email" rules={[{ type: "email" }]}>
              <Input />
            </Form.Item>
            <Form.Item
              name="accreditationNumber"
              label="Số công nhận"
              rules={[{ required: true }]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              name="accreditationScope"
              label="Phạm vi công nhận"
              rules={[{ required: true }]}
            >
              <Input.TextArea />
            </Form.Item>
            <Form.Item
              name="accreditationExpiresAt"
              label="Ngày hết hạn"
              rules={[{ required: true }]}
            >
              <DatePicker />
            </Form.Item>
          </>
        )}
        {kind === "testing-service" && (
          <>
            <Form.Item
              name="testingCenterId"
              label="Trung tâm kiểm nghiệm"
              rules={[{ required: true }]}
            >
              <Select
                options={testingCenters.map((x) => ({
                  value: x.id,
                  label: `${x.code} — ${x.name}`,
                }))}
              />
            </Form.Item>
            <Form.Item name="unit" label="Đơn vị" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
            <Form.Item
              name="method"
              label="Phương pháp"
              rules={[{ required: true }]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              name="price"
              label="Đơn giá"
              rules={[{ required: true }]}
            >
              <InputNumber min={0} style={{ width: "100%" }} />
            </Form.Item>
            <Form.Item
              name="turnaroundDays"
              label="Thời gian trả kết quả (ngày)"
              rules={[{ required: true }]}
            >
              <InputNumber min={0} style={{ width: "100%" }} />
            </Form.Item>
          </>
        )}
        <Form.Item name="sortOrder" label="Thứ tự">
          <InputNumber style={{ width: "100%" }} />
        </Form.Item>
        <Form.Item name="isActive" label="Hoạt động" valuePropName="checked">
          <Switch />
        </Form.Item>
      </Form>
    </Modal>
  );
}
