import { useEffect } from "react";
import {
  Button,
  Checkbox,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
} from "antd";
import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import dayjs, { type Dayjs } from "dayjs";
import {
  INSPECTION_OVERALL_RESULT,
  INSPECTION_OVERALL_RESULT_CONFIG,
  INSPECTION_TYPE,
  INSPECTION_TYPE_LABELS,
  type BusinessOption,
  type CreateUpdateInspectionResultInput,
  type InspectionOverallResult,
  type InspectionPlan,
  type InspectionResult,
  type InspectionType,
} from "../types/inspection.types";

interface ViolationFormValue {
  violationCode?: string;
  description: string;
  regulationReference?: string;
  fineAmount?: number;
  remedyRequired?: string;
  remedyDeadline?: Dayjs;
}

interface FormValues {
  planId?: string;
  planItemId?: string;
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
  violations?: ViolationFormValue[];
}

interface Props {
  open: boolean;
  item?: InspectionResult;
  businesses: BusinessOption[];
  plans: InspectionPlan[];
  saving: boolean;
  onCancel: () => void;
  onSubmit: (input: CreateUpdateInspectionResultInput) => void;
  /** Server-side search: options list is refetched with this filter. */
  onBusinessSearch?: (value: string) => void;
}

export function InspectionResultEditorModal(props: Props) {
  const [form] = Form.useForm<FormValues>();
  const { open, item } = props;
  const selectedPlanId = Form.useWatch("planId", form);
  const planItems =
    props.plans.find((p) => p.id === selectedPlanId)?.items ?? [];

  useEffect(() => {
    if (!open) return;
    if (item) {
      form.setFieldsValue({
        planId: item.planId,
        planItemId: item.planItemId,
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
        // The server replaces the whole violation set on update, so the form
        // must round-trip the existing rows — submitting an empty list here
        // silently destroyed every recorded violation.
        violations: item.violations.map((v) => ({
          violationCode: v.violationCode,
          description: v.description,
          regulationReference: v.regulationReference,
          fineAmount: v.fineAmount,
          remedyRequired: v.remedyRequired,
          remedyDeadline: v.remedyDeadline
            ? dayjs(v.remedyDeadline)
            : undefined,
        })),
      });
    } else {
      form.setFieldsValue({
        inspectionDate: dayjs(),
        inspectionType: INSPECTION_TYPE.Scheduled,
        overallResult: INSPECTION_OVERALL_RESULT.Pass,
        hasViolation: false,
        followUpRequired: false,
        violations: [],
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
            planId: values.planId || undefined,
            planItemId: values.planItemId || undefined,
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
            violations: (values.violations ?? []).map((v) => ({
              violationCode: v.violationCode?.trim() || undefined,
              description: v.description.trim(),
              regulationReference: v.regulationReference?.trim() || undefined,
              fineAmount: v.fineAmount,
              remedyRequired: v.remedyRequired?.trim() || undefined,
              remedyDeadline: v.remedyDeadline?.format("YYYY-MM-DD"),
            })),
            // The server only overwrites the inspector set when a non-empty
            // list arrives, so sending [] leaves the existing team intact.
            inspectors: [],
          })
        }
      >
        <Form.Item
          name="businessId"
          label="Cơ sở SXKD"
          rules={[{ required: true, message: "Vui lòng chọn cơ sở." }]}
          extra="Chọn kế hoạch bên dưới để ghi nhận kết quả này thuộc kế hoạch thanh tra."
        >
          <Select
            showSearch
            optionFilterProp="label"
            disabled={Boolean(item)}
            options={props.businesses.map((x) => ({
              value: x.id,
              label: x.code ? `${x.code} — ${x.name}` : x.name,
            }))}
            onSearch={props.onBusinessSearch}
          />
        </Form.Item>

        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}
        >
          <Form.Item name="planId" label="Thuộc kế hoạch thanh tra">
            <Select
              allowClear
              showSearch
              optionFilterProp="label"
              placeholder="Không thuộc kế hoạch"
              onChange={() => form.setFieldValue("planItemId", undefined)}
              options={props.plans.map((p) => ({
                value: p.id,
                label: `${p.planCode} — ${p.title}`,
              }))}
            />
          </Form.Item>
          <Form.Item name="planItemId" label="Cơ sở trong kế hoạch">
            <Select
              allowClear
              showSearch
              optionFilterProp="label"
              disabled={!selectedPlanId}
              placeholder={
                selectedPlanId ? "Chọn cơ sở" : "Chọn kế hoạch trước"
              }
              options={planItems.map((it) => ({
                value: it.id,
                label: it.businessName ?? it.businessId,
              }))}
            />
          </Form.Item>
        </div>

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

        <Form.List name="violations">
          {(fields, { add, remove }) => (
            <div style={{ marginBottom: 16 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 8,
                }}
              >
                <span style={{ fontWeight: 500 }}>Vi phạm chi tiết</span>
                <Button
                  type="dashed"
                  size="small"
                  icon={<PlusOutlined />}
                  onClick={() => add({})}
                >
                  Thêm vi phạm
                </Button>
              </div>

              {fields.length === 0 ? (
                <div style={{ color: "rgba(0,0,0,0.45)" }}>
                  Chưa có vi phạm chi tiết nào.
                </div>
              ) : null}

              {fields.map((field) => (
                <div
                  key={field.key}
                  style={{
                    border: "1px solid #f0f0f0",
                    borderRadius: 8,
                    padding: 12,
                    marginBottom: 12,
                  }}
                >
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr auto",
                      gap: 12,
                    }}
                  >
                    <Form.Item
                      name={[field.name, "violationCode"]}
                      label="Mã vi phạm"
                    >
                      <Input maxLength={50} />
                    </Form.Item>
                    <Form.Item
                      name={[field.name, "regulationReference"]}
                      label="Căn cứ pháp lý"
                    >
                      <Input maxLength={200} />
                    </Form.Item>
                    <Form.Item label=" ">
                      <Button
                        danger
                        type="text"
                        icon={<DeleteOutlined />}
                        onClick={() => remove(field.name)}
                      >
                        Xóa
                      </Button>
                    </Form.Item>
                  </div>

                  <Form.Item
                    name={[field.name, "description"]}
                    label="Nội dung vi phạm"
                    rules={[
                      {
                        required: true,
                        message: "Vui lòng nhập nội dung vi phạm",
                      },
                    ]}
                  >
                    <Input.TextArea rows={2} />
                  </Form.Item>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 12,
                    }}
                  >
                    <Form.Item
                      name={[field.name, "fineAmount"]}
                      label="Tiền phạt (VNĐ)"
                    >
                      <InputNumber min={0} style={{ width: "100%" }} />
                    </Form.Item>
                    <Form.Item
                      name={[field.name, "remedyDeadline"]}
                      label="Hạn khắc phục"
                    >
                      <DatePicker
                        format="DD/MM/YYYY"
                        style={{ width: "100%" }}
                      />
                    </Form.Item>
                  </div>

                  <Form.Item
                    name={[field.name, "remedyRequired"]}
                    label="Biện pháp khắc phục yêu cầu"
                  >
                    <Input.TextArea rows={2} />
                  </Form.Item>
                </div>
              ))}
            </div>
          )}
        </Form.List>

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
