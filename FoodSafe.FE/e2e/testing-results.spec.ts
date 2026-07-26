import { readFile } from "node:fs/promises";
import { expect, test, type APIRequestContext } from "@playwright/test";
import { requestVerificationToken, signInAsAdmin } from "./helpers/auth";

interface ListItem {
  id: string;
  sampleCode?: string;
}

async function removeStaleResults(
  request: APIRequestContext,
  headers: Record<string, string>,
) {
  const response = await request.get(
    "/api/v1/app/testing-result?Filter=E2E-KN&MaxResultCount=100",
  );
  if (!response.ok()) return;
  for (const item of ((await response.json()) as { items: ListItem[] })
    .items) {
    if (item.sampleCode?.startsWith("E2E-KN")) {
      await request.delete(`/api/v1/app/testing-result/${item.id}`, {
        headers,
      });
    }
  }
}

test.describe("testing results management", () => {
  test.setTimeout(60_000);

  test("creates testing result, exports excel, edits and deletes", async ({
    page,
  }) => {
    await signInAsAdmin(page);
    const request = page.context().request;
    const headers = {
      RequestVerificationToken: await requestVerificationToken(page),
    };
    await removeStaleResults(request, headers);

    await page.goto("/testing-results");
    await expect(
      page.getByRole("columnheader", { name: "Mã mẫu" }),
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
    const sampleCode = `E2E-KN-${suffix}`;

    await page.getByRole("button", { name: "Nhập kết quả" }).click();
    const dialog = page.getByRole("dialog", {
      name: "Nhập kết quả kiểm nghiệm",
    });
    await dialog
      .getByRole("textbox", { name: "Mã mẫu" })
      .fill(sampleCode);
    await dialog
      .getByRole("textbox", { name: "Tên mẫu" })
      .fill("Mẫu thực phẩm E2E");
    await dialog
      .getByRole("combobox", { name: "Kết quả" })
      .click();
    await page.getByText("Đạt", { exact: true }).last().click();
    await dialog
      .getByRole("button", { name: "Lưu", exact: true })
      .click();
    await expect(page.getByText(sampleCode)).toBeVisible();

    let row = page.getByRole("row").filter({ hasText: sampleCode });
    await row.getByRole("button", { name: /Xóa/ }).click();
    await page.getByRole("button", { name: "Xóa", exact: true }).click();
    await expect(page.getByText(sampleCode)).not.toBeVisible();
  });
});
