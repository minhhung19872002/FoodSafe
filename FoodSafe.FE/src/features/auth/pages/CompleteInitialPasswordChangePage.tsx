import { useCallback } from "react";
import { Button, Card, Form, Input, Space, Typography } from "antd";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "react-router-dom";
import { CaptchaWidget } from "../components/CaptchaWidget";
import { useCompleteInitialPasswordChange } from "../api/authMutations";

const schema = z
  .object({
    userNameOrEmailAddress: z.string().min(1, "Nhập tên đăng nhập hoặc email"),
    currentPassword: z.string().min(1, "Nhập mật khẩu hiện tại"),
    newPassword: z
      .string()
      .min(8, "Mật khẩu tối thiểu 8 ký tự")
      .regex(
        /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])/,
        "Mật khẩu phải có chữ, số và ký tự đặc biệt",
      ),
    confirmPassword: z.string().min(1, "Xác nhận mật khẩu mới"),
    captchaToken: z.string().min(1, "Hoàn thành xác minh CAPTCHA"),
  })
  .refine((value) => value.newPassword === value.confirmPassword, {
    path: ["confirmPassword"],
    message: "Mật khẩu xác nhận không khớp",
  });

type FormData = z.infer<typeof schema>;

export default function CompleteInitialPasswordChangePage() {
  const location = useLocation();
  const userName = (location.state as { userName?: string } | null)?.userName ?? "";
  const mutation = useCompleteInitialPasswordChange();
  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      userNameOrEmailAddress: userName,
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
      captchaToken: "",
    },
  });
  const handleCaptcha = useCallback(
    (token: string) =>
      setValue("captchaToken", token, { shouldValidate: true }),
    [setValue],
  );

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background: "linear-gradient(135deg, #1677ff 0%, #0958d9 100%)",
      }}
    >
      <Card style={{ width: 440 }}>
        <Space direction="vertical" size={16} style={{ width: "100%" }}>
          <Typography.Title level={3} style={{ margin: 0 }}>
            Thiết lập mật khẩu mới
          </Typography.Title>
          <Typography.Paragraph type="secondary">
            Tài khoản này phải đổi mật khẩu trước lần đăng nhập đầu tiên.
          </Typography.Paragraph>
          <Form
            layout="vertical"
            onFinish={handleSubmit((values) =>
              mutation.mutate({
                userNameOrEmailAddress: values.userNameOrEmailAddress,
                currentPassword: values.currentPassword,
                newPassword: values.newPassword,
                captchaToken: values.captchaToken,
              }),
            )}
          >
            <Form.Item
              label="Tên đăng nhập hoặc email"
              validateStatus={errors.userNameOrEmailAddress ? "error" : ""}
              help={errors.userNameOrEmailAddress?.message}
            >
              <Controller
                name="userNameOrEmailAddress"
                control={control}
                render={({ field }) => (
                  <Input {...field} autoComplete="username" />
                )}
              />
            </Form.Item>
            <Form.Item
              label="Mật khẩu hiện tại"
              validateStatus={errors.currentPassword ? "error" : ""}
              help={errors.currentPassword?.message}
            >
              <Controller
                name="currentPassword"
                control={control}
                render={({ field }) => (
                  <Input.Password {...field} autoComplete="current-password" />
                )}
              />
            </Form.Item>
            <Form.Item
              label="Mật khẩu mới"
              validateStatus={errors.newPassword ? "error" : ""}
              help={errors.newPassword?.message}
            >
              <Controller
                name="newPassword"
                control={control}
                render={({ field }) => (
                  <Input.Password {...field} autoComplete="new-password" />
                )}
              />
            </Form.Item>
            <Form.Item
              label="Xác nhận mật khẩu mới"
              validateStatus={errors.confirmPassword ? "error" : ""}
              help={errors.confirmPassword?.message}
            >
              <Controller
                name="confirmPassword"
                control={control}
                render={({ field }) => (
                  <Input.Password {...field} autoComplete="new-password" />
                )}
              />
            </Form.Item>
            <Form.Item
              validateStatus={errors.captchaToken ? "error" : ""}
              help={errors.captchaToken?.message}
            >
              <CaptchaWidget
                onTokenChange={handleCaptcha}
                resetKey={mutation.failureCount}
              />
            </Form.Item>
            <Button
              block
              type="primary"
              htmlType="submit"
              loading={mutation.isPending}
            >
              Đổi mật khẩu
            </Button>
          </Form>
        </Space>
      </Card>
    </div>
  );
}
