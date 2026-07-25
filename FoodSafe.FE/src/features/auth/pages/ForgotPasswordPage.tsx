import { useState } from "react";
import {
  Button,
  Card,
  Form,
  Input,
  Result,
  Space,
  Typography,
  message,
} from "antd";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { authApi } from "../api/authApi";

const schema = z.object({
  email: z.string().email("Vui lòng nhập địa chỉ email hợp lệ"),
});

type FormData = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [submitted, setSubmitted] = useState(false);
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: "" },
  });
  const mutation = useMutation({
    mutationFn: ({ email }: FormData) => authApi.sendPasswordResetCode(email),
    onSuccess: () => setSubmitted(true),
    onError: () => {
      message.error("Không thể xử lý yêu cầu lúc này. Vui lòng thử lại sau.");
    },
  });

  return (
    <div style={pageStyle}>
      <Card style={{ width: 440 }}>
        {submitted ? (
          <Result
            status="success"
            title="Đã tiếp nhận yêu cầu"
            subTitle="Nếu email thuộc một tài khoản, hướng dẫn đặt lại mật khẩu sẽ được gửi đến email đó."
            extra={
              <Button onClick={() => navigate("/login")}>
                Về trang đăng nhập
              </Button>
            }
          />
        ) : (
          <Space direction="vertical" size={20} style={{ width: "100%" }}>
            <div>
              <Typography.Title level={3}>Quên mật khẩu</Typography.Title>
              <Typography.Text type="secondary">
                Nhập email đã đăng ký để nhận liên kết đặt lại mật khẩu.
              </Typography.Text>
            </div>
            <Form
              layout="vertical"
              onFinish={handleSubmit((data) => mutation.mutate(data))}
            >
              <Form.Item
                label="Email"
                required
                validateStatus={errors.email ? "error" : ""}
                help={errors.email?.message}
              >
                <Controller
                  name="email"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      type="email"
                      autoComplete="email"
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
                Gửi hướng dẫn
              </Button>
            </Form>
            <Button type="link" block onClick={() => navigate("/login")}>
              Về trang đăng nhập
            </Button>
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
