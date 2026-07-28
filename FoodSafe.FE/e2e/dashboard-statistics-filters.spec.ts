/**
 * P1-1e (FR-39-02 dashboard filter + drill-down, FR-40 statistics year change):
 * rendered-UI evidence that the dashboard/statistics filters actually drive the
 * page, not just the backend. doc 73 had these as PASS_WITH_BACKEND_ONLY /
 * IMPLEMENTED_NOT_VERIFIED (thin heading-only browser checks).
 *
 * Read-only flows (no data mutation), so they are safe to run against the shared
 * stack. Real full stack, real admin login, no API interception: changing a
 * filter is asserted through a visible, deterministic change in rendered content
 * (a card/chart title that embeds the selected year), and drill-down is asserted
 * through a real React-Router navigation.
 */

import { test, expect, type Page } from "@playwright/test";
import { signInAsAdmin } from "./helpers/auth";

/** Opens a label-less AntD Select (located by its current visible text) and picks an option. */
async function pickSelectOption(
  page: Page,
  currentText: string,
  optionName: string,
): Promise<void> {
  await page.locator(".ant-select").filter({ hasText: currentText }).first().click();
  // AntD options expose the label as a `title` attribute; `.last()` skips the
  // selected-value chip that shares the same title.
  await page.getByTitle(optionName, { exact: true }).last().click();
}

test.describe("P1-1e — dashboard & statistics filters drive rendered UI", () => {
  test("FR-39-02 — dashboard year filter changes the rendered report-submission card", async ({
    page,
  }) => {
    await signInAsAdmin(page);
    await page.goto("/dashboard");

    // Default (no year selected) → the report card title embeds the current year.
    await expect(
      page.getByText(/Tình hình nộp báo cáo của các đơn vị — Năm 2026/),
    ).toBeVisible({ timeout: 15_000 });

    // Selecting a prior year must re-render the card title deterministically.
    await pickSelectOption(page, "Tất cả các năm", "Năm 2025");
    await expect(
      page.getByText(/Tình hình nộp báo cáo của các đơn vị — Năm 2025/),
    ).toBeVisible();
    await expect(
      page.getByText(/Tình hình nộp báo cáo của các đơn vị — Năm 2026/),
    ).toHaveCount(0);
  });

  test("FR-39 — dashboard quick-action drills down to the target route", async ({
    page,
  }) => {
    await signInAsAdmin(page);
    await page.goto("/dashboard");

    await page.getByRole("button", { name: "Kế hoạch thanh tra" }).click();
    await expect(page).toHaveURL(/\/inspection$/);
    // Landed on the real inspection feature (its page heading), not an error page.
    await expect(
      page.getByRole("heading", { name: "Thanh tra - Kiểm tra ATTP" }),
    ).toBeVisible({ timeout: 15_000 });
  });

  test("FR-40 — statistics year change re-renders the monthly charts", async ({
    page,
  }) => {
    await signInAsAdmin(page);
    await page.goto("/statistics");

    // Default year = current year; chart titles embed it.
    await expect(
      page.getByText(/theo tháng — Năm 2026/).first(),
    ).toBeVisible({ timeout: 15_000 });

    await pickSelectOption(page, "Năm 2026", "Năm 2025");
    await expect(
      page.getByText(/theo tháng — Năm 2025/).first(),
    ).toBeVisible();
    await expect(page.getByText(/theo tháng — Năm 2026/)).toHaveCount(0);
  });
});
