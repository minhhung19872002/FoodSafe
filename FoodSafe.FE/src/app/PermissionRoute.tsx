import type { ReactNode } from "react";
import { Button, Result } from "antd";
import { useAuthStore } from "@/features/auth/store/authStore";

interface Props {
  permission: string | string[];
  children: ReactNode;
}

export function PermissionRoute({ permission, children }: Props) {
  const allowed = useAuthStore((state) =>
    (Array.isArray(permission) ? permission : [permission]).some(
      state.hasPermission,
    ),
  );

  if (!allowed) {
    return (
      <Result
        status="403"
        title="Không có quyền truy cập"
        subTitle="Tài khoản của bạn không được cấp quyền sử dụng chức năng này. Vui lòng liên hệ quản trị viên nếu bạn cần quyền này."
        extra={
          <Button type="primary" href="/">
            Về trang chủ
          </Button>
        }
      />
    );
  }

  return <>{children}</>;
}
