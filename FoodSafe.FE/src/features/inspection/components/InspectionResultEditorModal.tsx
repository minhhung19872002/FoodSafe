import { useEffect } from "react";
import {
  Checkbox,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
} from "antd";
import dayjs, { type Dayjs } from "dayjs";
import {
  INSPECTION_OVERALL_RESULT,
  INSPECTION_OVERALL_RESULT_CONFIG,
  INSPECTION_TYPE,
  INSPECTION_TYPE_LABELS,
  type BusinessOption,
  type CreateUpdateInspectionResultInput,
  type InspectionOverallResult,
  type InspectionResult,
  type InspectionType,
} from "../types/inspection.types";

interface FormValues {
  businessId: string;
  inspectionDate: Dayjs;
  inspectionType: InspectionType;
  teamLeader?: string;
  teamMembersText?: string;
  overallResult: InspectionOverallResult;
  hasViolation: boolean;
  violationDescription?: string;
  fineAmount?: number;
  adminDecisionNumber?: string;
  adminDecisionDate?: Dayjs;
  followUpRequired: boolean;
  followUpDate?: Dayjs;
  recommendations?: string;
  notes?: string;
}

interface Props {
  open: boolean;
  item?: InspectionResult;
  businesses: BusinessOption[];
  saving: boolean;
  onCancel: () => void;
  onSubmit: (input: CreateUpdateInspectionResultInput) => void;
}

export function InspectionResultEditorModal(props: Props) {
  const [form] = Form.useForm<FormValues>();
  const { open, item } = props;

  useEffect(() => {
    if (!open) return;
    if (item) {
      form.setFieldsValue({
        businessId: item.businessId,
        inspectionDate: dayjs(item.inspectionDate),
        inspectionType: item.inspectionType,
        teamLeader: item.teamLeader,
        teamMembersText: item.teamMembersText,
        overallResult: item.overallResult,
        hasViolation: item.hasViolation,
        violationDescription: item.violationDescription,
        fineAmount: item.fineAmount,
        adminDecisionNumber: item.adminDecisionNumber,
        adminDecisionDate: item.adminDecisionDate
          ? dayjs(item.adminDecisionDate)
          : undefined,
        followUpRequired: item.followUpRequired,
        followUpDate: item.followUpDate ? dayjs(item.followUpDate) : undefined,
        recommendations: item.recommendations,
        notes: item.notes,
      });
    } else {
      form.setFieldsValue({
        inspectionDate: dayjs(),
        inspectionType: INSPECTION_TYPE.Scheduled,
        overallResult: INSPECTION_OVERALL_RESULT.Pass,
        hasViolation: false,
        followUpRequired: false,
      });
    }
  }, [form, open, item]);

  return (
    <Modal
      open={open}
      title={item ? "Cập nhật kết quả kiểm tra" : "Ghi nhận kết quả kiểm tra"}
      width={860}
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
            inspectionDate: values.inspectionDate.format("YYYY-MM-DD"),
            inspectionType: values.inspectionType,
            teamLeader: values.teamLeader?.trim() || undefined,
            teamMembersText: values.teamMembersText?.trim() || undefined,
            overallResult: values.overallResult,
            hasViolation: values.hasViolation,
            violationDescription:
              values.violationDescription?.trim() || undefined,
            fineAmount: values.fineAmount,
            adminDecisionNumber:
              values.adminDecisionNumber?.trim() || undefined,
            adminDecisionDate: values.adminDecisionDate?.format("YYYY-MM-DD"),
            followUpRequired: values.followUpRequired,
            followUpDate: values.followUpDate?.format("YYYY-MM-DD"),
            recommendations: values.recommendations?.trim() || undefined,
            notes: values.notes?.trim() || undefined,
            violations: [],
            inspectors: [],
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

        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}
        >
          <Form.Item
            name="inspectionDate"
            label="Ngày kiểm tra"
            rules={[{ required: true, message: "Vui lòng chọn ngày." }]}
          >
            <DatePicker format="DD/MM/YYYY" style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item
            name="inspectionType"
            label="Loại kiểm tra"
            rules={[{ required: true, message: "Vui lòng chọn loại." }]}
          >
            <Select
              options={Object.entries(INSPECTION_TYPE_LABELS).map(
                ([value, label]) => ({ value: Number(value), label }),
              )}
            />
          </Form.Item>
          <Form.Item name="teamLeader" label="Trưởng đoàn">
            <Input maxLength={200} />
          </Form.Item>
          <Form.Item
            name="overallResult"
            label="Kết quả chung"
            rules={[{ required: true }]}
          >
            <Select
              options={Object.entries(INSPECTION_OVERALL_RESULT_CONFIG).map(
                ([value, cfg]) => ({ value: Number(value), label: cfg.label }),
              )}
            />
          </Form.Item>
        </div>

        <Form.Item name="teamMembersText" label="Thành viên đoàn">
          <Input.TextArea rows={2} />
        </Form.Item>

        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}
        >
          <Form.Item name="hasViolation" valuePropName="checked">
            <Checkbox>Có vi phạm</Checkbox>
          </Form.Item>
          <Form.Item name="fineAmount" label="Số tiền phạt (VND)">
            <InputNumber
              min={0}
              style={{ width: "100%" }}
              formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
            />
          </Form.Item>
        </div>

        <Form.Item name="violationDescription" label="Mô tả vi phạm">
          <Input.TextArea rows={2} />
        </Form.Item>

        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}
        >
          <Form.Item name="adminDecisionNumber" label="Số QĐ xử phạt">
            <Input maxLength={100} />
          </Form.Item>
          <Form.Item name="adminDecisionDate" label="Ngày QĐ xử phạt">
            <DatePicker format="DD/MM/YYYY" style={{ width: "100%" }} />
          </Form.Item>
        </div>

        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}
        >
          <Form.Item name="followUpRequired" valuePropName="checked">
            <Checkbox>Yêu cầu tái kiểm tra</Checkbox>
          </Form.Item>
          <Form.Item name="followUpDate" label="Ngày tái kiểm tra">
            <DatePicker format="DD/MM/YYYY" style={{ width: "100%" }} />
          </Form.Item>
        </div>

        <Form.Item name="recommendations" label="Kiến nghị">
          <Input.TextArea rows={2} />
        </Form.Item>
        <Form.Item name="notes" label="Ghi chú">
          <Input.TextArea rows={2} />
        </Form.Item>
      </Form>
    </Modal>
  );
}
