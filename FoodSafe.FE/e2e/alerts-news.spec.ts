import { expect, test, type APIRequestContext } from "@playwright/test";
import { requestVerificationToken, signInAsAdmin } from "./helpers/auth";

interface ListItem {
  id: string;
  title?: string;
}

async function removeStaleAlerts(
  request: APIRequestContext,
  headers: Record<string, string>,
) {
  const response = await request.get(
    "/api/v1/app/atp-alert?Filter=E2E-ALERT&MaxResultCount=100",
  );
  if (!response.ok()) return;
  for (const item of ((await response.json()) as { items: ListItem[] })
    .items) {
    if (item.title?.startsWith("E2E-ALERT")) {
      await request.delete(`/api/v1/app/atp-alert/${item.id}`, { headers });
    }
  }
}

test.describe("alerts and news management", () => {
  test.setTimeout(60_000);

  test("creates alert, publishes, recalls, deletes, and verifies news tab", async ({
    page,
  }) => {
    await signInAsAdmin(page);
    const request = page.context().request;
    const headers = {
      RequestVerificationToken: await requestVerificationToken(page),
    };
    await removeStaleAlerts(request, headers);

    const suffix = Date.now().toString().slice(-8);
    const title = `E2E-ALERT Cảnh báo ${suffix}`;

    await page.goto("/alerts-news");
    await expect(
      page.getByRole("tab", { name: "Cảnh báo VSATTP" }),
    ).toBeVisible();

    await page.getByRole("button", { name: "Tạo cảnh báo" }).click();
    const alertDialog = page.getByRole("dialog", {
      name: "Tạo cảnh báo mới",
    });
    await alertDialog
      .getByRole("textbox", { name: "Tiêu đề" })
      .fill(title);
    await alertDialog
      .getByRole("combobox", { name: "Loại cảnh báo" })
      .click();
    await page.getByTitle("Sinh học").click();
    await alertDialog
      .getByRole("combobox", { name: "Mức độ" })
      .click();
    await page.getByTitle("Cao").click();
    await alertDialog
      .getByRole("textbox", { name: "Nội dung" })
      .fill("Nội dung cảnh báo E2E test");
    await alertDialog
      .getByRole("button", { name: "Lưu", exact: true })
      .click();
    await expect(page.getByText(title)).toBeVisible();

    let row = page.getByRole("row").filter({ hasText: title });
    await row.getByRole("button", { name: /Xuất bản/ }).click();
    await page
      .getByRole("button", { name: "Xuất bản", exact: true })
      .click();

    row = page.getByRole("row").filter({ hasText: title });
    await row.getByRole("button", { name: /Thu hồi/ }).click();
    const recallDialog = page.getByRole("dialog", {
      name: "Thu hồi cảnh báo",
    });
    await recallDialog
      .getByRole("textbox", { name: "Lý do thu hồi" })
      .fill("Thông tin không chính xác");
    await recallDialog
      .getByRole("button", { name: "Thu hồi", exact: true })
      .click();

    row = page.getByRole("row").filter({ hasText: title });
    await expect(row.getByText("Đã thu hồi")).toBeVisible();

    await removeStaleAlerts(request, headers);

    await page.getByRole("tab", { name: "Tin tức ATTP" }).click();
    await expect(
      page.getByRole("columnheader", { name: "Tiêu đề" }),
    ).toBeVisible();
  });
});
