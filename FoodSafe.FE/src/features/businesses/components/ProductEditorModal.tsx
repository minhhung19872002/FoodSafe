import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { Col, Form, Input, InputNumber, Modal, Row, Select } from "antd";
import type { CatalogItem } from "@/features/catalogs/types/catalog.types";
import { productSchema, type ProductFormValues } from "../types/businessSchema";
import {
  PRODUCT_STATUS,
  type Product,
  type ProductBusinessOption,
  type ProductInput,
  type UpdateProductInput,
} from "../types/business.types";

interface ProductEditorModalProps {
  open: boolean;
  product?: Product;
  businesses: ProductBusinessOption[];
  productGroups: CatalogItem[];
  countries: CatalogItem[];
  submitting: boolean;
  onCancel: () => void;
  onSubmit: (input: ProductInput | UpdateProductInput) => void;
}

const defaults: ProductFormValues = {
  businessId: "",
  code: "",
  name: "",
  productGroupId: "",
  brandName: "",
  manufacturer: "",
  manufacturingCountryId: "",
  netWeight: "",
  specifications: "",
  ingredients: "",
  storageConditions: "",
  usageInstructions: "",
  notes: "",
  status: PRODUCT_STATUS.Active,
};

const optional = (value: string | undefined) => value || undefined;

export function ProductEditorModal({
  open,
  product,
  businesses,
  productGroups,
  countries,
  submitting,
  onCancel,
  onSubmit,
}: ProductEditorModalProps) {
  const {
    control,
    reset,
    handleSubmit,
    formState: { errors },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: defaults,
  });

  useEffect(() => {
    if (open) {
      reset({
        ...defaults,
        ...product,
        businessId: product?.businessId ?? "",
        productGroupId: product?.productGroupId ?? "",
        manufacturingCountryId: product?.manufacturingCountryId ?? "",
      });
    }
  }, [open, product, reset]);

  const submit = handleSubmit((values) => {
    const common: ProductInput = {
      ...values,
      code: optional(values.code),
      productGroupId: optional(values.productGroupId),
      brandName: optional(values.brandName),
      manufacturer: optional(values.manufacturer),
      manufacturingCountryId: optional(values.manufacturingCountryId),
      netWeight: optional(values.netWeight),
      specifications: optional(values.specifications),
      ingredients: optional(values.ingredients),
      storageConditions: optional(values.storageConditions),
      usageInstructions: optional(values.usageInstructions),
      notes: optional(values.notes),
    };
    onSubmit(product ? { ...common, status: values.status } : common);
  });

  return (
    <Modal
      open={open}
      title={product ? "Cập nhật sản phẩm" : "Thêm sản phẩm"}
      width={760}
      okText="Lưu"
      cancelText="Hủy"
      confirmLoading={submitting}
      onCancel={onCancel}
      onOk={() => void submit()}
      destroyOnHidden
    >
      <form onSubmit={(event) => void submit(event)} noValidate>
        <Form.Item
          label="Cơ sở"
          required
          validateStatus={errors.businessId ? "error" : undefined}
          help={errors.businessId?.message}
        >
          <Controller
            control={control}
            name="businessId"
            render={({ field }) => (
              <Select
                {...field}
                aria-label="Cơ sở"
                showSearch
                optionFilterProp="label"
                disabled={Boolean(product)}
                options={businesses.map((item) => ({
                  value: item.id,
                  label: `${item.code ?? "—"} — ${item.name}`,
                }))}
              />
            )}
          />
        </Form.Item>
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item label="Mã sản phẩm">
              <Controller
                control={control}
                name="code"
                render={({ field }) => (
                  <Input {...field} aria-label="Mã sản phẩm" />
                )}
              />
            </Form.Item>
          </Col>
          <Col span={16}>
            <Form.Item
              label="Tên sản phẩm"
              required
              validateStatus={errors.name ? "error" : undefined}
              help={errors.name?.message}
            >
              <Controller
                control={control}
                name="name"
                render={({ field }) => (
                  <Input {...field} aria-label="Tên sản phẩm" />
                )}
              />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="Nhóm sản phẩm">
              <Controller
                control={control}
                name="productGroupId"
                render={({ field }) => (
                  <Select
                    {...field}
                    allowClear
                    options={productGroups.map((item) => ({
                      value: item.id,
                      label: item.name,
                    }))}
                  />
                )}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="Xuất xứ">
              <Controller
                control={control}
                name="manufacturingCountryId"
                render={({ field }) => (
                  <Select
                    {...field}
                    allowClear
                    showSearch
                    optionFilterProp="label"
                    options={countries.map((item) => ({
                      value: item.id,
                      label: item.name,
                    }))}
                  />
                )}
              />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item label="Thương hiệu">
              <Controller
                control={control}
                name="brandName"
                render={({ field }) => <Input {...field} />}
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="Nhà sản xuất">
              <Controller
                control={control}
                name="manufacturer"
                render={({ field }) => <Input {...field} />}
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="Khối lượng tịnh">
              <Controller
                control={control}
                name="netWeight"
                render={({ field }) => <Input {...field} />}
              />
            </Form.Item>
          </Col>
        </Row>
        <Form.Item label="Thành phần">
          <Controller
            control={control}
            name="ingredients"
            render={({ field }) => <Input.TextArea {...field} rows={2} />}
          />
        </Form.Item>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="Hạn sử dụng (tháng)">
              <Controller
                control={control}
                name="expiryPeriodMonths"
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
          {product && (
            <Col span={12}>
              <Form.Item label="Trạng thái">
                <Controller
                  control={control}
                  name="status"
                  render={({ field }) => (
                    <Select
                      {...field}
                      options={[
                        { value: 1, label: "Đang kinh doanh" },
                        { value: 2, label: "Ngừng kinh doanh" },
                      ]}
                    />
                  )}
                />
              </Form.Item>
            </Col>
          )}
        </Row>
        <Form.Item label="Điều kiện bảo quản">
          <Controller
            control={control}
            name="storageConditions"
            render={({ field }) => <Input.TextArea {...field} rows={2} />}
          />
        </Form.Item>
        <Form.Item label="Hướng dẫn sử dụng">
          <Controller
            control={control}
            name="usageInstructions"
            render={({ field }) => <Input.TextArea {...field} rows={2} />}
          />
        </Form.Item>
        <Form.Item label="Thông số kỹ thuật">
          <Controller
            control={control}
            name="specifications"
            render={({ field }) => <Input.TextArea {...field} rows={2} />}
          />
        </Form.Item>
        <Form.Item label="Ghi chú">
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
