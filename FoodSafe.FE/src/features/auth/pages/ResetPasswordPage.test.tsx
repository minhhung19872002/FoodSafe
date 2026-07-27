import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { App } from "antd";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import ResetPasswordPage from "./ResetPasswordPage";

function renderPage(search = "") {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return render(
    <MemoryRouter initialEntries={[`/account/reset-password${search}`]}>
      <QueryClientProvider client={client}>
        <App>
          <ResetPasswordPage />
        </App>
      </QueryClientProvider>
    </MemoryRouter>,
  );
}

describe("ResetPasswordPage", () => {
  it("shows invalid link when search params are missing", { timeout: 15000 }, async () => {
    renderPage();

    expect(
      await screen.findByText("Liên kết không hợp lệ hoặc đã hết hạn"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Gửi yêu cầu mới/ }),
    ).toBeInTheDocument();
  });
});
