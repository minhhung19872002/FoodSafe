import { App } from "antd";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { QuickCreateUserModal } from "./QuickCreateUserModal";

describe("QuickCreateUserModal", () => {
  it("requires a separate login name", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(
      <App>
        <QuickCreateUserModal
          open
          roles={[]}
          organizationTree={[]}
          loading={false}
          onCancel={vi.fn()}
          onSubmit={onSubmit}
        />
      </App>,
    );

    expect(screen.getByLabelText("Tên đăng nhập")).toBeRequired();
    await user.click(screen.getByRole("button", { name: "Tạo tài khoản" }));

    expect(
      await screen.findByText("Vui lòng nhập tên đăng nhập"),
    ).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
