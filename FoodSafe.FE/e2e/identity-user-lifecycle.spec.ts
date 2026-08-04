/**
 * P1-1c (FR-02-05 delete user, FR-02-07 random password, FR-02-02 filter users
 * by permission): admin user-management lifecycle through the REAL UI.
 *
 * doc 73 had these as IMPLEMENTED_NOT_VERIFIED (no executed browser flow that
 * actually creates, regenerates a password for, and deletes a real account).
 *
 * Real full stack, real admin login, NO API interception. Every assertion is a
 * real backend round-trip: the created account is proven to persist by searching
 * for it after a full browser reload, the generated password is the real value
 * returned by POST .../random-password, and the permission filter is proven to
 * reach the backend by observing the GET .../users request carry `permissionName`.
 *
 * Isolation on the shared stack: the account is a throwaway with a unique,
 * timestamped e-mail (`e2e.user.<ts>@…`) and is deleted at the end of the test.
 */

import { test, expect, type Page } from "@playwright/test";
import { signInAsAdmin } from "./helpers/auth";

/**
 * Opens an AntD Select and picks its first (active) option via the keyboard.
 * AntD commits a selection on mousedown while Playwright's full click waits for
 * post-animation stability, so a plain option .click() flakes; pressing Enter on
 * the already-highlighted first option is deterministic. For a single-select the
 * dropdown closes itself; a multi-select stays open (the caller dismisses it).
 */
async function selectFirst(
  page: Page,
  select: ReturnType<Page["locator"]>,
): Promise<void> {
  await select.click();
  await expect(
    page
      .locator(
        ".ant-select-dropdown:not(.ant-select-dropdown-hidden) .ant-select-item-option",
      )
      .first(),
  ).toBeVisible();
  await page.keyboard.press("Enter");
}

test.describe("P1-1c — admin user-management lifecycle", () => {
  test("FR-02-05/07 — admin creates, persists, regenerates password for, and deletes a user", async ({
    page,
  }) => {
    const unique = `${Date.now()}`;
    const email = `e2e.user.${unique}@foodsafe.local`;
    // Login names allow only unaccented letters, digits and "_".
    const userName = `e2e_user_${unique}`;
    const fullName = `E2E Throwaway ${unique}`;

    await signInAsAdmin(page);
    await page.goto("/administration/identity");
    await expect(page.getByRole("table").first()).toBeVisible();

    // --- Create through the real modal ---------------------------------------
    await page.getByRole("button", { name: "Tạo tài khoản" }).click();
    const modal = page.getByRole("dialog");
    await expect(modal.locator(".ant-modal-title")).toHaveText("Tạo tài khoản");
    await modal.getByLabel("Họ và tên").fill(fullName);
    // Login name and mailbox are now separate fields: staff without a work
    // email of their own still need an account.
    await modal.getByLabel("Tên đăng nhập").fill(userName);
    await modal.getByLabel("Email nhận thư").fill(email);
    // Đơn vị (required) — single-select, closes on choice.
    await selectFirst(
      page,
      modal
        .locator(".ant-form-item")
        .filter({ hasText: "Đơn vị" })
        .locator(".ant-select")
        .first(),
    );
    // Vai trò (required) — multi-select stays open; dismiss it via the title.
    await selectFirst(
      page,
      modal
        .locator(".ant-form-item")
        .filter({ hasText: "Vai trò" })
        .locator(".ant-select")
        .first(),
    );
    await modal.locator(".ant-modal-title").click();
    await modal.getByRole("button", { name: "Tạo và gửi hướng dẫn" }).click();
    // Creation now hands the administrator a one-time temporary password in a
    // confirmation modal (FR-02-07) instead of a fire-and-forget toast.
    const createdModal = page.getByRole("dialog").filter({
      hasText: "Đã tạo tài khoản",
    });
    await expect(createdModal).toBeVisible();
    await expect(createdModal).toContainText(email);
    await expect(
      createdModal.getByText("Người dùng phải đổi mật khẩu ở lần đăng nhập đầu tiên."),
    ).toBeVisible();
    await createdModal.getByRole("button", { name: "OK" }).click();

    // --- The account persisted: find it via the real search API --------------
    const search = () => page.getByLabel("Tìm tài khoản");
    await search().fill(email);
    await search().press("Enter");
    await expect(page.getByText(email).first()).toBeVisible();

    // --- Persistence after a full browser reload -----------------------------
    await page.reload();
    await expect(page.getByRole("table").first()).toBeVisible();
    await search().fill(email);
    await search().press("Enter");
    await expect(page.getByText(email).first()).toBeVisible();

    // --- FR-02-07: generate a real random password ---------------------------
    // "Tạo mật khẩu ngẫu nhiên" is in the ⋯ overflow (position 5).
    const userRow = page.getByRole("row").filter({ hasText: email });
    await userRow
      .getByRole("button", { name: `Thao tác ${userName}` })
      .click();
    await page
      .getByRole("menuitem", { name: "Tạo mật khẩu ngẫu nhiên" })
      .click();
    // modal.confirm pre-confirmation before the mutation runs.
    await page.getByRole("button", { name: /^(Đồng ý|OK)$/ }).click();
    // The confirm modal fades out while the result modal opens, so both titles
    // can be attached briefly — assert on the result title specifically.
    await expect(
      page
        .locator(".ant-modal-confirm-title")
        .filter({ hasText: "Mật khẩu mới đã được tạo" }),
    ).toBeVisible();
    const generated = page.locator(".ant-modal-confirm-content code").first();
    await expect(generated).toBeVisible();
    expect(
      (await generated.innerText()).trim().length,
      "generated password must satisfy the ≥8-char policy",
    ).toBeGreaterThanOrEqual(8);
    // Close the success modal (viVN locale → button text is not "OK"; use CSS).
    await page.locator(".ant-modal-confirm-btns .ant-btn").first().click();

    // --- FR-02-05: delete the throwaway account ------------------------------
    // "Xóa tài khoản" is in the ⋯ overflow (position 7).
    const deleteRow = page.getByRole("row").filter({ hasText: email });
    await deleteRow
      .getByRole("button", { name: `Thao tác ${userName}` })
      .click();
    await page.getByRole("menuitem", { name: "Xóa tài khoản" }).click();
    await page.getByRole("button", { name: /^(Đồng ý|OK)$/ }).click();
    await expect(page.getByText("Đã xóa tài khoản")).toBeVisible();

    // --- It is really gone from the backend ----------------------------------
    await search().fill(email);
    await search().press("Enter");
    await expect(page.getByText(email)).toHaveCount(0);
  });

  test("FR-02-02 — filtering users by permission reaches the backend", async ({
    page,
  }) => {
    await signInAsAdmin(page);
    await page.goto("/administration/identity");
    await expect(page.getByRole("table").first()).toBeVisible();

    // Applying the permission filter must issue a real GET .../users request
    // carrying `permissionName` — observed, never intercepted.
    const usersRequest = page.waitForResponse(
      (r) =>
        r.request().method() === "GET" &&
        /\/administration\/users\?/i.test(r.url()) &&
        /permissionName=/i.test(r.url()),
    );
    await page.getByLabel("Lọc theo quyền").click();
    await page
      .locator(
        ".ant-select-dropdown:not(.ant-select-dropdown-hidden) .ant-select-item-option",
      )
      .first()
      .click();
    const response = await usersRequest;
    expect(response.ok()).toBeTruthy();

    // The admin account holds every permission, so it survives any permission
    // filter — proving the filtered list rendered real results.
    await expect(page.getByText(/admin\s·/).first()).toBeVisible();
  });
});
