import { expect, type Locator, type Page } from "@playwright/test";

/**
 * Picks an option in an Ant Design `showSearch` Select.
 *
 * The option lists are virtualised, so clicking a rendered `.ant-select-item`
 * races the list's re-renders. Typing the query and committing the highlighted
 * entry with Enter is both stable and the path a keyboard user takes.
 */
export async function pickSearchOption(
  page: Page,
  combobox: Locator,
  query: string,
): Promise<void> {
  await expect(combobox).toBeEnabled();
  await combobox.click();
  await combobox.fill(query);
  // Give the filtered list a moment to settle before committing.
  await expect(page.locator(".ant-select-item-option").first()).toBeVisible({
    timeout: 10_000,
  });
  await page.keyboard.press("Enter");
}
