import { useEffect } from "react";
import {
  Button,
  Checkbox,
  Col,
  Divider,
  Form,
  Input,
  Modal,
  Row,
  Select,
  Space,
} from "antd";
import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import { useCommunes, useDistricts, useProvinces } from "@/hooks/useGeography";
import type { OrganizationTreeNode } from "@/features/organizations/types/organization.types";
import type {
  AdminRole,
  AdminUser,
  GeographyScopeInput,
  SaveUserInput,
} from "../types/identity.types";

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
      label: `${"\u00a0".repeat(depth * 3)}${item.code} — ${item.name}`,
    },
    ...flattenOrganizations(item.children, depth + 1),
  ]);
}

interface ScopeEditorProps {
  value?: GeographyScopeInput;
  onChange?: (value: GeographyScopeInput) => void;
}

function ScopeEditor({ value, onChange }: ScopeEditorProps) {
  const scope = value ?? {
    canView: true,
    canCreate: false,
    canEdit: false,
    canDelete: false,
  };
  const provinces = useProvinces();
  const districts = useDistricts(scope.provinceId ?? "");
  const communes = useCommunes(scope.districtId ?? "");
  const update = (changes: Partial<GeographyScopeInput>) =>
    onChange?.({ ...scope, ...changes });

  return (
    <Space direction="vertical" style={{ width: "100%" }}>
      <Space wrap>
        <Select
          aria-label="Tỉnh, thành phố"
          placeholder="Tỉnh/thành"
          value={scope.provinceId}
          loading={provinces.isLoading}
          options={provinces.data?.items.map((item) => ({
            value: item.id,
            label: item.name,
          }))}
          style={{ width: 180 }}
          onChange={(provinceId) =>
            update({ provinceId, districtId: undefined, communeId: undefined })
          }
        />
        <Select
          aria-label="Quận, huyện"
          allowClear
          placeholder="Quận/huyện"
          value={scope.districtId}
          disabled={!scope.provinceId}
          loading={districts.isLoading}
          options={districts.data?.items.map((item) => ({
            value: item.id,
            label: item.name,
          }))}
          style={{ width: 180 }}
          onChange={(districtId) =>
            update({ districtId, communeId: undefined })
          }
        />
        <Select
          aria-label="Phường, xã"
          allowClear
          placeholder="Phường/xã"
          value={scope.communeId}
          disabled={!scope.districtId}
          loading={communes.isLoading}
          options={communes.data?.items.map((item) => ({
            value: item.id,
            label: item.name,
          }))}
          style={{ width: 180 }}
          onChange={(communeId) => update({ communeId })}
        />
      </Space>
      <Checkbox.Group
        value={[
          ...(scope.canView ? ["canView"] : []),
          ...(scope.canCreate ? ["canCreate"] : []),
          ...(scope.canEdit ? ["canEdit"] : []),
          ...(scope.canDelete ? ["canDelete"] : []),
        ]}
        options={[
          { label: "Xem", value: "canView" },
          { label: "Tạo", value: "canCreate" },
          { label: "Sửa", value: "canEdit" },
          { label: "Xóa", value: "canDelete" },
        ]}
        onChange={(selected) =>
          update({
            canView: selected.includes("canView"),
            canCreate: selected.includes("canCreate"),
            canEdit: selected.includes("canEdit"),
            canDelete: selected.includes("canDelete"),
          })
        }
      />
    </Space>
  );
}

interface Props {
  open: boolean;
  user?: AdminUser;
  roles: AdminRole[];
  organizationTree: OrganizationTreeNode[];
  loading: boolean;
  onCancel: () => void;
  onSubmit: (input: SaveUserInput) => void;
}

export function UserEditorModal({
  open,
  user,
  roles,
  organizationTree,
  loading,
  onCancel,
  onSubmit,
}: Props) {
  const [form] = Form.useForm<SaveUserInput>();

  useEffect(() => {
    if (!open) return;
    form.setFieldsValue(
      user
        ? {
            userName: user.userName,
            fullName: user.fullName,
            email: user.email,
            phoneNumber: user.phoneNumber,
            organizationId: user.organizationId,
            position: user.position,
            department: user.department,
            roleNames: user.roleNames,
            geographyScopes: user.geographyScopes.map((scope) => ({
              provinceId: scope.provinceId,
              districtId: scope.districtId,
              communeId: scope.communeId,
              canView: scope.canView,
              canCreate: scope.canCreate,
              canEdit: scope.canEdit,
              canDelete: scope.canDelete,
              validFrom: scope.validFrom,
              validTo: scope.validTo,
            })),
            concurrencyStamp: user.concurrencyStamp,
          }
        : {
            roleNames: [],
            geographyScopes: [],
          },
    );
  }, [form, open, user]);

  return (
    <Modal
      open={open}
      width={820}
      title={user ? "Cập nhật tài khoản" : "Tạo tài khoản"}
      okText={user ? "Lưu thay đổi" : "Tạo và gửi hướng dẫn"}
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
          onSubmit({
            ...values,
            geographyScopes: values.geographyScopes.map((scope) => ({
              ...scope,
              provinceId:
                !scope.districtId && !scope.communeId
                  ? scope.provinceId
                  : undefined,
              districtId: !scope.communeId ? scope.districtId : undefined,
              communeId: scope.communeId,
            })),
            concurrencyStamp: user?.concurrencyStamp,
          })
        }
      >
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item
              name="fullName"
              label="Họ và tên"
              rules={[{ required: true, whitespace: true }]}
            >
              <Input maxLength={200} autoFocus />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item
              name="userName"
              label="Tên đăng nhập"
              // Set once at creation: changing it later would change how the
              // person signs in and break audit-trail references.
              extra={
                user
                  ? "Không thể đổi tên đăng nhập sau khi đã tạo"
                  : "Chữ không dấu, số và các ký tự . _ -"
              }
              rules={
                user
                  ? []
                  : [
                      { required: true, message: "Nhập tên đăng nhập" },
                      {
                        pattern: /^[A-Za-z0-9._-]{3,50}$/,
                        message:
                          "Từ 3 đến 50 ký tự, chỉ gồm chữ không dấu, số và . _ -",
                      },
                    ]
              }
            >
              <Input maxLength={50} disabled={Boolean(user)} />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item
              name="email"
              label="Email nhận thư"
              extra="Dùng để gửi hướng dẫn thiết lập và đặt lại mật khẩu"
              rules={[
                { required: true, message: "Nhập email" },
                { type: "email", message: "Email không hợp lệ" },
              ]}
            >
              <Input maxLength={256} />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="phoneNumber" label="Số điện thoại">
              <Input maxLength={32} />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item
              name="organizationId"
              label="Đơn vị"
              rules={[{ required: true, message: "Chọn đơn vị" }]}
            >
              <Select
                showSearch
                optionFilterProp="label"
                options={flattenOrganizations(organizationTree)}
              />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="position" label="Chức vụ">
              <Input maxLength={200} />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="department" label="Phòng ban">
              <Input maxLength={200} />
            </Form.Item>
          </Col>
        </Row>
        <Form.Item
          name="roleNames"
          label="Vai trò"
          rules={[{ required: true, message: "Chọn ít nhất một vai trò" }]}
        >
          <Select
            mode="multiple"
            options={roles
              .filter(
                (role) => role.isActive || user?.roleNames.includes(role.name),
              )
              .map((role) => ({ value: role.name, label: role.name }))}
          />
        </Form.Item>

        <Divider>Phạm vi địa bàn bổ sung</Divider>
        <Form.List name="geographyScopes">
          {(fields, { add, remove }) => (
            <Space direction="vertical" style={{ width: "100%" }}>
              {fields.map((field) => (
                <div
                  key={field.key}
                  style={{
                    border: "1px solid #d9d9d9",
                    borderRadius: 8,
                    padding: 12,
                    display: "flex",
                    gap: 12,
                  }}
                >
                  <Form.Item
                    name={field.name}
                    style={{ flex: 1, marginBottom: 0 }}
                    rules={[
                      {
                        validator: (_, scope: GeographyScopeInput) =>
                          scope?.provinceId ||
                          scope?.districtId ||
                          scope?.communeId
                            ? Promise.resolve()
                            : Promise.reject(new Error("Chọn địa bàn")),
                      },
                    ]}
                  >
                    <ScopeEditor />
                  </Form.Item>
                  <Button
                    aria-label="Xóa phạm vi"
                    danger
                    type="text"
                    icon={<DeleteOutlined />}
                    onClick={() => remove(field.name)}
                  />
                </div>
              ))}
              <Button
                type="dashed"
                icon={<PlusOutlined />}
                onClick={() =>
                  add({
                    canView: true,
                    canCreate: false,
                    canEdit: false,
                    canDelete: false,
                  })
                }
              >
                Thêm phạm vi địa bàn
              </Button>
            </Space>
          )}
        </Form.List>
      </Form>
    </Modal>
  );
}
