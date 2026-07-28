import { useCallback, useState } from "react";
import { Alert, Button, Form, Input, Result, Space, Typography } from "antd";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import axios from "axios";
import { CaptchaWidget } from "@/features/auth/components/CaptchaWidget";
import { PublicShell } from "../components/PublicShell";
import { useSubmitNewsReport } from "../api/publicPortalMutations";

const newsReportSchema = z.object({
  title: z
    .string()
    .min(1, "Vui lòng nhập tiêu đề")
    .max(500, "Tiêu đề không được vượt quá 500 ký tự"),
  content: z
    .string()
    .min(1, "Vui lòng nhập nội dung tin")
    .max(8000, "Nội dung không được vượt quá 8000 ký tự"),
  reporterName: z.string().max(200).optional(),
  reporterContact: z.string().max(200).optional(),
  captchaToken: z.string().min(1, "Vui lòng hoàn thành xác minh CAPTCHA"),
});

type NewsReportFormData = z.infer<typeof newsReportSchema>;

function resolveErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    if (status === 429) {
      return "Bạn đã gửi quá nhiều yêu cầu. Vui lòng thử lại sau ít phút.";
    }
    if (status === 400) {
      return "Xác minh CAPTCHA thất bại hoặc dữ liệu không hợp lệ. Vui lòng thử lại.";
    }
  }
  return "Đã xảy ra lỗi khi gửi tin. Vui lòng thử lại.";
}

export default function CitizenNewsReportPage() {
  const submitMutation = useSubmitNewsReport();
  const [captchaResetKey, setCaptchaResetKey] = useState(0);
  const [submitError, setSubmitError] = useState("");

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<NewsReportFormData>({
    resolver: zodResolver(newsReportSchema),
    defaultValues: {
      title: "",
      content: "",
      reporterName: "",
      reporterContact: "",
      captchaToken: "",
    },
  });

  const handleCaptchaToken = useCallback(
    (token: string) => {
      setValue("captchaToken", token, { shouldValidate: true });
    },
    [setValue],
  );

  const onSubmit = (data: NewsReportFormData) => {
    setSubmitError("");
    submitMutation.mutate(
      {
        title: data.title,
        content: data.content,
        reporterName: data.reporterName || undefined,
        reporterContact: data.reporterContact || undefined,
        captchaToken: data.captchaToken,
      },
      {
        onError: (error) => {
          setSubmitError(resolveErrorMessage(error));
          setCaptchaResetKey((k) => k + 1);
        },
      },
    );
  };

  if (submitMutation.isSuccess && submitMutation.data) {
    return (
      <PublicShell>
        <Result
          status="success"
          title="Tin đã được gửi thành công"
          subTitle={submitMutation.data.message}
          extra={[
            <Button
              type="primary"
              key="home"
              onClick={() => window.location.assign("/cong-thong-tin")}
            >
              Về trang chủ
            </Button>,
            <Button
              key="another"
              onClick={() => {
                submitMutation.reset();
                setSubmitError("");
                setCaptchaResetKey((k) => k + 1);
              }}
            >
              Gửi tin khác
            </Button>,
          ]}
        />
      </PublicShell>
    );
  }

  return (
    <PublicShell>
      <div style={{ maxWidth: 760 }}>
        <Typography.Title level={3} style={{ marginBottom: 8 }}>
          Gửi tin về an toàn thực phẩm
        </Typography.Title>
        <Typography.Paragraph type="secondary" style={{ marginBottom: 32 }}>
          Bạn có thể gửi tin tức, thông tin cảnh báo về an toàn thực phẩm. Tin
          sẽ được cơ quan chức năng xem xét trước khi đăng tải công khai.
        </Typography.Paragraph>

        {submitError && (
          <Alert
            type="error"
            message={submitError}
            showIcon
            style={{ marginBottom: 24 }}
            closable
            onClose={() => setSubmitError("")}
          />
        )}

        <Form
          layout="vertical"
          onFinish={handleSubmit(onSubmit)}
          requiredMark="optional"
        >
          <Form.Item
            label="Tiêu đề tin"
            required
            validateStatus={errors.title ? "error" : ""}
            help={errors.title?.message}
          >
            <Controller
              name="title"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  placeholder="Tiêu đề tin (tối đa 500 ký tự)"
                  showCount
                  maxLength={500}
                />
              )}
            />
          </Form.Item>

          <Form.Item
            label="Nội dung tin"
            required
            validateStatus={errors.content ? "error" : ""}
            help={errors.content?.message}
          >
            <Controller
              name="content"
              control={control}
              render={({ field }) => (
                <Input.TextArea
                  {...field}
                  rows={6}
                  placeholder="Nội dung tin tức, thông tin cảnh báo (tối đa 8000 ký tự)"
                  showCount
                  maxLength={8000}
                />
              )}
            />
          </Form.Item>

          <Typography.Title
            level={5}
            style={{ marginTop: 8, marginBottom: 16 }}
          >
            Thông tin người gửi (không bắt buộc)
          </Typography.Title>

          <Space style={{ width: "100%" }} size="middle">
            <Form.Item
              label="Họ và tên"
              style={{ flex: 1, marginBottom: 16 }}
              validateStatus={errors.reporterName ? "error" : ""}
              help={errors.reporterName?.message}
            >
              <Controller
                name="reporterName"
                control={control}
                render={({ field }) => (
                  <Input {...field} placeholder="Họ và tên" />
                )}
              />
            </Form.Item>

            <Form.Item
              label="Điện thoại / Email"
              style={{ flex: 1, marginBottom: 16 }}
              validateStatus={errors.reporterContact ? "error" : ""}
              help={errors.reporterContact?.message}
            >
              <Controller
                name="reporterContact"
                control={control}
                render={({ field }) => (
                  <Input {...field} placeholder="Thông tin liên hệ" />
                )}
              />
            </Form.Item>
          </Space>

          <Form.Item
            label="Xác minh CAPTCHA"
            required
            validateStatus={errors.captchaToken ? "error" : ""}
            help={errors.captchaToken?.message}
          >
            <CaptchaWidget
              onTokenChange={handleCaptchaToken}
              resetKey={captchaResetKey}
            />
          </Form.Item>

          <Form.Item style={{ marginTop: 8 }}>
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              loading={submitMutation.isPending}
            >
              Gửi tin
            </Button>
          </Form.Item>
        </Form>
      </div>
    </PublicShell>
  );
}
