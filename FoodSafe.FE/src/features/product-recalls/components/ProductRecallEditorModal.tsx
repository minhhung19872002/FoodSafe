import { DatePicker, Form, Input, InputNumber, Modal, Select } from "antd";
import dayjs, { type Dayjs } from "dayjs";
import {
  RECALL_TYPE,
  RECALL_TYPE_OPTIONS,
  type BusinessOption,
  type ProductRecall,
  type ProductRecallInput,
  type RecallType,
} from "../types/productRecall.types";

interface FormValues {
  businessId: string;
  productName: string;
  batchInfo?: string;
  recallType: RecallType;
  reason: string;
  decisionNumber?: string;
  decisionDate?: Dayjs;
  startDate: Dayjs;
  quantityRecalled?: number;
  quantityUnit?: string;
}

interface Props {
  open: boolean;
  recall?: ProductRecall;
  businesses: BusinessOption[];
  businessesLoading: boolean;
  saving: boolean;
  onCancel: () => void;
  onSubmit: (input: ProductRecallInput) => void;
}

export function ProductRecallEditorModal(props: Props) {
  const [form] = Form.useForm<FormValues>();
  const recallType = Form.useWatch("recallType", form);
  const { recall } = props;

  // Options only contain active businesses (max 500); when editing a recall of
  // a business outside that list the name must still be shown, not the GUID.
  const businessOptions =
    recall && !props.businesses.some((item) => item.id === recall.businessId)
      ? [{ id: recall.businessId, name: recall.businessName }, ...props.businesses]
      : props.businesses;

  const initialValues: Partial<FormValues> = recall
    ? {
        businessId: recall.businessId,
        productName: recall.productName,
        batchInfo: recall.batchInfo,
        recallType: recall.recallType,
        reason: recall.reason,
        decisionNumber: recall.decisionNumber,
        decisionDate: recall.decisionDate
          ? dayjs(recall.decisionDate)
          : undefined,
        startDate: dayjs(recall.startDate),
        quantityRecalled: recall.quantityRecalled,
        quantityUnit: recall.quantityUnit,
      }
    : { recallType: RECALL_TYPE.Voluntary, startDate: dayjs() };

  return (
    <Modal
      open={props.open}
      title={
        recall ? "Cập nhật hồ sơ thu hồi sản phẩm" : "Thêm hồ sơ thu hồi sản phẩm"
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
        // Remount per edited record so `initialValues` are re-applied when the
        // modal opens for another record before the old content is destroyed.
        key={recall?.id ?? "new"}
        form={form}
        layout="vertical"
        initialValues={initialValues}
        preserve={false}
        onFinish={(values) =>
          props.onSubmit({
            businessId: values.businessId,
            productId: recall?.productId,
            productName: values.productName.trim(),
            batchInfo: values.batchInfo?.trim() || undefined,
            recallType: values.recallType,
            reason: values.reason.trim(),
            decisionNumber: values.decisionNumber?.trim() || undefined,
            decisionDate: values.decisionDate?.format("YYYY-MM-DD"),
            startDate: values.startDate.format("YYYY-MM-DD"),
            quantityRecalled: values.quantityRecalled ?? undefined,
            quantityUnit: values.quantityUnit?.trim() || undefined,
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
            disabled={Boolean(recall)}
            loading={props.businessesLoading}
            options={businessOptions.map((item) => ({
              value: item.id,
              label: item.code ? `${item.code} — ${item.name}` : item.name,
            }))}
          />
        </Form.Item>
        <Form.Item
          name="productName"
          label="Tên sản phẩm thu hồi"
          rules={[
            { required: true, message: "Vui lòng nhập tên sản phẩm." },
            { max: 500 },
          ]}
        >
          <Input />
        </Form.Item>
        <Form.Item name="batchInfo" label="Số lô / hạn dùng">
          <Input maxLength={300} placeholder="VD: Lô 012024, HSD 31/12/2026" />
        </Form.Item>
        <Form.Item
          name="recallType"
          label="Hình thức thu hồi"
          rules={[{ required: true, message: "Vui lòng chọn hình thức." }]}
        >
          <Select options={[...RECALL_TYPE_OPTIONS]} />
        </Form.Item>
        <Form.Item
          name="decisionNumber"
          label="Số quyết định thu hồi"
          dependencies={["recallType"]}
          rules={[
            {
              required: recallType === RECALL_TYPE.Mandatory,
              message: "Thu hồi bắt buộc phải có số quyết định.",
            },
            { max: 100 },
          ]}
        >
          <Input autoComplete="off" />
        </Form.Item>
        <Form.Item name="decisionDate" label="Ngày quyết định">
          <DatePicker format="DD/MM/YYYY" style={{ width: "100%" }} />
        </Form.Item>
        <Form.Item
          name="reason"
          label="Lý do thu hồi"
          rules={[
            { required: true, message: "Vui lòng nhập lý do thu hồi." },
            { max: 2000 },
          ]}
        >
          <Input.TextArea rows={3} showCount maxLength={2000} />
        </Form.Item>
        <Form.Item
          name="startDate"
          label="Ngày bắt đầu thu hồi"
          rules={[{ required: true, message: "Vui lòng chọn ngày bắt đầu." }]}
        >
          <DatePicker format="DD/MM/YYYY" style={{ width: "100%" }} />
        </Form.Item>
        <Form.Item name="quantityRecalled" label="Số lượng thu hồi">
          <InputNumber min={0} style={{ width: "100%" }} />
        </Form.Item>
        <Form.Item name="quantityUnit" label="Đơn vị tính">
          <Input maxLength={50} placeholder="VD: hộp, chai, kg" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
