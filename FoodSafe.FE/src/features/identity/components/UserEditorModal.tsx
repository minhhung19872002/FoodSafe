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
import { useCommunesByProvince, useProvinces } from "@/hooks/useGeography";
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

function flatOrganizations(
  items: OrganizationTreeNode[],
): OrganizationTreeNode[] {
  return items.flatMap((item) => [item, ...flatOrganizations(item.children)]);
}

interface ScopeEditorProps {
  organizations: OrganizationTreeNode[];
  value?: GeographyScopeInput;
  onChange?: (value: GeographyScopeInput) => void;
}

function ScopeEditor({ organizations, value, onChange }: ScopeEditorProps) {
  const scope = value ?? {
    canView: true,
    canCreate: false,
    canEdit: false,
    canDelete: false,
  };
  const provinces = useProvinces();
  const flat = flatOrganizations(organizations);

  // Dòng đã lưu chỉ mang organizationId; suy ra địa bàn từ chính đơn vị đó để
  // hai ô lọc hiển thị đúng khi mở lại form.
  const selectedOrganization = scope.organizationId
    ? flat.find((item) => item.id === scope.organizationId)
    : undefined;
  const provinceId =
    scope.provinceId ?? selectedOrganization?.provinceId ?? undefined;
  const communeId =
    scope.communeId ?? selectedOrganization?.communeId ?? undefined;

  const communes = useCommunesByProvince(provinceId ?? "");
  const update = (changes: Partial<GeographyScopeInput>) =>
    onChange?.({ ...scope, ...changes });

  const organizationOptions = flat
    .filter((item) => item.isActive || item.id === scope.organizationId)
    .filter((item) => !provinceId || item.provinceId === provinceId)
    // Phường/xã chỉ dùng để lọc khi đã chọn — đơn vị cấp tỉnh không có communeId
    // nên sẽ bị loại, đúng ý "đơn vị thuộc phường/xã đã chọn".
    .filter((item) => !communeId || item.communeId === communeId)
    .map((item) => ({ value: item.id, label: `${item.code} — ${item.name}` }));

  return (
    <Space direction="vertical" style={{ width: "100%" }}>
      <Space wrap>
        <Select
          aria-label="Tỉnh, thành phố"
          placeholder="Tỉnh/thành"
          value={provinceId}
          loading={provinces.isLoading}
          options={provinces.data?.items.map((item) => ({
            value: item.id,
            label: item.name,
          }))}
          style={{ width: 180 }}
          onChange={(nextProvinceId) =>
            update({
              provinceId: nextProvinceId,
              communeId: undefined,
              organizationId: undefined,
            })
          }
        />
        <Select
          aria-label="Phường, xã"
          allowClear
          placeholder="Phường/xã"
          value={communeId}
          disabled={!provinceId}
          loading={communes.isLoading}
          options={communes.data?.items.map((item) => ({
            value: item.id,
            label: item.name,
          }))}
          style={{ width: 180 }}
          onChange={(nextCommuneId) =>
            update({ communeId: nextCommuneId, organizationId: undefined })
          }
        />
        <Select
          aria-label="Đơn vị"
          allowClear
          showSearch
          optionFilterProp="label"
          placeholder="Đơn vị (tùy chọn)"
          value={scope.organizationId}
          disabled={!provinceId}
          options={organizationOptions}
          style={{ width: 260 }}
          notFoundContent="Không có đơn vị trong địa bàn đã chọn"
          onChange={(organizationId) =>
            // Chọn đơn vị: gửi lên server đúng một mục tiêu là đơn vị, tỉnh/xã
            // giữ lại trong state chỉ để hiển thị bộ lọc.
            update({ organizationId: organizationId ?? undefined })
          }
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
              communeId: scope.communeId,
              organizationId: scope.organizationId,
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
            // Mỗi dòng chỉ gửi đúng một mục tiêu (ràng buộc chk_msa_one_target):
            // đã chọn đơn vị thì bỏ địa bàn, còn lại thì phường/xã ưu tiên hơn
            // tỉnh/thành phố.
            geographyScopes: values.geographyScopes.map((scope) =>
              scope.organizationId
                ? {
                    ...scope,
                    provinceId: undefined,
                    communeId: undefined,
                  }
                : {
                    ...scope,
                    organizationId: undefined,
                    provinceId: !scope.communeId ? scope.provinceId : undefined,
                    communeId: scope.communeId,
                  },
            ),
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
                  : "Chữ không dấu, số và dấu gạch dưới _"
              }
              rules={
                user
                  ? []
                  : [
                      { required: true, message: "Nhập tên đăng nhập" },
                      {
                        pattern: /^[A-Za-z0-9_]{3,50}$/,
                        message:
                          "Từ 3 đến 50 ký tự, chỉ gồm chữ không dấu, số và dấu gạch dưới _",
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
            <Form.Item
              name="phoneNumber"
              label="Số điện thoại"
              rules={[
                {
                  pattern: /^[0-9+()\-.\s]{6,20}$/,
                  message: "Số điện thoại không hợp lệ",
                },
              ]}
            >
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
                          scope?.communeId ||
                          scope?.organizationId
                            ? Promise.resolve()
                            : Promise.reject(
                                new Error("Chọn địa bàn hoặc đơn vị"),
                              ),
                      },
                    ]}
                  >
                    <ScopeEditor organizations={organizationTree} />
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
