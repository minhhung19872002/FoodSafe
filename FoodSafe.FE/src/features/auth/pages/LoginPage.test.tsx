import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { App } from "antd";
import { HttpResponse, http } from "msw";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { server } from "@/test/server";
import LoginPage from "./LoginPage";

function renderPage() {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return render(
    <MemoryRouter>
      <QueryClientProvider client={client}>
        <App>
          <LoginPage />
        </App>
      </QueryClientProvider>
    </MemoryRouter>,
  );
}

describe("LoginPage", () => {
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

  it("renders login form with key elements", { timeout: 30000 }, async () => {
    renderPage();

    expect(await screen.findByText("FoodSafe")).toBeInTheDocument();
    expect(
      screen.getByText("Chi cục An toàn vệ sinh thực phẩm tỉnh Quảng Ninh"),
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("Tên đăng nhập hoặc email"),
    ).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Mật khẩu")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Đăng nhập/ }),
    ).toBeInTheDocument();
    expect(screen.getByText("Quên mật khẩu?")).toBeInTheDocument();
  });
});
