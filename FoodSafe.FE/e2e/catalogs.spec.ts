import { expect, test, type Page } from "@playwright/test";
import { requestVerificationToken, signInAsAdmin } from "./helpers/auth";
import { activateTab } from "./helpers/tabs";

async function removeStaleE2eArtifacts(page: Page) {
  const request = page.context().request;
  const response = await request.get(
    "/api/v1/app/master-catalog/document-types?Filter=E2E-&MaxResultCount=100",
  );
  expect(response.ok()).toBeTruthy();
  const pageResult = (await response.json()) as {
    items: Array<{ id: string; code: string }>;
  };
  const token = await requestVerificationToken(page);

  for (const item of pageResult.items.filter(({ code }) =>
    code.startsWith("E2E-"),
  )) {
    const deletion = await request.delete(
      `/api/v1/app/master-catalog/${item.id}/document-type`,
      {
        headers: {
          RequestVerificationToken: token,
        },
      },
    );
    expect(deletion.ok()).toBeTruthy();
  }
}

test.describe("master catalog administration", () => {
  test("creates, edits, and deletes a document type", async ({ page }) => {
    await signInAsAdmin(page);
    await removeStaleE2eArtifacts(page);
    await page.goto("/catalogs");

    await expect(
      page.getByRole("heading", { name: "Danh mục dùng chung" }),
    ).toBeVisible();
    await activateTab(page, "Loại văn bản");

    const suffix = Date.now().toString().slice(-8);
    const code = `E2E-${suffix}`;
    const initialName = `Văn bản E2E ${suffix}`;
    const updatedName = `${initialName} cập nhật`;

    await page.getByRole("button", { name: /thêm mới/i }).click();
    await page.getByRole("textbox", { name: "Mã", exact: true }).fill(code);
    await page
      .getByRole("textbox", { name: "Tên", exact: true })
      .fill(initialName);
    await page.getByRole("button", { name: "Lưu", exact: true }).click();

    await expect(page.getByText("Đã lưu dữ liệu danh mục")).toBeVisible();
    let row = page.getByRole("row").filter({ hasText: code });
    await expect(row).toContainText(initialName);

    await row.getByRole("button", { name: `Sửa ${initialName}` }).click();
    await page
      .getByRole("textbox", { name: "Tên", exact: true })
      .fill(updatedName);
    await page.getByRole("button", { name: "Lưu", exact: true }).click();

    await expect(page.getByText("Đã lưu dữ liệu danh mục")).toBeVisible();
    row = page.getByRole("row").filter({ hasText: code });
    await expect(row).toContainText(updatedName);

    await row.getByRole("button", { name: `Xóa ${updatedName}` }).click();
    await page.getByRole("button", { name: /^(Đồng ý|OK)$/ }).click();

    await expect(page.getByText("Đã xóa dữ liệu danh mục")).toBeVisible();
    await expect(page.getByRole("row").filter({ hasText: code })).toHaveCount(
      0,
    );
  });
});
