import { useEffect, useState } from "react";
import { DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import {
  Button,
  Col,
  Form,
  Input,
  Modal,
  Popconfirm,
  Row,
  Space,
  Switch,
  Table,
  Tag,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  businessHandlerSchema,
  type BusinessHandlerFormValues,
} from "../types/businessSchema";
import type {
  Business,
  BusinessHandler,
  BusinessHandlerInput,
} from "../types/business.types";

interface Props {
  open: boolean;
  business?: Business;
  editable: boolean;
  submitting: boolean;
  onCancel: () => void;
  onSave: (handlerId: string | undefined, input: BusinessHandlerInput) => void;
  onDelete: (handlerId: string) => void;
}

const defaults: BusinessHandlerFormValues = {
  fullName: "",
  position: "",
  idCardNumber: "",
  trainingCertificateNumber: "",
  trainingDate: "",
  trainingOrganization: "",
  trainingExpiryDate: "",
  healthCertificateNumber: "",
  healthCheckDate: "",
  healthCheckFacility: "",
  healthCheckExpiryDate: "",
  isActive: true,
  notes: "",
};

const optional = (value?: string) => value || undefined;

export function BusinessHandlersModal({
  open,
  business,
  editable,
  submitting,
  onCancel,
  onSave,
  onDelete,
}: Props) {
  const [editing, setEditing] = useState<BusinessHandler | null>();
  const {
    control,
    reset,
    handleSubmit,
    formState: { errors },
  } = useForm<BusinessHandlerFormValues>({
    resolver: zodResolver(businessHandlerSchema),
    defaultValues: defaults,
  });

  useEffect(() => {
    reset(editing ? { ...defaults, ...editing } : defaults);
  }, [editing, reset]);

  const submit = handleSubmit((values) => {
    onSave(editing?.id, {
      ...values,
      position: optional(values.position),
      idCardNumber: optional(values.idCardNumber),
      trainingCertificateNumber: optional(values.trainingCertificateNumber),
      trainingDate: optional(values.trainingDate),
      trainingOrganization: optional(values.trainingOrganization),
      trainingExpiryDate: optional(values.trainingExpiryDate),
      healthCertificateNumber: optional(values.healthCertificateNumber),
      healthCheckDate: optional(values.healthCheckDate),
      healthCheckFacility: optional(values.healthCheckFacility),
      healthCheckExpiryDate: optional(values.healthCheckExpiryDate),
      notes: optional(values.notes),
    });
  });

  const columns: ColumnsType<BusinessHandler> = [
    { title: "Họ tên", dataIndex: "fullName" },
    { title: "Chức vụ", dataIndex: "position" },
    {
      title: "Trạng thái",
      dataIndex: "isActive",
      render: (active: boolean) => (
        <Tag color={active ? "success" : "default"}>
          {active ? "Đang phụ trách" : "Ngừng"}
        </Tag>
      ),
    },
    ...(editable
      ? [
          {
            title: "Thao tác",
            width: 100,
            render: (_: unknown, handler: BusinessHandler) => (
              <Space>
                <Button
                  type="text"
                  aria-label={`Sửa người phụ trách ${handler.fullName}`}
                  icon={<EditOutlined />}
                  onClick={() => setEditing(handler)}
                />
                <Popconfirm
                  title="Xóa người phụ trách này?"
                  okText="Xóa"
                  cancelText="Hủy"
                  onConfirm={() => onDelete(handler.id)}
                >
                  <Button
                    type="text"
                    danger
                    aria-label={`Xóa người phụ trách ${handler.fullName}`}
                    icon={<DeleteOutlined />}
                  />
                </Popconfirm>
              </Space>
            ),
          },
        ]
      : []),
  ];

  return (
    <Modal
      open={open}
      title={`Người phụ trách — ${business?.name ?? ""}`}
      width={900}
      footer={null}
      onCancel={onCancel}
      destroyOnHidden
    >
      <Table
        rowKey="id"
        size="small"
        pagination={false}
        dataSource={business?.handlers ?? []}
        columns={columns}
        locale={{ emptyText: "Chưa có người phụ trách" }}
      />
      {editable && editing === undefined && (
        <Button
          icon={<PlusOutlined />}
          style={{ marginTop: 16 }}
          onClick={() => setEditing(null)}
        >
          Thêm người phụ trách
        </Button>
      )}
      {editable && editing !== undefined && (
        <form
          onSubmit={(event) => void submit(event)}
          noValidate
          style={{ marginTop: 20 }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Họ tên"
                required
                validateStatus={errors.fullName ? "error" : undefined}
                help={errors.fullName?.message}
              >
                <Controller
                  control={control}
                  name="fullName"
                  render={({ field }) => (
                    <Input {...field} aria-label="Họ tên người phụ trách" />
                  )}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Chức vụ">
                <Controller
                  control={control}
                  name="position"
                  render={({ field }) => <Input {...field} />}
                />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={6}>
              <Form.Item label="CCCD/CMND">
                <Controller
                  control={control}
                  name="idCardNumber"
                  render={({ field }) => <Input {...field} />}
                />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label="Số chứng nhận tập huấn">
                <Controller
                  control={control}
                  name="trainingCertificateNumber"
                  render={({ field }) => <Input {...field} />}
                />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label="Ngày tập huấn">
                <Controller
                  control={control}
                  name="trainingDate"
                  render={({ field }) => <Input {...field} type="date" />}
                />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label="Ngày hết hạn tập huấn">
                <Controller
                  control={control}
                  name="trainingExpiryDate"
                  render={({ field }) => <Input {...field} type="date" />}
                />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="Đơn vị tập huấn">
            <Controller
              control={control}
              name="trainingOrganization"
              render={({ field }) => <Input {...field} />}
            />
          </Form.Item>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item label="Số giấy khám sức khỏe">
                <Controller
                  control={control}
                  name="healthCertificateNumber"
                  render={({ field }) => <Input {...field} />}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Ngày khám">
                <Controller
                  control={control}
                  name="healthCheckDate"
                  render={({ field }) => <Input {...field} type="date" />}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Ngày hết hạn sức khỏe">
                <Controller
                  control={control}
                  name="healthCheckExpiryDate"
                  render={({ field }) => <Input {...field} type="date" />}
                />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="Cơ sở khám sức khỏe">
            <Controller
              control={control}
              name="healthCheckFacility"
              render={({ field }) => <Input {...field} />}
            />
          </Form.Item>
          <Form.Item label="Đang phụ trách">
            <Controller
              control={control}
              name="isActive"
              render={({ field }) => (
                <Switch checked={field.value} onChange={field.onChange} />
              )}
            />
          </Form.Item>
          <Form.Item label="Ghi chú">
            <Controller
              control={control}
              name="notes"
              render={({ field }) => <Input.TextArea {...field} rows={2} />}
            />
          </Form.Item>
          <Space>
            <Button
              type="primary"
              loading={submitting}
              onClick={() => void submit()}
            >
              Lưu người phụ trách
            </Button>
            <Button onClick={() => setEditing(undefined)}>Hủy</Button>
          </Space>
        </form>
      )}
    </Modal>
  );
}
