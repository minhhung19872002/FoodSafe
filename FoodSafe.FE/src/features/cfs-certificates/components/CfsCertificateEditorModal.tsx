import { useEffect } from "react";
import { Col, DatePicker, Form, Input, Modal, Row, Select } from "antd";
import dayjs, { type Dayjs } from "dayjs";
import type {
  BusinessOption,
  CountryOption,
  ProductOption,
  CfsCertificate,
  CfsCertificateInput,
} from "../types/cfsCertificate.types";

interface FormValues {
  businessId: string;
  productId?: string;
  destinationCountryId: string;
  certificateNumber: string;
  issueDate: Dayjs;
  expiryDate?: Dayjs;
  certifyingAuthority?: string;
  notes?: string;
}

interface Props {
  open: boolean;
  registration?: CfsCertificate;
  businesses: BusinessOption[];
  products: ProductOption[];
  countries: CountryOption[];
  productsLoading: boolean;
  saving: boolean;
  onBusinessChange: (businessId?: string) => void;
  onCancel: () => void;
  onSubmit: (input: CfsCertificateInput) => void;
}

export function CfsCertificateEditorModal(props: Props) {
  const [form] = Form.useForm<FormValues>();
  const businessId = Form.useWatch("businessId", form);
  const { open, registration, onBusinessChange } = props;

  // Options chỉ chứa cơ sở Active (tối đa 500); khi sửa CFS của cơ sở ngoài
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
        destinationCountryId: registration.destinationCountryId,
        certificateNumber: registration.certificateNumber,
        issueDate: dayjs(registration.issueDate),
        expiryDate: registration.expiryDate
          ? dayjs(registration.expiryDate)
          : undefined,
        certifyingAuthority: registration.certifyingAuthority,
        notes: registration.notes,
      }
    : { issueDate: dayjs() };

  useEffect(() => {
    if (!open) return;
    onBusinessChange(registration?.businessId);
  }, [open, registration, onBusinessChange]);

  return (
    <Modal
      open={open}
      title={registration ? "Cập nhật giấy CFS" : "Thêm giấy CFS"}
      width={820}
      okText="Lưu"
      cancelText="Hủy"
      confirmLoading={props.saving}
      onCancel={props.onCancel}
      onOk={() => form.submit()}
      destroyOnHidden
    >
      <Form
        // Remount theo giấy CFS đang sửa để `initialValues` được áp dụng lại khi
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
            destinationCountryId: values.destinationCountryId,
            certificateNumber: values.certificateNumber.trim(),
            issueDate: values.issueDate.format("YYYY-MM-DD"),
            expiryDate: values.expiryDate?.format("YYYY-MM-DD"),
            certifyingAuthority:
              values.certifyingAuthority?.trim() || undefined,
            notes: values.notes?.trim() || undefined,
          })
        }
      >
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="businessId"
              label="Cơ sở SXKD"
              rules={[{ required: true, message: "Vui lòng chọn cơ sở." }]}
            >
              <Select
                showSearch
                optionFilterProp="label"
                disabled={Boolean(registration)}
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
          </Col>
          <Col span={12}>
            <Form.Item
              name="destinationCountryId"
              label="Quốc gia nhập khẩu"
              rules={[{ required: true, message: "Vui lòng chọn quốc gia." }]}
            >
              <Select
                showSearch
                optionFilterProp="label"
                options={props.countries.map((item) => ({
                  value: item.id,
                  label: `${item.code} — ${item.name}`,
                }))}
              />
            </Form.Item>
          </Col>
        </Row>
        <Form.Item name="productId" label="Sản phẩm">
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
          />
        </Form.Item>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="certificateNumber"
              label="Số CFS"
              rules={[{ required: true, message: "Vui lòng nhập số CFS." }]}
            >
              <Input maxLength={100} autoComplete="off" />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item
              name="issueDate"
              label="Ngày cấp"
              rules={[{ required: true, message: "Vui lòng chọn ngày cấp." }]}
            >
              <DatePicker format="DD/MM/YYYY" style={{ width: "100%" }} />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item
              name="expiryDate"
              label="Ngày hết hạn"
              dependencies={["issueDate"]}
              rules={[
                ({ getFieldValue }) => ({
                  validator(_, value?: Dayjs) {
                    const start = getFieldValue("issueDate") as
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
          </Col>
        </Row>
        <Form.Item name="certifyingAuthority" label="Cơ quan cấp">
          <Input maxLength={200} />
        </Form.Item>
        <Form.Item name="notes" label="Ghi chú">
          <Input.TextArea rows={3} />
        </Form.Item>
      </Form>
    </Modal>
  );
}
