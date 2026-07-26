import { readFile } from "node:fs/promises";
import { expect, test, type APIRequestContext } from "@playwright/test";
import { requestVerificationToken, signInAsAdmin } from "./helpers/auth";

interface ListItem {
  id: string;
  code?: string;
}

async function removeStaleArtifacts(
  request: APIRequestContext,
  headers: Record<string, string>,
) {
  for (const endpoint of [
    "food-poisoning-case",
    "food-poisoning-incident",
  ]) {
    const response = await request.get(
      `/api/v1/app/${endpoint}?Filter=E2E-ND&MaxResultCount=100`,
    );
    if (!response.ok()) continue;
    for (const item of ((await response.json()) as { items: ListItem[] })
      .items) {
      if (item.code?.startsWith("E2E-ND")) {
        await request.delete(`/api/v1/app/${endpoint}/${item.id}`, {
          headers,
        });
      }
    }
  }
}

test.describe("food poisoning management", () => {
  test.setTimeout(90_000);

  test("creates case, submits, verifies, creates incident, concludes, exports", async ({
    page,
  }) => {
    await signInAsAdmin(page);
    const request = page.context().request;
    const headers = {
      RequestVerificationToken: await requestVerificationToken(page),
    };
    await removeStaleArtifacts(request, headers);

    await page.goto("/food-poisoning");
    await expect(
      page.getByRole("heading", { name: "Ngộ độc thực phẩm" }),
    ).toBeVisible();

    await expect(
      page.getByRole("tab", { name: "Ca ngộ độc nhỏ lẻ" }),
    ).toBeVisible();

    const exportPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: "Xuất Excel" }).first().click();
    const exportDownload = await exportPromise;
    expect(exportDownload.suggestedFilename()).toMatch(/\.xlsx$/);
    expect(
      (await readFile((await exportDownload.path())!))
        .subarray(0, 2)
        .toString(),
    ).toBe("PK");

    await page.getByRole("button", { name: "Tạo ca ngộ độc" }).click();
    const caseDialog = page.getByRole("dialog", {
      name: "Tạo ca ngộ độc mới",
    });
    await caseDialog
      .getByRole("textbox", { name: "Họ tên" })
      .first()
      .fill("Nguyễn Văn E2E");
    await caseDialog
      .getByRole("textbox", { name: "Địa điểm xảy ra" })
      .fill("Chợ đêm TP Hạ Long");
    await caseDialog
      .getByRole("textbox", { name: "Thực phẩm nghi ngờ" })
      .fill("Hải sản sống");
    await caseDialog
      .getByRole("textbox", { name: "Triệu chứng" })
      .fill("Đau bụng, nôn mửa");
    await caseDialog
      .getByRole("button", { name: "Lưu", exact: true })
      .click();
    await expect(
      page.getByText("Tạo ca ngộ độc thành công."),
    ).toBeVisible();

    await expect(
      page.getByText("Nguyễn Văn E2E"),
    ).toBeVisible();

    let row = page.getByRole("row").filter({ hasText: "Nguyễn Văn E2E" });
    await row.getByRole("button", { name: /Gửi/ }).click();
    await page.getByRole("button", { name: "Gửi", exact: true }).click();
    await expect(page.getByText("Đã gửi báo cáo.")).toBeVisible();

    row = page.getByRole("row").filter({ hasText: "Nguyễn Văn E2E" });
    await row.getByRole("button", { name: /Xác minh/ }).click();
    await page.getByRole("button", { name: "Xác minh", exact: true }).click();
    await expect(page.getByText("Đã xác minh.")).toBeVisible();

    await page
      .getByRole("tab", { name: "Vụ ngộ độc thực phẩm" })
      .click();
    await page.getByRole("button", { name: "Tạo vụ ngộ độc" }).click();
    const incidentDialog = page.getByRole("dialog", {
      name: "Tạo vụ ngộ độc mới",
    });
    await incidentDialog
      .getByRole("textbox", { name: "Địa điểm xảy ra" })
      .fill("Nhà hàng hải sản E2E");
    await incidentDialog
      .getByRole("spinbutton", { name: "Số người phơi nhiễm" })
      .fill("20");
    await incidentDialog
      .getByRole("spinbutton", { name: "Số người mắc" })
      .fill("8");
    await incidentDialog
      .getByRole("spinbutton", { name: "Số người nhập viện" })
      .fill("3");
    await incidentDialog
      .getByRole("textbox", { name: "Thực phẩm nghi ngờ" })
      .fill("Hàu sống");
    await incidentDialog
      .getByRole("button", { name: "Lưu", exact: true })
      .click();
    await expect(
      page.getByText("Tạo vụ ngộ độc thành công."),
    ).toBeVisible();

    await expect(
      page.getByText("Nhà hàng hải sản E2E"),
    ).toBeVisible();

    row = page.getByRole("row").filter({ hasText: "Nhà hàng hải sản E2E" });
    await row.getByRole("button", { name: /Gửi/ }).click();
    await page.getByRole("button", { name: "Gửi", exact: true }).click();
    await expect(page.getByText("Đã gửi báo cáo.")).toBeVisible();

    row = page.getByRole("row").filter({ hasText: "Nhà hàng hải sản E2E" });
    await row.getByRole("button", { name: /Xác minh/ }).click();
    await page
      .getByRole("button", { name: "Xác minh", exact: true })
      .click();
    await expect(page.getByText("Đã xác minh.")).toBeVisible();

    row = page.getByRole("row").filter({ hasText: "Nhà hàng hải sản E2E" });
    await row.getByRole("button", { name: /Kết luận/ }).click();
    const concludeDialog = page.getByRole("dialog", {
      name: "Kết luận vụ ngộ độc",
    });
    await concludeDialog
      .getByRole("textbox")
      .fill("Do vi khuẩn Vibrio parahaemolyticus trong hàu sống");
    await concludeDialog
      .getByRole("button", { name: "Xác nhận", exact: true })
      .click();
    await expect(
      page.getByText("Đã kết luận vụ ngộ độc."),
    ).toBeVisible();

    await page.getByRole("tab", { name: "Bản đồ" }).click();
    await expect(
      page.locator(".leaflet-container"),
    ).toBeVisible();
  });
});
