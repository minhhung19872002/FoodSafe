import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { App } from "antd";
import { HttpResponse, http } from "msw";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it } from "vitest";
import { useAuthStore } from "@/features/auth/store/authStore";
import { server } from "@/test/server";
import AlertsNewsPage from "./AlertsNewsPage";

function renderPage(initialEntry = "/alerts-news") {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return render(
    <QueryClientProvider client={client}>
      <App>
        <MemoryRouter initialEntries={[initialEntry]}>
          <AlertsNewsPage />
        </MemoryRouter>
      </App>
    </QueryClientProvider>,
  );
}

function mockData() {
  server.use(
    http.get("*/api/v1/app/atp-alert", () =>
      HttpResponse.json({
        totalCount: 1,
        items: [
          {
            id: "alert-1",
            title: "Cảnh báo nguy cơ kiểm thử",
            category: 1,
            severity: 2,
            source: 1,
            status: 1,
            creationTime: "2026-07-01T00:00:00",
          },
        ],
      }),
    ),
    http.get("*/api/v1/app/atp-news", () =>
      HttpResponse.json({ totalCount: 0, items: [] }),
    ),
  );
}

describe("AlertsNewsPage", () => {
  afterEach(() => useAuthStore.getState().clearAuth());

  it(
    "renders alerts tab with create button for full-permission user",
    { timeout: 30000 },
    async () => {
      mockData();
      useAuthStore.getState().setAuth({
        id: "user-1",
        name: "Test User",
        email: "test@foodsafe.local",
        organizationId: null,
        organizationName: null,
        roles: ["ProvinceStaff"],
        permissions: [
          "FoodSafe.AlertsAndTesting.Alerts.View",
          "FoodSafe.AlertsAndTesting.Alerts.Create",
          "FoodSafe.AlertsAndTesting.Alerts.Edit",
          "FoodSafe.AlertsAndTesting.Alerts.Delete",
          "FoodSafe.AlertsAndTesting.Alerts.Publish",
          "FoodSafe.AlertsAndTesting.News.View",
          "FoodSafe.AlertsAndTesting.News.Create",
          "FoodSafe.AlertsAndTesting.News.Edit",
          "FoodSafe.AlertsAndTesting.News.Delete",
          "FoodSafe.AlertsAndTesting.News.Publish",
        ],
      });

      renderPage();

      expect(
        await screen.findByText("Cảnh báo nguy cơ kiểm thử"),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /Tạo cảnh báo/ }),
      ).toBeInTheDocument();
    },
  );

  it("hides mutation controls for read-only user", async () => {
    mockData();
    useAuthStore.getState().setAuth({
      id: "viewer",
      name: "Viewer",
      email: "viewer@foodsafe.local",
      organizationId: null,
      organizationName: null,
      roles: ["Viewer"],
      permissions: ["FoodSafe.AlertsAndTesting.Alerts.View"],
    });

    renderPage();

    expect(
      await screen.findByText("Cảnh báo nguy cơ kiểm thử"),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Tạo cảnh báo/ }),
    ).not.toBeInTheDocument();
  });

  it("assigns a citizen report with the alert-scoped staff picker", async () => {
    const user = userEvent.setup();
    let assignment: { id: string; assigneeId: string } | undefined;
    mockData();
    server.use(
      http.get("*/api/v1/app/atp-alert/assignable-users", () =>
        HttpResponse.json({
          items: [
            {
              id: "staff-1",
              userName: "staff.one",
              fullName: "Cán bộ Một",
            },
          ],
        }),
      ),
      http.post(
        "*/api/v1/app/atp-alert/:id/assign",
        async ({ params, request }) => {
          const body = (await request.json()) as { assigneeId: string };
          assignment = { id: String(params.id), assigneeId: body.assigneeId };
          return HttpResponse.json({
            id: params.id,
            title: "Cảnh báo nguy cơ kiểm thử",
            category: 1,
            severity: 2,
            source: 2,
            status: 1,
            assigneeId: body.assigneeId,
            assigneeName: "Cán bộ Một",
            creationTime: "2026-07-01T00:00:00",
          });
        },
      ),
    );
    useAuthStore.getState().setAuth({
      id: "moderator",
      name: "Moderator",
      email: "moderator@foodsafe.local",
      organizationId: null,
      organizationName: null,
      roles: ["ProvinceStaff"],
      permissions: [
        "FoodSafe.AlertsAndTesting.Alerts.View",
        "FoodSafe.AlertsAndTesting.Alerts.Publish",
        "FoodSafe.AlertsAndTesting.Alerts.Assign",
      ],
    });

    renderPage("/alerts-news?tab=moderation");

    const assignAction = await screen.findByRole("button", {
      name: "Phân công Cảnh báo nguy cơ kiểm thử",
    });
    await user.click(assignAction);

    const dialog = await screen.findByRole("dialog", {
      name: "Phân công cán bộ xử lý",
    });
    await user.click(within(dialog).getByRole("combobox"));
    await user.click(await screen.findByText("Cán bộ Một"));
    await user.click(within(dialog).getByRole("button", { name: "Phân công" }));

    await waitFor(() =>
      expect(assignment).toEqual({
        id: "alert-1",
        assigneeId: "staff-1",
      }),
    );
  });
});
