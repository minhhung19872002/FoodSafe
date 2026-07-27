import { readFile } from "node:fs/promises";
import { expect, test, type APIRequestContext } from "@playwright/test";
import { requestVerificationToken, signInAsAdmin } from "./helpers/auth";

interface ListItem {
  id: string;
  code?: string;
  registrationNumber?: string;
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
  const registrations = await request.get(
    "/api/v1/app/product-registration?Filter=E2E-STT22&MaxResultCount=100",
  );
  expect(registrations.ok(), await registrations.text()).toBeTruthy();
  for (const item of ((await registrations.json()) as { items: ListItem[] })
    .items) {
    if (item.registrationNumber?.startsWith("E2E-STT22")) {
      const deletion = await request.delete(
        `/api/v1/app/product-registration/${item.id}`,
        { headers },
      );
      expect(deletion.ok(), await deletion.text()).toBeTruthy();
    }
  }
  for (const endpoint of ["product", "business"]) {
    const response = await request.get(
      `/api/v1/app/${endpoint}?Filter=E2E-STT22&MaxResultCount=100`,
    );
    expect(response.ok(), await response.text()).toBeTruthy();
    for (const item of ((await response.json()) as { items: ListItem[] })
      .items) {
      if (item.code?.startsWith("E2E-STT22")) {
        const deletion = await request.delete(
          `/api/v1/app/${endpoint}/${item.id}`,
          { headers },
        );
        expect(deletion.ok(), await deletion.text()).toBeTruthy();
      }
    }
  }
}

test.describe("product registration management", () => {
  test.setTimeout(60_000);

  test("completes DKCB, public lookup, file and retention rules", async ({
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
    const payload = (await organizationsResponse.json()) as {
      items?: OrganizationNode[];
    };
    const organization = firstOrganization(payload.items ?? []);
    expect(organization).toBeDefined();

    const suffix = Date.now().toString().slice(-8);
    const businessName = `Cơ sở STT22 ${suffix}`;
    const productName = `Sản phẩm DKCB ${suffix}`;
    const registrationNumber = `E2E-STT22-${suffix}/QN`;
    const businessResponse = await request.post("/api/v1/app/business", {
      headers,
      data: {
        organizationId: organization!.id,
        code: `E2E-STT22-CS-${suffix}`,
        name: businessName,
        productGroupIds: [],
      },
    });
    expect(businessResponse.ok(), await businessResponse.text()).toBeTruthy();
    const business = (await businessResponse.json()) as { id: string };
    const productResponse = await request.post("/api/v1/app/product", {
      headers,
      data: {
        businessId: business.id,
        code: `E2E-STT22-SP-${suffix}`,
        name: productName,
      },
    });
    expect(productResponse.ok(), await productResponse.text()).toBeTruthy();
    const product = (await productResponse.json()) as { id: string };

    await page.goto("/product-registrations");
    await expect(
      page.getByRole("heading", { name: "Đăng ký công bố sản phẩm" }),
    ).toBeVisible();
    const exportPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: "Xuất Excel" }).click();
    const exportDownload = await exportPromise;
    expect(exportDownload.suggestedFilename()).toMatch(
      /^dang-ky-cong-bo-san-pham-\d{8}-\d{6}\.xlsx$/,
    );
    const exportPath = await exportDownload.path();
    expect((await readFile(exportPath!)).subarray(0, 2).toString()).toBe("PK");

    await page.getByRole("button", { name: "Thêm đăng ký" }).click();
    await page.getByRole("combobox", { name: "Cơ sở SXKD" }).click();
    await page.getByText(businessName, { exact: false }).last().click();
    await page.getByRole("combobox", { name: "Sản phẩm liên kết" }).click();
    await page.getByText(productName, { exact: false }).last().click();
    await page
      .getByRole("textbox", { name: "Số đăng ký" })
      .fill(registrationNumber);
    await page.getByRole("textbox", { name: "Số tiếp nhận" }).fill("TN-001");
    await page.getByRole("button", { name: "Lưu", exact: true }).click();
    await expect(page.getByText("Đã lưu đăng ký công bố.")).toBeVisible();

    let row = page.getByRole("row").filter({ hasText: registrationNumber });
    await row
      .getByRole("button", { name: `Tệp ${registrationNumber}` })
      .click();
    const fileDialog = page.getByRole("dialog", {
      name: `Tệp đăng ký — ${registrationNumber}`,
    });
    await fileDialog.locator('input[type="file"]').setInputFiles({
      name: "dang-ky.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from("%PDF-1.7\n%%EOF\n"),
    });
    await fileDialog.getByRole("button", { name: "Tải lên" }).click();
    await expect(page.getByText("Đã tải tệp lên.")).toBeVisible();
    await fileDialog.getByRole("button", { name: "Close" }).click();

    await page.context().clearCookies();
    await page.goto(`/tra-cuu-dang-ky-cong-bo`);
    await page.getByPlaceholder("Số đăng ký").fill(registrationNumber);
    await page.getByRole("button", { name: "Tra cứu" }).click();
    await expect(page.getByText(productName)).toBeVisible();
    await expect(page.getByText(businessName)).toBeVisible();

    await signInAsAdmin(page);
    await page.goto("/product-registrations");
    row = page.getByRole("row").filter({ hasText: registrationNumber });
    await row
      .getByRole("button", { name: `Thu hồi ${registrationNumber}` })
      .click();
    const revokeDialog = page.getByRole("dialog", {
      name: `Thu hồi đăng ký ${registrationNumber}`,
    });
    await revokeDialog
      .getByRole("textbox", { name: "Lý do thu hồi" })
      .fill("Kiểm thử quy trình thu hồi");
    await revokeDialog
      .getByRole("button", { name: "Thu hồi", exact: true })
      .click();
    await expect(page.getByText("Đã thu hồi đăng ký.")).toBeVisible();

    const found = await request.get(
      `/api/v1/app/product-registration?Filter=${encodeURIComponent(registrationNumber)}&MaxResultCount=10`,
    );
    const registration = ((await found.json()) as { items: { id: string }[] })
      .items[0];
    const blockedUpload = await request.post(
      `/api/v1/app/product-registration/${registration.id}/attachments`,
      {
        headers,
        multipart: {
          file: {
            name: "blocked.pdf",
            mimeType: "application/pdf",
            buffer: Buffer.from("%PDF-1.7\n%%EOF\n"),
          },
        },
      },
    );
    expect(blockedUpload.ok()).toBeFalsy();

    row = page.getByRole("row").filter({ hasText: registrationNumber });
    await row
      .getByRole("button", { name: `Xóa ${registrationNumber}` })
      .click();
    await page.getByRole("button", { name: "Xóa", exact: true }).click();
    await expect(page.getByText("Đã xóa đăng ký.")).toBeVisible();
    const duplicate = await request.post("/api/v1/app/product-registration", {
      headers,
      data: {
        businessId: business.id,
        registrationNumber,
        registrationDate: "2026-07-25",
        productName,
      },
    });
    expect(duplicate.ok()).toBeFalsy();

    await request.delete(`/api/v1/app/product/${product.id}`, { headers });
    await request.delete(`/api/v1/app/business/${business.id}`, { headers });
  });
});
