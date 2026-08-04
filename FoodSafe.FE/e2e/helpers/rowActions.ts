import { expect, type Locator, type Page } from "@playwright/test";

/**
 * Triggers a row action rendered by the shared `RowActions` component.
 *
 * Only the first two visible actions render as inline icon buttons (their
 * accessible name is the row-specific `ariaLabel`); the rest collapse into a
 * "⋯" dropdown whose entries carry the plain action label. Which bucket an
 * action lands in depends on how many actions the row's state exposes, so
 * specs must handle both — this helper does, the same way a user would.
 */
export async function runRowAction(
  page: Page,
  row: Locator,
  options: { label: string; ariaLabel?: string },
): Promise<void> {
  const inline = row.getByRole("button", {
    name: options.ariaLabel ?? options.label,
    exact: true,
  });
  if ((await inline.count()) > 0 && (await inline.first().isVisible())) {
    await inline.first().click();
    return;
  }

  const overflow = row.getByRole("button", {
    name: /^(Thao tác |Thêm thao tác$)/,
  });
  await expect(
    overflow.first(),
    `row must expose "${options.label}" inline or in its overflow menu`,
  ).toBeVisible();

  // Match on the entry's own text, not its accessible name: each item carries
  // an antd icon whose aria-label ("delete", "undo", …) is folded into the
  // accessible name, so a name-based lookup never matches the Vietnamese label.
  // Scope to the dropdown menu — the sidebar is a `menu` role as well.
  const item = page
    .locator(".ant-dropdown-menu li")
    .filter({ hasText: new RegExp(`^${options.label}$`) })
    .last();

  // The trigger toggles, so click exactly once and wait for the menu.
  await overflow.first().click();
  await expect(
    item,
    `overflow menu must offer "${options.label}"`,
  ).toBeVisible({ timeout: 10_000 });
  await item.click();
}
