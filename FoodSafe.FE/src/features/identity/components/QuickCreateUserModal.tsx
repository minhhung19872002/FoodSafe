import { Form, Input, Modal, Select } from "antd";
import type { OrganizationTreeNode } from "@/features/organizations/types/organization.types";
import type { AdminRole, SaveUserInput } from "../types/identity.types";

interface OrganizationOption {
  value: string;
  label: string;
}

function flattenOrganizations(
  items: OrganizationTreeNode[],
  depth = 0,
): OrganizationOption[] {
  return items.flatMap((item) => [
    {
      value: item.id,
      label: `${" ".repeat(depth * 3)}${item.code} — ${item.name}`,
    },
    ...flattenOrganizations(item.children, depth + 1),
  ]);
}

interface QuickCreateUserModalProps {
  open: boolean;
  roles: AdminRole[];
  organizationTree: OrganizationTreeNode[];
  loading: boolean;
  onCancel: () => void;
  onSubmit: (input: SaveUserInput) => void;
}

export function QuickCreateUserModal({
  open,
  roles,
  organizationTree,
  loading,
  onCancel,
  onSubmit,
}: QuickCreateUserModalProps) {
  const [form] = Form.useForm<{
    userName: string;
    fullName: string;
    email: string;
    organizationId: string;
    roleNames: string[];
  }>();

  const orgOptions = flattenOrganizations(organizationTree);
  const roleOptions = roles
    .filter((r) => r.isActive)
    .map((r) => ({ value: r.name, label: r.name }));

  return (
    <Modal
      title="Tạo nhanh tài khoản"
      open={open}
      width={480}
      okText="Tạo tài khoản"
      cancelText="Hủy"
      confirmLoading={loading}
      destroyOnHidden
      onCancel={onCancel}
      onOk={() => form.submit()}
    >
      <Form
        form={form}
        layout="vertical"
        preserve={false}
        onFinish={(values) =>
          onSubmit({
            ...values,
            geographyScopes: [],
          })
        }
      >
        <Form.Item
          name="fullName"
          label="Họ và tên"
          rules={[
            {
              required: true,
              whitespace: true,
              message: "Vui lòng nhập họ và tên",
            },
          ]}
        >
          <Input placeholder="Nguyễn Văn A" maxLength={200} autoFocus />
        </Form.Item>
        <Form.Item
          name="userName"
          label="Tên đăng nhập"
          extra="Chữ không dấu, số và dấu gạch dưới _"
          rules={[
            { required: true, message: "Vui lòng nhập tên đăng nhập" },
            {
              pattern: /^[A-Za-z0-9_]{3,50}$/,
              message:
                "Từ 3 đến 50 ký tự, chỉ gồm chữ không dấu, số và dấu gạch dưới _",
            },
          ]}
        >
          <Input placeholder="nguyenvana" maxLength={50} />
        </Form.Item>
        <Form.Item
          name="email"
          label="Email"
          rules={[
            { required: true, message: "Vui lòng nhập email" },
            { type: "email", message: "Email không hợp lệ" },
          ]}
        >
          <Input placeholder="example@quangninh.gov.vn" maxLength={256} />
        </Form.Item>
        <Form.Item
          name="organizationId"
          label="Đơn vị"
          rules={[{ required: true, message: "Vui lòng chọn đơn vị" }]}
        >
          <Select
            showSearch
            optionFilterProp="label"
            placeholder="Chọn đơn vị"
            options={orgOptions}
          />
        </Form.Item>
        <Form.Item
          name="roleNames"
          label="Vai trò"
          rules={[
            { required: true, message: "Vui lòng chọn ít nhất 1 vai trò" },
          ]}
        >
          <Select
            mode="multiple"
            placeholder="Chọn vai trò"
            options={roleOptions}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}
