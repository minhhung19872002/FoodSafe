import { useEffect } from "react";
import { Alert, Col, DatePicker, Form, Input, Modal, Row, Select } from "antd";
import dayjs, { type Dayjs } from "dayjs";
import type {
  BusinessOption,
  ProductOption,
  ProductRegistration,
  ProductRegistrationInput,
} from "../types/productRegistration.types";

interface FormValues {
  businessId: string;
  productId?: string;
  registrationNumber: string;
  receiptNumber?: string;
  registrationDate: Dayjs;
  receiptDate?: Dayjs;
  expiryDate?: Dayjs;
  productName: string;
  manufacturer?: string;
  certifyingAuthority?: string;
  notes?: string;
}

interface Props {
  open: boolean;
  registration?: ProductRegistration;
  defaultBusinessId?: string;
  businesses: BusinessOption[];
  products: ProductOption[];
  productsLoading: boolean;
  saving: boolean;
  onBusinessChange: (businessId?: string) => void;
  onCancel: () => void;
  onSubmit: (input: ProductRegistrationInput) => void;
}

export function ProductRegistrationEditorModal(props: Props) {
  const [form] = Form.useForm<FormValues>();
  const businessId = Form.useWatch("businessId", form);
  const { open, registration, onBusinessChange } = props;

  // Options chỉ chứa cơ sở Active (tối đa 500); khi sửa đăng ký của cơ sở ngoài
  // danh sách đó vẫn phải hiển thị tên thay vì GUID.
  const businessOptions =
    registration &&
    !props.businesses.some((item) => item.id === registration.businessId)
      ? [
          { id: registration.businessId, name: registration.businessName },
          ...props.businesses,
        ]
      : props.businesses;

  const initialValues: Partial<FormValues> = registration
    ? {
        businessId: registration.businessId,
        productId: registration.productId,
        registrationNumber: registration.registrationNumber,
        receiptNumber: registration.receiptNumber,
        registrationDate: dayjs(registration.registrationDate),
        receiptDate: registration.receiptDate
          ? dayjs(registration.receiptDate)
          : undefined,
        expiryDate: registration.expiryDate
          ? dayjs(registration.expiryDate)
          : undefined,
        productName: registration.productName,
        manufacturer: registration.manufacturer,
        certifyingAuthority: registration.certifyingAuthority,
        notes: registration.notes,
      }
    : { registrationDate: dayjs(), businessId: props.defaultBusinessId };

  useEffect(() => {
    if (!open) return;
    onBusinessChange(registration?.businessId ?? props.defaultBusinessId);
  }, [open, registration, onBusinessChange]);

  return (
    <Modal
      open={open}
      title={registration ? "Cập nhật đăng ký công bố" : "Thêm đăng ký công bố"}
      width={820}
      okText="Lưu"
      cancelText="Hủy"
      confirmLoading={props.saving}
      onCancel={props.onCancel}
      onOk={() => form.submit()}
      destroyOnHidden
    >
      {!registration && (
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
          message="Thẩm quyền tiếp nhận từ 01/7/2025 (Nghị định 148/2025/NĐ-CP)"
          description="Thực phẩm dinh dưỡng y học, thực phẩm dùng cho chế độ ăn đặc biệt, sản phẩm dinh dưỡng dùng cho trẻ đến 36 tháng tuổi: Sở Y tế giải quyết trong 7 ngày làm việc. Thực phẩm bảo vệ sức khỏe, phụ gia thực phẩm mới: Cục An toàn thực phẩm (Bộ Y tế), 21 ngày làm việc."
        />
      )}
      <Form
        // Remount theo đăng ký đang sửa để `initialValues` được áp dụng lại khi
        // mở modal cho bản ghi khác trước lúc nội dung cũ bị destroy.
        key={registration?.id ?? "new"}
        form={form}
        layout="vertical"
        initialValues={initialValues}
        preserve={false}
        onFinish={(values) =>
          props.onSubmit({
            businessId: values.businessId,
            productId: values.productId,
            registrationNumber: values.registrationNumber.trim(),
            receiptNumber: values.receiptNumber?.trim() || undefined,
            registrationDate: values.registrationDate.format("YYYY-MM-DD"),
            receiptDate: values.receiptDate?.format("YYYY-MM-DD"),
            expiryDate: values.expiryDate?.format("YYYY-MM-DD"),
            productName: values.productName.trim(),
            manufacturer: values.manufacturer?.trim() || undefined,
            certifyingAuthority:
              values.certifyingAuthority?.trim() || undefined,
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
            disabled={Boolean(registration) || Boolean(props.defaultBusinessId)}
            options={businessOptions.map((item) => ({
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
        <Row gutter={16}>
          <Col span={12}>
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
          </Col>
          <Col span={12}>
            <Form.Item name="receiptNumber" label="Số tiếp nhận">
              <Input maxLength={100} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="registrationDate"
              label="Ngày đăng ký"
              rules={[{ required: true, message: "Vui lòng chọn ngày." }]}
            >
              <DatePicker format="DD/MM/YYYY" style={{ width: "100%" }} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="receiptDate" label="Ngày tiếp nhận">
              <DatePicker format="DD/MM/YYYY" style={{ width: "100%" }} />
            </Form.Item>
          </Col>
          <Col span={8}>
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
                      new Error("Ngày hết hạn không được trước ngày đăng ký."),
                    );
                  },
                }),
              ]}
            >
              <DatePicker format="DD/MM/YYYY" style={{ width: "100%" }} />
            </Form.Item>
          </Col>
        </Row>
        <Form.Item
          name="productName"
          label="Tên sản phẩm"
          rules={[
            { required: true, message: "Vui lòng nhập tên sản phẩm." },
            { max: 500 },
          ]}
        >
          <Input />
        </Form.Item>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="manufacturer" label="Nhà sản xuất">
              <Input maxLength={300} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="certifyingAuthority" label="Cơ quan cấp">
              <Input maxLength={200} />
            </Form.Item>
          </Col>
        </Row>
        <Form.Item name="notes" label="Ghi chú">
          <Input.TextArea rows={3} />
        </Form.Item>
      </Form>
    </Modal>
  );
}
