import { expect, test, type APIRequestContext } from "@playwright/test";
import { requestVerificationToken, signInAsAdmin } from "./helpers/auth";

interface ListItem {
  id: string;
  title?: string;
}

async function removeStaleAnalyses(
  request: APIRequestContext,
  headers: Record<string, string>,
) {
  const response = await request.get(
    "/api/v1/app/risk-analysis?Filter=E2E-RA&MaxResultCount=100",
  );
  if (!response.ok()) return;
  for (const item of ((await response.json()) as { items: ListItem[] }).items) {
    if (item.title?.startsWith("E2E-RA")) {
      await request.delete(`/api/v1/app/risk-analysis/${item.id}`, {
        headers,
      });
    }
  }
}

test.describe("risk analysis management", () => {
  test.setTimeout(60_000);

  test("creates analysis, publishes, edits and deletes", async ({ page }) => {
    await signInAsAdmin(page);
    const request = page.context().request;
    const headers = {
      RequestVerificationToken: await requestVerificationToken(page),
    };
    await removeStaleAnalyses(request, headers);

    await page.goto("/risk-analysis");
    await expect(
      page.getByRole("columnheader", { name: "Tiêu đề" }),
    ).toBeVisible();

    const suffix = Date.now().toString().slice(-8);
    const title = `E2E-RA Phân tích ${suffix}`;

    await page.getByRole("button", { name: "Tạo phân tích" }).click();
    const dialog = page.getByRole("dialog", {
      name: "Tạo phân tích nguy cơ",
    });
    await dialog.getByRole("textbox", { name: "Tiêu đề" }).fill(title);
    await dialog.getByRole("combobox", { name: "Chuyên mục" }).click();
    await page.getByTitle("Sinh học").click();
    await dialog.getByRole("combobox", { name: "Mức độ" }).click();
    await page.getByTitle("Cao").click();
    await dialog
      .getByRole("textbox", { name: "Nội dung" })
      .fill("Nội dung phân tích nguy cơ E2E");
    await dialog.getByRole("button", { name: "Lưu", exact: true }).click();
    await expect(page.getByText(title)).toBeVisible();

    let row = page.getByRole("row").filter({ hasText: title });
    await row.getByRole("button", { name: `Thao tác ${title}` }).click();
    await page.getByRole("menuitem", { name: "Xuất bản" }).click();
    await page.getByRole("button", { name: /^(Xóa|Đồng ý|OK)$/ }).click();

    row = page.getByRole("row").filter({ hasText: title });
    await expect(row.getByText("Đã xuất bản")).toBeVisible({ timeout: 10_000 });

    await removeStaleAnalyses(request, headers);
  });
});
