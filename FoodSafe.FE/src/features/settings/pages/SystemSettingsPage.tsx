import { useEffect, useState } from "react";
import {
  App,
  Button,
  Card,
  Col,
  Form,
  Image,
  Input,
  InputNumber,
  Popconfirm,
  Row,
  Space,
  Spin,
  Switch,
  Typography,
  Upload,
} from "antd";
import {
  DeleteOutlined,
  LockOutlined,
  MailOutlined,
  PictureOutlined,
  SaveOutlined,
  HomeOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import { PageHeader } from "@/components/PageHeader";
import { useAuthStore } from "@/features/auth/store/authStore";
import {
  useDeleteBrandingImage,
  useSystemSettings,
  useUpdateSystemSettings,
  useUploadBrandingImage,
} from "../api/settingsQueries";
import type {
  BrandingImageKind,
  UpdateSystemSettingsInput,
} from "../types/settings.types";

const settingsPermission = "FoodSafe.SystemAdmin.Settings";

interface BrandingUploaderProps {
  kind: BrandingImageKind;
  label: string;
  hasImage: boolean;
  disabled: boolean;
}

function BrandingUploader({
  kind,
  label,
  hasImage,
  disabled,
}: BrandingUploaderProps) {
  const { message } = App.useApp();
  const upload = useUploadBrandingImage();
  const remove = useDeleteBrandingImage();
  const [cacheBust, setCacheBust] = useState(0);

  return (
    <Space direction="vertical" style={{ width: "100%" }}>
      <Typography.Text strong>{label}</Typography.Text>
      {hasImage && (
        <Image
          src={`/api/v1/public/branding/${kind}?v=${cacheBust}`}
          alt={label}
          height={80}
          style={{ objectFit: "contain" }}
        />
      )}
      <Space>
        <Upload
          accept="image/png,image/jpeg,image/webp,image/svg+xml"
          maxCount={1}
          showUploadList={false}
          disabled={disabled}
          beforeUpload={(file) => {
            if (file.size > 2 * 1024 * 1024) {
              void message.error("Ảnh không được vượt quá 2MB.");
              return Upload.LIST_IGNORE;
            }
            upload.mutate(
              { kind, file },
              {
                onSuccess: () => {
                  setCacheBust((v) => v + 1);
                  void message.success("Đã cập nhật hình ảnh.");
                },
                onError: () =>
                  void message.error("Không thể tải lên hình ảnh."),
              },
            );
            return false;
          }}
        >
          <Button
            icon={<UploadOutlined />}
            loading={upload.isPending}
            disabled={disabled}
          >
            Tải ảnh lên
          </Button>
        </Upload>
        {hasImage && (
          <Popconfirm
            title="Xóa hình ảnh này?"
            okText="Xóa"
            cancelText="Hủy"
            onConfirm={() =>
              remove.mutate(kind, {
                onSuccess: () =>
                  void message.success("Đã xóa hình ảnh."),
                onError: () => void message.error("Không thể xóa hình ảnh."),
              })
            }
          >
            <Button
              danger
              icon={<DeleteOutlined />}
              loading={remove.isPending}
              disabled={disabled}
            >
              Xóa
            </Button>
          </Popconfirm>
        )}
      </Space>
    </Space>
  );
}

export default function SystemSettingsPage() {
  const { message } = App.useApp();
  const hasPermission = useAuthStore((state) => state.hasPermission);
  const canEdit = hasPermission(settingsPermission);
  const { data, isLoading } = useSystemSettings();
  const update = useUpdateSystemSettings();
  const [form] = Form.useForm<UpdateSystemSettingsInput>();

  useEffect(() => {
    if (data) {
      form.setFieldsValue({
        passwordRequiredLength: data.passwordRequiredLength,
        passwordMaxLength: data.passwordMaxLength,
        passwordRequireDigit: data.passwordRequireDigit,
        passwordRequireLowercase: data.passwordRequireLowercase,
        passwordRequireUppercase: data.passwordRequireUppercase,
        passwordRequireNonAlphanumeric: data.passwordRequireNonAlphanumeric,
        lockoutMaxFailedAttempts: data.lockoutMaxFailedAttempts,
        lockoutDurationMinutes: data.lockoutDurationMinutes,
        smtpHost: data.smtpHost,
        smtpPort: data.smtpPort,
        smtpUserName: data.smtpUserName,
        smtpEnableSsl: data.smtpEnableSsl,
        smtpSenderAddress: data.smtpSenderAddress,
        smtpSenderDisplayName: data.smtpSenderDisplayName,
        homepageTitle: data.homepageTitle,
        homepageDescription: data.homepageDescription,
        contactPhone: data.contactPhone,
        contactEmail: data.contactEmail,
        contactAddress: data.contactAddress,
      });
    }
  }, [data, form]);

  if (isLoading) {
    return (
      <div style={{ textAlign: "center", padding: 80 }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="page-container">
      <PageHeader
        title="Cấu hình hệ thống"
        subtitle="Chính sách mật khẩu, khóa tài khoản, email, giao diện và trang chủ"
      />

      <Form<UpdateSystemSettingsInput>
        form={form}
        layout="vertical"
        disabled={!canEdit}
        onFinish={(values) =>
          update.mutate(values, {
            onSuccess: () => {
              void message.success("Đã lưu cấu hình hệ thống.");
              form.setFieldValue("smtpPassword", undefined);
            },
            onError: () =>
              void message.error(
                "Không thể lưu cấu hình. Vui lòng kiểm tra dữ liệu nhập.",
              ),
          })
        }
      >
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={12}>
            <Card
              title={
                <span>
                  <LockOutlined style={{ marginRight: 8 }} />
                  Chính sách mật khẩu
                </span>
              }
              size="small"
            >
              <Row gutter={12}>
                <Col span={12}>
                  <Form.Item
                    name="passwordRequiredLength"
                    label="Độ dài tối thiểu"
                    rules={[{ required: true, message: "Bắt buộc" }]}
                  >
                    <InputNumber
                      min={8}
                      max={64}
                      style={{ width: "100%" }}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="passwordMaxLength"
                    label="Độ dài tối đa"
                    rules={[{ required: true, message: "Bắt buộc" }]}
                  >
                    <InputNumber
                      min={16}
                      max={256}
                      style={{ width: "100%" }}
                    />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={12}>
                <Col span={12}>
                  <Form.Item
                    name="passwordRequireDigit"
                    label="Yêu cầu chữ số"
                    valuePropName="checked"
                  >
                    <Switch />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="passwordRequireNonAlphanumeric"
                    label="Yêu cầu ký tự đặc biệt"
                    valuePropName="checked"
                  >
                    <Switch />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="passwordRequireLowercase"
                    label="Yêu cầu chữ thường"
                    valuePropName="checked"
                  >
                    <Switch />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="passwordRequireUppercase"
                    label="Yêu cầu chữ hoa"
                    valuePropName="checked"
                  >
                    <Switch />
                  </Form.Item>
                </Col>
              </Row>
            </Card>
          </Col>

          <Col xs={24} lg={12}>
            <Card
              title={
                <span>
                  <LockOutlined style={{ marginRight: 8 }} />
                  Khóa tài khoản
                </span>
              }
              size="small"
            >
              <Form.Item
                name="lockoutMaxFailedAttempts"
                label="Số lần đăng nhập sai tối đa trước khi khóa"
                rules={[{ required: true, message: "Bắt buộc" }]}
              >
                <InputNumber min={1} max={20} style={{ width: "100%" }} />
              </Form.Item>
              <Form.Item
                name="lockoutDurationMinutes"
                label="Thời gian khóa tài khoản (phút)"
                rules={[{ required: true, message: "Bắt buộc" }]}
              >
                <InputNumber min={1} max={1440} style={{ width: "100%" }} />
              </Form.Item>
            </Card>
          </Col>

          <Col xs={24} lg={12}>
            <Card
              title={
                <span>
                  <MailOutlined style={{ marginRight: 8 }} />
                  Cấu hình Email (SMTP)
                </span>
              }
              size="small"
            >
              <Row gutter={12}>
                <Col span={16}>
                  <Form.Item name="smtpHost" label="Máy chủ SMTP">
                    <Input placeholder="smtp.example.com" />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="smtpPort" label="Cổng">
                    <InputNumber
                      min={1}
                      max={65535}
                      style={{ width: "100%" }}
                    />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={12}>
                <Col span={12}>
                  <Form.Item name="smtpUserName" label="Tài khoản">
                    <Input autoComplete="off" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="smtpPassword"
                    label={
                      data?.hasSmtpPassword
                        ? "Mật khẩu (để trống nếu giữ nguyên)"
                        : "Mật khẩu"
                    }
                  >
                    <Input.Password autoComplete="new-password" />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={12}>
                <Col span={12}>
                  <Form.Item
                    name="smtpSenderAddress"
                    label="Địa chỉ gửi"
                    rules={[{ type: "email", message: "Email không hợp lệ" }]}
                  >
                    <Input placeholder="noreply@example.com" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="smtpSenderDisplayName"
                    label="Tên hiển thị"
                  >
                    <Input />
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item
                name="smtpEnableSsl"
                label="Sử dụng SSL/TLS"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            </Card>
          </Col>

          <Col xs={24} lg={12}>
            <Card
              title={
                <span>
                  <HomeOutlined style={{ marginRight: 8 }} />
                  Thông tin trang chủ
                </span>
              }
              size="small"
            >
              <Form.Item name="homepageTitle" label="Tiêu đề hệ thống">
                <Input />
              </Form.Item>
              <Form.Item name="homepageDescription" label="Mô tả">
                <Input.TextArea rows={2} />
              </Form.Item>
              <Row gutter={12}>
                <Col span={12}>
                  <Form.Item name="contactPhone" label="Điện thoại liên hệ">
                    <Input />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="contactEmail"
                    label="Email liên hệ"
                    rules={[{ type: "email", message: "Email không hợp lệ" }]}
                  >
                    <Input />
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item name="contactAddress" label="Địa chỉ">
                <Input />
              </Form.Item>
            </Card>
          </Col>

          <Col xs={24}>
            <Card
              title={
                <span>
                  <PictureOutlined style={{ marginRight: 8 }} />
                  Giao diện
                </span>
              }
              size="small"
            >
              <Row gutter={[24, 16]}>
                <Col xs={24} lg={12}>
                  <BrandingUploader
                    kind="logo"
                    label="Logo ứng dụng"
                    hasImage={data?.hasLogo ?? false}
                    disabled={!canEdit}
                  />
                </Col>
                <Col xs={24} lg={12}>
                  <BrandingUploader
                    kind="login-background"
                    label="Ảnh nền màn hình đăng nhập"
                    hasImage={data?.hasLoginBackground ?? false}
                    disabled={!canEdit}
                  />
                </Col>
              </Row>
            </Card>
          </Col>
        </Row>

        {canEdit && (
          <div style={{ marginTop: 16 }}>
            <Button
              type="primary"
              htmlType="submit"
              icon={<SaveOutlined />}
              loading={update.isPending}
            >
              Lưu cấu hình
            </Button>
          </div>
        )}
      </Form>
    </div>
  );
}
