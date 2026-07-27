import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { App } from "antd";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import ChangePasswordPage from "./ChangePasswordPage";

function renderPage(props: { isExpired?: boolean } = {}) {
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
          <ChangePasswordPage {...props} />
        </App>
      </QueryClientProvider>
    </MemoryRouter>,
  );
}

describe("ChangePasswordPage", () => {
  it("renders change password form", async () => {
    renderPage();

    expect(
      screen.getByRole("heading", { name: "Đổi mật khẩu" }),
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("Nhập mật khẩu hiện tại"),
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(/Tối thiểu 8 ký tự/),
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("Nhập lại mật khẩu mới"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Đổi mật khẩu/ }),
    ).toBeInTheDocument();
  });

  it("shows expiry warning when isExpired is true", async () => {
    renderPage({ isExpired: true });

    expect(
      screen.getByText(
        "Mật khẩu đã hết hạn. Vui lòng đổi mật khẩu để tiếp tục.",
      ),
    ).toBeInTheDocument();
  });
});
