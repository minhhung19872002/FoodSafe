import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { App } from "antd";
import { HttpResponse, http } from "msw";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { server } from "@/test/server";
import { NotificationBell } from "./NotificationBell";

function renderBell() {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={client}>
      <App>
        <MemoryRouter>
          <NotificationBell />
        </MemoryRouter>
      </App>
    </QueryClientProvider>,
  );
}

describe("NotificationBell", () => {
  it("opens and displays notifications returned by the API", async () => {
    server.use(
      http.get("*/api/v1/app/notification/unread-count", () =>
        HttpResponse.json({ count: 1 }),
      ),
      http.get("*/api/v1/app/notification", () =>
        HttpResponse.json({
          totalCount: 1,
          items: [
            {
              id: "notification-1",
              type: 11,
              title: "Báo cáo mới cần xử lý",
              message: "Đơn vị cấp dưới vừa gửi báo cáo.",
              entityType: "NdtpReport",
              entityId: "report-1",
              isRead: false,
              creationTime: "2026-07-29T08:00:00Z",
            },
          ],
        }),
      ),
    );
    renderBell();

    const bell = await screen.findByRole("button", {
      name: /Thông báo/,
    });
    await userEvent.click(bell);

    await waitFor(() => {
      expect(bell).toHaveAttribute("aria-expanded", "true");
    });
    expect(
      await screen.findByText("Báo cáo mới cần xử lý"),
    ).toBeInTheDocument();
  });
});
