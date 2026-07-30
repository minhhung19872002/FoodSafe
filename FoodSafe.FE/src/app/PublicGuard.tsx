import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { Spin } from "antd";
import { useQuery } from "@tanstack/react-query";
import { authApi } from "@/features/auth/api/authApi";

interface Props {
  children: ReactNode;
}

export function PublicGuard({ children }: Props) {
  const currentUser = useQuery({
    queryKey: ["auth", "current-user"],
    queryFn: authApi.getCurrentUser,
    retry: false,
    staleTime: 60_000,
  });

  if (currentUser.isLoading) {
    return (
      <div
        style={{ minHeight: "100vh", display: "grid", placeItems: "center" }}
      >
        <Spin size="large" tip="Đang kiểm tra phiên đăng nhập..." />
      </div>
    );
  }

  if (currentUser.data) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
