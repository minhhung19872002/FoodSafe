import { useEffect } from "react";
import {
  Button,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Space,
  Table,
} from "antd";
import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import dayjs, { type Dayjs } from "dayjs";
import type { ColumnsType } from "antd/es/table";
import {
  INSPECTION_PLAN_TYPE,
  INSPECTION_PLAN_TYPE_LABELS,
  type BusinessOption,
  type CreateUpdateInspectionPlanInput,
  type CreateUpdatePlanItemInput,
  type InspectionPlan,
  type InspectionPlanType,
} from "../types/inspection.types";

interface FormValues {
  planCode: string;
  title: string;
  planType: InspectionPlanType;
  year: number;
  startDate?: Dayjs;
  endDate?: Dayjs;
  description?: string;
  objectives?: string;
}

interface ItemRow {
  key: string;
  businessId: string;
  sequenceNumber: number;
  plannedDate?: string;
  notes?: string;
}

interface Props {
  open: boolean;
  item?: InspectionPlan;
  businesses: BusinessOption[];
  saving: boolean;
  onCancel: () => void;
  onSubmit: (input: CreateUpdateInspectionPlanInput) => void;
}

export function InspectionPlanEditorModal(props: Props) {
  const [form] = Form.useForm<FormValues>();
  const [itemsForm] = Form.useForm<{ items: ItemRow[] }>();
  const { open, item } = props;

  useEffect(() => {
    if (!open) return;
    if (item) {
      form.setFieldsValue({
        planCode: item.planCode,
        title: item.title,
        planType: item.planType,
        year: item.year,
        startDate: item.startDate ? dayjs(item.startDate) : undefined,
        endDate: item.endDate ? dayjs(item.endDate) : undefined,
        description: item.description,
        objectives: item.objectives,
      });
      itemsForm.setFieldsValue({
        items: item.items.map((i) => ({
          key: i.id,
          businessId: i.businessId,
          sequenceNumber: i.sequenceNumber,
          plannedDate: i.plannedDate,
          notes: i.notes,
        })),
      });
    } else {
      form.setFieldsValue({
        year: new Date().getFullYear(),
        planType: INSPECTION_PLAN_TYPE.Annual,
      });
      itemsForm.setFieldsValue({ items: [] });
    }
  }, [form, itemsForm, open, item]);

  const handleSubmit = () => {
    form
      .validateFields()
      .then((values) => {
        const items: ItemRow[] = itemsForm.getFieldValue("items") ?? [];
        const planItems: CreateUpdatePlanItemInput[] = items.map((row, idx) => ({
          businessId: row.businessId,
          sequenceNumber: row.sequenceNumber ?? idx + 1,
          plannedDate: row.plannedDate,
          notes: row.notes,
        }));
        props.onSubmit({
          planCode: values.planCode.trim(),
          title: values.title.trim(),
          planType: values.planType,
          year: values.year,
          startDate: values.startDate?.format("YYYY-MM-DD"),
          endDate: values.endDate?.format("YYYY-MM-DD"),
          description: values.description?.trim() || undefined,
          objectives: values.objectives?.trim() || undefined,
          items: planItems,
        });
      })
      .catch(() => {});
  };

  return (
    <Modal
      open={open}
      title={item ? "Cập nhật kế hoạch" : "Tạo kế hoạch thanh kiểm tra"}
      width={960}
      okText="Lưu"
      cancelText="Hủy"
      confirmLoading={props.saving}
      onCancel={props.onCancel}
      onOk={handleSubmit}
      destroyOnHidden
    >
      <Form form={form} layout="vertical" preserve={false}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <Form.Item
            name="planCode"
            label="Mã kế hoạch"
            rules={[
              { required: true, message: "Vui lòng nhập mã kế hoạch." },
              { max: 50 },
            ]}
          >
            <Input autoComplete="off" />
          </Form.Item>
          <Form.Item
            name="title"
            label="Tên kế hoạch"
            rules={[
              { required: true, message: "Vui lòng nhập tên kế hoạch." },
              { max: 500 },
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="planType"
            label="Loại kế hoạch"
            rules={[{ required: true, message: "Vui lòng chọn loại." }]}
          >
            <Select
              options={Object.entries(INSPECTION_PLAN_TYPE_LABELS).map(
                ([value, label]) => ({
                  value: Number(value),
                  label,
                }),
              )}
            />
          </Form.Item>
          <Form.Item
            name="year"
            label="Năm"
            rules={[{ required: true, message: "Vui lòng nhập năm." }]}
          >
            <InputNumber min={2020} max={2099} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="startDate" label="Ngày bắt đầu">
            <DatePicker format="DD/MM/YYYY" style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item
            name="endDate"
            label="Ngày kết thúc"
            dependencies={["startDate"]}
            rules={[
              ({ getFieldValue }) => ({
                validator(_, value?: Dayjs) {
                  const start = getFieldValue("startDate") as Dayjs | undefined;
                  if (!value || !start || !value.isBefore(start, "day"))
                    return Promise.resolve();
                  return Promise.reject(
                    new Error("Ngày kết thúc không được trước ngày bắt đầu."),
                  );
                },
              }),
            ]}
          >
            <DatePicker format="DD/MM/YYYY" style={{ width: "100%" }} />
          </Form.Item>
        </div>
        <Form.Item name="description" label="Mô tả">
          <Input.TextArea rows={2} />
        </Form.Item>
        <Form.Item name="objectives" label="Mục tiêu">
          <Input.TextArea rows={2} />
        </Form.Item>
      </Form>

      <PlanItemsEditor
        businesses={props.businesses}
        form={itemsForm}
      />
    </Modal>
  );
}

function PlanItemsEditor({
  businesses,
  form,
}: {
  businesses: BusinessOption[];
  form: ReturnType<typeof Form.useForm<{ items: ItemRow[] }>>[0];
}) {
  const items: ItemRow[] = Form.useWatch("items", form) ?? [];

  const addItem = () => {
    const current = form.getFieldValue("items") ?? [];
    form.setFieldsValue({
      items: [
        ...current,
        {
          key: crypto.randomUUID(),
          businessId: "",
          sequenceNumber: current.length + 1,
        },
      ],
    });
  };

  const removeItem = (key: string) => {
    const current: ItemRow[] = form.getFieldValue("items") ?? [];
    form.setFieldsValue({
      items: current.filter((i) => i.key !== key),
    });
  };

  const updateItem = (key: string, field: string, value: unknown) => {
    const current: ItemRow[] = form.getFieldValue("items") ?? [];
    form.setFieldsValue({
      items: current.map((i) =>
        i.key === key ? { ...i, [field]: value } : i,
      ),
    });
  };

  const columns: ColumnsType<ItemRow> = [
    {
      title: "STT",
      dataIndex: "sequenceNumber",
      width: 65,
      render: (_, __, idx) => idx + 1,
    },
    {
      title: "Cơ sở SXKD",
      dataIndex: "businessId",
      render: (value: string, row) => (
        <Select
          showSearch
          optionFilterProp="label"
          value={value || undefined}
          style={{ width: "100%" }}
          placeholder="Chọn cơ sở"
          options={businesses.map((x) => ({
            value: x.id,
            label: x.code ? `${x.code} — ${x.name}` : x.name,
          }))}
          onChange={(v) => updateItem(row.key, "businessId", v)}
        />
      ),
    },
    {
      title: "Ghi chú",
      dataIndex: "notes",
      width: 200,
      render: (value: string | undefined, row) => (
        <Input
          value={value}
          placeholder="Ghi chú"
          onChange={(e) => updateItem(row.key, "notes", e.target.value)}
        />
      ),
    },
    {
      title: "",
      width: 50,
      render: (_, row) => (
        <Button
          type="text"
          danger
          size="small"
          icon={<DeleteOutlined />}
          onClick={() => removeItem(row.key)}
        />
      ),
    },
  ];

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 8,
        }}
      >
        <strong>Danh sách cơ sở kiểm tra</strong>
        <Button
          size="small"
          type="dashed"
          icon={<PlusOutlined />}
          onClick={addItem}
        >
          Thêm cơ sở
        </Button>
      </div>
      <Table
        size="small"
        rowKey="key"
        columns={columns}
        dataSource={items}
        pagination={false}
        locale={{ emptyText: "Chưa có cơ sở nào" }}
      />
    </div>
  );
}
