import { expect, test, type Browser, type Page } from "@playwright/test";
import { requestVerificationToken, signIn, signInAsAdmin } from "./helpers/auth";

// Real full-stack acceptance for FR-50-05 — Partner API Specification management.
// Exercises the real React admin tab → real ASP.NET Core API → real PostgreSQL,
// plus the anonymous partner download surface. No API interception, no mocked
// responses, no injected tokens: every request hits the live Docker stack.

const TEST_PASSWORD = process.env.E2E_TEST_USER_PASSWORD ?? "Admin@2026!";
const MGMT_LIST = "/api/v1/app/api-specification";

const SPEC_TITLE = "FoodSafe Partner Sharing API";
const SPEC_API_VERSION = "1.4.2";
const OPENAPI_VERSION = "3.0.3";

function openApiDoc(): string {
  return JSON.stringify(
    {
      openapi: OPENAPI_VERSION,
      info: {
        title: SPEC_TITLE,
        version: SPEC_API_VERSION,
        description: "E2E fixture for partner data-sharing specification.",
      },
      paths: {
        "/ping": {
          get: {
            summary: "Health probe",
            responses: { "200": { description: "OK" } },
          },
        },
      },
    },
    null,
    2,
  );
}

async function newSignedInPage(browser: Browser, userName: string) {
  const context = await browser.newContext();
  const page = await context.newPage();
  await signIn(page, userName, TEST_PASSWORD);
  return { context, page };
}

async function openApiSpecTab(page: Page) {
  await page.goto("/data-integration");
  await page.getByRole("tab", { name: "Đặc tả API" }).click();
  // Trigger button only renders once the tab (and its permission gate) is mounted.
  await expect(
    page.getByRole("button", { name: "Tải lên đặc tả" }),
  ).toBeVisible({ timeout: 15_000 });
}

async function searchSpec(page: Page, name: string) {
  const search = page.getByPlaceholder("Tên, tiêu đề đặc tả");
  await search.fill(name);
  await search.press("Enter");
}

test.describe("partner API specification management (FR-50-05)", () => {
  test.setTimeout(120_000);

  test("unauthenticated management API is rejected", async ({ request }) => {
    const res = await request.get(MGMT_LIST, { maxRedirects: 0 });
    expect([401, 302]).toContain(res.status());
    expect(res.ok()).toBeFalsy();
  });

  test("user without data-integration permission is denied", async ({
    browser,
  }) => {
    const { context, page } = await newSignedInPage(
      browser,
      "noperm@foodsafe.local",
    );
    try {
      const res = await page.context().request.get(MGMT_LIST, {
        maxRedirects: 0,
      });
      expect([403, 302]).toContain(res.status());
      expect(res.ok()).toBeFalsy();
    } finally {
      await context.close();
    }
  });

  test("full UI lifecycle: upload → publish → partner download → unpublish → delete", async ({
    page,
    request,
  }) => {
    await signInAsAdmin(page);
    const suffix = Date.now().toString().slice(-9);
    const specName = `e2e-partner-spec-${suffix}`;
    const partnerPath = `/api/v1/partner/api-spec/${specName}`;

    await openApiSpecTab(page);

    // ---- UPLOAD (real file through the Upload.Dragger) ----
    await page.getByRole("button", { name: "Tải lên đặc tả" }).click();
    const modal = page.getByRole("dialog");
    await expect(modal.getByText("Tải lên đặc tả API (OpenAPI)")).toBeVisible();
    await modal.getByPlaceholder("vd: partner-sharing-api").fill(specName);
    await modal.locator('input[type="file"]').setInputFiles({
      name: `${specName}.json`,
      mimeType: "application/json",
      buffer: Buffer.from(openApiDoc(), "utf-8"),
    });
    // beforeUpload reads the file asynchronously into the paste area — wait for it.
    await expect(modal.locator("textarea").first()).toHaveValue(
      /FoodSafe Partner Sharing API/,
      { timeout: 10_000 },
    );
    await page
      .locator(".ant-modal-footer")
      .getByRole("button", { name: "Tải lên" })
      .click();

    // Row appears with the server-parsed metadata (title/version/format).
    await searchSpec(page, specName);
    const row = page.getByRole("row", { name: new RegExp(specName) });
    await expect(row).toBeVisible({ timeout: 15_000 });
    // Ellipsis cells render their text but antd can report them "hidden" to
    // Playwright's visibility check, so assert on the row's text content.
    await expect(row).toContainText(SPEC_TITLE);
    await expect(row).toContainText(SPEC_API_VERSION);
    await expect(row).toContainText("Nháp");

    // Resolve the persisted id through the real API (authenticated, not mocked).
    const listRes = await page.context().request.get(MGMT_LIST, {
      params: { filter: specName, skipCount: 0, maxResultCount: 10 },
    });
    expect(listRes.ok(), await listRes.text()).toBeTruthy();
    const list = (await listRes.json()) as {
      items: Array<{
        id: string;
        name: string;
        title: string;
        specVersion: string;
        openApiVersion: string;
        format: number;
        isPublished: boolean;
        checksum: string;
      }>;
    };
    const created = list.items.find((s) => s.name === specName);
    expect(created, "uploaded spec present in list").toBeTruthy();
    expect(created!.title).toBe(SPEC_TITLE);
    expect(created!.specVersion).toBe(SPEC_API_VERSION);
    expect(created!.openApiVersion).toBe(OPENAPI_VERSION);
    expect(created!.format).toBe(1); // Json
    expect(created!.isPublished).toBe(false);
    expect(created!.checksum).toMatch(/^[a-f0-9]{64}$/i);
    const specId = created!.id;

    // ---- PARTNER DOWNLOAD BEFORE PUBLISH → 404 (publication is the gate) ----
    const beforePublish = await request.get(partnerPath, { maxRedirects: 0 });
    expect(beforePublish.status()).toBe(404);

    // ---- PUBLISH via the UI ----
    await row.getByRole("button", { name: "Xuất bản" }).click();
    await page
      .locator(".ant-popconfirm-buttons")
      .getByRole("button", { name: "Xuất bản" })
      .click();
    await expect(row).toContainText("Đã xuất bản", { timeout: 10_000 });

    // ---- PARTNER ANONYMOUS DOWNLOAD (cookieless request context) → 200 ----
    const partnerRes = await request.get(partnerPath, { maxRedirects: 0 });
    expect(partnerRes.status(), await partnerRes.text()).toBe(200);
    expect(partnerRes.headers()["content-type"]).toContain("application/json");
    expect(partnerRes.headers()["content-disposition"] ?? "").toMatch(
      /attachment/i,
    );
    const partnerBody = await partnerRes.text();
    expect(partnerBody).toContain(SPEC_TITLE);
    expect(partnerBody).toContain(SPEC_API_VERSION);

    // ---- MANAGEMENT DOWNLOAD DTO (authenticated) ----
    const dlRes = await page.context().request.get(
      `${MGMT_LIST}/${specId}/download`,
    );
    expect(dlRes.ok(), await dlRes.text()).toBeTruthy();
    const dl = (await dlRes.json()) as {
      content: string;
      format: number;
      fileName: string;
      contentType: string;
    };
    expect(dl.content).toContain(SPEC_TITLE);
    expect(dl.format).toBe(1);
    expect(dl.fileName).toContain(specName);

    // ---- UNPUBLISH via the UI → partner download 404 again ----
    await row.getByRole("button", { name: "Gỡ" }).click();
    await page
      .locator(".ant-popconfirm-buttons")
      .getByRole("button", { name: "Gỡ" })
      .click();
    await expect(row).toContainText("Nháp", { timeout: 10_000 });

    const afterUnpublish = await request.get(partnerPath, { maxRedirects: 0 });
    expect(afterUnpublish.status()).toBe(404);

    // ---- PERSISTENCE AFTER RELOAD ----
    await page.reload();
    await page.getByRole("tab", { name: "Đặc tả API" }).click();
    await searchSpec(page, specName);
    const rowAfterReload = page.getByRole("row", {
      name: new RegExp(specName),
    });
    await expect(rowAfterReload).toBeVisible({ timeout: 15_000 });
    await expect(rowAfterReload).toContainText(SPEC_TITLE);
    await expect(rowAfterReload).toContainText("Nháp");

    // ---- DELETE via the UI ----
    await rowAfterReload.locator("button.ant-btn-dangerous").click();
    await page
      .locator(".ant-popconfirm-buttons")
      .getByRole("button", { name: "Xóa" })
      .click();
    await expect(page.getByText("Đã xóa.")).toBeVisible({ timeout: 10_000 });

    // Gone from the backend.
    const afterDelete = await page.context().request.get(
      `${MGMT_LIST}/${specId}`,
      { maxRedirects: 0 },
    );
    expect(afterDelete.ok()).toBeFalsy();
  });

  test("invalid OpenAPI content is rejected and surfaced in the UI", async ({
    page,
  }) => {
    await signInAsAdmin(page);
    const suffix = Date.now().toString().slice(-9);
    const specName = `e2e-invalid-${suffix}`;

    await openApiSpecTab(page);
    await page.getByRole("button", { name: "Tải lên đặc tả" }).click();
    const modal = page.getByRole("dialog");
    await modal.getByPlaceholder("vd: partner-sharing-api").fill(specName);
    // Well-formed JSON but not a valid OpenAPI document.
    await modal
      .locator("textarea")
      .first()
      .fill('{ "not": "an openapi document" }');
    await page
      .locator(".ant-modal-footer")
      .getByRole("button", { name: "Tải lên" })
      .click();

    // The server rejects it; the FE surfaces the error and keeps the modal open.
    await expect(
      page.locator(".ant-message-error").first(),
    ).toBeVisible({ timeout: 10_000 });
    await expect(modal).toBeVisible();

    // Nothing was persisted.
    const listRes = await page.context().request.get(MGMT_LIST, {
      params: { filter: specName, skipCount: 0, maxResultCount: 10 },
    });
    expect(listRes.ok()).toBeTruthy();
    const list = (await listRes.json()) as { totalCount: number };
    expect(list.totalCount).toBe(0);
  });
});
