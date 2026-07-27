import { expect, test, type Browser, type Page } from "@playwright/test";
import {
  requestVerificationToken,
  signIn,
  signInAsAdmin,
} from "./helpers/auth";

const TEST_PASSWORD = process.env.E2E_TEST_USER_PASSWORD ?? "Admin@2026!";
const YEAR = 2088;

interface ListItem {
  id: string;
  periodYear?: number;
  status?: number;
}

interface ErrorNotification {
  id: string;
  errorFields: string;
  correctionDetails: string;
  status: number;
  response: string | null;
}

async function cleanReports(page: Page, headers: Record<string, string>) {
  const request = page.context().request;
  const response = await request.get(
    "/api/v1/app/ndtp-report?MaxResultCount=1000",
  );
  if (!response.ok()) return;
  for (const item of ((await response.json()) as { items: ListItem[] })
    .items) {
    if (item.periodYear !== YEAR) continue;
    for (const action of ["return", "return-to-draft"]) {
      await request.post(`/api/v1/app/ndtp-report/${item.id}/${action}`, {
        headers,
        maxRedirects: 0,
        data:
          action === "return" ? { returnReason: "E2E cleanup" } : undefined,
      });
    }
    await request.delete(`/api/v1/app/ndtp-report/${item.id}`, {
      headers,
      maxRedirects: 0,
    });
  }
}

async function createDraft(
  page: Page,
  headers: Record<string, string>,
  month: number,
) {
  const response = await page.context().request.post("/api/v1/app/ndtp-report", {
    headers,
    data: {
      periodYear: YEAR,
      periodMonth: month,
      notes: "E2E error-notification report",
    },
  });
  expect(response.ok(), await response.text()).toBeTruthy();
  return (await response.json()) as { id: string };
}

test.describe("report error notifications (FR-33/34/35-05)", () => {
  test.setTimeout(120_000);

  test("full error-notification lifecycle with persistence", async ({
    page,
  }) => {
    await signInAsAdmin(page);
    const headers = {
      RequestVerificationToken: await requestVerificationToken(page),
    };
    const request = page.context().request;
    await cleanReports(page, headers);

    const report = await createDraft(page, headers, 1);

    // Cannot report errors while Draft
    const draftAttempt = await request.post(
      `/api/v1/app/ndtp-report/${report.id}/error-notification`,
      {
        headers,
        maxRedirects: 0,
        data: { errorFields: "x", correctionDetails: "y" },
      },
    );
    expect([400, 403]).toContain(draftAttempt.status());

    // Submit, then add an error notification
    const submit = await request.post(
      `/api/v1/app/ndtp-report/${report.id}/submit`,
      { headers, maxRedirects: 0 },
    );
    expect(submit.ok(), await submit.text()).toBeTruthy();

    const add = await request.post(
      `/api/v1/app/ndtp-report/${report.id}/error-notification`,
      {
        headers,
        maxRedirects: 0,
        data: {
          errorFields: "Số ca ngộ độc",
          correctionDetails: "Giá trị đúng là 12, đã nhập nhầm 21",
        },
      },
    );
    expect(add.ok(), await add.text()).toBeTruthy();
    const created = (await add.json()) as ErrorNotification;
    expect(created.status).toBe(1); // Pending

    // Validation: empty fields rejected
    const invalid = await request.post(
      `/api/v1/app/ndtp-report/${report.id}/error-notification`,
      {
        headers,
        maxRedirects: 0,
        data: { errorFields: "", correctionDetails: "" },
      },
    );
    expect(invalid.status()).toBe(400);

    // Acknowledge, then respond
    const ack = await request.post(
      `/api/v1/app/ndtp-report/${report.id}/acknowledge-error-notification/${created.id}`,
      { headers, maxRedirects: 0 },
    );
    expect(ack.ok(), await ack.text()).toBeTruthy();
    expect(((await ack.json()) as ErrorNotification).status).toBe(2);

    const respond = await request.post(
      `/api/v1/app/ndtp-report/${report.id}/respond-error-notification/${created.id}`,
      {
        headers,
        maxRedirects: 0,
        data: { response: "Đã trả lại báo cáo để đơn vị sửa số liệu" },
      },
    );
    expect(respond.ok(), await respond.text()).toBeTruthy();
    expect(((await respond.json()) as ErrorNotification).status).toBe(3);

    // Persistence via separate retrieval
    const list = await request.get(
      `/api/v1/app/ndtp-report/${report.id}/error-notifications`,
    );
    expect(list.ok(), await list.text()).toBeTruthy();
    const items = (await list.json()) as ErrorNotification[];
    expect(items).toHaveLength(1);
    expect(items[0].status).toBe(3);
    expect(items[0].response).toContain("trả lại");

    // UI: the Sai sót button opens the modal listing the notification
    await page.goto("/reporting");
    await page
      .getByRole("row", { name: new RegExp(`Tháng 1/${YEAR}`) })
      .getByRole("button", { name: "Sai sót" })
      .click();
    await expect(
      page.getByText("Trường sai sót: Số ca ngộ độc"),
    ).toBeVisible();
    await expect(page.getByText(/Phản hồi tuyến trên/)).toBeVisible();

    await cleanReports(page, headers);
  });

  test("user without permission cannot add or read error notifications", async ({
    browser,
    page,
  }) => {
    await signInAsAdmin(page);
    const headers = {
      RequestVerificationToken: await requestVerificationToken(page),
    };
    await cleanReports(page, headers);
    const report = await createDraft(page, headers, 2);
    const submit = await page.context().request.post(
      `/api/v1/app/ndtp-report/${report.id}/submit`,
      { headers, maxRedirects: 0 },
    );
    expect(submit.ok()).toBeTruthy();

    const context = await browser.newContext();
    const other = await context.newPage();
    await signIn(other, "noperm@foodsafe.local", TEST_PASSWORD);
    try {
      const denied = await other.context().request.post(
        `/api/v1/app/ndtp-report/${report.id}/error-notification`,
        {
          maxRedirects: 0,
          data: { errorFields: "x", correctionDetails: "y" },
        },
      );
      expect([401, 403]).toContain(denied.status());

      const deniedList = await other.context().request.get(
        `/api/v1/app/ndtp-report/${report.id}/error-notifications`,
        { maxRedirects: 0 },
      );
      expect([401, 403]).toContain(deniedList.status());
    } finally {
      await context.close();
    }

    await cleanReports(page, headers);
  });
});
