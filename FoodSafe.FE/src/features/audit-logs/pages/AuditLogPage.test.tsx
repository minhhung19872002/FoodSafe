import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { App } from "antd";
import { HttpResponse, http } from "msw";
import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { useAuthStore } from "@/features/auth/store/authStore";
import { server } from "@/test/server";
import AuditLogPage from "./AuditLogPage";

function renderPage() {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return render(
    <QueryClientProvider client={client}>
      <App>
        <AuditLogPage />
      </App>
    </QueryClientProvider>,
  );
}

describe("AuditLogPage", () => {
  afterEach(() => useAuthStore.getState().clearAuth());

  it("renders audit log table with data", { timeout: 15000 }, async () => {
    server.use(
      http.get("*/api/v1/app/audit-log", () =>
        HttpResponse.json({
          totalCount: 1,
          items: [
            {
              id: "log-1",
              executionTime: "2026-07-20T10:30:00",
              userName: "admin",
              httpMethod: "POST",
              url: "/api/v1/app/business",
              httpStatusCode: 200,
              executionDuration: 150,
              clientIpAddress: "192.168.1.1",
              hasException: false,
            },
          ],
        }),
      ),
    );
    useAuthStore.getState().setAuth({
      id: "user-1",
      name: "Admin",
      email: "admin@foodsafe.local",
      organizationId: null,
      organizationName: null,
      roles: ["Admin"],
      permissions: [],
    });

    renderPage();

    expect(screen.getByText("Nhật ký hoạt động")).toBeInTheDocument();
    expect(
      await screen.findByText("admin", {}, { timeout: 10000 }),
    ).toBeInTheDocument();
    expect(screen.getByText("POST")).toBeInTheDocument();
    expect(screen.getByText("192.168.1.1")).toBeInTheDocument();
  });
});
