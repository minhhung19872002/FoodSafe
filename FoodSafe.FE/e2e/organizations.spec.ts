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
  for (const item of ((await response.json()) as { items: ListItem[] }).items) {
    if (item.name?.startsWith("E2E-ORG")) {
      await request.delete(`/api/v1/app/organization/${item.id}`, {
        headers,
      });
    }
  }
}

test.describe("organization management", () => {
  test.setTimeout(90_000);

  test("lists seeded organizations and shows hierarchy", async ({ page }) => {
    await signInAsAdmin(page);
    await page.goto("/organizations");
    await expect(
      page.getByRole("heading", { name: "Quản lý đơn vị" }),
    ).toBeVisible();

    const table = page.getByRole("table");
    await expect(
      table.getByRole("cell", { name: "CCATVSTP-QN" }),
    ).toBeVisible();
    await expect(table.getByRole("cell", { name: "PYT-HL" })).toBeVisible();
    await expect(table.getByRole("cell", { name: "TYT-BD" })).toBeVisible();

    await expect(
      table.getByRole("cell", {
        name: "Chi cục An toàn vệ sinh thực phẩm tỉnh Quảng Ninh",
        exact: true,
      }),
    ).toBeVisible();
  });

  test("creates via API, edits and deletes via UI", async ({ page }) => {
    await signInAsAdmin(page);
    const request = page.context().request;
    const headers = {
      RequestVerificationToken: await requestVerificationToken(page),
    };
    await removeStaleOrganizations(request, headers);

    const suffix = Date.now().toString().slice(-8);
    const orgCode = `E2E${suffix}`;
    const orgName = `E2E-ORG-${suffix}`;

    const provinceId = "e2e00000-0000-4000-8001-000000000001";

    const createResponse = await request.post("/api/v1/app/organization", {
      headers: {
        ...headers,
        "Content-Type": "application/json",
      },
      data: {
        code: orgCode,
        name: orgName,
        level: 1,
        parentId: null,
        provinceId,
        districtId: null,
        communeId: null,
        address: null,
        phone: null,
        email: null,
        leaderName: null,
        isActive: true,
      },
    });
    expect(createResponse.ok(), await createResponse.text()).toBeTruthy();

    await page.goto("/organizations");
    const table = page.getByRole("table");
    await expect(
      table.getByRole("cell", { name: orgName, exact: true }),
    ).toBeVisible({ timeout: 10_000 });

    const row = table.getByRole("row").filter({ hasText: orgName });
    await row.getByRole("button", { name: /Sửa/ }).click();
    const editDialog = page.getByRole("dialog");
    await expect(editDialog).toBeVisible();
    const nameInput = editDialog
      .locator(".ant-form-item")
      .filter({ hasText: "Tên đơn vị" })
      .locator("input")
      .first();
    await nameInput.clear();
    await nameInput.fill(`${orgName}-updated`);
    await editDialog.getByRole("button", { name: "Lưu", exact: true }).click();
    await expect(
      table.getByRole("cell", { name: `${orgName}-updated`, exact: true }),
    ).toBeVisible({ timeout: 10_000 });

    await page.reload();
    await expect(
      table.getByRole("cell", { name: `${orgName}-updated`, exact: true }),
    ).toBeVisible({ timeout: 10_000 });

    const updatedRow = table
      .getByRole("row")
      .filter({ hasText: `${orgName}-updated` });
    await updatedRow.getByRole("button", { name: /Xóa/ }).click();
    await page.getByRole("button", { name: "OK" }).click();
    await expect(
      table.getByRole("cell", { name: `${orgName}-updated`, exact: true }),
    ).not.toBeVisible({ timeout: 10_000 });
  });
});
