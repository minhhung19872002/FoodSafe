import { App } from "antd";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ClearFiltersButton } from "./ClearFiltersButton";

describe("ClearFiltersButton", () => {
  it("always shows the filter icon and remains clickable without active filters", async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    const { container } = render(
      <App>
        <ClearFiltersButton active={false} onClick={onClick} />
      </App>,
    );

    const button = screen.getByRole("button", {
      name: "Xóa tất cả bộ lọc",
    });
    expect(container.querySelector('[data-icon="filter"]')).toBeInTheDocument();
    expect(container.querySelector(".filter-clear-active-dot")).toBeNull();

    await user.hover(button);
    expect(await screen.findByRole("tooltip")).toHaveTextContent(
      "Xóa tất cả bộ lọc",
    );
    await user.click(button);
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("shows the red status dot when filters are active", () => {
    const { container } = render(
      <App>
        <ClearFiltersButton active onClick={vi.fn()} />
      </App>,
    );

    expect(container.querySelector(".filter-clear-active-dot")).not.toBeNull();
  });
});
