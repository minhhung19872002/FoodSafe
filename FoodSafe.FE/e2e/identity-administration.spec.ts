import { expect, test, type APIRequestContext } from "@playwright/test";
import { requestVerificationToken, signInAsAdmin } from "./helpers/auth";

interface RoleListItem {
  id: string;
  name: string;
}

async function removeStaleRoles(
  request: APIRequestContext,
  headers: Record<string, string>,
) {
  const roles = await request.get(
    "/api/v1/administration/roles?Filter=E2E-ROLE&MaxResultCount=100",
  );
  expect(roles.ok(), await roles.text()).toBeTruthy();
  for (const item of ((await roles.json()) as { items: RoleListItem[] })
    .items) {
    if (item.name.startsWith("E2E-ROLE")) {
      const deletion = await request.delete(
        `/api/v1/administration/roles/${item.id}`,
        { headers },
      );
      expect(deletion.ok(), await deletion.text()).toBeTruthy();
    }
  }
}

test.describe("identity administration", () => {
  test.setTimeout(60_000);

  test("manages roles and views user list", async ({ page }) => {
    await signInAsAdmin(page);
    const request = page.context().request;
    const headers = {
      RequestVerificationToken: await requestVerificationToken(page),
    };
    await removeStaleRoles(request, headers);

    await page.goto("/administration/identity");
    await expect(
      page.getByRole("heading", { name: "Tài khoản và quyền" }),
    ).toBeVisible();

    await expect(
      page.getByRole("columnheader", { name: "Tài khoản" }),
    ).toBeVisible();

    await page.getByRole("tab", { name: "Vai trò và quyền" }).click();
    await expect(
      page.getByRole("columnheader", { name: "Vai trò" }),
    ).toBeVisible();

    const suffix = Date.now().toString().slice(-8);
    const roleName = `E2E-ROLE-${suffix}`;
    await page.getByRole("button", { name: "Tạo vai trò" }).click();
    const createDialog = page.getByRole("dialog", { name: "Tạo vai trò" });
    await createDialog
      .getByRole("textbox", { name: "Tên vai trò" })
      .fill(roleName);
    await createDialog
      .getByRole("textbox", { name: "Mô tả" })
      .fill("Vai trò E2E test");
    await createDialog
      .getByRole("button", { name: "Lưu", exact: true })
      .click();
    await expect(page.getByText(roleName)).toBeVisible();

    let row = page.getByRole("row").filter({ hasText: roleName });
    await row.getByRole("button", { name: `Sửa vai trò ${roleName}` }).click();
    const editDialog = page.getByRole("dialog", {
      name: "Cập nhật vai trò",
    });
    await editDialog
      .getByRole("textbox", { name: "Mô tả" })
      .fill("Đã cập nhật mô tả");
    await editDialog.getByRole("button", { name: "Lưu", exact: true }).click();
    await expect(page.getByText("Đã cập nhật mô tả")).toBeVisible();

    row = page.getByRole("row").filter({ hasText: roleName });
    await row.getByRole("button", { name: `Thao tác ${roleName}` }).click();
    await page.getByRole("menuitem", { name: "Xóa vai trò" }).click();
    await page.getByRole("button", { name: "OK" }).click();
    await expect(page.getByText("Đã xóa vai trò")).toBeVisible();
    await expect(
      page.getByRole("row").filter({ hasText: roleName }),
    ).toHaveCount(0);

    await page.getByRole("tab", { name: "Tài khoản" }).click();
    await expect(
      page.getByRole("columnheader", { name: "Tài khoản" }),
    ).toBeVisible();
    await expect(page.getByRole("table").locator("tbody tr")).not.toHaveCount(
      0,
    );
  });
});
