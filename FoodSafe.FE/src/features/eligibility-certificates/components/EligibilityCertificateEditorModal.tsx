import { useEffect } from "react";
import { DatePicker, Form, Input, Modal, Select } from "antd";
import dayjs, { type Dayjs } from "dayjs";
import type {
  BusinessOption,
  EligibilityCertificate,
  EligibilityCertificateInput,
} from "../types/eligibilityCertificate.types";

interface Values {
  businessId: string;
  certificateNumber: string;
  issueDate: Dayjs;
  expiryDate?: Dayjs;
  certifyingAuthority?: string;
  certificationScope?: string;
  notes?: string;
}

interface Props {
  open: boolean;
  item?: EligibilityCertificate;
  businesses: BusinessOption[];
  saving: boolean;
  onCancel: () => void;
  onSubmit: (input: EligibilityCertificateInput) => void;
}

export function EligibilityCertificateEditorModal(props: Props) {
  const [form] = Form.useForm<Values>();
  const { open, item } = props;
  useEffect(() => {
    if (!open) return;
    form.setFieldsValue(
      item
        ? {
            businessId: item.businessId,
            certificateNumber: item.certificateNumber,
            issueDate: dayjs(item.issueDate),
            expiryDate: item.expiryDate ? dayjs(item.expiryDate) : undefined,
            certifyingAuthority: item.certifyingAuthority,
            certificationScope: item.certificationScope,
            notes: item.notes,
          }
        : { issueDate: dayjs() },
    );
  }, [form, open, item]);

  return (
    <Modal
      open={open}
      title={
        item
          ? "Cập nhật giấy chứng nhận đủ điều kiện"
          : "Cấp giấy chứng nhận đủ điều kiện"
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
            certificateNumber: values.certificateNumber.trim(),
            issueDate: values.issueDate.format("YYYY-MM-DD"),
            expiryDate: values.expiryDate?.format("YYYY-MM-DD"),
            certifyingAuthority:
              values.certifyingAuthority?.trim() || undefined,
            certificationScope: values.certificationScope?.trim() || undefined,
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
            disabled={Boolean(item)}
            options={props.businesses.map((x) => ({
              value: x.id,
              label: x.code ? `${x.code} — ${x.name}` : x.name,
            }))}
          />
        </Form.Item>
        <Form.Item
          name="certificateNumber"
          label="Số giấy chứng nhận"
          rules={[
            { required: true, message: "Vui lòng nhập số giấy." },
            { max: 100 },
          ]}
        >
          <Input autoComplete="off" />
        </Form.Item>
        <Form.Item
          name="issueDate"
          label="Ngày cấp"
          rules={[{ required: true, message: "Vui lòng chọn ngày cấp." }]}
        >
          <DatePicker format="DD/MM/YYYY" style={{ width: "100%" }} />
        </Form.Item>
        <Form.Item
          name="expiryDate"
          label="Ngày hết hạn"
          dependencies={["issueDate"]}
          rules={[
            ({ getFieldValue }) => ({
              validator(_, value?: Dayjs) {
                const start = getFieldValue("issueDate") as Dayjs | undefined;
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
        <Form.Item name="certifyingAuthority" label="Cơ quan cấp">
          <Input maxLength={200} />
        </Form.Item>
        <Form.Item name="certificationScope" label="Phạm vi chứng nhận">
          <Input.TextArea rows={4} />
        </Form.Item>
        <Form.Item name="notes" label="Ghi chú">
          <Input.TextArea rows={2} />
        </Form.Item>
      </Form>
    </Modal>
  );
}
