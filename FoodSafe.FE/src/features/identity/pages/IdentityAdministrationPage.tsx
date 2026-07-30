import { useMemo, useState } from "react";
import {
  Alert,
  App,
  Button,
  Input,
  Select,
  Space,
  Table,
  Tabs,
  Tag,
  Tooltip,
  Typography,
} from "antd";
import { RowActions } from "@/components/RowActions";
import { PageHeader } from "@/components/PageHeader";
import { ClearFiltersButton } from "@/components/ClearFiltersButton";
import {
  AuditOutlined,
  DeleteOutlined,
  EditOutlined,
  ExportOutlined,
  FormOutlined,
  LockOutlined,
  PlusOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined,
  StopOutlined,
  TeamOutlined,
  UnlockOutlined,
  UserAddOutlined,
} from "@ant-design/icons";
import { useMutation } from "@tanstack/react-query";
import dayjs from "dayjs";
import { RecordDetailDrawer } from "@/components/RecordDetailDrawer";
import { useTablePagination } from "@/hooks/useTablePagination";
import { extractApiError } from "@/lib/apiError";
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
  useSetUserActivation,
  useSetUserLock,
  useSetUserPassword,
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
import { PermissionMatrixDrawer } from "../components/PermissionMatrixDrawer";
import { RolePermissionsDrawer } from "../components/RolePermissionsDrawer";
import { UserActivityDrawer } from "../components/UserActivityDrawer";
import { QuickCreateUserModal } from "../components/QuickCreateUserModal";
import { SetUserPasswordModal } from "../components/SetUserPasswordModal";
import { UserEditorModal } from "../components/UserEditorModal";
import type {
  AdminRole,
  AdminUser,
  CreatedAdminUser,
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
  const usersPagination = useTablePagination(10);
  const rolesPagination = useTablePagination(10);
  const [userFilter, setUserFilter] = useState<UserFilter>({
    sorting: "UserName",
  });
  const [userFilterResetKey, setUserFilterResetKey] = useState(0);
  const [roleFilter, setRoleFilter] = useState<RoleFilter>({
    sorting: "Name",
  });
  const [roleFilterResetKey, setRoleFilterResetKey] = useState(0);
  const [editingUser, setEditingUser] = useState<AdminUser>();
  const [passwordUser, setPasswordUser] = useState<AdminUser>();
  const [detailUser, setDetailUser] = useState<AdminUser | null>(null);
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [activityUser, setActivityUser] = useState<AdminUser>();
  const [editingRole, setEditingRole] = useState<AdminRole>();
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [permissionRole, setPermissionRole] = useState<AdminRole>();
  const [quickCreateOpen, setQuickCreateOpen] = useState(false);
  const [matrixOpen, setMatrixOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(canViewUsers ? "users" : "roles");

  const users = useAdminUsers({
    ...userFilter,
    skipCount: usersPagination.skipCount,
    maxResultCount: usersPagination.maxResultCount,
  });
  const roles = useAdminRoles({
    ...roleFilter,
    skipCount: rolesPagination.skipCount,
    maxResultCount: rolesPagination.maxResultCount,
  });
  const roleOptions = useAdminRoles({
    skipCount: 0,
    maxResultCount: 500,
    sorting: "Name",
    isActive: true,
  });
  const organizations = useOrganizationTree();
  const activity = useUserActivity(activityUser?.id);
  const rolePermissions = useRolePermissions(permissionRole?.id);

  const resetUserFilters = () => {
    setUserFilter({ sorting: "UserName" });
    usersPagination.resetToFirstPage();
    setUserFilterResetKey((key) => key + 1);
  };
  const refreshUsers = () => void users.refetch();

  const resetRoleFilters = () => {
    setRoleFilter({ sorting: "Name" });
    rolesPagination.resetToFirstPage();
    setRoleFilterResetKey((key) => key + 1);
  };
  const refreshRoles = () => void roles.refetch();

  const createUser = useCreateAdminUser();
  const updateUser = useUpdateAdminUser();
  const deleteUser = useDeleteAdminUser();
  const generatePassword = useGenerateRandomPassword();
  const setPassword = useSetUserPassword();
  const setActivation = useSetUserActivation();
  const setLock = useSetUserLock();
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
  // The server explains exactly which rule was broken — e.g. "Vai trò không phù
  // hợp với cấp đơn vị hoặc phạm vi quản trị." Replacing that with a generic
  // sentence left administrators staring at a 403 with nothing to act on.
  const showError = (error: unknown) =>
    void message.error(extractApiError(error));

  /**
   * The temporary password is returned once and never again, so it has to be
   * handed to the administrator here. When the notification email failed this
   * dialog is the only way the new user can be let in, so it says so plainly.
   */
  const showCreatedUserPassword = (result: CreatedAdminUser) =>
    modal.success({
      title: "Đã tạo tài khoản",
      content: (
        <Space direction="vertical">
          {result.notificationEmailSent ? (
            <Typography.Text>
              Đã gửi email hướng dẫn thiết lập tới {result.user.email}. Mật khẩu
              tạm thời dưới đây chỉ hiển thị một lần.
            </Typography.Text>
          ) : (
            <Alert
              type="warning"
              showIcon
              message="Chưa gửi được email hướng dẫn"
              description={`Tài khoản đã được tạo nhưng email tới ${result.user.email} không gửi được. Hãy chuyển mật khẩu tạm thời dưới đây cho người dùng, hoặc kiểm tra cấu hình máy chủ thư rồi dùng chức năng "Gửi email đặt lại mật khẩu".`}
            />
          )}
          <Typography.Text code copyable>
            {result.temporaryPassword}
          </Typography.Text>
          <Typography.Text type="secondary">
            Người dùng phải đổi mật khẩu ở lần đăng nhập đầu tiên.
          </Typography.Text>
        </Space>
      ),
    });

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
            key={`user-search-${userFilterResetKey}`}
            aria-label="Tìm tài khoản"
            allowClear
            placeholder="Tên, email hoặc số điện thoại"
            style={{ width: 290 }}
            onSearch={(filter) => {
              setUserFilter((current) => ({
                ...current,
                filter: filter || undefined,
              }));
              usersPagination.resetToFirstPage();
            }}
          />
          <Select
            key={`user-role-${userFilterResetKey}`}
            aria-label="Lọc vai trò"
            allowClear
            placeholder="Vai trò"
            options={roleSelectOptions}
            style={{ width: 180 }}
            onChange={(roleId) => {
              setUserFilter((current) => ({ ...current, roleId }));
              usersPagination.resetToFirstPage();
            }}
          />
          <Select
            key={`user-org-${userFilterResetKey}`}
            aria-label="Lọc đơn vị"
            allowClear
            showSearch
            optionFilterProp="label"
            placeholder="Đơn vị"
            options={organizationSelectOptions}
            style={{ width: 210 }}
            onChange={(organizationId) => {
              setUserFilter((current) => ({ ...current, organizationId }));
              usersPagination.resetToFirstPage();
            }}
          />
          <Select
            key={`user-permission-${userFilterResetKey}`}
            aria-label="Lọc theo quyền"
            allowClear
            showSearch
            optionFilterProp="label"
            placeholder="Quyền"
            options={permissionSelectOptions}
            style={{ width: 210 }}
            onChange={(permissionName) => {
              setUserFilter((current) => ({ ...current, permissionName }));
              usersPagination.resetToFirstPage();
            }}
          />
          <Select
            key={`user-status-${userFilterResetKey}`}
            aria-label="Lọc trạng thái tài khoản"
            allowClear
            placeholder="Trạng thái"
            style={{ width: 160 }}
            options={[
              { value: "active", label: "Đang hoạt động" },
              { value: "inactive", label: "Đã vô hiệu hóa" },
              { value: "locked", label: "Đang khóa" },
            ]}
            onChange={(value) => {
              setUserFilter((current) => ({
                ...current,
                isActive:
                  value === "active"
                    ? true
                    : value === "inactive"
                      ? false
                      : undefined,
                isLocked: value === "locked" ? true : undefined,
              }));
              usersPagination.resetToFirstPage();
            }}
          />
          <ClearFiltersButton
            active={Boolean(
              userFilter.filter?.trim() ||
              userFilter.roleId ||
              userFilter.organizationId ||
              userFilter.permissionName ||
              userFilter.isActive !== undefined ||
              userFilter.isLocked !== undefined,
            )}
            onClick={resetUserFilters}
          />
          <Button
            icon={<ReloadOutlined />}
            loading={users.isFetching}
            onClick={refreshUsers}
          >
            Làm mới
          </Button>
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
            <>
              <Tooltip title={userFormBlockedReason}>
                <Button
                  aria-label="Tạo nhanh tài khoản"
                  icon={<UserAddOutlined />}
                  disabled={Boolean(userFormBlockedReason)}
                  onClick={() => setQuickCreateOpen(true)}
                >
                  Tạo nhanh
                </Button>
              </Tooltip>
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
            </>
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
          pagination={usersPagination.buildConfig(users.data?.totalCount)}
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
              width: 120,
              render: (_, user) => {
                const isSelf = user.id === currentUser?.id;
                const activateLabel = user.isActive
                  ? "Vô hiệu hóa"
                  : "Kích hoạt";
                const lockLabel = user.isLocked ? "Mở khóa" : "Khóa";
                return (
                  <RowActions
                    overflowAriaLabel={`Thao tác ${user.userName}`}
                    actions={[
                      {
                        key: "edit",
                        label: userFormBlockedReason ?? "Cập nhật",
                        ariaLabel: `Sửa ${user.fullName}`,
                        icon: <EditOutlined />,
                        hidden: !hasPermission(permission.editUser),
                        disabled: Boolean(userFormBlockedReason),
                        onClick: () => {
                          setEditingUser(user);
                          setUserModalOpen(true);
                        },
                      },
                      {
                        key: "activate",
                        label: activateLabel,
                        ariaLabel: `${activateLabel} ${user.fullName}`,
                        icon: <StopOutlined />,
                        hidden: !hasPermission(permission.activateUser),
                        disabled: isSelf,
                        danger: user.isActive,
                        onClick: () =>
                          setActivation.mutate(
                            { id: user.id, isActive: !user.isActive },
                            {
                              onSuccess: () =>
                                showSuccess("Đã cập nhật trạng thái"),
                              onError: showError,
                            },
                          ),
                      },
                      {
                        key: "lock",
                        label: lockLabel,
                        ariaLabel: `${lockLabel} ${user.fullName}`,
                        icon: user.isLocked ? (
                          <UnlockOutlined />
                        ) : (
                          <LockOutlined />
                        ),
                        hidden: !hasPermission(permission.lockUser),
                        disabled: isSelf,
                        onClick: () =>
                          setLock.mutate(
                            { id: user.id, isLocked: !user.isLocked },
                            {
                              onSuccess: () =>
                                showSuccess("Đã cập nhật khóa tài khoản"),
                              onError: showError,
                            },
                          ),
                      },
                      {
                        key: "set-password",
                        label: "Đổi mật khẩu",
                        ariaLabel: `Đổi mật khẩu ${user.fullName}`,
                        icon: <FormOutlined />,
                        hidden: !hasPermission(permission.resetPassword),
                        onClick: () => setPasswordUser(user),
                      },
                      {
                        key: "generate-password",
                        label: "Tạo mật khẩu ngẫu nhiên",
                        ariaLabel: `Tạo mật khẩu ngẫu nhiên ${user.fullName}`,
                        icon: <SafetyCertificateOutlined />,
                        hidden: !hasPermission(permission.resetPassword),
                        confirm:
                          "Tạo mật khẩu ngẫu nhiên mới cho tài khoản này?",
                        onClick: () =>
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
                          }),
                      },
                      {
                        key: "activity",
                        label: "Nhật ký hoạt động",
                        ariaLabel: `Hoạt động ${user.fullName}`,
                        icon: <AuditOutlined />,
                        hidden: !hasPermission(permission.activity),
                        onClick: () => setActivityUser(user),
                      },
                      {
                        key: "delete",
                        label: "Xóa tài khoản",
                        ariaLabel: `Xóa ${user.fullName}`,
                        icon: <DeleteOutlined />,
                        danger: true,
                        hidden: !hasPermission(permission.deleteUser),
                        disabled: isSelf,
                        confirm:
                          "Xóa tài khoản này? Hành động không thể hoàn tác.",
                        onClick: () =>
                          deleteUser.mutate(user.id, {
                            onSuccess: () => showSuccess("Đã xóa tài khoản"),
                            onError: showError,
                          }),
                      },
                    ]}
                  />
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
            key={`role-search-${roleFilterResetKey}`}
            aria-label="Tìm vai trò"
            allowClear
            placeholder="Tên hoặc mô tả vai trò"
            style={{ width: 290 }}
            onSearch={(filter) => {
              setRoleFilter((current) => ({
                ...current,
                filter: filter || undefined,
              }));
              rolesPagination.resetToFirstPage();
            }}
          />
          <Select
            key={`role-status-${roleFilterResetKey}`}
            aria-label="Lọc trạng thái vai trò"
            allowClear
            placeholder="Trạng thái"
            style={{ width: 160 }}
            options={[
              { value: true, label: "Đang hoạt động" },
              { value: false, label: "Đã vô hiệu hóa" },
            ]}
            onChange={(isActive) => {
              setRoleFilter((current) => ({ ...current, isActive }));
              rolesPagination.resetToFirstPage();
            }}
          />
          <ClearFiltersButton
            active={Boolean(
              roleFilter.filter?.trim() || roleFilter.isActive !== undefined,
            )}
            onClick={resetRoleFilters}
          />
          <Button
            icon={<ReloadOutlined />}
            loading={roles.isFetching}
            onClick={refreshRoles}
          >
            Làm mới
          </Button>
          <Button
            icon={<SafetyCertificateOutlined />}
            onClick={() => setMatrixOpen(true)}
          >
            Ma trận quyền
          </Button>
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
          pagination={rolesPagination.buildConfig(roles.data?.totalCount)}
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
              fixed: "right",
              width: 120,
              render: (_, role) => (
                <RowActions
                  overflowAriaLabel={`Thao tác ${role.name}`}
                  actions={[
                    {
                      key: "edit",
                      label: "Cập nhật",
                      ariaLabel: `Sửa vai trò ${role.name}`,
                      icon: <EditOutlined />,
                      hidden: !hasPermission(permission.editRole),
                      onClick: () => {
                        setEditingRole(role);
                        setRoleModalOpen(true);
                      },
                    },
                    {
                      key: "permissions",
                      label: "Phân quyền",
                      ariaLabel: `Phân quyền ${role.name}`,
                      icon: <SafetyCertificateOutlined />,
                      hidden: !hasPermission(permission.permissions),
                      onClick: () => setPermissionRole(role),
                    },
                    {
                      key: "users",
                      label: "Xem người dùng",
                      ariaLabel: `Người dùng vai trò ${role.name}`,
                      icon: <TeamOutlined />,
                      hidden: !canViewUsers,
                      onClick: () => {
                        setUserFilter((current) => ({
                          ...current,
                          roleId: role.id,
                        }));
                        usersPagination.resetToFirstPage();
                        setActiveTab("users");
                      },
                    },
                    {
                      key: "delete",
                      label: "Xóa vai trò",
                      ariaLabel: `Xóa vai trò ${role.name}`,
                      icon: <DeleteOutlined />,
                      danger: true,
                      hidden:
                        !hasPermission(permission.deleteRole) || role.isStatic,
                      disabled: role.userCount > 0,
                      confirm: `Xóa vai trò "${role.name}"?`,
                      onClick: () =>
                        deleteRole.mutate(role.id, {
                          onSuccess: () => showSuccess("Đã xóa vai trò"),
                          onError: showError,
                        }),
                    },
                  ]}
                />
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

      <QuickCreateUserModal
        open={quickCreateOpen}
        roles={roleOptions.data?.items ?? []}
        organizationTree={organizations.data?.items ?? []}
        loading={createUser.isPending}
        onCancel={() => setQuickCreateOpen(false)}
        onSubmit={(input: SaveUserInput) => {
          createUser.mutate(input, {
            onSuccess: () => {
              setQuickCreateOpen(false);
              showSuccess("Đã tạo tài khoản và gửi hướng dẫn thiết lập");
            },
            onError: showError,
          });
        }}
      />
      <UserEditorModal
        open={userModalOpen}
        user={editingUser}
        roles={roleOptions.data?.items ?? []}
        organizationTree={organizations.data?.items ?? []}
        loading={createUser.isPending || updateUser.isPending}
        onCancel={() => setUserModalOpen(false)}
        onSubmit={(input: SaveUserInput) => {
          if (editingUser) {
            updateUser.mutate(
              { id: editingUser.id, input },
              {
                onSuccess: () => {
                  setUserModalOpen(false);
                  showSuccess("Đã cập nhật tài khoản");
                },
                onError: showError,
              },
            );
            return;
          }

          createUser.mutate(input, {
            onSuccess: (result) => {
              setUserModalOpen(false);
              showCreatedUserPassword(result);
            },
            onError: showError,
          });
        }}
      />
      <SetUserPasswordModal
        user={passwordUser}
        loading={setPassword.isPending}
        onCancel={() => setPasswordUser(undefined)}
        onSubmit={(newPassword) => {
          if (!passwordUser) return;
          setPassword.mutate(
            { id: passwordUser.id, newPassword },
            {
              onSuccess: () => {
                setPasswordUser(undefined);
                showSuccess("Đã đặt mật khẩu mới cho tài khoản");
              },
              onError: showError,
            },
          );
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
      <PermissionMatrixDrawer
        open={matrixOpen}
        onClose={() => setMatrixOpen(false)}
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
