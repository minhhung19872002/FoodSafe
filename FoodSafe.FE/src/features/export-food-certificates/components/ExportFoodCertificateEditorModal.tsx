import { useEffect } from "react";
import { Col, DatePicker, Form, Input, InputNumber, Modal, Row, Select } from "antd";
import dayjs, { type Dayjs } from "dayjs";
import type {
  BusinessOption,
  CountryOption,
  ProductOption,
  ExportFoodCertificate,
  ExportFoodCertificateInput,
} from "../types/exportFoodCertificate.types";

interface FormValues {
  businessId: string;
  productId?: string;
  destinationCountryId?: string;
  certificateNumber: string;
  issueDate: Dayjs;
  expiryDate?: Dayjs;
  notes?: string;
  lotNumber?: string;
  quantity?: number;
  quantityUnit?: string;
}

interface Props {
  open: boolean;
  registration?: ExportFoodCertificate;
  businesses: BusinessOption[];
  products: ProductOption[];
  countries: CountryOption[];
  productsLoading: boolean;
  saving: boolean;
  onBusinessChange: (businessId?: string) => void;
  onCancel: () => void;
  onSubmit: (input: ExportFoodCertificateInput) => void;
}

export function ExportFoodCertificateEditorModal(props: Props) {
  const [form] = Form.useForm<FormValues>();
  const businessId = Form.useWatch("businessId", form);
  const { open, registration, onBusinessChange } = props;

  useEffect(() => {
    if (!open) return;
    form.setFieldsValue(
      registration
        ? {
            businessId: registration.businessId,
            productId: registration.productId,
            destinationCountryId: registration.destinationCountryId,
            certificateNumber: registration.certificateNumber,
            issueDate: dayjs(registration.issueDate),
            expiryDate: registration.expiryDate
              ? dayjs(registration.expiryDate)
              : undefined,
            notes: registration.notes,
            lotNumber: registration.lotNumber,
            quantity: registration.quantity,
            quantityUnit: registration.quantityUnit,
          }
        : { issueDate: dayjs() },
    );
    onBusinessChange(registration?.businessId);
  }, [form, open, registration, onBusinessChange]);

  return (
    <Modal
      open={open}
      title={
        registration
          ? "Cập nhật GCN xuất khẩu"
          : "Thêm GCN xuất khẩu"
      }
      width={820}
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
            destinationCountryId: values.destinationCountryId || undefined,
            certificateNumber: values.certificateNumber.trim(),
            issueDate: values.issueDate.format("YYYY-MM-DD"),
            expiryDate: values.expiryDate?.format("YYYY-MM-DD"),
            notes: values.notes?.trim() || undefined,
            lotNumber: values.lotNumber?.trim() || undefined,
            quantity: values.quantity,
            quantityUnit: values.quantityUnit?.trim() || undefined,
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
                options={props.businesses.map((item) => ({
                  value: item.id,
                  label: item.code
                    ? `${item.code} — ${item.name}`
                    : item.name,
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
              label="Quốc gia đích"
            >
              <Select
                allowClear
                showSearch
                optionFilterProp="label"
                placeholder="Không bắt buộc"
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
              label="Số GCN XK"
              rules={[
                { required: true, message: "Vui lòng nhập số GCN xuất khẩu." },
              ]}
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
                      | Dayjs
                      | undefined;
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
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item name="lotNumber" label="Số lô">
              <Input maxLength={100} autoComplete="off" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="quantity"
              label="Số lượng"
              rules={[
                {
                  type: "number",
                  min: 0,
                  message: "Số lượng phải lớn hơn hoặc bằng 0.",
                },
              ]}
            >
              <InputNumber
                min={0}
                style={{ width: "100%" }}
                placeholder="Không bắt buộc"
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="quantityUnit" label="Đơn vị tính">
              <Input maxLength={50} autoComplete="off" />
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
