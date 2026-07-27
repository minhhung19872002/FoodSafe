import { useEffect } from "react";
import { DatePicker, Form, Input, Modal, Select } from "antd";
import dayjs, { type Dayjs } from "dayjs";
import type {
  BusinessOption,
  ProductOption,
  SelfDeclaration,
  SelfDeclarationInput,
} from "../types/selfDeclaration.types";

interface FormValues {
  businessId: string;
  productId?: string;
  declarationNumber: string;
  declarationDate: Dayjs;
  productName: string;
  manufacturer?: string;
  purpose?: string;
  expiryDate?: Dayjs;
  notes?: string;
}

interface Props {
  open: boolean;
  declaration?: SelfDeclaration;
  businesses: BusinessOption[];
  products: ProductOption[];
  productsLoading: boolean;
  saving: boolean;
  onBusinessChange: (businessId?: string) => void;
  onCancel: () => void;
  onSubmit: (input: SelfDeclarationInput) => void;
}

export function SelfDeclarationEditorModal(props: Props) {
  const [form] = Form.useForm<FormValues>();
  const businessId = Form.useWatch("businessId", form);
  const { open, declaration, onBusinessChange } = props;

  useEffect(() => {
    if (!open) return;
    const item = declaration;
    form.setFieldsValue(
      item
        ? {
            businessId: item.businessId,
            productId: item.productId,
            declarationNumber: item.declarationNumber,
            declarationDate: dayjs(item.declarationDate),
            productName: item.productName,
            manufacturer: item.manufacturer,
            purpose: item.purpose,
            expiryDate: item.expiryDate ? dayjs(item.expiryDate) : undefined,
            notes: item.notes,
          }
        : {
            declarationDate: dayjs(),
          },
    );
    onBusinessChange(item?.businessId);
  }, [form, open, declaration, onBusinessChange]);

  return (
    <Modal
      open={props.open}
      title={
        props.declaration
          ? "Cập nhật hồ sơ tự công bố"
          : "Thêm hồ sơ tự công bố"
      }
      width={760}
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
            businessId: values.businessId,
            productId: values.productId,
            declarationNumber: values.declarationNumber.trim(),
            declarationDate: values.declarationDate.format("YYYY-MM-DD"),
            productName: values.productName.trim(),
            manufacturer: values.manufacturer?.trim() || undefined,
            purpose: values.purpose?.trim() || undefined,
            expiryDate: values.expiryDate?.format("YYYY-MM-DD"),
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
            placeholder="Chọn cơ sở"
            options={props.businesses.map((item) => ({
              value: item.id,
              label: item.code ? `${item.code} — ${item.name}` : item.name,
            }))}
            onChange={(value) => {
              form.setFieldValue("productId", undefined);
              props.onBusinessChange(value);
            }}
          />
        </Form.Item>
        <Form.Item name="productId" label="Sản phẩm liên kết">
          <Select
            allowClear
            showSearch
            optionFilterProp="label"
            disabled={!businessId}
            loading={props.productsLoading}
            placeholder="Không bắt buộc"
            options={props.products.map((item) => ({
              value: item.id,
              label: item.code ? `${item.code} — ${item.name}` : item.name,
            }))}
            onChange={(value) => {
              const product = props.products.find((item) => item.id === value);
              if (product) form.setFieldValue("productName", product.name);
            }}
          />
        </Form.Item>
        <Form.Item
          name="declarationNumber"
          label="Số hồ sơ tự công bố"
          rules={[
            { required: true, message: "Vui lòng nhập số hồ sơ." },
            { max: 100 },
          ]}
        >
          <Input autoComplete="off" />
        </Form.Item>
        <Form.Item
          name="declarationDate"
          label="Ngày công bố"
          rules={[{ required: true, message: "Vui lòng chọn ngày." }]}
        >
          <DatePicker format="DD/MM/YYYY" style={{ width: "100%" }} />
        </Form.Item>
        <Form.Item
          name="productName"
          label="Tên sản phẩm công bố"
          rules={[
            { required: true, message: "Vui lòng nhập tên sản phẩm." },
            { max: 500 },
          ]}
        >
          <Input />
        </Form.Item>
        <Form.Item name="manufacturer" label="Nhà sản xuất">
          <Input maxLength={300} />
        </Form.Item>
        <Form.Item name="purpose" label="Mục đích sử dụng">
          <Input maxLength={200} />
        </Form.Item>
        <Form.Item
          name="expiryDate"
          label="Ngày hết hạn"
          dependencies={["declarationDate"]}
          rules={[
            ({ getFieldValue }) => ({
              validator(_, value?: Dayjs) {
                const declarationDate = getFieldValue("declarationDate") as
                  Dayjs | undefined;
                if (
                  !value ||
                  !declarationDate ||
                  !value.isBefore(declarationDate, "day")
                )
                  return Promise.resolve();
                return Promise.reject(
                  new Error("Ngày hết hạn không được trước ngày công bố."),
                );
              },
            }),
          ]}
        >
          <DatePicker format="DD/MM/YYYY" style={{ width: "100%" }} />
        </Form.Item>
        <Form.Item name="notes" label="Ghi chú">
          <Input.TextArea rows={3} />
        </Form.Item>
      </Form>
    </Modal>
  );
}
