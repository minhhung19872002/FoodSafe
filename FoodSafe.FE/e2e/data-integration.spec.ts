import { expect, test, type APIRequestContext } from "@playwright/test";
import { requestVerificationToken, signInAsAdmin } from "./helpers/auth";

interface ListItem {
  id: string;
  name?: string;
}

async function removeStaleEndpoints(
  request: APIRequestContext,
  headers: Record<string, string>,
) {
  const response = await request.get(
    "/api/v1/app/api-endpoint?Filter=E2E-API&MaxResultCount=100",
  );
  if (!response.ok()) return;
  for (const item of ((await response.json()) as { items: ListItem[] })
    .items) {
    if (item.name?.startsWith("E2E-API")) {
      await request.delete(`/api/v1/app/api-endpoint/${item.id}`, {
        headers,
      });
    }
  }
}

test.describe("data integration management", () => {
  test.setTimeout(60_000);

  test("manages API endpoints and views call history", async ({ page }) => {
    await signInAsAdmin(page);
    const request = page.context().request;
    const headers = {
      RequestVerificationToken: await requestVerificationToken(page),
    };
    await removeStaleEndpoints(request, headers);

    await page.goto("/data-integration");
    await expect(
      page.getByRole("tab", { name: "Cấu hình API" }),
    ).toBeVisible();

    const suffix = Date.now().toString().slice(-8);
    const endpointName = `E2E-API-${suffix}`;

    await page.getByRole("button", { name: "Thêm endpoint" }).click();
    const dialog = page.getByRole("dialog", { name: /Thêm/ });
    await dialog
      .getByRole("textbox", { name: "Tên endpoint" })
      .fill(endpointName);
    await dialog
      .getByRole("textbox", { name: "URL" })
      .fill("https://api.example.gov.vn/test");
    await dialog.getByRole("combobox", { name: "Phương thức" }).click();
    await page.getByText("GET", { exact: true }).last().click();
    await dialog
      .getByRole("combobox", { name: "Hệ thống" })
      .click();
    await page.getByText("Bộ Y tế", { exact: true }).last().click();
    await dialog
      .getByRole("button", { name: "Lưu", exact: true })
      .click();
    await expect(page.getByText(endpointName)).toBeVisible();

    let row = page.getByRole("row").filter({ hasText: endpointName });
    await row.getByRole("button", { name: /Xóa/ }).click();
    await page.getByRole("button", { name: "Xóa", exact: true }).click();
    await expect(page.getByText(endpointName)).not.toBeVisible();

    await page.getByRole("tab", { name: "Lịch sử gọi API" }).click();
    await expect(
      page.getByRole("columnheader", { name: "URL" }),
    ).toBeVisible();
  });
});
