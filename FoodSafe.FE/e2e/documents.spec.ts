import { readFile } from "node:fs/promises";
import { expect, test, type APIRequestContext } from "@playwright/test";
import { requestVerificationToken, signInAsAdmin } from "./helpers/auth";

interface ListItem {
  id: string;
  documentNumber?: string;
}

async function removeStaleDocuments(
  request: APIRequestContext,
  headers: Record<string, string>,
) {
  const response = await request.get(
    "/api/v1/app/administrative-document?Filter=E2E-VB&MaxResultCount=100",
  );
  if (!response.ok()) return;
  for (const item of ((await response.json()) as { items: ListItem[] })
    .items) {
    if (item.documentNumber?.startsWith("E2E-VB")) {
      await request.delete(
        `/api/v1/app/administrative-document/${item.id}`,
        { headers },
      );
    }
  }
}

test.describe("documents management", () => {
  test.setTimeout(60_000);

  test("creates document, exports excel and deletes", async ({ page }) => {
    await signInAsAdmin(page);
    const request = page.context().request;
    const headers = {
      RequestVerificationToken: await requestVerificationToken(page),
    };
    await removeStaleDocuments(request, headers);

    await page.goto("/documents");
    await expect(
      page.getByRole("columnheader", { name: "Số văn bản" }),
    ).toBeVisible();

    const exportPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: "Xuất Excel" }).click();
    const exportDownload = await exportPromise;
    expect(exportDownload.suggestedFilename()).toMatch(/\.xlsx$/);
    expect(
      (await readFile((await exportDownload.path())!))
        .subarray(0, 2)
        .toString(),
    ).toBe("PK");

    const suffix = Date.now().toString().slice(-8);
    const docNumber = `E2E-VB-${suffix}`;

    await page.getByRole("button", { name: "Thêm văn bản" }).click();
    const dialog = page.getByRole("dialog", { name: "Thêm văn bản" });
    await dialog
      .getByRole("textbox", { name: "Số văn bản" })
      .fill(docNumber);
    await dialog
      .getByRole("textbox", { name: "Tiêu đề" })
      .fill("Văn bản E2E test");
    await dialog
      .getByRole("button", { name: "Lưu", exact: true })
      .click();
    await expect(page.getByText(docNumber)).toBeVisible();

    let row = page.getByRole("row").filter({ hasText: docNumber });
    await row.getByRole("button", { name: /Xóa/ }).click();
    await page.getByRole("button", { name: "Xóa", exact: true }).click();
    await expect(page.getByText(docNumber)).not.toBeVisible();
  });
});
