import { Card, Form, Input, Button, Typography, Space } from "antd";
import { UserOutlined, LockOutlined } from "@ant-design/icons";
import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLogin } from "../api/authMutations";
import { CaptchaWidget } from "../components/CaptchaWidget";

const loginSchema = z.object({
  captchaToken: z.string().min(1, "Vui lòng hoàn thành xác minh CAPTCHA"),
  userNameOrEmailAddress: z.string().min(1, "Vui lòng nhập tên đăng nhập"),
  password: z.string().min(1, "Vui lòng nhập mật khẩu"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const loginMutation = useLogin();
  const navigate = useNavigate();

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      captchaToken: "",
      userNameOrEmailAddress: "",
      password: "",
    },
  });

  const onSubmit = (data: LoginFormData) => {
    loginMutation.mutate(data);
  };

  const handleCaptchaToken = useCallback(
    (token: string) => {
      setValue("captchaToken", token, { shouldValidate: true });
    },
    [setValue],
  );

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #1677ff 0%, #0958d9 100%)",
      }}
    >
      <Card style={{ width: 400, boxShadow: "0 8px 32px rgba(0,0,0,0.12)" }}>
        <Space direction="vertical" size={24} style={{ width: "100%" }}>
          <div style={{ textAlign: "center" }}>
            <Typography.Title level={3} style={{ margin: 0, color: "#1677ff" }}>
              FoodSafe
            </Typography.Title>
            <Typography.Text type="secondary">
              Chi cục An toàn vệ sinh thực phẩm tỉnh Quảng Ninh
            </Typography.Text>
          </div>

          <Form layout="vertical" onFinish={handleSubmit(onSubmit)}>
            <Form.Item
              label="Tên đăng nhập"
              required
              validateStatus={errors.userNameOrEmailAddress ? "error" : ""}
              help={errors.userNameOrEmailAddress?.message}
            >
              <Controller
                name="userNameOrEmailAddress"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    prefix={<UserOutlined />}
                    placeholder="Tên đăng nhập hoặc email"
                    size="large"
                    autoComplete="username"
                  />
                )}
              />
            </Form.Item>

            <Form.Item
              label="Mật khẩu"
              required
              validateStatus={errors.password ? "error" : ""}
              help={errors.password?.message}
            >
              <Controller
                name="password"
                control={control}
                render={({ field }) => (
                  <Input.Password
                    {...field}
                    prefix={<LockOutlined />}
                    placeholder="Mật khẩu"
                    size="large"
                    autoComplete="current-password"
                  />
                )}
              />
            </Form.Item>

            <Form.Item
              required
              validateStatus={errors.captchaToken ? "error" : ""}
              help={errors.captchaToken?.message}
            >
              <CaptchaWidget
                onTokenChange={handleCaptchaToken}
                resetKey={loginMutation.failureCount}
              />
            </Form.Item>

            <Form.Item style={{ textAlign: "right", marginBottom: 12 }}>
              <Typography.Link
                onClick={() => navigate("/account/forgot-password")}
              >
                Quên mật khẩu?
              </Typography.Link>
            </Form.Item>

            <Form.Item style={{ marginBottom: 0 }}>
              <Button
                type="primary"
                htmlType="submit"
                size="large"
                loading={loginMutation.isPending}
                block
              >
                Đăng nhập
              </Button>
            </Form.Item>
          </Form>
        </Space>
      </Card>
    </div>
  );
}
