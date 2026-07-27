import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { App } from "antd";
import { HttpResponse, http } from "msw";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { server } from "@/test/server";
import CompleteInitialPasswordChangePage from "./CompleteInitialPasswordChangePage";

function renderPage() {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return render(
    <MemoryRouter
      initialEntries={[
        {
          pathname: "/account/complete-password-change",
          state: { userName: "testuser" },
        },
      ]}
    >
      <QueryClientProvider client={client}>
        <App>
          <Routes>
            <Route
              path="/account/complete-password-change"
              element={<CompleteInitialPasswordChangePage />}
            />
          </Routes>
        </App>
      </QueryClientProvider>
    </MemoryRouter>,
  );
}

describe("CompleteInitialPasswordChangePage", () => {
  beforeEach(() => {
    window.turnstile = {
      render: (_container, options) => {
        setTimeout(() => options.callback("test-token"), 0);
        return "widget-1";
      },
      remove: vi.fn(),
    };
    server.use(
      http.get("*/api/v1/security/captcha/config", () =>
        HttpResponse.json({ siteKey: "test-key", action: "login" }),
      ),
    );
  });

  afterEach(() => {
    delete window.turnstile;
  });

  it(
    "renders initial password change form with prefilled username",
    { timeout: 30000 },
    async () => {
      renderPage();

      expect(
        await screen.findByText("Thiết lập mật khẩu mới"),
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          "Tài khoản này phải đổi mật khẩu trước lần đăng nhập đầu tiên.",
        ),
      ).toBeInTheDocument();
      const usernameInput = screen.getByDisplayValue("testuser");
      expect(usernameInput).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /Đổi mật khẩu/ }),
      ).toBeInTheDocument();
    },
  );
});
