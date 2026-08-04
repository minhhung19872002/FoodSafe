import { expect, type Page } from "@playwright/test";

/**
 * Activates an Ant Design tab by its label.
 *
 * Tab strips with many entries (the catalog page has ten) overflow the viewport
 * and antd moves the surplus into a "⋯" dropdown whose entries are `option`
 * roles inside a listbox — a plain `getByRole("tab").click()` would silently
 * click an off-screen element. This resolves either presentation, so specs
 * exercise the same path a user has.
 */
export async function activateTab(page: Page, label: string): Promise<void> {
  const tab = page.getByRole("tab", { name: label, exact: true });

  if ((await tab.count()) > 0) {
    const box = await tab.first().boundingBox();
    const viewport = page.viewportSize();
    const fitsOnScreen =
      box !== null &&
      viewport !== null &&
      box.x >= 0 &&
      box.x + box.width <= viewport.width;

    if (fitsOnScreen) {
      await tab.first().click();
      await expect(tab.first()).toHaveAttribute("aria-selected", "true");
      return;
    }
  }

  // Overflowed into the "⋯" dropdown.
  await page.locator(".ant-tabs-nav-more").first().click();
  const dropdown = page.locator(".ant-tabs-dropdown").last();
  await dropdown.getByRole("option", { name: label, exact: true }).click();
  await expect(
    page.getByRole("tab", { name: label, exact: true }),
  ).toHaveAttribute("aria-selected", "true");
}
