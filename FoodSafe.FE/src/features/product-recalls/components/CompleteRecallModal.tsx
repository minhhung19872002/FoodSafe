import { DatePicker, Form, Modal, Select, Input } from "antd";
import dayjs, { type Dayjs } from "dayjs";
import {
  POST_RECALL_ACTION_OPTIONS,
  type CompleteRecallInput,
  type PostRecallAction,
  type ProductRecall,
} from "../types/productRecall.types";

interface FormValues {
  postRecallAction: PostRecallAction;
  completedDate: Dayjs;
  actionDescription?: string;
}

interface Props {
  recall?: ProductRecall;
  confirmLoading: boolean;
  onCancel: () => void;
  onConfirm: (input: CompleteRecallInput) => void;
}

/**
 * Completion modal: the post-recall handling method (Circular 23/2018/TT-BYT)
 * is mandatory before a recall can be marked as completed.
 */
export function CompleteRecallModal(props: Props) {
  const [form] = Form.useForm<FormValues>();

  return (
    <Modal
      open={Boolean(props.recall)}
      title={`Hoàn thành thu hồi: ${props.recall?.productName ?? ""}`}
      okText="Hoàn thành"
      cancelText="Hủy"
      confirmLoading={props.confirmLoading}
      onCancel={props.onCancel}
      onOk={() => form.submit()}
      destroyOnHidden
    >
      <Form
        key={props.recall?.id ?? "none"}
        form={form}
        layout="vertical"
        initialValues={{ completedDate: dayjs() }}
        preserve={false}
        onFinish={(values) =>
          props.onConfirm({
            postRecallAction: values.postRecallAction,
            completedDate: values.completedDate.format("YYYY-MM-DD"),
            actionDescription: values.actionDescription?.trim() || undefined,
          })
        }
      >
        <Form.Item
          name="postRecallAction"
          label="Biện pháp xử lý sau thu hồi"
          rules={[
            { required: true, message: "Vui lòng chọn biện pháp xử lý." },
          ]}
        >
          <Select
            placeholder="Chọn biện pháp xử lý"
            options={[...POST_RECALL_ACTION_OPTIONS]}
          />
        </Form.Item>
        <Form.Item
          name="completedDate"
          label="Ngày hoàn thành"
          rules={[{ required: true, message: "Vui lòng chọn ngày hoàn thành." }]}
        >
          <DatePicker format="DD/MM/YYYY" style={{ width: "100%" }} />
        </Form.Item>
        <Form.Item name="actionDescription" label="Mô tả biện pháp xử lý">
          <Input.TextArea rows={3} showCount maxLength={2000} />
        </Form.Item>
      </Form>
    </Modal>
  );
}
