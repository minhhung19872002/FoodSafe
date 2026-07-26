import { readFile } from "node:fs/promises";
import { expect, test, type APIRequestContext } from "@playwright/test";
import { requestVerificationToken, signInAsAdmin } from "./helpers/auth";

interface ListItem {
  id: string;
  code?: string;
  planCode?: string;
}

interface OrganizationNode {
  id: string;
  children?: OrganizationNode[];
}

function firstOrganization(
  nodes: OrganizationNode[],
): OrganizationNode | undefined {
  for (const node of nodes) {
    return node ?? firstOrganization(node.children ?? []);
  }
  return undefined;
}

async function removeStaleArtifacts(
  request: APIRequestContext,
  headers: Record<string, string>,
) {
  const plans = await request.get(
    "/api/v1/app/inspection-plan?Filter=E2E-KH&MaxResultCount=100",
  );
  expect(plans.ok(), await plans.text()).toBeTruthy();
  for (const item of ((await plans.json()) as { items: ListItem[] }).items) {
    if (item.planCode?.startsWith("E2E-KH")) {
      await request.delete(`/api/v1/app/inspection-plan/${item.id}`, {
        headers,
      });
    }
  }
  const results = await request.get(
    "/api/v1/app/inspection-result?Filter=E2E-KH&MaxResultCount=100",
  );
  if (results.ok()) {
    for (const item of ((await results.json()) as { items: ListItem[] })
      .items) {
      await request.delete(`/api/v1/app/inspection-result/${item.id}`, {
        headers,
      });
    }
  }
  const businesses = await request.get(
    "/api/v1/app/business?Filter=E2E-KH&MaxResultCount=100",
  );
  expect(businesses.ok(), await businesses.text()).toBeTruthy();
  for (const item of ((await businesses.json()) as { items: ListItem[] })
    .items) {
    if (item.code?.startsWith("E2E-KH")) {
      await request.delete(`/api/v1/app/business/${item.id}`, { headers });
    }
  }
}

test.describe("inspection management", () => {
  test.setTimeout(90_000);

  test("creates plan, submits, approves, records result, exports excel", async ({
    page,
  }) => {
    await signInAsAdmin(page);
    const request = page.context().request;
    const headers = {
      RequestVerificationToken: await requestVerificationToken(page),
    };
    await removeStaleArtifacts(request, headers);

    const organizationsResponse = await request.get(
      "/api/v1/app/organization/tree",
    );
    const organizationPayload = (await organizationsResponse.json()) as {
      items?: OrganizationNode[];
    };
    const organization = firstOrganization(organizationPayload.items ?? []);
    expect(organization).toBeDefined();

    const suffix = Date.now().toString().slice(-8);
    const businessCode = `E2E-KH-CS-${suffix}`;
    const businessName = `Cơ sở kiểm tra ${suffix}`;
    const planCode = `E2E-KH-${suffix}`;
    const planName = `Kế hoạch E2E ${suffix}`;
    const businessResponse = await request.post("/api/v1/app/business", {
      headers,
      data: {
        organizationId: organization!.id,
        code: businessCode,
        name: businessName,
        productGroupIds: [],
      },
    });
    expect(businessResponse.ok(), await businessResponse.text()).toBeTruthy();
    const business = (await businessResponse.json()) as { id: string };

    await page.goto("/inspection");
    await expect(
      page.getByRole("heading", { name: "Thanh tra - Kiểm tra ATTP" }),
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

    await page.getByRole("button", { name: "Tạo kế hoạch" }).click();
    const planDialog = page.getByRole("dialog", {
      name: "Tạo kế hoạch thanh kiểm tra",
    });
    await planDialog
      .getByRole("textbox", { name: "Mã kế hoạch" })
      .fill(planCode);
    await planDialog
      .getByRole("textbox", { name: "Tên kế hoạch" })
      .fill(planName);
    await planDialog
      .getByRole("combobox", { name: "Loại kế hoạch" })
      .click();
    await page.getByText("Đột xuất", { exact: true }).click();
    await planDialog.getByRole("button", { name: "Lưu", exact: true }).click();
    await expect(page.getByText(planCode)).toBeVisible();

    let row = page.getByRole("row").filter({ hasText: planCode });
    await expect(row.getByText("Nháp")).toBeVisible();

    await row.getByRole("button", { name: /Gửi/ }).click();
    await page.getByRole("button", { name: "Gửi", exact: true }).click();
    await expect(
      page.getByRole("row").filter({ hasText: planCode }).getByText("Đã gửi"),
    ).toBeVisible();

    row = page.getByRole("row").filter({ hasText: planCode });
    await row.getByRole("button", { name: /Duyệt/ }).click();
    await page.getByRole("button", { name: "Duyệt", exact: true }).click();
    await expect(
      page
        .getByRole("row")
        .filter({ hasText: planCode })
        .getByText("Đã duyệt"),
    ).toBeVisible();

    await page.getByRole("tab", { name: "Kết quả" }).click();
    await page.getByRole("button", { name: "Ghi nhận kết quả" }).click();
    const resultDialog = page.getByRole("dialog", {
      name: "Ghi nhận kết quả kiểm tra",
    });
    await resultDialog.getByRole("combobox", { name: "Cơ sở SXKD" }).click();
    await page.getByText(businessName, { exact: false }).last().click();
    await resultDialog
      .getByRole("combobox", { name: "Loại kiểm tra" })
      .click();
    await page.getByText("Đột xuất", { exact: true }).last().click();
    await resultDialog
      .getByRole("combobox", { name: "Kết quả chung" })
      .click();
    await page.getByText("Đạt", { exact: true }).last().click();
    await resultDialog
      .getByRole("textbox", { name: "Trưởng đoàn" })
      .fill(`Trưởng đoàn E2E-KH-${suffix}`);
    await resultDialog
      .getByRole("button", { name: "Lưu", exact: true })
      .click();
    await expect(
      page.getByText(`Trưởng đoàn E2E-KH-${suffix}`),
    ).toBeVisible();

    await page.getByRole("tab", { name: "Kế hoạch" }).click();
    row = page.getByRole("row").filter({ hasText: planCode });
    await row.getByRole("button", { name: /Xóa/ }).click();
    await page.getByRole("button", { name: "Xóa", exact: true }).click();

    await request.delete(`/api/v1/app/business/${business.id}`, { headers });
  });
});
