import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { App } from "antd";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import ForgotPasswordPage from "./ForgotPasswordPage";

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
          <ForgotPasswordPage />
        </App>
      </QueryClientProvider>
    </MemoryRouter>,
  );
}

describe("ForgotPasswordPage", () => {
  it("renders forgot password form", async () => {
    renderPage();

    expect(screen.getByText("Quên mật khẩu")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Nhập email đã đăng ký để nhận liên kết đặt lại mật khẩu.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole("textbox")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Gửi hướng dẫn/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Về trang đăng nhập/ }),
    ).toBeInTheDocument();
  });
});
