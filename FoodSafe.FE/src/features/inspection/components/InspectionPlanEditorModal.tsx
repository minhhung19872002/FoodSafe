import { useEffect, useMemo, useState } from "react";
import {
  Button,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Table,
  theme,
} from "antd";
import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import dayjs, { type Dayjs } from "dayjs";
import type { ColumnsType } from "antd/es/table";
import { useCommunesByProvince, useProvinces } from "@/hooks/useGeography";
import { useOrganizationTree } from "@/features/organizations/api/organizationQueries";
import {
  INSPECTION_PLAN_TYPE,
  INSPECTION_PLAN_TYPE_LABELS,
  type BusinessOption,
  type CreateUpdateInspectionPlanInput,
  type CreateUpdatePlanItemInput,
  type InspectionPlan,
  type InspectionPlanType,
} from "../types/inspection.types";

import { useAuthStore } from "@/features/auth/store/authStore";

interface FormValues {
  planCode: string;
  title: string;
  planType: InspectionPlanType;
  year: number;
  provinceId?: string;
  communeId?: string;
  organizationId?: string;
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
  /** Server-side search: options list is refetched with this filter. */
  onBusinessSearch?: (value: string) => void;
  onLocationChange?: (location: {
    provinceId?: string;
    communeId?: string;
  }) => void;
}

function flattenOrganizations(
  items: any[] | undefined,
  depth = 0,
): { value: string; label: string }[] {
  if (!items || !Array.isArray(items)) return [];
  return items.flatMap((item) => [
    {
      value: item.id,
      label: `${"\u00a0".repeat(depth * 3)}${item.code ? `${item.code} — ` : ""}${item.name}`,
    },
    ...flattenOrganizations(item.children || [], depth + 1),
  ]);
}

export function InspectionPlanEditorModal(props: Props) {
  const [form] = Form.useForm<FormValues>();
  const [items, setItems] = useState<ItemRow[]>([]);
  const [itemsError, setItemsError] = useState<string>();
  const { open, item } = props;

  const hasPermission = useAuthStore((s) => s.hasPermission);
  const canViewOrgs = hasPermission("FoodSafe.Organizations.View");

  const selectedProvinceId = Form.useWatch("provinceId", form);
  const selectedCommuneId = Form.useWatch("communeId", form);
  const selectedPlanType = Form.useWatch("planType", form);

  const provinces = useProvinces(true);
  const communes = useCommunesByProvince(selectedProvinceId ?? "", true);
  const { data: organizationTree } = useOrganizationTree({
    enabled: canViewOrgs,
  });

  const flatOrganizations = useMemo(
    () => flattenOrganizations(organizationTree?.items),
    [organizationTree],
  );

  const initialValues: Partial<FormValues> = item
    ? {
        planCode: item.planCode,
        title: item.title,
        planType: item.planType,
        year: item.year,
        provinceId: item.provinceId,
        communeId: item.communeId,
        organizationId: item.organizationId,
        startDate: item.startDate ? dayjs(item.startDate) : undefined,
        endDate: item.endDate ? dayjs(item.endDate) : undefined,
        description: item.description,
        objectives: item.objectives,
      }
    : {
        year: new Date().getFullYear(),
        planType: INSPECTION_PLAN_TYPE.Annual,
      };

  // `items` backs the PlanItemsEditor table, a plain React state outside the
  // AntD Form — it doesn't need the Form's key-remount trick to stay in sync.
  useEffect(() => {
    if (!open) return;
    setItemsError(undefined);
    setItems(
      item
        ? item.items.map((i) => ({
            key: i.id,
            businessId: i.businessId,
            sequenceNumber: i.sequenceNumber,
            plannedDate: i.plannedDate,
            notes: i.notes,
          }))
        : [],
    );
  }, [open, item]);

  useEffect(() => {
    if (open) {
      props.onLocationChange?.({
        provinceId: selectedProvinceId,
        communeId: selectedCommuneId,
      });
    }
  }, [selectedProvinceId, selectedCommuneId, open]);

  const validateItems = (): boolean => {
    if (items.some((row) => !row.businessId)) {
      setItemsError("Vui lòng chọn cơ sở cho tất cả các dòng.");
      return false;
    }
    const uniqueBusinessIds = new Set(items.map((row) => row.businessId));
    if (uniqueBusinessIds.size < items.length) {
      setItemsError("Cơ sở bị trùng trong danh sách.");
      return false;
    }
    setItemsError(undefined);
    return true;
  };

  const handleSubmit = () => {
    form
      .validateFields()
      .then((values) => {
        if (!validateItems()) return;
        const planItems: CreateUpdatePlanItemInput[] = items.map(
          (row, idx) => ({
            businessId: row.businessId,
            sequenceNumber: row.sequenceNumber ?? idx + 1,
            plannedDate: row.plannedDate,
            notes: row.notes,
          }),
        );
        props.onSubmit({
          planCode: values.planCode.trim(),
          title: values.title.trim(),
          planType: values.planType,
          year: values.year,
          provinceId: values.provinceId || undefined,
          communeId: values.communeId || undefined,
          organizationId: values.organizationId || undefined,
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
      <Form
        // Remount theo kế hoạch đang sửa để `initialValues` được áp dụng lại khi
        // mở modal cho bản ghi khác trước lúc nội dung cũ bị destroy.
        key={item?.id ?? "new"}
        form={form}
        layout="vertical"
        initialValues={initialValues}
        preserve={false}
      >
        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}
        >
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
            extra={
              selectedPlanType === INSPECTION_PLAN_TYPE.Annual
                ? "Kế hoạch kiểm tra hằng năm của cơ quan cấp tỉnh phải được phê duyệt trước ngày 15/11 năm trước (Điều 7 Thông tư 48/2015/TT-BYT)."
                : undefined
            }
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
          <Form.Item name="provinceId" label="Tỉnh/ thành phố">
            <Select
              allowClear
              showSearch
              optionFilterProp="label"
              placeholder="Chọn tỉnh/ thành phố"
              options={(provinces.data?.items ?? []).map((p) => ({
                value: p.id,
                label: p.name,
              }))}
              onChange={() => form.setFieldValue("communeId", undefined)}
            />
          </Form.Item>
          <Form.Item name="communeId" label="Phường/ xã">
            <Select
              allowClear
              showSearch
              optionFilterProp="label"
              disabled={!selectedProvinceId}
              placeholder="Chọn phường/ xã"
              options={(communes.data?.items ?? []).map((c) => ({
                value: c.id,
                label: c.name,
              }))}
            />
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
          <Form.Item
            name="organizationId"
            label="Đơn vị thanh tra"
            extra="Đơn vị quản lý chịu trách nhiệm thực hiện"
            style={{ gridColumn: "span 2" }}
          >
            <Select
              allowClear
              showSearch
              optionFilterProp="label"
              placeholder="Đơn vị quản lý"
              options={flatOrganizations}
            />
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
        items={items}
        error={itemsError}
        onChange={(next) => {
          setItems(next);
          setItemsError(undefined);
        }}
        onBusinessSearch={props.onBusinessSearch}
      />
    </Modal>
  );
}

function PlanItemsEditor({
  businesses,
  items,
  error,
  onChange,
  onBusinessSearch,
}: {
  businesses: BusinessOption[];
  items: ItemRow[];
  error?: string;
  onChange: (items: ItemRow[]) => void;
  onBusinessSearch?: (value: string) => void;
}) {
  const { token } = theme.useToken();
  const addItem = () => {
    onChange([
      ...items,
      {
        key: crypto.randomUUID(),
        businessId: "",
        sequenceNumber: items.length + 1,
      },
    ]);
  };

  const removeItem = (key: string) => {
    onChange(items.filter((i) => i.key !== key));
  };

  const updateItem = (key: string, field: string, value: unknown) => {
    onChange(items.map((i) => (i.key === key ? { ...i, [field]: value } : i)));
  };

  const optionsByRow = useMemo(() => {
    const selected = new Set(items.map((i) => i.businessId).filter(Boolean));
    const all = businesses.map((x) => ({
      value: x.id,
      label: x.code ? `${x.code} — ${x.name}` : x.name,
    }));
    const map = new Map<string, typeof all>();
    for (const item of items) {
      map.set(
        item.key,
        all.filter(
          (o) => o.value === item.businessId || !selected.has(o.value),
        ),
      );
    }
    return map;
  }, [items, businesses]);

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
          status={error && !value ? "error" : undefined}
          style={{ width: "100%" }}
          placeholder="Chọn cơ sở"
          options={optionsByRow.get(row.key)}
          onSearch={onBusinessSearch}
          onChange={(v) => updateItem(row.key, "businessId", v)}
        />
      ),
    },
    {
      title: "Ngày dự kiến",
      dataIndex: "plannedDate",
      width: 150,
      render: (value: string | undefined, row) => (
        <DatePicker
          format="DD/MM/YYYY"
          style={{ width: "100%" }}
          value={value ? dayjs(value) : undefined}
          onChange={(d) =>
            updateItem(row.key, "plannedDate", d?.format("YYYY-MM-DD"))
          }
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
      {error && (
        <div role="alert" style={{ color: token.colorError, marginTop: 8 }}>
          {error}
        </div>
      )}
    </div>
  );
}
