import { readFile } from "node:fs/promises";
import { expect, test, type APIRequestContext } from "@playwright/test";
import { requestVerificationToken, signInAsAdmin } from "./helpers/auth";

interface ListItem {
  id: string;
  victimName?: string;
  locationDescription?: string;
}

async function removeStaleArtifacts(
  request: APIRequestContext,
  headers: Record<string, string>,
) {
  const cases = await request.get(
    "/api/v1/app/food-poisoning-case?Filter=E2E-NDTP&MaxResultCount=100",
  );
  if (cases.ok()) {
    for (const item of ((await cases.json()) as { items: ListItem[] }).items) {
      await request.delete(`/api/v1/app/food-poisoning-case/${item.id}`, {
        headers,
        maxRedirects: 0,
      });
    }
  }
  const incidents = await request.get(
    "/api/v1/app/food-poisoning-incident?Filter=E2E-NDTP&MaxResultCount=100",
  );
  if (incidents.ok()) {
    for (const item of ((await incidents.json()) as { items: ListItem[] })
      .items) {
      await request.delete(`/api/v1/app/food-poisoning-incident/${item.id}`, {
        headers,
        maxRedirects: 0,
      });
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

    const suffix = Date.now().toString().slice(-8);
    const victimName = `E2E-NDTP Nạn nhân ${suffix}`;
    const incidentLocation = `E2E-NDTP Nhà hàng ${suffix}`;

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
      .fill(victimName);
    await caseDialog
      .getByRole("textbox", { name: "Địa chỉ chi tiết" })
      .fill("Chợ đêm TP Hạ Long");
    await caseDialog
      .getByRole("textbox", { name: "Thực phẩm nghi ngờ" })
      .fill("Hải sản sống");
    await caseDialog
      .getByRole("textbox", { name: "Triệu chứng" })
      .fill("Đau bụng, nôn mửa");
    await caseDialog.getByRole("button", { name: "Lưu", exact: true }).click();
    await expect(page.getByText("Tạo ca ngộ độc thành công.")).toBeVisible();

    await expect(page.getByText(victimName)).toBeVisible();

    const caseListResponse = await request.get(
      `/api/v1/app/food-poisoning-case?Filter=${encodeURIComponent(victimName)}&MaxResultCount=10`,
    );
    expect(caseListResponse.ok(), await caseListResponse.text()).toBeTruthy();
    const caseItem = (
      (await caseListResponse.json()) as { items: ListItem[] }
    ).items.find((item) => item.victimName === victimName);
    expect(caseItem).toBeDefined();
    let workflowResponse = await request.post(
      `/api/v1/app/food-poisoning-case/${caseItem!.id}/submit`,
      { headers },
    );
    expect(workflowResponse.ok(), await workflowResponse.text()).toBeTruthy();
    workflowResponse = await request.post(
      `/api/v1/app/food-poisoning-case/${caseItem!.id}/verify`,
      { headers },
    );
    expect(workflowResponse.ok(), await workflowResponse.text()).toBeTruthy();

    await page.getByRole("tab", { name: "Vụ ngộ độc thực phẩm" }).click();
    await page.getByRole("button", { name: "Tạo vụ ngộ độc" }).click();
    const incidentDialog = page.getByRole("dialog", {
      name: "Tạo vụ ngộ độc mới",
    });
    await incidentDialog
      .getByRole("textbox", { name: "Thời điểm xảy ra" })
      .fill("27/07/2026 18:00");
    await page.keyboard.press("Enter");
    await incidentDialog
      .getByRole("textbox", { name: "Địa chỉ chi tiết" })
      .fill(incidentLocation);
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
    await expect(page.getByText("Tạo vụ ngộ độc thành công.")).toBeVisible();

    await expect(page.getByText(incidentLocation)).toBeVisible();

    const incidentListResponse = await request.get(
      `/api/v1/app/food-poisoning-incident?Filter=${encodeURIComponent(incidentLocation)}&MaxResultCount=10`,
    );
    expect(
      incidentListResponse.ok(),
      await incidentListResponse.text(),
    ).toBeTruthy();
    const incidentItem = (
      (await incidentListResponse.json()) as { items: ListItem[] }
    ).items.find((item) => item.locationDescription === incidentLocation);
    expect(incidentItem).toBeDefined();
    workflowResponse = await request.post(
      `/api/v1/app/food-poisoning-incident/${incidentItem!.id}/submit`,
      { headers },
    );
    expect(workflowResponse.ok(), await workflowResponse.text()).toBeTruthy();
    workflowResponse = await request.post(
      `/api/v1/app/food-poisoning-incident/${incidentItem!.id}/verify`,
      { headers },
    );
    expect(workflowResponse.ok(), await workflowResponse.text()).toBeTruthy();
    workflowResponse = await request.post(
      `/api/v1/app/food-poisoning-incident/${incidentItem!.id}/conclude`,
      {
        headers,
        data: {
          conclusion: "Do vi khuẩn Vibrio parahaemolyticus trong hàu sống",
        },
      },
    );
    expect(workflowResponse.ok(), await workflowResponse.text()).toBeTruthy();

    await page.reload();
    await page.getByRole("tab", { name: "Vụ ngộ độc thực phẩm" }).click();
    let row = page.getByRole("row").filter({ hasText: incidentLocation });
    await row.getByRole("button", { name: /Sai sót/ }).click();
    const errorReportDialog = page.getByRole("dialog", {
      name: /Báo cáo sai sót/,
    });
    await errorReportDialog
      .getByRole("textbox", { name: "Mô tả sai sót" })
      .fill("E2E sai số người mắc");
    await errorReportDialog
      .getByRole("textbox", { name: "Yêu cầu sửa" })
      .fill("Điều chỉnh lại số người mắc theo biên bản xác minh");
    await errorReportDialog
      .getByRole("button", { name: "Gửi báo cáo sai sót" })
      .click();
    await expect(page.getByText("Đã gửi báo cáo sai sót.")).toBeVisible();
    await errorReportDialog.getByRole("button", { name: "Close" }).click();

    const mappedIncidentResponse = await request.post(
      "/api/v1/app/food-poisoning-incident",
      {
        headers,
        data: {
          occurrenceDate: "2026-07-27T11:00:00Z",
          locationDescription: `E2E-NDTP Bản đồ ${suffix}`,
          locationLatitude: 21.0064,
          locationLongitude: 107.2925,
          exposedCount: 5,
          affectedCount: 2,
          hospitalizedCount: 1,
          deathCount: 0,
        },
      },
    );
    expect(
      mappedIncidentResponse.ok(),
      await mappedIncidentResponse.text(),
    ).toBeTruthy();

    await page.reload();
    await page.getByRole("tab", { name: "Bản đồ" }).click();
    await expect(page.locator(".leaflet-container")).toBeVisible({
      timeout: 15_000,
    });
    await expect(
      page.locator(".leaflet-container path.leaflet-interactive").first(),
    ).toBeVisible({ timeout: 10_000 });

    await removeStaleArtifacts(request, headers);
  });
});
