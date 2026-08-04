import { expect, test } from "@playwright/test";
import { signInAsAdmin } from "./helpers/auth";

test.describe("business code suggestion and dropdown sizing", () => {
  test("selecting an organization immediately suggests its next business code", async ({
    page,
  }) => {
    await signInAsAdmin(page);
    await page.goto("/businesses");
    await page.getByRole("button", { name: /thêm cơ sở/i }).click();

    const organizationSelect = page.getByRole("combobox", {
      name: "Đơn vị quản lý",
    });
    const organizationControl = page
      .locator(".ant-select", { has: organizationSelect })
      .first();
    await organizationSelect.click();

    const organizationDropdown = page.locator(
      ".ant-select-dropdown:visible",
    );
    await expect(organizationDropdown).toBeVisible();
    const [controlBox, dropdownBox] = await Promise.all([
      organizationControl.boundingBox(),
      organizationDropdown.boundingBox(),
    ]);
    expect(controlBox).not.toBeNull();
    expect(dropdownBox).not.toBeNull();
    expect(dropdownBox!.width).toBeGreaterThan(controlBox!.width);

    await organizationDropdown
      .getByText(/PYT-HL — Phòng Y tế TP Hạ Long/)
      .click();
    await expect(page.getByRole("textbox", { name: "Mã cơ sở" })).toHaveValue(
      // Suggested code now carries the full unit code (CS-<orgCode>-NNNN).
      /^CS-PYT-HL-\d{4,}$/,
    );

    const typeSelect = page.getByRole("combobox", { name: "Loại hình" });
    const typeControl = page.locator(".ant-select", { has: typeSelect }).first();
    // Close the organisation dropdown first: antd keeps the leaving popup in
    // the DOM during its fade-out, which would make ":visible" ambiguous.
    await page.keyboard.press("Escape");
    await expect(page.locator(".ant-select-dropdown:visible")).toHaveCount(0);
    await typeSelect.click();
    const typeDropdown = page.locator(".ant-select-dropdown:visible").first();
    await expect(typeDropdown).toBeVisible();
    const [typeControlBox, typeDropdownBox] = await Promise.all([
      typeControl.boundingBox(),
      typeDropdown.boundingBox(),
    ]);
    expect(typeControlBox).not.toBeNull();
    expect(typeDropdownBox).not.toBeNull();
    expect(typeDropdownBox!.width).toBeGreaterThan(typeControlBox!.width);
  });
});
