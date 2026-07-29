import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { GeographicCatalogModal } from "./GeographicCatalogModal";

describe("GeographicCatalogModal", () => {
  it("normalizes and submits a new province", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(
      <GeographicCatalogModal
        open
        kind="province"
        submitting={false}
        onCancel={vi.fn()}
        onSubmit={onSubmit}
      />,
    );

    await user.type(screen.getByLabelText("Mã"), "  qn  ");
    await user.type(screen.getByLabelText("Tên"), "  Quảng Ninh  ");
    await user.click(screen.getByRole("button", { name: "Lưu" }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        code: "qn",
        name: "Quảng Ninh",
        isActive: true,
      }),
    );
  });
});
