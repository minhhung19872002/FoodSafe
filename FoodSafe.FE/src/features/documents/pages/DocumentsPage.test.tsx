import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { App } from "antd";
import { HttpResponse, http } from "msw";
import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { useAuthStore } from "@/features/auth/store/authStore";
import { server } from "@/test/server";
import DocumentsPage from "./DocumentsPage";

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
        <DocumentsPage />
      </App>
    </QueryClientProvider>,
  );
}

function mockData() {
  server.use(
    http.get("*/api/v1/app/administrative-document", () =>
      HttpResponse.json({
        totalCount: 1,
        items: [
          {
            id: "doc-1",
            organizationId: "org-1",
            documentNumber: "VB-2026/01",
            title: "Văn bản kiểm thử",
            documentTypeName: "Quyết định",
            issuingAuthority: "Chi cục ATTP",
            issuedDate: "2026-07-01",
            status: 1,
          },
        ],
      }),
    ),
  );
}

describe("DocumentsPage", () => {
  afterEach(() => useAuthStore.getState().clearAuth());

  it("renders data and write actions for full-permission user", async () => {
    mockData();
    useAuthStore.getState().setAuth({
      id: "user-1",
      name: "Test User",
      email: "test@foodsafe.local",
      organizationId: null,
      organizationName: null,
      roles: ["ProvinceStaff"],
      permissions: [
        "FoodSafe.AlertsAndTesting.Documents.View",
        "FoodSafe.AlertsAndTesting.Documents.Create",
        "FoodSafe.AlertsAndTesting.Documents.Edit",
        "FoodSafe.AlertsAndTesting.Documents.Delete",
      ],
    });

    renderPage();

    expect(await screen.findByText("VB-2026/01")).toBeInTheDocument();
    expect(screen.getByText("Văn bản kiểm thử")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Thêm văn bản/ }),
    ).toBeInTheDocument();
  });

  it("hides mutation controls for read-only user", async () => {
    mockData();
    useAuthStore.getState().setAuth({
      id: "viewer",
      name: "Viewer",
      email: "viewer@foodsafe.local",
      organizationId: null,
      organizationName: null,
      roles: ["Viewer"],
      permissions: ["FoodSafe.AlertsAndTesting.Documents.View"],
    });

    renderPage();

    expect(await screen.findByText("VB-2026/01")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Thêm văn bản/ }),
    ).not.toBeInTheDocument();
  });
});
