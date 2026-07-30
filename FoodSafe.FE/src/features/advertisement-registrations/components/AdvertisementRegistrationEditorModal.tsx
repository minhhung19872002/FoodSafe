import { useEffect } from "react";
import { DatePicker, Form, Input, Modal, Select } from "antd";
import dayjs, { type Dayjs } from "dayjs";
import type {
  AdvertisementRegistration,
  AdvertisementRegistrationInput,
  AdvertisementTypeOption,
  BusinessOption,
  ProductOption,
} from "../types/advertisementRegistration.types";

interface Values {
  businessId: string;
  advertisementTypeId?: string;
  productIds: string[];
  registrationNumber: string;
  registrationDate: Dayjs;
  expiryDate?: Dayjs;
  medium?: string;
  contentDescription?: string;
  notes?: string;
}

interface Props {
  open: boolean;
  item?: AdvertisementRegistration;
  defaultBusinessId?: string;
  businesses: BusinessOption[];
  products: ProductOption[];
  types: AdvertisementTypeOption[];
  productsLoading: boolean;
  saving: boolean;
  onBusinessChange: (id?: string) => void;
  onCancel: () => void;
  onSubmit: (input: AdvertisementRegistrationInput) => void;
}

export function AdvertisementRegistrationEditorModal(props: Props) {
  const [form] = Form.useForm<Values>();
  const businessId = Form.useWatch("businessId", form);
  const { open, item, onBusinessChange } = props;

  // Options chỉ chứa cơ sở Active (tối đa 500); khi sửa đăng ký của cơ sở
  // ngoài danh sách đó vẫn phải hiển thị tên thay vì GUID.
  const businessOptions =
    item && !props.businesses.some((x) => x.id === item.businessId)
      ? [{ id: item.businessId, name: item.businessName }, ...props.businesses]
      : props.businesses;
  const initialValues: Partial<Values> = item
    ? {
        businessId: item.businessId,
        advertisementTypeId: item.advertisementTypeId,
        productIds: item.products.map((x) => x.id),
        registrationNumber: item.registrationNumber,
        registrationDate: dayjs(item.registrationDate),
        expiryDate: item.expiryDate ? dayjs(item.expiryDate) : undefined,
        medium: item.medium,
        contentDescription: item.contentDescription,
        notes: item.notes,
      }
    : { registrationDate: dayjs(), productIds: [], businessId: props.defaultBusinessId };

  useEffect(() => {
    if (!open) return;
    onBusinessChange(item?.businessId ?? props.defaultBusinessId);
  }, [open, item, onBusinessChange]);

  return (
    <Modal
      open={open}
      title={
        item
          ? "Cập nhật đăng ký nội dung quảng cáo"
          : "Thêm đăng ký nội dung quảng cáo"
      }
      width={800}
      okText="Lưu"
      cancelText="Hủy"
      confirmLoading={props.saving}
      onCancel={props.onCancel}
      onOk={() => form.submit()}
      destroyOnHidden
    >
      <Form
        // Remount theo đăng ký đang sửa để `initialValues` được áp dụng lại khi
        // mở modal cho bản ghi khác trước lúc nội dung cũ bị destroy.
        key={item?.id ?? "new"}
        form={form}
        layout="vertical"
        initialValues={initialValues}
        preserve={false}
        onFinish={(values) =>
          props.onSubmit({
            businessId: values.businessId,
            advertisementTypeId: values.advertisementTypeId,
            productIds: values.productIds,
            registrationNumber: values.registrationNumber.trim(),
            registrationDate: values.registrationDate.format("YYYY-MM-DD"),
            expiryDate: values.expiryDate?.format("YYYY-MM-DD"),
            medium: values.medium?.trim() || undefined,
            contentDescription: values.contentDescription?.trim() || undefined,
            notes: values.notes?.trim() || undefined,
          })
        }
      >
        <Form.Item
          name="businessId"
          label="Cơ sở SXKD"
          rules={[{ required: true, message: "Vui lòng chọn cơ sở." }]}
        >
          <Select
            showSearch
            optionFilterProp="label"
            disabled={Boolean(item) || Boolean(props.defaultBusinessId)}
            options={businessOptions.map((x) => ({
              value: x.id,
              label: x.code ? `${x.code} — ${x.name}` : x.name,
            }))}
            onChange={(value) => {
              form.setFieldValue("productIds", []);
              props.onBusinessChange(value);
            }}
          />
        </Form.Item>
        <Form.Item
          name="productIds"
          label="Sản phẩm quảng cáo"
          rules={[
            {
              required: true,
              type: "array",
              min: 1,
              message: "Vui lòng chọn ít nhất một sản phẩm.",
            },
          ]}
        >
          <Select
            mode="multiple"
            showSearch
            optionFilterProp="label"
            disabled={!businessId}
            loading={props.productsLoading}
            options={props.products.map((x) => ({
              value: x.id,
              label: x.code ? `${x.code} — ${x.name}` : x.name,
            }))}
          />
        </Form.Item>
        <Form.Item name="advertisementTypeId" label="Loại hình quảng cáo">
          <Select
            allowClear
            showSearch
            optionFilterProp="label"
            options={props.types.map((x) => ({
              value: x.id,
              label: `${x.code} — ${x.name}`,
            }))}
          />
        </Form.Item>
        <Form.Item
          name="registrationNumber"
          label="Số đăng ký"
          rules={[
            { required: true, message: "Vui lòng nhập số đăng ký." },
            { max: 100 },
          ]}
        >
          <Input autoComplete="off" />
        </Form.Item>
        <Form.Item
          name="registrationDate"
          label="Ngày cấp"
          rules={[{ required: true, message: "Vui lòng chọn ngày cấp." }]}
        >
          <DatePicker format="DD/MM/YYYY" style={{ width: "100%" }} />
        </Form.Item>
        <Form.Item
          name="expiryDate"
          label="Ngày hết hạn"
          dependencies={["registrationDate"]}
          rules={[
            ({ getFieldValue }) => ({
              validator(_, value?: Dayjs) {
                const start = getFieldValue("registrationDate") as
                  Dayjs | undefined;
                if (!value || !start || !value.isBefore(start, "day"))
                  return Promise.resolve();
                return Promise.reject(
                  new Error("Ngày hết hạn không được trước ngày cấp."),
                );
              },
            }),
          ]}
        >
          <DatePicker format="DD/MM/YYYY" style={{ width: "100%" }} />
        </Form.Item>
        <Form.Item name="medium" label="Phương tiện quảng cáo">
          <Input maxLength={200} placeholder="TV, radio, báo điện tử..." />
        </Form.Item>
        <Form.Item name="contentDescription" label="Mô tả nội dung">
          <Input.TextArea rows={4} />
        </Form.Item>
        <Form.Item name="notes" label="Ghi chú">
          <Input.TextArea rows={2} />
        </Form.Item>
      </Form>
    </Modal>
  );
}
