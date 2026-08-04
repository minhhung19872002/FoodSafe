import { readFile } from "node:fs/promises";
import { expect, test, type APIRequestContext } from "@playwright/test";
import { requestVerificationToken, signInAsAdmin } from "./helpers/auth";
import { runRowAction } from "./helpers/rowActions";

interface ListItem {
  id: string;
  code?: string;
  certificateNumber?: string;
  hasEligibilityCertificate?: boolean;
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
  const certificates = await request.get(
    "/api/v1/app/eligibility-certificate?Filter=E2E-STT24&MaxResultCount=100",
  );
  if (certificates.ok()) {
    for (const item of ((await certificates.json()) as { items: ListItem[] })
      .items) {
      if (item.certificateNumber?.startsWith("E2E-STT24")) {
        const resp = await request.delete(
          `/api/v1/app/eligibility-certificate/${item.id}`,
          { headers, maxRedirects: 0 },
        );
        if (!resp.ok()) {
          // Revoked certificates may not be deletable — skip silently
        }
      }
    }
  }
  const businesses = await request.get(
    "/api/v1/app/business?Filter=E2E-STT24&MaxResultCount=100",
  );
  if (businesses.ok()) {
    for (const item of ((await businesses.json()) as { items: ListItem[] })
      .items) {
      if (item.code?.startsWith("E2E-STT24")) {
        await request.delete(`/api/v1/app/business/${item.id}`, {
          headers,
        });
      }
    }
  }
}

test.describe("eligibility certificate management", () => {
  test.setTimeout(75_000);

  test("completes certificate, public lookup, cache and retention rules", async ({
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
    const businessCode = `E2E-STT24-CS-${suffix}`;
    const businessName = `Cơ sở đủ điều kiện ${suffix}`;
    const certificateNumber = `E2E-STT24-${suffix}/QN`;
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

    await page.goto("/eligibility-certificates");
    await expect(
      page.getByRole("heading", {
        name: "Giấy chứng nhận đủ điều kiện ATTP",
      }),
    ).toBeVisible();
    const exportPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: "Xuất Excel" }).click();
    const exportDownload = await exportPromise;
    expect(exportDownload.suggestedFilename()).toMatch(
      /^giay-du-dieu-kien-attp-\d{8}-\d{6}\.xlsx$/,
    );
    expect(
      (await readFile((await exportDownload.path())!))
        .subarray(0, 2)
        .toString(),
    ).toBe("PK");

    await page.getByRole("button", { name: "Cấp giấy" }).click();
    await page.getByRole("combobox", { name: "Cơ sở SXKD" }).click();
    await page.keyboard.type(businessName);
    await page.getByText(businessName, { exact: false }).last().click();
    await page
      .getByRole("textbox", { name: "Số giấy chứng nhận" })
      .fill(certificateNumber);
    await page
      .getByRole("textbox", { name: "Cơ quan cấp" })
      .fill("Chi cục An toàn vệ sinh thực phẩm");
    await page
      .getByRole("textbox", { name: "Phạm vi chứng nhận" })
      .fill("Sản xuất và kinh doanh thực phẩm");
    await page.getByRole("button", { name: "Lưu", exact: true }).click();
    await expect(page.getByText("Đã lưu giấy chứng nhận.")).toBeVisible();

    let businessListResponse = await request.get(
      `/api/v1/app/business?Filter=${businessCode}&MaxResultCount=10`,
    );
    let businessRow = (
      (await businessListResponse.json()) as { items: ListItem[] }
    ).items[0];
    expect(businessRow.hasEligibilityCertificate).toBe(true);

    let row = page.getByRole("row").filter({ hasText: certificateNumber });
    await runRowAction(page, row, {
      label: "Tệp",
      ariaLabel: `Tệp ${certificateNumber}`,
    });
    const fileDialog = page.getByRole("dialog", {
      name: `Tệp giấy chứng nhận — ${certificateNumber}`,
    });
    await fileDialog.locator('input[type="file"]').setInputFiles({
      name: "giay-du-dieu-kien.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from("%PDF-1.7\n%%EOF\n"),
    });
    await fileDialog.getByRole("button", { name: "Tải lên" }).click();
    await expect(page.getByText("Đã tải tệp lên.")).toBeVisible();
    const attachmentDownloadPromise = page.waitForEvent("download");
    await fileDialog
      .getByRole("button", { name: "Tải giay-du-dieu-kien.pdf" })
      .click();
    const attachmentDownload = await attachmentDownloadPromise;
    expect(
      (await readFile((await attachmentDownload.path())!))
        .subarray(0, 4)
        .toString(),
    ).toBe("%PDF");
    await fileDialog
      .getByRole("button", { name: "Xóa giay-du-dieu-kien.pdf" })
      .click();
    await page.getByRole("button", { name: "Xóa", exact: true }).click();
    await expect(page.getByText("Đã xóa tệp.")).toBeVisible();
    await fileDialog.getByRole("button", { name: "Close" }).click();

    await page.context().clearCookies();
    await page.goto("/tra-cuu-giay-du-dieu-kien");
    await page
      .getByPlaceholder("Số giấy phép, tên cơ sở...")
      .fill(certificateNumber);
    await page.getByRole("button", { name: "Tìm kiếm" }).click();
    await expect(page.getByText(businessName)).toBeVisible();
    await expect(
      page.getByText("Sản xuất và kinh doanh thực phẩm"),
    ).toBeVisible();

    await signInAsAdmin(page);
    await page.goto("/eligibility-certificates");
    row = page.getByRole("row").filter({ hasText: certificateNumber });
    await row
      .getByRole("button", { name: `Thao tác ${certificateNumber}` })
      .click();
    await page.getByRole("menuitem", { name: "Thu hồi" }).click();
    const revokeDialog = page.getByRole("dialog", {
      name: `Thu hồi giấy ${certificateNumber}`,
    });
    await revokeDialog
      .getByRole("textbox", { name: "Lý do thu hồi" })
      .fill("Cơ sở không còn đáp ứng điều kiện");
    await revokeDialog
      .getByRole("button", { name: "Thu hồi", exact: true })
      .click();
    await expect(page.getByText("Đã thu hồi giấy chứng nhận.")).toBeVisible();

    const foundResponse = await request.get(
      `/api/v1/app/eligibility-certificate?Filter=${encodeURIComponent(certificateNumber)}&MaxResultCount=10`,
    );
    const certificate = (
      (await foundResponse.json()) as { items: { id: string }[] }
    ).items[0];
    const blockedUpload = await request.post(
      `/api/v1/app/eligibility-certificate/${certificate.id}/attachments`,
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
    businessListResponse = await request.get(
      `/api/v1/app/business?Filter=${businessCode}&MaxResultCount=10`,
    );
    businessRow = ((await businessListResponse.json()) as { items: ListItem[] })
      .items[0];
    expect(businessRow.hasEligibilityCertificate).toBe(false);

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
    await expect(page.getByText("Đã xóa giấy chứng nhận.")).toBeVisible();
    const duplicate = await request.post(
      "/api/v1/app/eligibility-certificate",
      {
        headers,
        data: {
          businessId: business.id,
          certificateNumber,
          issueDate: "2026-07-25",
        },
      },
    );
    expect(duplicate.ok()).toBeFalsy();
    await request.delete(`/api/v1/app/business/${business.id}`, { headers });
  });
});
