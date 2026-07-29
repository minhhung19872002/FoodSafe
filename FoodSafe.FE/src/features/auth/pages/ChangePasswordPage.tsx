import { useMemo } from "react";
import { Card, Form, Input, Button, Typography, Space, Alert } from "antd";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  DEFAULT_PASSWORD_POLICY,
  passwordPolicySchema,
  usePasswordPolicy,
} from "@/hooks/usePasswordPolicy";
import { useChangePassword } from "../api/authMutations";

function buildSchema(policy: ReturnType<typeof usePasswordPolicy>["data"]) {
  return z
    .object({
      currentPassword: z.string().min(1, "Vui lòng nhập mật khẩu hiện tại"),
      newPassword: passwordPolicySchema(policy ?? DEFAULT_PASSWORD_POLICY),
      confirmPassword: z.string().min(1, "Vui lòng xác nhận mật khẩu"),
    })
    .refine((d) => d.newPassword === d.confirmPassword, {
      message: "Mật khẩu xác nhận không khớp",
      path: ["confirmPassword"],
    });
}

type ChangePasswordFormData = z.infer<ReturnType<typeof buildSchema>>;

interface Props {
  isExpired?: boolean;
}

export default function ChangePasswordPage({ isExpired }: Props) {
  const changeMutation = useChangePassword();
  const { data: policy } = usePasswordPolicy();
  const schema = useMemo(() => buildSchema(policy), [policy]);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = (data: ChangePasswordFormData) => {
    changeMutation.mutate({
      currentPassword: data.currentPassword,
      newPassword: data.newPassword,
    });
  };

  return (
    <div style={{ maxWidth: 500, margin: "0 auto" }}>
      <Card>
        <Space direction="vertical" size={16} style={{ width: "100%" }}>
          <Typography.Title level={4} style={{ margin: 0 }}>
            Đổi mật khẩu
          </Typography.Title>

          {isExpired && (
            <Alert
              type="warning"
              message="Mật khẩu đã hết hạn. Vui lòng đổi mật khẩu để tiếp tục."
              showIcon
            />
          )}

          <Form layout="vertical" onFinish={handleSubmit(onSubmit)}>
            <Form.Item
              label="Mật khẩu hiện tại"
              required
              validateStatus={errors.currentPassword ? "error" : ""}
              help={errors.currentPassword?.message}
            >
              <Controller
                name="currentPassword"
                control={control}
                render={({ field }) => (
                  <Input.Password
                    {...field}
                    placeholder="Nhập mật khẩu hiện tại"
                    autoComplete="current-password"
                  />
                )}
              />
            </Form.Item>

            <Form.Item
              label="Mật khẩu mới"
              required
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
              required
              validateStatus={errors.confirmPassword ? "error" : ""}
              help={errors.confirmPassword?.message}
            >
              <Controller
                name="confirmPassword"
                control={control}
                render={({ field }) => (
                  <Input.Password
                    {...field}
                    placeholder="Nhập lại mật khẩu mới"
                    autoComplete="new-password"
                  />
                )}
              />
            </Form.Item>

            <Form.Item style={{ marginBottom: 0 }}>
              <Button
                type="primary"
                htmlType="submit"
                loading={changeMutation.isPending}
                block
              >
                Đổi mật khẩu
              </Button>
            </Form.Item>
          </Form>
        </Space>
      </Card>
    </div>
  );
}
