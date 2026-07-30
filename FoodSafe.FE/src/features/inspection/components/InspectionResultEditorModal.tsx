import {
  Button,
  Checkbox,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  theme,
} from "antd";
import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import dayjs, { type Dayjs } from "dayjs";
import { useAdminUsers } from "@/features/identity/api/identityQueries";
import {
  INSPECTION_OVERALL_RESULT,
  INSPECTION_OVERALL_RESULT_CONFIG,
  INSPECTION_PLAN_ITEM_STATUS,
  INSPECTION_TYPE,
  INSPECTION_TYPE_LABELS,
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
  teamMembersText?: string | string[];
  overallResult: InspectionOverallResult;
  hasViolation: boolean;
  violationDescription?: string;
  fineAmount?: number;
  adminDecisionNumber?: string;
  adminDecisionDate?: Dayjs;
  followUpRequired: boolean;
  followUpDate?: Dayjs;
  followUpScope?: string;
  recommendations?: string;
  notes?: string;
  violations?: ViolationFormValue[];
}

interface Props {
  open: boolean;
  item?: InspectionResult;
  plans: InspectionPlan[];
  saving: boolean;
  onCancel: () => void;
  onSubmit: (input: CreateUpdateInspectionResultInput) => void;
}

const groupThousands = (value: string) =>
  value.replace(/\B(?=(\d{3})+(?!\d))/g, ",");

export function InspectionResultEditorModal(props: Props) {
  const [form] = Form.useForm<FormValues>();
  const { token } = theme.useToken();
  const { item } = props;

  const { data: usersData, isLoading: isLoadingUsers } = useAdminUsers({
    skipCount: 0,
    maxResultCount: 200,
  });

  const userOptions = (usersData?.items ?? []).map((u) => ({
    label: u.fullName ? `${u.fullName} (${u.userName})` : u.userName,
    value: u.fullName || u.userName, // use name as value because API expects string
  }));
  const selectedPlanId = Form.useWatch("planId", form);
  const hasViolation = Form.useWatch("hasViolation", form);
  const followUpRequired = Form.useWatch("followUpRequired", form);
  const selectedPlan = props.plans.find((p) => p.id === selectedPlanId);
  const planItems = selectedPlan?.items ?? [];

  const initialValues: Partial<FormValues> = item
    ? {
        planId: item.planId,
        planItemId: item.planItemId,
        businessId: item.businessId,
        inspectionDate: dayjs(item.inspectionDate),
        inspectionType: item.inspectionType,
        teamLeader: item.teamLeader,
        teamMembersText: item.teamMembersText
          ? item.teamMembersText.split(",").map((s) => s.trim())
          : [],
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
        followUpScope: item.followUpScope,
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
      }
    : {
        inspectionDate: dayjs(),
        inspectionType: INSPECTION_TYPE.Scheduled,
        overallResult: INSPECTION_OVERALL_RESULT.Pass,
        hasViolation: false,
        followUpRequired: false,
        violations: [],
      };

  return (
    <Modal
      open={props.open}
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
        // Remount theo kết quả đang sửa để `initialValues` được áp dụng lại khi
        // mở modal cho bản ghi khác trước lúc nội dung cũ bị destroy.
        key={item?.id ?? "new"}
        form={form}
        layout="vertical"
        initialValues={initialValues}
        preserve={false}
        onFinish={(values) =>
          props.onSubmit({
            planId: values.planId || undefined,
            planItemId: values.planItemId || undefined,
            businessId: values.businessId,
            inspectionDate: values.inspectionDate.format("YYYY-MM-DD"),
            inspectionType: values.inspectionType,
            teamLeader: values.teamLeader?.trim() || undefined,
            teamMembersText: Array.isArray(values.teamMembersText)
              ? values.teamMembersText.join(", ")
              : values.teamMembersText?.trim() || undefined,
            overallResult: values.overallResult,
            hasViolation: values.hasViolation,
            violationDescription:
              values.violationDescription?.trim() || undefined,
            fineAmount: values.hasViolation ? values.fineAmount : undefined,
            adminDecisionNumber:
              values.adminDecisionNumber?.trim() || undefined,
            adminDecisionDate: values.adminDecisionDate?.format("YYYY-MM-DD"),
            followUpRequired: values.followUpRequired,
            followUpDate: values.followUpRequired
              ? values.followUpDate?.format("YYYY-MM-DD")
              : undefined,
            followUpScope: values.followUpRequired
              ? values.followUpScope?.trim() || undefined
              : undefined,
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
        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}
        >
          <Form.Item
            name="planId"
            label="Thuộc kế hoạch thanh tra"
            rules={[
              { required: true, message: "Vui lòng chọn kế hoạch thanh tra." },
            ]}
            extra={
              item
                ? "Không thể đổi kế hoạch của kết quả đã ghi nhận."
                : undefined
            }
          >
            <Select
              showSearch
              optionFilterProp="label"
              disabled={Boolean(item)}
              placeholder="Chọn kế hoạch thanh tra"
              onChange={() => {
                form.setFieldValue("planItemId", undefined);
                form.setFieldValue("businessId", undefined);
              }}
              options={props.plans.map((p) => ({
                value: p.id,
                label: `${p.planCode} — ${p.title}`,
              }))}
            />
          </Form.Item>
          <Form.Item
            name="planItemId"
            label="Cơ sở trong kế hoạch"
            rules={[
              {
                required: true,
                message: "Vui lòng chọn cơ sở trong kế hoạch.",
              },
            ]}
          >
            <Select
              allowClear
              showSearch
              optionFilterProp="label"
              disabled={Boolean(item) || !selectedPlanId}
              placeholder={
                selectedPlanId ? "Chọn cơ sở" : "Chọn kế hoạch trước"
              }
              onChange={(planItemId?: string) => {
                const planItem = planItems.find((it) => it.id === planItemId);
                if (planItem)
                  form.setFieldValue("businessId", planItem.businessId);
              }}
              options={planItems.map((it) => {
                const isCompleted =
                  !item && it.status === INSPECTION_PLAN_ITEM_STATUS.Completed;
                return {
                  value: it.id,
                  label: isCompleted
                    ? `${it.businessName ?? it.businessId} (Đã có kết quả)`
                    : (it.businessName ?? it.businessId),
                  disabled: isCompleted,
                };
              })}
            />
          </Form.Item>
        </div>

        <Form.Item name="businessId" hidden>
          <Input />
        </Form.Item>

        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}
        >
          <Form.Item
            name="inspectionDate"
            label="Ngày kiểm tra"
            rules={[{ required: true, message: "Vui lòng chọn ngày." }]}
          >
            <DatePicker
              format="DD/MM/YYYY"
              style={{ width: "100%" }}
              disabledDate={(d) => d.isAfter(dayjs(), "day")}
            />
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
            <Select
              showSearch
              allowClear
              options={userOptions}
              loading={isLoadingUsers}
              optionFilterProp="label"
              placeholder="Chọn trưởng đoàn"
            />
          </Form.Item>
          <Form.Item
            name="overallResult"
            label="Kết quả chung"
            rules={[{ required: true, message: "Vui lòng chọn kết quả." }]}
          >
            <Select
              options={Object.entries(INSPECTION_OVERALL_RESULT_CONFIG).map(
                ([value, cfg]) => ({ value: Number(value), label: cfg.label }),
              )}
            />
          </Form.Item>
        </div>

        <Form.Item name="teamMembersText" label="Thành viên đoàn">
          <Select
            mode="multiple"
            allowClear
            options={userOptions}
            loading={isLoadingUsers}
            optionFilterProp="label"
            placeholder="Chọn thành viên đoàn"
          />
        </Form.Item>

        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}
        >
          <Form.Item
            name="hasViolation"
            valuePropName="checked"
            label=" "
            colon={false}
          >
            <Checkbox
              onChange={(event) => {
                if (!event.target.checked)
                  form.setFieldValue("fineAmount", undefined);
              }}
            >
              Có vi phạm
            </Checkbox>
          </Form.Item>
          <Form.Item
            name="fineAmount"
            label="Số tiền phạt (VND)"
            rules={
              hasViolation
                ? [
                    {
                      required: true,
                      message: "Vui lòng nhập số tiền phạt.",
                    },
                  ]
                : []
            }
          >
            <InputNumber<number>
              min={0}
              disabled={!hasViolation}
              style={{ width: "100%" }}
              formatter={(v) => groupThousands(`${v ?? ""}`)}
              parser={(v) => Number((v ?? "").replace(/,/g, ""))}
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
                <div style={{ color: token.colorTextTertiary }}>
                  Chưa có vi phạm chi tiết nào.
                </div>
              ) : null}

              {fields.map((field) => (
                <div
                  key={field.key}
                  style={{
                    border: `1px solid ${token.colorBorderSecondary}`,
                    borderRadius: token.borderRadiusLG,
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

                  <Form.Item
                    name={[field.name, "remedyDeadline"]}
                    label="Hạn khắc phục"
                  >
                    <DatePicker format="DD/MM/YYYY" style={{ width: "100%" }} />
                  </Form.Item>

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
          <Form.Item
            name="followUpRequired"
            valuePropName="checked"
            label=" "
            colon={false}
          >
            <Checkbox
              onChange={(e) => {
                if (!e.target.checked) {
                  form.setFieldValue("followUpDate", undefined);
                  form.setFieldValue("followUpScope", undefined);
                }
              }}
            >
              Yêu cầu tái kiểm tra
            </Checkbox>
          </Form.Item>
          <Form.Item
            name="followUpDate"
            label="Ngày tái kiểm tra"
            rules={
              followUpRequired
                ? [
                    {
                      required: true,
                      message: "Vui lòng chọn ngày tái kiểm tra.",
                    },
                  ]
                : []
            }
          >
            <DatePicker
              format="DD/MM/YYYY"
              style={{ width: "100%" }}
              disabled={!followUpRequired}
            />
          </Form.Item>
        </div>

        <Form.Item name="followUpScope" label="Phạm vi kiểm tra lại">
          <Input.TextArea
            rows={2}
            disabled={!followUpRequired}
            placeholder={
              followUpRequired ? "Nhập phạm vi kiểm tra lại" : undefined
            }
          />
        </Form.Item>

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
