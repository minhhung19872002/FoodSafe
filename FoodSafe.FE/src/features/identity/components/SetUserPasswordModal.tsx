import { Alert, Form, Input, Modal } from "antd";
import {
  DEFAULT_PASSWORD_POLICY,
  describePasswordPolicy,
  passwordPolicySchema,
  usePasswordPolicy,
} from "@/hooks/usePasswordPolicy";
import type { AdminUser } from "../types/identity.types";

interface Props {
  user?: AdminUser;
  loading: boolean;
  onCancel: () => void;
  onSubmit: (newPassword: string) => void;
}

export function SetUserPasswordModal({
  user,
  loading,
  onCancel,
  onSubmit,
}: Props) {
  const [form] = Form.useForm<{
    newPassword: string;
    confirmPassword: string;
  }>();
  const { data: policy } = usePasswordPolicy();
  const activePolicy = policy ?? DEFAULT_PASSWORD_POLICY;

  return (
    <Modal
      title={user ? `Đặt mật khẩu cho ${user.fullName}` : "Đặt mật khẩu"}
      open={Boolean(user)}
      okText="Đặt mật khẩu"
      cancelText="Hủy"
      confirmLoading={loading}
      destroyOnHidden
      onCancel={onCancel}
      onOk={() => form.submit()}
    >
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        message="Mật khẩu mới có hiệu lực ngay, người dùng có thể đăng nhập trực tiếp bằng mật khẩu này."
        description={describePasswordPolicy(activePolicy)}
      />
      <Form
        form={form}
        layout="vertical"
        preserve={false}
        onFinish={(values) => onSubmit(values.newPassword)}
      >
        <Form.Item
          name="newPassword"
          label="Mật khẩu mới"
          rules={[
            { required: true, message: "Vui lòng nhập mật khẩu mới" },
            {
              validator: (_, value: string | undefined) => {
                if (!value) return Promise.resolve();
                const result =
                  passwordPolicySchema(activePolicy).safeParse(value);
                return result.success
                  ? Promise.resolve()
                  : Promise.reject(
                      new Error(
                        result.error.issues[0]?.message ??
                          "Mật khẩu không hợp lệ",
                      ),
                    );
              },
            },
          ]}
        >
          <Input.Password autoComplete="new-password" autoFocus />
        </Form.Item>
        <Form.Item
          name="confirmPassword"
          label="Xác nhận mật khẩu mới"
          dependencies={["newPassword"]}
          rules={[
            { required: true, message: "Vui lòng xác nhận mật khẩu mới" },
            ({ getFieldValue }) => ({
              validator(_, value: string | undefined) {
                if (!value || getFieldValue("newPassword") === value) {
                  return Promise.resolve();
                }
                return Promise.reject(
                  new Error("Mật khẩu xác nhận không khớp"),
                );
              },
            }),
          ]}
        >
          <Input.Password autoComplete="new-password" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
