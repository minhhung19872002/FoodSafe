import { useCallback, useState } from "react";
import {
  Alert,
  Button,
  Form,
  Input,
  Result,
  Select,
  Space,
  Typography,
} from "antd";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import axios from "axios";
import { CaptchaWidget } from "@/features/auth/components/CaptchaWidget";
import { PublicShell } from "../components/PublicShell";
import { useSubmitAlertReport } from "../api/publicPortalMutations";
import {
  ALERT_CATEGORY_CONFIG,
  type AlertCategory,
} from "../types/publicPortal.types";

const alertReportSchema = z.object({
  title: z
    .string()
    .min(1, "Vui lòng nhập tiêu đề")
    .max(500, "Tiêu đề không được vượt quá 500 ký tự"),
  content: z
    .string()
    .min(1, "Vui lòng nhập nội dung phản ánh")
    .max(8000, "Nội dung không được vượt quá 8000 ký tự"),
  category: z.number({ message: "Vui lòng chọn danh mục" }).int().min(1).max(6),
  affectedArea: z.string().max(500).optional(),
  affectedProducts: z.string().max(500).optional(),
  reporterName: z.string().max(200).optional(),
  reporterPhone: z
    .string()
    .max(20)
    .optional()
    .refine(
      (v) => !v || /^[0-9+\-\s()]{7,20}$/.test(v),
      "Số điện thoại không hợp lệ",
    ),
  reporterEmail: z
    .string()
    .optional()
    .refine((v) => !v || z.string().email().safeParse(v).success, "Email không hợp lệ"),
  captchaToken: z.string().min(1, "Vui lòng hoàn thành xác minh CAPTCHA"),
});

type AlertReportFormData = z.infer<typeof alertReportSchema>;

const CATEGORY_OPTIONS = (
  Object.entries(ALERT_CATEGORY_CONFIG) as [string, { label: string }][]
).map(([key, cfg]) => ({
  value: Number(key),
  label: cfg.label,
}));

function resolveErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    if (status === 429) {
      return "Bạn đã gửi quá nhiều yêu cầu. Vui lòng thử lại sau ít phút.";
    }
    if (status === 400) {
      const data = error.response?.data as Record<string, unknown> | undefined;
      const detail = data?.error as { message?: string } | undefined;
      if (detail?.message) return detail.message;
      return "Xác minh CAPTCHA thất bại hoặc dữ liệu không hợp lệ. Vui lòng thử lại.";
    }
  }
  return "Đã xảy ra lỗi khi gửi phản ánh. Vui lòng thử lại.";
}

export default function CitizenAlertReportPage() {
  const submitMutation = useSubmitAlertReport();
  const [captchaResetKey, setCaptchaResetKey] = useState(0);
  const [submitError, setSubmitError] = useState("");

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<AlertReportFormData>({
    resolver: zodResolver(alertReportSchema),
    defaultValues: {
      title: "",
      content: "",
      category: undefined,
      affectedArea: "",
      affectedProducts: "",
      reporterName: "",
      reporterPhone: "",
      reporterEmail: "",
      captchaToken: "",
    },
  });

  const handleCaptchaToken = useCallback(
    (token: string) => {
      setValue("captchaToken", token, { shouldValidate: true });
    },
    [setValue],
  );

  const onSubmit = (data: AlertReportFormData) => {
    setSubmitError("");
    submitMutation.mutate(
      {
        title: data.title,
        content: data.content,
        category: data.category as AlertCategory,
        affectedArea: data.affectedArea || undefined,
        affectedProducts: data.affectedProducts || undefined,
        reporterName: data.reporterName || undefined,
        reporterPhone: data.reporterPhone || undefined,
        reporterEmail: data.reporterEmail || undefined,
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
          title="Phản ánh đã được gửi thành công"
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
              Gửi phản ánh khác
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
          Gửi phản ánh về an toàn thực phẩm
        </Typography.Title>
        <Typography.Paragraph type="secondary" style={{ marginBottom: 32 }}>
          Bạn có thể gửi phản ánh, báo cáo sự cố an toàn thực phẩm tới Chi cục
          An toàn vệ sinh thực phẩm tỉnh Quảng Ninh. Thông tin liên hệ của bạn
          là không bắt buộc.
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
            label="Tiêu đề phản ánh"
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
                  placeholder="Mô tả ngắn gọn vấn đề phản ánh (tối đa 500 ký tự)"
                  showCount
                  maxLength={500}
                />
              )}
            />
          </Form.Item>

          <Form.Item
            label="Danh mục"
            required
            validateStatus={errors.category ? "error" : ""}
            help={errors.category?.message}
          >
            <Controller
              name="category"
              control={control}
              render={({ field }) => (
                <Select
                  {...field}
                  placeholder="Chọn danh mục"
                  options={CATEGORY_OPTIONS}
                  style={{ width: "100%" }}
                />
              )}
            />
          </Form.Item>

          <Form.Item
            label="Nội dung phản ánh"
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
                  placeholder="Mô tả chi tiết sự cố, vi phạm hoặc vấn đề an toàn thực phẩm (tối đa 8000 ký tự)"
                  showCount
                  maxLength={8000}
                />
              )}
            />
          </Form.Item>

          <Form.Item
            label="Địa bàn bị ảnh hưởng"
            validateStatus={errors.affectedArea ? "error" : ""}
            help={errors.affectedArea?.message}
          >
            <Controller
              name="affectedArea"
              control={control}
              render={({ field }) => (
                <Input {...field} placeholder="Ví dụ: Xã An Sinh, huyện Đông Triều" />
              )}
            />
          </Form.Item>

          <Form.Item
            label="Sản phẩm / cơ sở liên quan"
            validateStatus={errors.affectedProducts ? "error" : ""}
            help={errors.affectedProducts?.message}
          >
            <Controller
              name="affectedProducts"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  placeholder="Tên sản phẩm, tên cơ sở hoặc địa chỉ liên quan"
                />
              )}
            />
          </Form.Item>

          <Typography.Title level={5} style={{ marginTop: 8, marginBottom: 16 }}>
            Thông tin người phản ánh (không bắt buộc)
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
              label="Số điện thoại"
              style={{ flex: 1, marginBottom: 16 }}
              validateStatus={errors.reporterPhone ? "error" : ""}
              help={errors.reporterPhone?.message}
            >
              <Controller
                name="reporterPhone"
                control={control}
                render={({ field }) => (
                  <Input {...field} placeholder="Số điện thoại liên hệ" />
                )}
              />
            </Form.Item>

            <Form.Item
              label="Email"
              style={{ flex: 1, marginBottom: 16 }}
              validateStatus={errors.reporterEmail ? "error" : ""}
              help={errors.reporterEmail?.message}
            >
              <Controller
                name="reporterEmail"
                control={control}
                render={({ field }) => (
                  <Input {...field} type="email" placeholder="Email liên hệ" />
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
              Gửi phản ánh
            </Button>
          </Form.Item>
        </Form>
      </div>
    </PublicShell>
  );
}
