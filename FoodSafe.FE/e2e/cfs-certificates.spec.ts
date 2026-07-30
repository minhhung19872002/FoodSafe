import { readFile } from "node:fs/promises";
import { expect, test, type APIRequestContext } from "@playwright/test";
import { requestVerificationToken, signInAsAdmin } from "./helpers/auth";

interface ListItem {
  id: string;
  code?: string;
  certificateNumber?: string;
}

interface OrganizationNode {
  id: string;
  children?: OrganizationNode[];
}

interface CountryOption {
  id: string;
  code: string;
  name: string;
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
  const certificates = await request.get(
    "/api/v1/app/cfs-certificate?Filter=E2E-CFS&MaxResultCount=100",
  );
  expect(certificates.ok(), await certificates.text()).toBeTruthy();
  for (const item of ((await certificates.json()) as { items: ListItem[] })
    .items) {
    if (item.certificateNumber?.startsWith("E2E-CFS")) {
      const deletion = await request.delete(
        `/api/v1/app/cfs-certificate/${item.id}`,
        { headers },
      );
      expect(deletion.ok(), await deletion.text()).toBeTruthy();
    }
  }
  const businesses = await request.get(
    "/api/v1/app/business?Filter=E2E-CFS&MaxResultCount=100",
  );
  expect(businesses.ok(), await businesses.text()).toBeTruthy();
  for (const item of ((await businesses.json()) as { items: ListItem[] })
    .items) {
    if (item.code?.startsWith("E2E-CFS")) {
      const deletion = await request.delete(`/api/v1/app/business/${item.id}`, {
        headers,
      });
      expect(deletion.ok(), await deletion.text()).toBeTruthy();
    }
  }
}

test.describe("CFS certificate management", () => {
  test.setTimeout(75_000);

  test("completes CFS lifecycle, public lookup, attachments and retention rules", async ({
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

    const countriesResponse = await request.get(
      "/api/v1/app/cfs-certificate/country-options",
    );
    expect(countriesResponse.ok()).toBeTruthy();
    const countries = (await countriesResponse.json()) as CountryOption[];
    expect(countries.length).toBeGreaterThan(0);
    const country = countries[0];

    const suffix = Date.now().toString().slice(-8);
    const businessCode = `E2E-CFS-CS-${suffix}`;
    const businessName = `Cơ sở CFS ${suffix}`;
    const certificateNumber = `E2E-CFS-${suffix}/QN`;
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

    await page.goto("/cfs-certificates");
    await expect(
      page.getByRole("heading", {
        name: "Chứng nhận lưu hành tự do (CFS)",
      }),
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

    await page.getByRole("button", { name: "Thêm CFS" }).click();
    await page.getByRole("combobox", { name: "Cơ sở SXKD" }).click();
    await page.getByText(businessName, { exact: false }).last().click();
    await page.getByRole("combobox", { name: "Quốc gia nhập khẩu" }).click();
    await page
      .getByText(`${country.code} — ${country.name}`, { exact: false })
      .last()
      .click();
    await page.getByRole("textbox", { name: "Số CFS" }).fill(certificateNumber);
    await page
      .getByRole("textbox", { name: "Cơ quan cấp" })
      .fill("Chi cục ATVSTP Quảng Ninh");
    await page.getByRole("button", { name: "Lưu", exact: true }).click();
    await expect(page.getByText("Đã lưu chứng nhận CFS.")).toBeVisible();

    let row = page.getByRole("row").filter({ hasText: certificateNumber });
    await row.getByRole("button", { name: `Tệp ${certificateNumber}` }).click();
    const fileDialog = page.getByRole("dialog", {
      name: `Tệp CFS — ${certificateNumber}`,
    });
    await fileDialog.locator('input[type="file"]').setInputFiles({
      name: "cfs-giay.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from("%PDF-1.7\n%%EOF\n"),
    });
    await fileDialog.getByRole("button", { name: "Tải lên" }).click();
    await expect(page.getByText("Đã tải tệp lên.")).toBeVisible();
    const attachmentDownloadPromise = page.waitForEvent("download");
    await fileDialog.getByRole("button", { name: "Tải cfs-giay.pdf" }).click();
    const attachmentDownload = await attachmentDownloadPromise;
    expect(
      (await readFile((await attachmentDownload.path())!))
        .subarray(0, 4)
        .toString(),
    ).toBe("%PDF");
    await fileDialog.getByRole("button", { name: "Xóa cfs-giay.pdf" }).click();
    await page.getByRole("button", { name: "Xóa", exact: true }).click();
    await expect(page.getByText("Đã xóa tệp.")).toBeVisible();
    await fileDialog.getByRole("button", { name: "Close" }).click();

    await page.context().clearCookies();
    await page.goto("/tra-cuu-cfs");
    await page.getByPlaceholder("Số CFS").fill(certificateNumber);
    await page.getByRole("button", { name: "Tra cứu" }).click();
    await expect(page.getByText(businessName)).toBeVisible();
    await expect(page.getByText("Chi cục ATVSTP Quảng Ninh")).toBeVisible();

    await signInAsAdmin(page);
    await page.goto("/cfs-certificates");
    row = page.getByRole("row").filter({ hasText: certificateNumber });
    await row
      .getByRole("button", { name: `Thao tác ${certificateNumber}` })
      .click();
    await page.getByRole("menuitem", { name: "Thu hồi" }).click();
    const revokeDialog = page.getByRole("dialog", {
      name: `Thu hồi CFS ${certificateNumber}`,
    });
    await revokeDialog
      .getByRole("textbox", { name: "Lý do thu hồi" })
      .fill("Cơ sở vi phạm quy định an toàn thực phẩm");
    await revokeDialog
      .getByRole("button", { name: "Thu hồi", exact: true })
      .click();
    await expect(page.getByText("Đã thu hồi chứng nhận CFS.")).toBeVisible();

    const foundResponse = await request.get(
      `/api/v1/app/cfs-certificate?Filter=${encodeURIComponent(certificateNumber)}&MaxResultCount=10`,
    );
    const certificate = (
      (await foundResponse.json()) as { items: { id: string }[] }
    ).items[0];
    const blockedUpload = await request.post(
      `/api/v1/app/cfs-certificate/${certificate.id}/attachments`,
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

    row = page.getByRole("row").filter({ hasText: certificateNumber });
    await row
      .getByRole("button", { name: `Thao tác ${certificateNumber}` })
      .click();
    await page.getByRole("menuitem", { name: "Xóa" }).click();
    // Nhãn nút xác nhận phụ thuộc cấu hình RowActions/locale antd.
    await page
      .getByRole("dialog")
      .getByRole("button", { name: /^(Xóa|Đồng ý|OK)$/ })
      .click();
    await expect(page.getByText("Đã xóa chứng nhận CFS.")).toBeVisible();

    const duplicate = await request.post("/api/v1/app/cfs-certificate", {
      headers,
      data: {
        businessId: business.id,
        destinationCountryId: country.id,
        certificateNumber,
        issueDate: "2026-07-25",
      },
    });
    expect(duplicate.ok()).toBeFalsy();

    await request.delete(`/api/v1/app/business/${business.id}`, { headers });
  });
});
