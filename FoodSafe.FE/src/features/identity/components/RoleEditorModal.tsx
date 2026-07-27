import { useEffect } from "react";
import { Form, Input, Modal, Switch } from "antd";
import type { AdminRole, SaveRoleInput } from "../types/identity.types";

interface Props {
  open: boolean;
  role?: AdminRole;
  loading: boolean;
  onCancel: () => void;
  onSubmit: (input: SaveRoleInput) => void;
}

export function RoleEditorModal({
  open,
  role,
  loading,
  onCancel,
  onSubmit,
}: Props) {
  const [form] = Form.useForm<SaveRoleInput>();

  useEffect(() => {
    if (!open) return;
    form.setFieldsValue(
      role
        ? {
            name: role.name,
            description: role.description,
            isActive: role.isActive,
            concurrencyStamp: role.concurrencyStamp,
          }
        : { isActive: true },
    );
  }, [form, open, role]);

  return (
    <Modal
      open={open}
      title={role ? "Cập nhật vai trò" : "Tạo vai trò"}
      okText="Lưu"
      cancelText="Hủy"
      confirmLoading={loading}
      onCancel={onCancel}
      onOk={() => form.submit()}
      afterOpenChange={(isOpen) => {
        if (!isOpen) form.resetFields();
      }}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={(values) =>
          onSubmit({ ...values, concurrencyStamp: role?.concurrencyStamp })
        }
      >
        <Form.Item
          name="name"
          label="Tên vai trò"
          rules={[{ required: true, whitespace: true }]}
        >
          <Input maxLength={64} disabled={role?.isStatic} autoFocus />
        </Form.Item>
        <Form.Item name="description" label="Mô tả">
          <Input.TextArea maxLength={500} showCount rows={3} />
        </Form.Item>
        {role && (
          <Form.Item
            name="isActive"
            label="Đang hoạt động"
            valuePropName="checked"
          >
            <Switch disabled={role.isStatic && role.name === "SystemAdmin"} />
          </Form.Item>
        )}
      </Form>
    </Modal>
  );
}
