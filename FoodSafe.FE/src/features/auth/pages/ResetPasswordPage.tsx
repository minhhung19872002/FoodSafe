import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  Card,
  Form,
  Input,
  Result,
  Space,
  Spin,
  Typography,
  message,
} from "antd";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  DEFAULT_PASSWORD_POLICY,
  describePasswordPolicy,
  passwordPolicySchema,
  usePasswordPolicy,
} from "@/hooks/usePasswordPolicy";
import { authApi } from "../api/authApi";

function buildSchema(policy: ReturnType<typeof usePasswordPolicy>["data"]) {
  return z
    .object({
      password: passwordPolicySchema(policy ?? DEFAULT_PASSWORD_POLICY),
      confirmation: z.string(),
    })
    .refine((value) => value.password === value.confirmation, {
      path: ["confirmation"],
      message: "Mật khẩu xác nhận không khớp",
    });
}

type FormData = z.infer<ReturnType<typeof buildSchema>>;

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [verification, setVerification] = useState<
    "checking" | "valid" | "invalid"
  >("checking");
  const [completed, setCompleted] = useState(false);
  const userId = searchParams.get("userId") ?? "";
  const resetToken = searchParams.get("resetToken") ?? "";
  const hasRequiredParameters = useMemo(
    () => /^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(userId) && resetToken.length > 0,
    [resetToken, userId],
  );
  const { data: policy } = usePasswordPolicy();
  const effectivePolicy = policy ?? DEFAULT_PASSWORD_POLICY;
  const schema = useMemo(() => buildSchema(policy), [policy]);
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { password: "", confirmation: "" },
  });

  useEffect(() => {
    if (!hasRequiredParameters) {
      setVerification("invalid");
      return;
    }

    let active = true;
    authApi
      .verifyPasswordResetToken(userId, resetToken)
      .then(() => active && setVerification("valid"))
      .catch(() => active && setVerification("invalid"));
    return () => {
      active = false;
    };
  }, [hasRequiredParameters, resetToken, userId]);

  const mutation = useMutation({
    mutationFn: ({ password }: FormData) =>
      authApi.resetPassword({ userId, resetToken, password }),
    onSuccess: () => setCompleted(true),
    onError: () =>
      message.error("Không thể đặt lại mật khẩu. Liên kết có thể đã hết hạn."),
  });

  return (
    <div style={pageStyle}>
      <Card style={{ width: 460 }}>
        {verification === "checking" && (
          <Spin tip="Đang xác minh liên kết..." />
        )}
        {verification === "invalid" && (
          <Result
            status="error"
            title="Liên kết không hợp lệ hoặc đã hết hạn"
            extra={
              <Button onClick={() => navigate("/account/forgot-password")}>
                Gửi yêu cầu mới
              </Button>
            }
          />
        )}
        {verification === "valid" && completed && (
          <Result
            status="success"
            title="Đặt lại mật khẩu thành công"
            extra={
              <Button type="primary" onClick={() => navigate("/login")}>
                Đăng nhập
              </Button>
            }
          />
        )}
        {verification === "valid" && !completed && (
          <Space direction="vertical" size={20} style={{ width: "100%" }}>
            <Typography.Title level={3}>Đặt lại mật khẩu</Typography.Title>
            <Alert
              type="info"
              showIcon
              message={describePasswordPolicy(effectivePolicy)}
            />
            <Form
              layout="vertical"
              onFinish={handleSubmit((data) => mutation.mutate(data))}
            >
              <Form.Item
                label="Mật khẩu mới"
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
                      autoComplete="new-password"
                      size="large"
                    />
                  )}
                />
              </Form.Item>
              <Form.Item
                label="Xác nhận mật khẩu"
                required
                validateStatus={errors.confirmation ? "error" : ""}
                help={errors.confirmation?.message}
              >
                <Controller
                  name="confirmation"
                  control={control}
                  render={({ field }) => (
                    <Input.Password
                      {...field}
                      autoComplete="new-password"
                      size="large"
                    />
                  )}
                />
              </Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={mutation.isPending}
                block
                size="large"
              >
                Đặt lại mật khẩu
              </Button>
            </Form>
          </Space>
        )}
      </Card>
    </div>
  );
}

const pageStyle = {
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "#f5f7fa",
} as const;
