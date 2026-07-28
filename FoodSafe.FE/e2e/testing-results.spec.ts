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
  for (const item of ((await response.json()) as { items: ListItem[] }).items) {
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

    const suffix = Date.now().toString().slice(-8);
    const sampleCode = `E2E-KN-${suffix}`;
    const centerName = `Trung tâm KN E2E ${suffix}`;

    const centerResponse = await request.post(
      "/api/v1/app/master-catalog/testing-center",
      {
        headers,
        data: {
          code: `E2E-KN-TT-${suffix}`,
          name: centerName,
          address: "Số 1 đường Kiểm Nghiệm, Hạ Long, Quảng Ninh",
          provinceId: "e2e00000-0000-4000-8001-000000000001",
          accreditationNumber: `VILAS-E2E-${suffix}`,
          accreditationScope: "Vi sinh, hóa lý thực phẩm (E2E)",
        },
      },
    );
    expect(centerResponse.ok(), await centerResponse.text()).toBeTruthy();
    const center = (await centerResponse.json()) as { id: string };

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

    await page.getByRole("button", { name: "Nhập kết quả" }).click();
    const dialog = page.getByRole("dialog", {
      name: "Nhập kết quả kiểm nghiệm",
    });
    await dialog.getByRole("textbox", { name: "Mã mẫu" }).fill(sampleCode);
    await dialog
      .getByRole("textbox", { name: "Tên mẫu" })
      .fill("Mẫu thực phẩm E2E");
    await dialog.getByRole("combobox", { name: "Cơ sở kiểm nghiệm" }).click();
    await page.getByText(centerName, { exact: true }).last().click();
    const dateInput = dialog.getByRole("textbox", { name: "Ngày lấy mẫu" });
    await dateInput.click();
    await dateInput.fill("25/07/2026");
    await dateInput.press("Enter");
    await dateInput.press("Escape");
    await dialog.getByRole("combobox", { name: "Kết quả" }).click();
    await page.getByText("Đạt", { exact: true }).last().click();
    await dialog.getByRole("button", { name: "Lưu", exact: true }).click();
    await expect(dialog).not.toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(sampleCode)).toBeVisible();

    let row = page.getByRole("row").filter({ hasText: sampleCode });
    await row.getByRole("button", { name: /Xóa/ }).click();
    // Nhãn nút xác nhận phụ thuộc cấu hình RowActions/locale antd.
    await page
      .getByRole("dialog")
      .getByRole("button", { name: /^(Xóa|Đồng ý|OK)$/ })
      .click();
    await expect(page.getByText(sampleCode)).not.toBeVisible({
      timeout: 10_000,
    });

    await request.delete(
      `/api/v1/app/master-catalog/${center.id}/testing-center`,
      { headers, maxRedirects: 0 },
    );
  });
});
