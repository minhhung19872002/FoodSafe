import { useEffect, useMemo } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm, useWatch } from "react-hook-form";
import {
  DatePicker,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Switch,
} from "antd";
import dayjs from "dayjs";
import { useCommunes, useDistricts, useProvinces } from "@/hooks/useGeography";
import { createCatalogSchema } from "../types/catalogSchema";
import type {
  CatalogInput,
  CatalogItem,
  CatalogKind,
} from "../types/catalog.types";

interface CatalogEditorModalProps {
  kind: CatalogKind;
  item?: CatalogItem;
  productGroups: CatalogItem[];
  testingCenters: CatalogItem[];
  open: boolean;
  saving: boolean;
  onCancel: () => void;
  onSave: (input: CatalogInput) => void;
}

const emptyCatalog: CatalogInput = {
  code: "",
  name: "",
  description: "",
  isActive: true,
  sortOrder: 0,
};

export function CatalogEditorModal({
  kind,
  item,
  productGroups,
  testingCenters,
  open,
  saving,
  onCancel,
  onSave,
}: CatalogEditorModalProps) {
  const schema = useMemo(() => createCatalogSchema(kind), [kind]);
  const {
    control,
    formState: { errors },
    handleSubmit,
    reset,
  } = useForm<CatalogInput>({
    resolver: zodResolver(schema),
    defaultValues: emptyCatalog,
  });
  const provinceId = useWatch({ control, name: "provinceId" });
  const districtId = useWatch({ control, name: "districtId" });
  const level = useWatch({ control, name: "level" });
  const provinces = useProvinces(true);
  const districts = useDistricts(provinceId ?? "", true);
  const communes = useCommunes(districtId ?? "", true);

  useEffect(() => {
    if (open) reset({ ...emptyCatalog, ...item });
  }, [item, open, reset]);

  const submit = handleSubmit((values) => {
    onSave({
      ...values,
      parentId: values.level === 2 ? values.parentId : undefined,
    });
  });

  return (
    <Modal
      title={`${item ? "Cập nhật" : "Thêm"} danh mục`}
      open={open}
      confirmLoading={saving}
      okText="Lưu"
      cancelText="Hủy"
      onCancel={onCancel}
      onOk={() => void submit()}
      width={720}
      destroyOnHidden
    >
      <form onSubmit={(event) => void submit(event)} noValidate>
        <Controller
          control={control}
          name="code"
          render={({ field }) => (
            <Form.Item
              label={kind === "country" ? "Mã ISO Alpha-2" : "Mã"}
              required
              validateStatus={errors.code ? "error" : undefined}
              help={errors.code?.message}
            >
              <Input
                {...field}
                aria-label={kind === "country" ? "Mã ISO Alpha-2" : "Mã"}
                maxLength={kind === "country" ? 2 : 50}
                autoFocus
              />
            </Form.Item>
          )}
        />
        {kind === "country" && (
          <>
            <Controller
              control={control}
              name="codeAlpha3"
              render={({ field }) => (
                <Form.Item
                  label="Mã ISO Alpha-3"
                  validateStatus={errors.codeAlpha3 ? "error" : undefined}
                  help={errors.codeAlpha3?.message}
                >
                  <Input
                    {...field}
                    aria-label="Mã ISO Alpha-3"
                    value={field.value ?? ""}
                    maxLength={3}
                  />
                </Form.Item>
              )}
            />
            <Controller
              control={control}
              name="nameEn"
              render={({ field }) => (
                <Form.Item
                  label="Tên tiếng Anh"
                  validateStatus={errors.nameEn ? "error" : undefined}
                  help={errors.nameEn?.message}
                >
                  <Input
                    {...field}
                    aria-label="Tên tiếng Anh"
                    value={field.value ?? ""}
                    maxLength={200}
                  />
                </Form.Item>
              )}
            />
          </>
        )}
        <Controller
          control={control}
          name="name"
          render={({ field }) => (
            <Form.Item
              label={kind === "country" ? "Tên tiếng Việt" : "Tên"}
              required
              validateStatus={errors.name ? "error" : undefined}
              help={errors.name?.message}
            >
              <Input
                {...field}
                aria-label={kind === "country" ? "Tên tiếng Việt" : "Tên"}
                maxLength={200}
              />
            </Form.Item>
          )}
        />
        {kind !== "country" && (
          <Controller
            control={control}
            name="description"
            render={({ field }) => (
              <Form.Item
                label="Mô tả"
                validateStatus={errors.description ? "error" : undefined}
                help={errors.description?.message}
              >
                <Input.TextArea
                  {...field}
                  value={field.value ?? ""}
                  rows={2}
                  maxLength={2000}
                />
              </Form.Item>
            )}
          />
        )}
        {kind === "product-group" && (
          <>
            <Controller
              control={control}
              name="level"
              render={({ field }) => (
                <Form.Item
                  label="Cấp"
                  required
                  validateStatus={errors.level ? "error" : undefined}
                  help={errors.level?.message}
                >
                  <Select
                    {...field}
                    options={[
                      { value: 1, label: "Cấp 1" },
                      { value: 2, label: "Cấp 2" },
                    ]}
                  />
                </Form.Item>
              )}
            />
            {level === 2 && (
              <Controller
                control={control}
                name="parentId"
                render={({ field }) => (
                  <Form.Item
                    label="Nhóm cha"
                    required
                    validateStatus={errors.parentId ? "error" : undefined}
                    help={errors.parentId?.message}
                  >
                    <Select
                      {...field}
                      value={field.value || undefined}
                      options={productGroups
                        .filter((group) => group.level === 1)
                        .map((group) => ({
                          value: group.id,
                          label: `${group.code} — ${group.name}`,
                        }))}
                    />
                  </Form.Item>
                )}
              />
            )}
          </>
        )}
        {kind === "business-classification" && (
          <>
            <Controller
              control={control}
              name="criteria"
              render={({ field }) => (
                <Form.Item
                  label="Tiêu chí phân loại"
                  required
                  validateStatus={errors.criteria ? "error" : undefined}
                  help={errors.criteria?.message}
                >
                  <Input.TextArea
                    {...field}
                    value={field.value ?? ""}
                    rows={3}
                    maxLength={2000}
                  />
                </Form.Item>
              )}
            />
            <Controller
              control={control}
              name="riskLevel"
              render={({ field }) => (
                <Form.Item
                  label="Mức rủi ro"
                  required
                  validateStatus={errors.riskLevel ? "error" : undefined}
                  help={errors.riskLevel?.message}
                >
                  <Select
                    {...field}
                    options={[
                      { value: 1, label: "Cao" },
                      { value: 2, label: "Trung bình" },
                      { value: 3, label: "Thấp" },
                    ]}
                  />
                </Form.Item>
              )}
            />
          </>
        )}
        {kind === "testing-center" && (
          <>
            <Controller
              control={control}
              name="address"
              render={({ field }) => (
                <Form.Item
                  label="Địa chỉ"
                  required
                  validateStatus={errors.address ? "error" : undefined}
                  help={errors.address?.message}
                >
                  <Input {...field} value={field.value ?? ""} />
                </Form.Item>
              )}
            />
            <Controller
              control={control}
              name="provinceId"
              render={({ field }) => (
                <Form.Item
                  label="Tỉnh/Thành phố"
                  required
                  validateStatus={errors.provinceId ? "error" : undefined}
                  help={errors.provinceId?.message}
                >
                  <Select
                    {...field}
                    value={field.value || undefined}
                    showSearch
                    optionFilterProp="label"
                    options={(provinces.data?.items ?? []).map((province) => ({
                      value: province.id,
                      label: province.name,
                    }))}
                  />
                </Form.Item>
              )}
            />
            <Controller
              control={control}
              name="districtId"
              render={({ field }) => (
                <Form.Item label="Huyện/Quận">
                  <Select
                    {...field}
                    value={field.value || undefined}
                    allowClear
                    options={(districts.data?.items ?? []).map((district) => ({
                      value: district.id,
                      label: district.name,
                    }))}
                  />
                </Form.Item>
              )}
            />
            <Controller
              control={control}
              name="communeId"
              render={({ field }) => (
                <Form.Item label="Xã/Phường">
                  <Select
                    {...field}
                    value={field.value || undefined}
                    allowClear
                    options={(communes.data?.items ?? []).map((commune) => ({
                      value: commune.id,
                      label: commune.name,
                    }))}
                  />
                </Form.Item>
              )}
            />
            {(
              [
                ["contactPerson", "Người liên hệ"],
                ["phone", "Điện thoại"],
                ["email", "Email"],
                ["accreditationNumber", "Số công nhận"],
              ] as const
            ).map(([name, label]) => (
              <Controller
                key={name}
                control={control}
                name={name}
                render={({ field }) => (
                  <Form.Item
                    label={label}
                    required={name === "accreditationNumber"}
                    validateStatus={errors[name] ? "error" : undefined}
                    help={errors[name]?.message}
                  >
                    <Input {...field} value={field.value ?? ""} />
                  </Form.Item>
                )}
              />
            ))}
            <Controller
              control={control}
              name="accreditationScope"
              render={({ field }) => (
                <Form.Item
                  label="Phạm vi công nhận"
                  required
                  validateStatus={
                    errors.accreditationScope ? "error" : undefined
                  }
                  help={errors.accreditationScope?.message}
                >
                  <Input.TextArea {...field} value={field.value ?? ""} />
                </Form.Item>
              )}
            />
            <Controller
              control={control}
              name="accreditationExpiresAt"
              render={({ field }) => (
                <Form.Item
                  label="Ngày hết hạn"
                  required
                  validateStatus={
                    errors.accreditationExpiresAt ? "error" : undefined
                  }
                  help={errors.accreditationExpiresAt?.message}
                >
                  <DatePicker
                    value={field.value ? dayjs(field.value) : null}
                    onBlur={field.onBlur}
                    onChange={(date) =>
                      field.onChange(date ? date.toISOString() : undefined)
                    }
                  />
                </Form.Item>
              )}
            />
          </>
        )}
        {kind === "testing-service" && (
          <>
            <Controller
              control={control}
              name="testingCenterId"
              render={({ field }) => (
                <Form.Item
                  label="Trung tâm kiểm nghiệm"
                  required
                  validateStatus={errors.testingCenterId ? "error" : undefined}
                  help={errors.testingCenterId?.message}
                >
                  <Select
                    {...field}
                    value={field.value || undefined}
                    options={testingCenters.map((center) => ({
                      value: center.id,
                      label: `${center.code} — ${center.name}`,
                    }))}
                  />
                </Form.Item>
              )}
            />
            {(
              [
                ["unit", "Đơn vị"],
                ["method", "Phương pháp"],
              ] as const
            ).map(([name, label]) => (
              <Controller
                key={name}
                control={control}
                name={name}
                render={({ field }) => (
                  <Form.Item
                    label={label}
                    required
                    validateStatus={errors[name] ? "error" : undefined}
                    help={errors[name]?.message}
                  >
                    <Input {...field} value={field.value ?? ""} />
                  </Form.Item>
                )}
              />
            ))}
            <Controller
              control={control}
              name="price"
              render={({ field }) => (
                <Form.Item
                  label="Đơn giá"
                  required
                  validateStatus={errors.price ? "error" : undefined}
                  help={errors.price?.message}
                >
                  <InputNumber
                    value={field.value}
                    onBlur={field.onBlur}
                    onChange={(value) => field.onChange(value ?? undefined)}
                    min={0}
                    style={{ width: "100%" }}
                  />
                </Form.Item>
              )}
            />
            <Controller
              control={control}
              name="turnaroundDays"
              render={({ field }) => (
                <Form.Item
                  label="Thời gian trả kết quả (ngày)"
                  required
                  validateStatus={errors.turnaroundDays ? "error" : undefined}
                  help={errors.turnaroundDays?.message}
                >
                  <InputNumber
                    value={field.value}
                    onBlur={field.onBlur}
                    onChange={(value) => field.onChange(value ?? undefined)}
                    min={0}
                    style={{ width: "100%" }}
                  />
                </Form.Item>
              )}
            />
          </>
        )}
        <Controller
          control={control}
          name="sortOrder"
          render={({ field }) => (
            <Form.Item
              label="Thứ tự"
              validateStatus={errors.sortOrder ? "error" : undefined}
              help={errors.sortOrder?.message}
            >
              <InputNumber
                value={field.value}
                onBlur={field.onBlur}
                onChange={(value) => field.onChange(value ?? 0)}
                style={{ width: "100%" }}
              />
            </Form.Item>
          )}
        />
        <Controller
          control={control}
          name="isActive"
          render={({ field }) => (
            <Form.Item label="Hoạt động">
              <Switch checked={field.value} onChange={field.onChange} />
            </Form.Item>
          )}
        />
      </form>
    </Modal>
  );
}
