import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm, useWatch } from "react-hook-form";
import {
  Button,
  Checkbox,
  Col,
  Collapse,
  Form,
  Input,
  InputNumber,
  Modal,
  Row,
  Select,
  Space,
} from "antd";
import { useCommunes, useDistricts, useProvinces } from "@/hooks/useGeography";
import type { CatalogItem } from "@/features/catalogs/types/catalog.types";
import type { OrganizationDto } from "@/features/organizations/types/organization.types";
import { MapPicker } from "./MapPicker";
import {
  businessSchema,
  type BusinessFormValues,
} from "../types/businessSchema";
import {
  BUSINESS_STATUS,
  type Business,
  type BusinessInput,
  type UpdateBusinessInput,
} from "../types/business.types";

interface BusinessEditorModalProps {
  open: boolean;
  business?: Business;
  organizations: OrganizationDto[];
  businessTypes: CatalogItem[];
  classifications: CatalogItem[];
  productGroups: CatalogItem[];
  submitting: boolean;
  onCancel: () => void;
  onSubmit: (input: BusinessInput | UpdateBusinessInput) => void;
}

const defaults: BusinessFormValues = {
  organizationId: "",
  code: "",
  name: "",
  businessTypeId: "",
  businessClassificationId: "",
  taxCode: "",
  representativeName: "",
  representativeIdCard: "",
  contactPhone: "",
  contactEmail: "",
  contactWebsite: "",
  addressStreet: "",
  addressProvinceId: "",
  addressDistrictId: "",
  addressCommuneId: "",
  establishedDate: "",
  notes: "",
  productGroupIds: [],
  status: BUSINESS_STATUS.Active,
  suspensionReason: "",
  hasEligibilityCertificate: false,
  hasVsattpCommitment: false,
};

function optional(value: string | undefined) {
  return value || undefined;
}

/** BE trả DateTime ISO ("2020-01-01T00:00:00") — input type="date" cần "YYYY-MM-DD". */
function toDateInput(value?: string) {
  return value ? value.slice(0, 10) : "";
}

export function BusinessEditorModal({
  open,
  business,
  organizations,
  businessTypes,
  classifications,
  productGroups,
  submitting,
  onCancel,
  onSubmit,
}: BusinessEditorModalProps) {
  const {
    control,
    reset,
    setValue,
    handleSubmit,
    formState: { errors },
  } = useForm<BusinessFormValues>({
    resolver: zodResolver(businessSchema),
    defaultValues: defaults,
  });
  const provinceId = useWatch({ control, name: "addressProvinceId" });
  const districtId = useWatch({ control, name: "addressDistrictId" });
  const status = useWatch({ control, name: "status" });
  const latitude = useWatch({ control, name: "addressLatitude" });
  const longitude = useWatch({ control, name: "addressLongitude" });
  const provinces = useProvinces(true);
  const districts = useDistricts(provinceId ?? "", true);
  const communes = useCommunes(districtId ?? "", true);

  useEffect(() => {
    if (!open) return;
    reset({
      ...defaults,
      ...business,
      organizationId: business?.organizationId ?? "",
      businessTypeId: business?.businessTypeId ?? "",
      businessClassificationId: business?.businessClassificationId ?? "",
      addressProvinceId: business?.addressProvinceId ?? "",
      addressDistrictId: business?.addressDistrictId ?? "",
      addressCommuneId: business?.addressCommuneId ?? "",
      establishedDate: toDateInput(business?.establishedDate),
      productGroupIds: business?.productGroupIds ?? [],
    });
  }, [business, open, reset]);

  const submit = handleSubmit((values) => {
    const common: BusinessInput = {
      ...values,
      code: optional(values.code),
      businessTypeId: optional(values.businessTypeId),
      businessClassificationId: optional(values.businessClassificationId),
      taxCode: optional(values.taxCode),
      representativeName: optional(values.representativeName),
      representativeIdCard: optional(values.representativeIdCard),
      contactPhone: optional(values.contactPhone),
      contactEmail: optional(values.contactEmail),
      contactWebsite: optional(values.contactWebsite),
      addressStreet: optional(values.addressStreet),
      addressProvinceId: optional(values.addressProvinceId),
      addressDistrictId: optional(values.addressDistrictId),
      addressCommuneId: optional(values.addressCommuneId),
      establishedDate: optional(values.establishedDate),
      notes: optional(values.notes),
    };
    if (!business) {
      onSubmit(common);
      return;
    }
    onSubmit({
      ...common,
      status: values.status,
      suspensionReason: optional(values.suspensionReason),
      hasEligibilityCertificate: values.hasEligibilityCertificate,
      hasVsattpCommitment: values.hasVsattpCommitment,
    });
  });

  return (
    <Modal
      open={open}
      title={business ? "Cập nhật cơ sở" : "Thêm cơ sở"}
      okText="Lưu"
      cancelText="Hủy"
      width={900}
      confirmLoading={submitting}
      onCancel={onCancel}
      onOk={() => void submit()}
      destroyOnHidden
    >
      <form onSubmit={(event) => void submit(event)} noValidate>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="Đơn vị quản lý"
              required
              validateStatus={errors.organizationId ? "error" : undefined}
              help={errors.organizationId?.message}
            >
              <Controller
                control={control}
                name="organizationId"
                render={({ field }) => (
                  <Select
                    {...field}
                    aria-label="Đơn vị quản lý"
                    showSearch
                    optionFilterProp="label"
                    disabled={Boolean(business)}
                    options={organizations.map((item) => ({
                      value: item.id,
                      label: `${item.code} — ${item.name}`,
                    }))}
                  />
                )}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="Mã cơ sở">
              <Controller
                control={control}
                name="code"
                render={({ field }) => (
                  <Input {...field} aria-label="Mã cơ sở" />
                )}
              />
            </Form.Item>
          </Col>
        </Row>
        <Form.Item
          label="Tên cơ sở"
          required
          validateStatus={errors.name ? "error" : undefined}
          help={errors.name?.message}
        >
          <Controller
            control={control}
            name="name"
            render={({ field }) => <Input {...field} aria-label="Tên cơ sở" />}
          />
        </Form.Item>
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item label="Loại hình">
              <Controller
                control={control}
                name="businessTypeId"
                render={({ field }) => (
                  <Select
                    {...field}
                    allowClear
                    options={businessTypes.map((item) => ({
                      value: item.id,
                      label: item.name,
                    }))}
                  />
                )}
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="Phân loại nguy cơ">
              <Controller
                control={control}
                name="businessClassificationId"
                render={({ field }) => (
                  <Select
                    {...field}
                    allowClear
                    options={classifications.map((item) => ({
                      value: item.id,
                      label: item.name,
                    }))}
                  />
                )}
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="Mã số thuế">
              <Controller
                control={control}
                name="taxCode"
                render={({ field }) => <Input {...field} />}
              />
            </Form.Item>
          </Col>
        </Row>
        <Form.Item label="Nhóm sản phẩm kinh doanh">
          <Controller
            control={control}
            name="productGroupIds"
            render={({ field }) => (
              <Select
                {...field}
                mode="multiple"
                showSearch
                optionFilterProp="label"
                options={productGroups.map((item) => ({
                  value: item.id,
                  label: `${item.code} — ${item.name}`,
                }))}
              />
            )}
          />
        </Form.Item>
        <Collapse
          ghost
          items={[
            {
              key: "contact",
              label: "Người đại diện và liên hệ",
              children: (
                <>
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item label="Người đại diện">
                        <Controller
                          control={control}
                          name="representativeName"
                          render={({ field }) => <Input {...field} />}
                        />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item label="CMND/CCCD người đại diện">
                        <Controller
                          control={control}
                          name="representativeIdCard"
                          render={({ field }) => <Input {...field} />}
                        />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Row gutter={16}>
                    <Col span={8}>
                      <Form.Item label="Điện thoại">
                        <Controller
                          control={control}
                          name="contactPhone"
                          render={({ field }) => <Input {...field} />}
                        />
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item
                        label="Email"
                        validateStatus={
                          errors.contactEmail ? "error" : undefined
                        }
                        help={errors.contactEmail?.message}
                      >
                        <Controller
                          control={control}
                          name="contactEmail"
                          render={({ field }) => <Input {...field} />}
                        />
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item
                        label="Website"
                        validateStatus={
                          errors.contactWebsite ? "error" : undefined
                        }
                        help={errors.contactWebsite?.message}
                      >
                        <Controller
                          control={control}
                          name="contactWebsite"
                          render={({ field }) => <Input {...field} />}
                        />
                      </Form.Item>
                    </Col>
                  </Row>
                </>
              ),
            },
          ]}
        />
        <Form.Item label="Địa chỉ">
          <Controller
            control={control}
            name="addressStreet"
            render={({ field }) => <Input {...field} />}
          />
        </Form.Item>
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item label="Tỉnh/Thành phố">
              <Controller
                control={control}
                name="addressProvinceId"
                render={({ field }) => (
                  <Select
                    {...field}
                    allowClear
                    showSearch
                    optionFilterProp="label"
                    onChange={(value) => {
                      field.onChange(value ?? "");
                      setValue("addressDistrictId", "");
                      setValue("addressCommuneId", "");
                    }}
                    options={(provinces.data?.items ?? []).map((item) => ({
                      value: item.id,
                      label: item.name,
                    }))}
                  />
                )}
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="Huyện/Quận">
              <Controller
                control={control}
                name="addressDistrictId"
                render={({ field }) => (
                  <Select
                    {...field}
                    allowClear
                    onChange={(value) => {
                      field.onChange(value ?? "");
                      setValue("addressCommuneId", "");
                    }}
                    options={(districts.data?.items ?? []).map((item) => ({
                      value: item.id,
                      label: item.name,
                    }))}
                  />
                )}
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="Xã/Phường">
              <Controller
                control={control}
                name="addressCommuneId"
                render={({ field }) => (
                  <Select
                    {...field}
                    allowClear
                    options={(communes.data?.items ?? []).map((item) => ({
                      value: item.id,
                      label: item.name,
                    }))}
                  />
                )}
              />
            </Form.Item>
          </Col>
        </Row>
        <Form.Item
          label="Vị trí bản đồ"
          validateStatus={errors.addressLatitude ? "error" : undefined}
          help={errors.addressLatitude?.message}
        >
          <MapPicker
            latitude={latitude}
            longitude={longitude}
            onChange={(lat, lng) => {
              setValue("addressLatitude", lat, { shouldValidate: true });
              setValue("addressLongitude", lng, { shouldValidate: true });
            }}
          />
          {latitude !== undefined && (
            <Button
              size="small"
              style={{ marginTop: 8 }}
              onClick={() => {
                setValue("addressLatitude", undefined, {
                  shouldValidate: true,
                });
                setValue("addressLongitude", undefined, {
                  shouldValidate: true,
                });
              }}
            >
              Xóa tọa độ
            </Button>
          )}
        </Form.Item>
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item label="Ngày thành lập">
              <Controller
                control={control}
                name="establishedDate"
                render={({ field }) => <Input {...field} type="date" />}
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="Số lao động">
              <Controller
                control={control}
                name="employeeCount"
                render={({ field }) => (
                  <InputNumber
                    min={0}
                    value={field.value}
                    onChange={(value) => field.onChange(value ?? undefined)}
                    style={{ width: "100%" }}
                  />
                )}
              />
            </Form.Item>
          </Col>
          {business && (
            <Col span={8}>
              <Form.Item label="Trạng thái">
                <Controller
                  control={control}
                  name="status"
                  render={({ field }) => (
                    <Select
                      {...field}
                      options={[
                        { value: 1, label: "Hoạt động" },
                        { value: 2, label: "Ngừng hoạt động" },
                        { value: 3, label: "Đình chỉ" },
                      ]}
                    />
                  )}
                />
              </Form.Item>
            </Col>
          )}
        </Row>
        {business && status === BUSINESS_STATUS.Suspended && (
          <Form.Item
            label="Lý do đình chỉ"
            required
            validateStatus={errors.suspensionReason ? "error" : undefined}
            help={errors.suspensionReason?.message}
          >
            <Controller
              control={control}
              name="suspensionReason"
              render={({ field }) => <Input.TextArea {...field} />}
            />
          </Form.Item>
        )}
        {business && (
          <Space>
            <Controller
              control={control}
              name="hasEligibilityCertificate"
              render={({ field }) => (
                <Checkbox checked={field.value} onChange={field.onChange}>
                  Có giấy đủ điều kiện ATTP
                </Checkbox>
              )}
            />
            <Controller
              control={control}
              name="hasVsattpCommitment"
              render={({ field }) => (
                <Checkbox checked={field.value} onChange={field.onChange}>
                  Đã nộp cam kết VSATTP
                </Checkbox>
              )}
            />
          </Space>
        )}
        <Form.Item label="Ghi chú" style={{ marginTop: 16 }}>
          <Controller
            control={control}
            name="notes"
            render={({ field }) => <Input.TextArea {...field} rows={2} />}
          />
        </Form.Item>
      </form>
    </Modal>
  );
}
