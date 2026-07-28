import { Form, Input, Button, Typography } from "antd";
import { UserOutlined, LockOutlined } from "@ant-design/icons";
import { useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  brandingLoginBackgroundUrl,
  brandingLogoUrl,
  useBranding,
} from "@/hooks/useBranding";
import { useLogin } from "../api/authMutations";
import { CaptchaWidget } from "../components/CaptchaWidget";

const loginSchema = z.object({
  captchaToken: z.string().min(1, "Vui lòng hoàn thành xác minh CAPTCHA"),
  userNameOrEmailAddress: z.string().min(1, "Vui lòng nhập tên đăng nhập"),
  password: z.string().min(1, "Vui lòng nhập mật khẩu"),
});

type LoginFormData = z.infer<typeof loginSchema>;

const DEFAULT_ORGANIZATION =
  "Chi cục An toàn vệ sinh thực phẩm tỉnh Quảng Ninh";

export default function LoginPage() {
  const loginMutation = useLogin();
  const navigate = useNavigate();
  const branding = useBranding();

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
    <div className="login-page">
      <aside
        className="login-aside"
        style={
          branding.data?.hasLoginBackground
            ? {
                background: `linear-gradient(160deg, rgba(10,107,46,0.92) 0%, rgba(18,138,62,0.86) 100%), url(${brandingLoginBackgroundUrl}) center/cover no-repeat`,
              }
            : undefined
        }
      >
        <div className="login-aside-brand">
          <div className="login-aside-mark">
            {branding.data?.hasLogo ? (
              <img
                src={brandingLogoUrl}
                alt=""
                style={{ height: 30, objectFit: "contain" }}
              />
            ) : (
              "AT"
            )}
          </div>
          <div style={{ fontWeight: 700, fontSize: 16 }}>
            <strong style={{ fontWeight: 700 }}>FoodSafe</strong> · Quảng Ninh
          </div>
        </div>

        <div className="login-aside-body">
          <h1 className="login-aside-title">
            Hệ thống quản lý
            <br />
            An toàn thực phẩm
          </h1>
          <p className="login-aside-lead">
            Nền tảng nghiệp vụ dành cho cán bộ quản lý: cấp phép, thanh tra,
            giám sát nguy cơ và báo cáo toàn tỉnh trên một hệ thống duy nhất.
          </p>
        </div>

        <div className="login-aside-legal">
          © {new Date().getFullYear()} {DEFAULT_ORGANIZATION}
        </div>
      </aside>

      <main className="login-panel">
        <div className="login-form">
          <h1 className="login-form-title">Đăng nhập</h1>
          <p className="login-form-sub">
            {branding.data?.homepageDescription ?? DEFAULT_ORGANIZATION}
          </p>

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

          <div className="login-form-footer">
            <Link to="/cong-thong-tin">← Về cổng thông tin công khai</Link>
          </div>
        </div>
      </main>
    </div>
  );
}
