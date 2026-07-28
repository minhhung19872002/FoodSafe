import { useMemo, useState } from "react";
import {
  App,
  Button,
  Input,
  Popconfirm,
  Select,
  Space,
  Table,
  Tabs,
  Tag,
  Tooltip,
  Typography,
} from "antd";
import { PageHeader } from "@/components/PageHeader";
import {
  AuditOutlined,
  DeleteOutlined,
  EditOutlined,
  ExportOutlined,
  KeyOutlined,
  LockOutlined,
  PlusOutlined,
  SafetyCertificateOutlined,
  StopOutlined,
  TeamOutlined,
  UnlockOutlined,
} from "@ant-design/icons";
import { useMutation } from "@tanstack/react-query";
import dayjs from "dayjs";
import { RecordDetailDrawer } from "@/components/RecordDetailDrawer";
import { saveDownload } from "@/utils/download";
import { identityApi } from "../api/identityApi";
import { useAuthStore } from "@/features/auth/store/authStore";
import { useOrganizationTree } from "@/features/organizations/api/organizationQueries";
import type { OrganizationTreeNode } from "@/features/organizations/types/organization.types";
import {
  useCreateAdminRole,
  useCreateAdminUser,
  useDeleteAdminRole,
  useDeleteAdminUser,
  useGenerateRandomPassword,
  useSendPasswordReset,
  useSetUserActivation,
  useSetUserLock,
  useUpdateAdminRole,
  useUpdateAdminUser,
  useUpdateRolePermissions,
} from "../api/identityMutations";
import {
  useAdminRoles,
  useAdminUsers,
  usePermissionOptions,
  useRolePermissions,
  useUserActivity,
} from "../api/identityQueries";
import { RoleEditorModal } from "../components/RoleEditorModal";
import { RolePermissionsDrawer } from "../components/RolePermissionsDrawer";
import { UserActivityDrawer } from "../components/UserActivityDrawer";
import { UserEditorModal } from "../components/UserEditorModal";
import type {
  AdminRole,
  AdminUser,
  RoleFilter,
  SaveRoleInput,
  SaveUserInput,
  UserFilter,
} from "../types/identity.types";

const permission = {
  users: "FoodSafe.SystemAdmin.Users",
  createUser: "FoodSafe.SystemAdmin.Users.Create",
  editUser: "FoodSafe.SystemAdmin.Users.Edit",
  deleteUser: "FoodSafe.SystemAdmin.Users.Delete",
  manageUserRoles: "FoodSafe.SystemAdmin.Users.ManageRoles",
  manageUserScope: "FoodSafe.SystemAdmin.Users.ManageScope",
  activateUser: "FoodSafe.SystemAdmin.Users.Activate",
  lockUser: "FoodSafe.SystemAdmin.Users.Lock",
  resetPassword: "FoodSafe.SystemAdmin.Users.ResetPassword",
  activity: "FoodSafe.SystemAdmin.Users.ViewActivity",
  roles: "FoodSafe.SystemAdmin.Roles",
  createRole: "FoodSafe.SystemAdmin.Roles.Create",
  editRole: "FoodSafe.SystemAdmin.Roles.Edit",
  deleteRole: "FoodSafe.SystemAdmin.Roles.Delete",
  permissions: "FoodSafe.SystemAdmin.Roles.ManagePermissions",
} as const;

// Backend kiểm tra thêm ManageRoles + ManageScope khi tạo/cập nhật tài khoản
// (form luôn gửi kèm vai trò và phạm vi địa bàn), ngoài Users.Create / Users.Edit.
const userFormPermissions = [
  { name: permission.manageUserRoles, label: "Gán vai trò người dùng" },
  { name: permission.manageUserScope, label: "Gán phạm vi dữ liệu" },
] as const;

const pageSize = 10;

function organizationOptions(
  items: OrganizationTreeNode[],
  depth = 0,
): Array<{ value: string; label: string }> {
  return items.flatMap((item) => [
    {
      value: item.id,
      label: `${"\u00a0".repeat(depth * 3)}${item.name}`,
    },
    ...organizationOptions(item.children, depth + 1),
  ]);
}

export default function IdentityAdministrationPage() {
  const { message, modal } = App.useApp();
  const currentUser = useAuthStore((state) => state.user);
  const hasPermission = useAuthStore((state) => state.hasPermission);
  const canViewUsers = hasPermission(permission.users);
  const canViewRoles = hasPermission(permission.roles);
  const missingUserFormPermissions = userFormPermissions
    .filter((item) => !hasPermission(item.name))
    .map((item) => item.label);
  // Thiếu quyền phụ thì vô hiệu hóa nút (kèm lý do) thay vì ẩn đi,
  // để quản trị viên biết cần xin cấp thêm quyền nào.
  const userFormBlockedReason = missingUserFormPermissions.length
    ? `Bạn chưa có quyền ${missingUserFormPermissions.join(" và ")}. Liên hệ quản trị viên hệ thống để được cấp quyền.`
    : undefined;
  const [userFilter, setUserFilter] = useState<UserFilter>({
    skipCount: 0,
    maxResultCount: pageSize,
    sorting: "UserName",
  });
  const [roleFilter, setRoleFilter] = useState<RoleFilter>({
    skipCount: 0,
    maxResultCount: pageSize,
    sorting: "Name",
  });
  const [editingUser, setEditingUser] = useState<AdminUser>();
  const [detailUser, setDetailUser] = useState<AdminUser | null>(null);
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [activityUser, setActivityUser] = useState<AdminUser>();
  const [editingRole, setEditingRole] = useState<AdminRole>();
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [permissionRole, setPermissionRole] = useState<AdminRole>();
  const [activeTab, setActiveTab] = useState(canViewUsers ? "users" : "roles");

  const users = useAdminUsers(userFilter);
  const roles = useAdminRoles(roleFilter);
  const roleOptions = useAdminRoles({
    skipCount: 0,
    maxResultCount: 500,
    sorting: "Name",
    isActive: true,
  });
  const organizations = useOrganizationTree();
  const activity = useUserActivity(activityUser?.id);
  const rolePermissions = useRolePermissions(permissionRole?.id);

  const createUser = useCreateAdminUser();
  const updateUser = useUpdateAdminUser();
  const deleteUser = useDeleteAdminUser();
  const generatePassword = useGenerateRandomPassword();
  const setActivation = useSetUserActivation();
  const setLock = useSetUserLock();
  const sendReset = useSendPasswordReset();
  const permissionOptions = usePermissionOptions();
  const createRole = useCreateAdminRole();
  const updateRole = useUpdateAdminRole();
  const deleteRole = useDeleteAdminRole();
  const updatePermissions = useUpdateRolePermissions();
  const exportUsers = useMutation({
    mutationFn: () =>
      identityApi.exportUsers({
        filter: userFilter.filter,
        roleId: userFilter.roleId,
        organizationId: userFilter.organizationId,
        isActive: userFilter.isActive,
        isLocked: userFilter.isLocked,
      }),
  });

  const showSuccess = (content: string) => void message.success(content);
  const showError = () =>
    void message.error("Không thể thực hiện thao tác. Vui lòng kiểm tra lại.");

  const permissionSelectOptions = useMemo(
    () =>
      permissionOptions.data?.items.map((option) => ({
        value: option.name,
        label: option.parentName
          ? `  ${option.displayName}`
          : option.displayName,
      })) ?? [],
    [permissionOptions.data],
  );

  const roleSelectOptions = useMemo(
    () =>
      roleOptions.data?.items.map((role) => ({
        value: role.id,
        label: role.name,
      })) ?? [],
    [roleOptions.data],
  );
  const organizationSelectOptions = useMemo(
    () => organizationOptions(organizations.data?.items ?? []),
    [organizations.data],
  );

  const userTab = {
    key: "users",
    label: "Tài khoản",
    children: (
      <Space direction="vertical" size="middle" style={{ width: "100%" }}>
        <div className="filter-toolbar" style={{ marginBottom: 16 }}>
          <Input.Search
            aria-label="Tìm tài khoản"
            allowClear
            placeholder="Tên, email hoặc số điện thoại"
            style={{ width: 290 }}
            onSearch={(filter) =>
              setUserFilter((current) => ({
                ...current,
                filter: filter || undefined,
                skipCount: 0,
              }))
            }
          />
          <Select
            aria-label="Lọc vai trò"
            allowClear
            placeholder="Vai trò"
            options={roleSelectOptions}
            style={{ width: 180 }}
            onChange={(roleId) =>
              setUserFilter((current) => ({
                ...current,
                roleId,
                skipCount: 0,
              }))
            }
          />
          <Select
            aria-label="Lọc đơn vị"
            allowClear
            showSearch
            optionFilterProp="label"
            placeholder="Đơn vị"
            options={organizationSelectOptions}
            style={{ width: 210 }}
            onChange={(organizationId) =>
              setUserFilter((current) => ({
                ...current,
                organizationId,
                skipCount: 0,
              }))
            }
          />
          <Select
            aria-label="Lọc theo quyền"
            allowClear
            showSearch
            optionFilterProp="label"
            placeholder="Quyền"
            options={permissionSelectOptions}
            style={{ width: 210 }}
            onChange={(permissionName) =>
              setUserFilter((current) => ({
                ...current,
                permissionName,
                skipCount: 0,
              }))
            }
          />
          <Select
            aria-label="Lọc trạng thái tài khoản"
            allowClear
            placeholder="Trạng thái"
            style={{ width: 160 }}
            options={[
              { value: "active", label: "Đang hoạt động" },
              { value: "inactive", label: "Đã vô hiệu hóa" },
              { value: "locked", label: "Đang khóa" },
            ]}
            onChange={(value) =>
              setUserFilter((current) => ({
                ...current,
                isActive:
                  value === "active"
                    ? true
                    : value === "inactive"
                      ? false
                      : undefined,
                isLocked: value === "locked" ? true : undefined,
                skipCount: 0,
              }))
            }
          />
          <Button
            icon={<ExportOutlined />}
            loading={exportUsers.isPending}
            onClick={() =>
              exportUsers.mutate(undefined, {
                onSuccess: (file) => saveDownload(file.blob, file.fileName),
                onError: showError,
              })
            }
          >
            Xuất Excel
          </Button>
          {hasPermission(permission.createUser) && (
            <Tooltip title={userFormBlockedReason}>
              <Button
                type="primary"
                aria-label="Tạo tài khoản"
                icon={<PlusOutlined />}
                disabled={Boolean(userFormBlockedReason)}
                onClick={() => {
                  setEditingUser(undefined);
                  setUserModalOpen(true);
                }}
              >
                Tạo tài khoản
              </Button>
            </Tooltip>
          )}
        </div>
        <Table<AdminUser>
          rowKey="id"
          size="middle"
          loading={users.isLoading}
          dataSource={users.data?.items}
          scroll={{ x: 1100 }}
          onRow={(user) => ({
            onDoubleClick: () => setDetailUser(user),
            style: { cursor: "pointer" },
          })}
          pagination={{
            total: users.data?.totalCount,
            current: userFilter.skipCount / pageSize + 1,
            pageSize,
            showSizeChanger: false,
            showTotal: (total) => `${total} bản ghi`,
            onChange: (page) =>
              setUserFilter((current) => ({
                ...current,
                skipCount: (page - 1) * pageSize,
              })),
          }}
          columns={[
            {
              title: "Tài khoản",
              render: (_, user) => (
                <Space direction="vertical" size={0}>
                  <Typography.Text strong>{user.fullName}</Typography.Text>
                  <Typography.Text type="secondary">
                    {user.userName} · {user.email}
                  </Typography.Text>
                </Space>
              ),
            },
            {
              title: "Đơn vị",
              dataIndex: "organizationName",
              render: (value: string | undefined) => value ?? "Toàn hệ thống",
            },
            {
              title: "Vai trò",
              dataIndex: "roleNames",
              render: (names: string[]) => (
                <Space wrap>
                  {names.map((name) => (
                    <Tag key={name}>{name}</Tag>
                  ))}
                </Space>
              ),
            },
            {
              title: "Trạng thái",
              width: 145,
              render: (_, user) => (
                <Space direction="vertical" size={2}>
                  <Tag color={user.isActive ? "green" : "default"}>
                    {user.isActive ? "Hoạt động" : "Vô hiệu"}
                  </Tag>
                  {user.isLocked && <Tag color="red">Đang khóa</Tag>}
                  {user.mustChangePassword && (
                    <Tag color="orange">Đổi mật khẩu</Tag>
                  )}
                </Space>
              ),
            },
            {
              title: "Thao tác",
              fixed: "right",
              width: 260,
              render: (_, user) => {
                const isSelf = user.id === currentUser?.id;
                return (
                  <Space wrap>
                    {hasPermission(permission.editUser) && (
                      <Tooltip title={userFormBlockedReason ?? "Cập nhật"}>
                        <Button
                          size="small"
                          aria-label={`Sửa ${user.fullName}`}
                          icon={<EditOutlined />}
                          disabled={Boolean(userFormBlockedReason)}
                          onClick={() => {
                            setEditingUser(user);
                            setUserModalOpen(true);
                          }}
                        />
                      </Tooltip>
                    )}
                    {hasPermission(permission.activateUser) && (
                      <Tooltip
                        title={user.isActive ? "Vô hiệu hóa" : "Kích hoạt"}
                      >
                        <Button
                          size="small"
                          aria-label={`${user.isActive ? "Vô hiệu hóa" : "Kích hoạt"} ${user.fullName}`}
                          disabled={isSelf}
                          danger={user.isActive}
                          icon={<StopOutlined />}
                          loading={
                            setActivation.isPending &&
                            setActivation.variables?.id === user.id
                          }
                          onClick={() =>
                            setActivation.mutate(
                              { id: user.id, isActive: !user.isActive },
                              {
                                onSuccess: () =>
                                  showSuccess("Đã cập nhật trạng thái"),
                                onError: showError,
                              },
                            )
                          }
                        />
                      </Tooltip>
                    )}
                    {hasPermission(permission.lockUser) && (
                      <Tooltip title={user.isLocked ? "Mở khóa" : "Khóa"}>
                        <Button
                          size="small"
                          aria-label={`${user.isLocked ? "Mở khóa" : "Khóa"} ${user.fullName}`}
                          disabled={isSelf}
                          icon={
                            user.isLocked ? (
                              <UnlockOutlined />
                            ) : (
                              <LockOutlined />
                            )
                          }
                          onClick={() =>
                            setLock.mutate(
                              { id: user.id, isLocked: !user.isLocked },
                              {
                                onSuccess: () =>
                                  showSuccess("Đã cập nhật khóa tài khoản"),
                                onError: showError,
                              },
                            )
                          }
                        />
                      </Tooltip>
                    )}
                    {hasPermission(permission.resetPassword) && (
                      <Popconfirm
                        title="Gửi liên kết đặt lại mật khẩu?"
                        okText="Gửi"
                        cancelText="Hủy"
                        onConfirm={() =>
                          sendReset.mutate(user.id, {
                            onSuccess: () =>
                              showSuccess("Đã gửi email đặt lại mật khẩu"),
                            onError: showError,
                          })
                        }
                      >
                        <Tooltip title="Đặt lại mật khẩu">
                          <Button
                            size="small"
                            aria-label={`Đặt lại mật khẩu ${user.fullName}`}
                            icon={<KeyOutlined />}
                          />
                        </Tooltip>
                      </Popconfirm>
                    )}
                    {hasPermission(permission.resetPassword) && (
                      <Popconfirm
                        title="Tạo mật khẩu ngẫu nhiên mới cho tài khoản này?"
                        okText="Tạo"
                        cancelText="Hủy"
                        onConfirm={() =>
                          generatePassword.mutate(user.id, {
                            onSuccess: (result) =>
                              modal.success({
                                title: "Mật khẩu mới đã được tạo",
                                content: (
                                  <Space direction="vertical">
                                    <Typography.Text>
                                      Mật khẩu chỉ hiển thị một lần. Người dùng
                                      phải đổi mật khẩu ở lần đăng nhập tiếp
                                      theo.
                                    </Typography.Text>
                                    <Typography.Text code copyable>
                                      {result.password}
                                    </Typography.Text>
                                  </Space>
                                ),
                              }),
                            onError: showError,
                          })
                        }
                      >
                        <Tooltip title="Tạo mật khẩu ngẫu nhiên">
                          <Button
                            size="small"
                            aria-label={`Tạo mật khẩu ngẫu nhiên ${user.fullName}`}
                            loading={
                              generatePassword.isPending &&
                              generatePassword.variables === user.id
                            }
                            icon={<SafetyCertificateOutlined />}
                          />
                        </Tooltip>
                      </Popconfirm>
                    )}
                    {hasPermission(permission.deleteUser) && (
                      <Popconfirm
                        title="Xóa tài khoản này? Hành động không thể hoàn tác."
                        okText="Xóa"
                        okButtonProps={{ danger: true }}
                        cancelText="Hủy"
                        onConfirm={() =>
                          deleteUser.mutate(user.id, {
                            onSuccess: () => showSuccess("Đã xóa tài khoản"),
                            onError: showError,
                          })
                        }
                      >
                        <Tooltip title="Xóa tài khoản">
                          <Button
                            size="small"
                            danger
                            disabled={isSelf}
                            aria-label={`Xóa ${user.fullName}`}
                            loading={
                              deleteUser.isPending &&
                              deleteUser.variables === user.id
                            }
                            icon={<DeleteOutlined />}
                          />
                        </Tooltip>
                      </Popconfirm>
                    )}
                    {hasPermission(permission.activity) && (
                      <Tooltip title="Nhật ký hoạt động">
                        <Button
                          size="small"
                          aria-label={`Hoạt động ${user.fullName}`}
                          icon={<AuditOutlined />}
                          onClick={() => setActivityUser(user)}
                        />
                      </Tooltip>
                    )}
                  </Space>
                );
              },
            },
          ]}
        />
      </Space>
    ),
  };

  const roleTab = {
    key: "roles",
    label: "Vai trò và quyền",
    children: (
      <Space direction="vertical" size="middle" style={{ width: "100%" }}>
        <div className="filter-toolbar" style={{ marginBottom: 16 }}>
          <Input.Search
            aria-label="Tìm vai trò"
            allowClear
            placeholder="Tên hoặc mô tả vai trò"
            style={{ width: 290 }}
            onSearch={(filter) =>
              setRoleFilter((current) => ({
                ...current,
                filter: filter || undefined,
                skipCount: 0,
              }))
            }
          />
          <Select
            aria-label="Lọc trạng thái vai trò"
            allowClear
            placeholder="Trạng thái"
            style={{ width: 160 }}
            options={[
              { value: true, label: "Đang hoạt động" },
              { value: false, label: "Đã vô hiệu hóa" },
            ]}
            onChange={(isActive) =>
              setRoleFilter((current) => ({
                ...current,
                isActive,
                skipCount: 0,
              }))
            }
          />
          {hasPermission(permission.createRole) && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setEditingRole(undefined);
                setRoleModalOpen(true);
              }}
            >
              Tạo vai trò
            </Button>
          )}
        </div>
        <Table<AdminRole>
          rowKey="id"
          size="middle"
          loading={roles.isLoading}
          dataSource={roles.data?.items}
          scroll={{ x: 900 }}
          pagination={{
            total: roles.data?.totalCount,
            current: roleFilter.skipCount / pageSize + 1,
            pageSize,
            showSizeChanger: false,
            showTotal: (total) => `${total} bản ghi`,
            onChange: (page) =>
              setRoleFilter((current) => ({
                ...current,
                skipCount: (page - 1) * pageSize,
              })),
          }}
          columns={[
            {
              title: "Vai trò",
              render: (_, role) => (
                <Space direction="vertical" size={0}>
                  <Typography.Text strong>{role.name}</Typography.Text>
                  <Typography.Text type="secondary">
                    {role.description || "Không có mô tả"}
                  </Typography.Text>
                </Space>
              ),
            },
            {
              title: "Người dùng",
              dataIndex: "userCount",
              width: 110,
            },
            {
              title: "Trạng thái",
              width: 140,
              render: (_, role) => (
                <Space>
                  <Tag color={role.isActive ? "green" : "default"}>
                    {role.isActive ? "Hoạt động" : "Vô hiệu"}
                  </Tag>
                  {role.isStatic && <Tag>Hệ thống</Tag>}
                </Space>
              ),
            },
            {
              title: "Thao tác",
              width: 190,
              render: (_, role) => (
                <Space>
                  {hasPermission(permission.editRole) && (
                    <Tooltip title="Cập nhật">
                      <Button
                        size="small"
                        aria-label={`Sửa vai trò ${role.name}`}
                        icon={<EditOutlined />}
                        onClick={() => {
                          setEditingRole(role);
                          setRoleModalOpen(true);
                        }}
                      />
                    </Tooltip>
                  )}
                  {hasPermission(permission.permissions) && (
                    <Tooltip title="Phân quyền">
                      <Button
                        size="small"
                        aria-label={`Phân quyền ${role.name}`}
                        icon={<SafetyCertificateOutlined />}
                        onClick={() => setPermissionRole(role)}
                      />
                    </Tooltip>
                  )}
                  {canViewUsers && (
                    <Tooltip title="Xem người dùng được gán">
                      <Button
                        size="small"
                        aria-label={`Người dùng vai trò ${role.name}`}
                        icon={<TeamOutlined />}
                        onClick={() => {
                          setUserFilter((current) => ({
                            ...current,
                            roleId: role.id,
                            skipCount: 0,
                          }));
                          setActiveTab("users");
                        }}
                      />
                    </Tooltip>
                  )}
                  {hasPermission(permission.deleteRole) && !role.isStatic && (
                    <Popconfirm
                      title={`Xóa vai trò "${role.name}"?`}
                      description={
                        role.userCount > 0
                          ? "Vai trò đang được sử dụng và không thể xóa."
                          : undefined
                      }
                      okText="Xóa"
                      cancelText="Hủy"
                      disabled={role.userCount > 0}
                      onConfirm={() =>
                        deleteRole.mutate(role.id, {
                          onSuccess: () => showSuccess("Đã xóa vai trò"),
                          onError: showError,
                        })
                      }
                    >
                      <Button
                        size="small"
                        aria-label={`Xóa vai trò ${role.name}`}
                        danger
                        disabled={role.userCount > 0}
                        icon={<DeleteOutlined />}
                      />
                    </Popconfirm>
                  )}
                </Space>
              ),
            },
          ]}
        />
      </Space>
    ),
  };

  return (
    <>
      <div className="page-container">
        <PageHeader
          title="Tài khoản và quyền"
          subtitle="Quản lý người dùng, vai trò và phân quyền hệ thống"
        />
        <div className="page-card">
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={[
              ...(canViewUsers ? [userTab] : []),
              ...(canViewRoles ? [roleTab] : []),
            ]}
          />
        </div>
      </div>

      <UserEditorModal
        open={userModalOpen}
        user={editingUser}
        roles={roleOptions.data?.items ?? []}
        organizationTree={organizations.data?.items ?? []}
        loading={createUser.isPending || updateUser.isPending}
        onCancel={() => setUserModalOpen(false)}
        onSubmit={(input: SaveUserInput) => {
          const callbacks = {
            onSuccess: () => {
              setUserModalOpen(false);
              showSuccess(
                editingUser
                  ? "Đã cập nhật tài khoản"
                  : "Đã tạo tài khoản và gửi hướng dẫn thiết lập",
              );
            },
            onError: showError,
          };
          if (editingUser) {
            updateUser.mutate({ id: editingUser.id, input }, callbacks);
          } else {
            createUser.mutate(input, callbacks);
          }
        }}
      />
      <RecordDetailDrawer
        title="Chi tiết người dùng"
        record={detailUser}
        onClose={() => setDetailUser(null)}
        fields={[
          { label: "Tên đăng nhập", render: (r) => r.userName },
          { label: "Họ và tên", render: (r) => r.fullName },
          { label: "Email", render: (r) => r.email },
          { label: "Điện thoại", render: (r) => r.phoneNumber },
          {
            label: "Đơn vị",
            render: (r) => r.organizationName ?? "Toàn hệ thống",
          },
          { label: "Chức vụ", render: (r) => r.position },
          { label: "Phòng ban", render: (r) => r.department },
          {
            label: "Vai trò",
            render: (r) => (
              <Space wrap>
                {r.roleNames.map((name) => (
                  <Tag key={name}>{name}</Tag>
                ))}
              </Space>
            ),
            span: 2,
          },
          {
            label: "Trạng thái",
            render: (r) => (
              <Tag color={r.isActive ? "green" : "default"}>
                {r.isActive ? "Hoạt động" : "Vô hiệu"}
              </Tag>
            ),
          },
          {
            label: "Khóa tài khoản",
            render: (r) =>
              r.isLocked ? <Tag color="red">Đang khóa</Tag> : "Không",
          },
          {
            label: "Khóa đến",
            render: (r) =>
              r.lockoutEnd ? dayjs(r.lockoutEnd).format("DD/MM/YYYY") : null,
          },
          {
            label: "Đổi mật khẩu",
            render: (r) =>
              r.mustChangePassword ? (
                <Tag color="orange">Bắt buộc đổi</Tag>
              ) : (
                "Không"
              ),
          },
          {
            label: "Mật khẩu hết hạn",
            render: (r) =>
              r.passwordExpiresAt
                ? dayjs(r.passwordExpiresAt).format("DD/MM/YYYY")
                : null,
          },
          {
            label: "Ngày tạo",
            render: (r) => dayjs(r.creationTime).format("DD/MM/YYYY"),
          },
        ]}
      />
      <UserActivityDrawer
        user={activityUser}
        items={activity.data?.items ?? []}
        loading={activity.isLoading}
        onClose={() => setActivityUser(undefined)}
      />
      <RoleEditorModal
        open={roleModalOpen}
        role={editingRole}
        loading={createRole.isPending || updateRole.isPending}
        onCancel={() => setRoleModalOpen(false)}
        onSubmit={(input: SaveRoleInput) => {
          const callbacks = {
            onSuccess: () => {
              setRoleModalOpen(false);
              showSuccess(
                editingRole ? "Đã cập nhật vai trò" : "Đã tạo vai trò",
              );
            },
            onError: showError,
          };
          if (editingRole) {
            updateRole.mutate({ id: editingRole.id, input }, callbacks);
          } else {
            createRole.mutate(input, callbacks);
          }
        }}
      />
      <RolePermissionsDrawer
        role={permissionRole}
        groups={rolePermissions.data?.items ?? []}
        loading={rolePermissions.isLoading}
        saving={updatePermissions.isPending}
        onClose={() => setPermissionRole(undefined)}
        onSave={(permissions) => {
          if (!permissionRole) return;
          updatePermissions.mutate(
            { id: permissionRole.id, permissions },
            {
              onSuccess: () => {
                showSuccess("Đã cập nhật quyền");
                setPermissionRole(undefined);
              },
              onError: showError,
            },
          );
        }}
      />
    </>
  );
}
