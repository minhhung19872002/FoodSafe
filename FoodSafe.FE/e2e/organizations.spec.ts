import { expect, test, type APIRequestContext } from "@playwright/test";
import { requestVerificationToken, signInAsAdmin } from "./helpers/auth";

interface ListItem {
  id: string;
  name?: string;
}

async function removeStaleOrganizations(
  request: APIRequestContext,
  headers: Record<string, string>,
) {
  const response = await request.get(
    "/api/v1/app/organization?Filter=E2E-ORG&MaxResultCount=100",
  );
  if (!response.ok()) return;
  for (const item of ((await response.json()) as { items: ListItem[] })
    .items) {
    if (item.name?.startsWith("E2E-ORG")) {
      await request.delete(`/api/v1/app/organization/${item.id}`, {
        headers,
      });
    }
  }
}

test.describe("organization management", () => {
  test.setTimeout(60_000);

  test("creates, edits and deletes an organization", async ({ page }) => {
    await signInAsAdmin(page);
    const request = page.context().request;
    const headers = {
      RequestVerificationToken: await requestVerificationToken(page),
    };
    await removeStaleOrganizations(request, headers);

    await page.goto("/organizations");
    await expect(
      page.getByRole("heading", { name: "Quản lý đơn vị" }),
    ).toBeVisible();

    const suffix = Date.now().toString().slice(-8);
    const orgName = `E2E-ORG-${suffix}`;

    await page.getByRole("button", { name: "Thêm đơn vị" }).click();
    const createDialog = page.getByRole("dialog");
    await createDialog
      .getByRole("textbox", { name: "Tên đơn vị" })
      .fill(orgName);
    await createDialog
      .getByRole("button", { name: "Lưu", exact: true })
      .click();
    await expect(page.getByText("Đã thêm đơn vị")).toBeVisible();
    await expect(page.getByText(orgName)).toBeVisible();

    let row = page.getByRole("row").filter({ hasText: orgName });
    await row.getByRole("button", { name: /Sửa/ }).click();
    const editDialog = page.getByRole("dialog");
    const nameField = editDialog.getByRole("textbox", { name: "Tên đơn vị" });
    await nameField.clear();
    await nameField.fill(`${orgName}-updated`);
    await editDialog
      .getByRole("button", { name: "Lưu", exact: true })
      .click();
    await expect(page.getByText("Đã cập nhật đơn vị")).toBeVisible();
    await expect(page.getByText(`${orgName}-updated`)).toBeVisible();

    row = page.getByRole("row").filter({ hasText: `${orgName}-updated` });
    await row.getByRole("button", { name: /Xóa/ }).click();
    await page.getByRole("button", { name: "Xóa", exact: true }).click();
    await expect(page.getByText("Đã xóa đơn vị")).toBeVisible();
  });
});
