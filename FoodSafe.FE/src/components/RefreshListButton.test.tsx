import { App } from "antd";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { RefreshListButton } from "./RefreshListButton";

describe("RefreshListButton", () => {
  it("shows the reload icon and refreshes without changing list state", async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    const { container } = render(
      <App>
        <RefreshListButton onClick={onClick} />
      </App>,
    );

    const button = screen.getByRole("button", {
      name: "Làm mới danh sách",
    });
    expect(container.querySelector('[data-icon="reload"]')).toBeInTheDocument();

    await user.hover(button);
    expect(await screen.findByRole("tooltip")).toHaveTextContent(
      "Làm mới danh sách",
    );
    await user.click(button);
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("shows a loading button while the list is refreshing", () => {
    render(
      <App>
        <RefreshListButton loading onClick={vi.fn()} />
      </App>,
    );

    expect(
      screen.getByRole("button", { name: "Làm mới danh sách" }),
    ).toHaveClass("ant-btn-loading");
  });
});
