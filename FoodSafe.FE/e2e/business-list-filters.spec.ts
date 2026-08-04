/**
 * FR-19-02 (§19.1 "Danh sách cơ sở"): advanced business filters + multi-column
 * sort + pagination, proven against the real full stack.
 *
 * Real React → real HTTP → ASP.NET Core → EF Core → PostgreSQL. NO interception:
 * the browser drives the actual filter/sort/pager controls, and the `request`
 * fixture (genuine HTTP, not page.route) both seeds deterministic cohorts and
 * independently confirms the backend honours each query parameter.
 *
 * Why cohorts are seeded: the shared dev database is degenerate for filtering —
 * every seeded business is Active with a null business-type/classification/
 * province and the catalogs that feed those dropdowns are empty. So filter/sort
 * proofs create their own uniquely-keyworded rows, exercise the control, assert
 * the narrowed/ordered result, then delete the rows.
 */

import { expect, test, type Page } from "@playwright/test";
import { requestVerificationToken, signInAsAdmin } from "./helpers/auth";

const PROVINCE_ORG_ID = "e2e00000-0000-4000-8010-000000000001";
const SEARCH_PLACEHOLDER = "Tên, mã, MST hoặc địa chỉ";
const PAGE_SIZE = 20;

const BUSINESS_STATUS = { Active: 1, Suspended: 3 } as const;

async function csrfHeaders(page: Page) {
  return { RequestVerificationToken: await requestVerificationToken(page) };
}

async function createBusiness(
  page: Page,
  headers: Record<string, string>,
  code: string,
  name: string,
) {
  const response = await page.context().request.post("/api/v1/app/business", {
    headers,
    data: { organizationId: PROVINCE_ORG_ID, code, name, productGroupIds: [] },
  });
  expect(response.ok(), await response.text()).toBeTruthy();
  return (await response.json()) as { id: string; code: string; name: string };
}

async function suspendBusiness(
  page: Page,
  headers: Record<string, string>,
  business: { id: string; code: string; name: string },
) {
  const response = await page.context().request.put(
    `/api/v1/app/business/${business.id}`,
    {
      headers,
      maxRedirects: 0,
      data: {
        organizationId: PROVINCE_ORG_ID,
        code: business.code,
        name: business.name,
        status: BUSINESS_STATUS.Suspended,
        suspensionReason: "E2E filter cohort",
        productGroupIds: [],
      },
    },
  );
  expect(response.ok(), await response.text()).toBeTruthy();
}

async function deleteBusiness(
  page: Page,
  headers: Record<string, string>,
  id: string,
) {
  await page.context().request.delete(`/api/v1/app/business/${id}`, {
    headers,
    maxRedirects: 0,
  });
}

async function searchBusinesses(page: Page, keyword: string) {
  const search = page.getByPlaceholder(SEARCH_PLACEHOLDER);
  await search.fill(keyword);
  await page.keyboard.press("Enter");
}

// Selects an option from the currently-open AntD dropdown by exact label. Scoped
// to the visible dropdown and anchored with ^...$ so "Hoạt động" never matches
// "Ngừng hoạt động".
async function pickOpenOption(page: Page, label: string) {
  await page
    .locator(
      ".ant-select-dropdown:not(.ant-select-dropdown-hidden) .ant-select-item-option",
    )
    .filter({ hasText: new RegExp(`^${label}$`) })
    .click();
}

function firstRowCodeCell(page: Page) {
  return page.locator(".ant-table-tbody tr.ant-table-row td").first();
}

test.describe("FR-19-02 — advanced business list filters, sort & pagination", () => {
  test.setTimeout(120_000);

  test("status filter narrows the list in the real UI and backend", async ({
    page,
  }) => {
    await signInAsAdmin(page);
    const headers = await csrfHeaders(page);
    const suffix = Date.now().toString().slice(-9);
    const activeName = `Cơ sở lọc ${suffix} hoạt động`;
    const suspendedName = `Cơ sở lọc ${suffix} đình chỉ`;

    const active = await createBusiness(
      page,
      headers,
      `E2E-FLT-ACT-${suffix}`,
      activeName,
    );
    const suspended = await createBusiness(
      page,
      headers,
      `E2E-FLT-SUS-${suffix}`,
      suspendedName,
    );
    await suspendBusiness(page, headers, suspended);

    try {
      // Backend honours the Status parameter deterministically for this cohort.
      const req = page.context().request;
      const activeOnly = await req.get(
        `/api/v1/app/business?Filter=${suffix}&Status=${BUSINESS_STATUS.Active}&MaxResultCount=10`,
      );
      const activePayload = (await activeOnly.json()) as {
        totalCount: number;
        items: { code: string }[];
      };
      expect(activePayload.totalCount).toBe(1);
      expect(activePayload.items[0].code).toBe(active.code);

      const suspendedOnly = await req.get(
        `/api/v1/app/business?Filter=${suffix}&Status=${BUSINESS_STATUS.Suspended}&MaxResultCount=10`,
      );
      const suspendedPayload = (await suspendedOnly.json()) as {
        totalCount: number;
        items: { code: string }[];
      };
      expect(suspendedPayload.totalCount).toBe(1);
      expect(suspendedPayload.items[0].code).toBe(suspended.code);

      // Real UI: search isolates the cohort (both rows), then the status
      // dropdown narrows it to exactly one, proving the control drives a real
      // filtered fetch.
      await page.goto("/businesses");
      await searchBusinesses(page, suffix);
      await expect(page.getByText(activeName)).toBeVisible({ timeout: 10_000 });
      await expect(page.getByText(suspendedName)).toBeVisible();

      const statusSelect = page.locator(".filter-toolbar .ant-select").nth(0);
      await statusSelect.click();
      await pickOpenOption(page, "Hoạt động");
      await expect(page.getByText(activeName)).toBeVisible();
      await expect(page.getByText(suspendedName)).toBeHidden();

      await statusSelect.click();
      await pickOpenOption(page, "Đình chỉ");
      await expect(page.getByText(suspendedName)).toBeVisible();
      await expect(page.getByText(activeName)).toBeHidden();
    } finally {
      await deleteBusiness(page, headers, active.id);
      await deleteBusiness(page, headers, suspended.id);
    }
  });

  test("column sort toggles order in the real UI and backend", async ({
    page,
  }) => {
    await signInAsAdmin(page);
    const headers = await csrfHeaders(page);
    const suffix = Date.now().toString().slice(-9);
    const codeA = `E2E-SORT-${suffix}-A`;
    const codeM = `E2E-SORT-${suffix}-M`;
    const codeZ = `E2E-SORT-${suffix}-Z`;

    const rows = [
      await createBusiness(page, headers, codeA, `Cơ sở sắp xếp ${suffix} A`),
      await createBusiness(page, headers, codeM, `Cơ sở sắp xếp ${suffix} M`),
      await createBusiness(page, headers, codeZ, `Cơ sở sắp xếp ${suffix} Z`),
    ];

    try {
      const req = page.context().request;
      // Backend honours the Sorting parameter in both directions.
      const asc = await req.get(
        `/api/v1/app/business?Filter=${suffix}&Sorting=${encodeURIComponent("code asc")}&MaxResultCount=10`,
      );
      const ascCodes = ((await asc.json()) as { items: { code: string }[] })
        .items.map((x) => x.code);
      expect(ascCodes).toEqual([codeA, codeM, codeZ]);

      const desc = await req.get(
        `/api/v1/app/business?Filter=${suffix}&Sorting=${encodeURIComponent("code desc")}&MaxResultCount=10`,
      );
      const descCodes = ((await desc.json()) as { items: { code: string }[] })
        .items.map((x) => x.code);
      expect(descCodes).toEqual([codeZ, codeM, codeA]);

      // Real UI: clicking the "Mã" header cycles ascending → descending and the
      // first visible row's code follows the server-sorted order.
      await page.goto("/businesses");
      await searchBusinesses(page, suffix);
      await expect(firstRowCodeCell(page)).toBeVisible({ timeout: 10_000 });

      // exact: "Mã" also matches the "Mã số thuế" header.
      const codeHeader = page.getByRole("columnheader", {
        name: "Mã",
        exact: true,
      });
      await codeHeader.click(); // ascending
      await expect(firstRowCodeCell(page)).toHaveText(codeA, {
        timeout: 10_000,
      });

      await codeHeader.click(); // descending
      await expect(firstRowCodeCell(page)).toHaveText(codeZ, {
        timeout: 10_000,
      });
    } finally {
      for (const row of rows) {
        await deleteBusiness(page, headers, row.id);
      }
    }
  });

  test("pagination pages through the real list in the UI and backend", async ({
    page,
  }) => {
    await signInAsAdmin(page);
    const headers = await csrfHeaders(page);
    const suffix = Date.now().toString().slice(-9);

    // Backend skip/take pages deterministically over a small seeded cohort.
    const cohort = [
      await createBusiness(page, headers, `E2E-PAGE-${suffix}-1`, `Trang ${suffix} 1`),
      await createBusiness(page, headers, `E2E-PAGE-${suffix}-2`, `Trang ${suffix} 2`),
      await createBusiness(page, headers, `E2E-PAGE-${suffix}-3`, `Trang ${suffix} 3`),
    ];

    try {
      const req = page.context().request;
      const sorting = encodeURIComponent("code asc");
      const firstPage = await req.get(
        `/api/v1/app/business?Filter=${suffix}&Sorting=${sorting}&SkipCount=0&MaxResultCount=2`,
      );
      const firstPayload = (await firstPage.json()) as {
        totalCount: number;
        items: { code: string }[];
      };
      expect(firstPayload.totalCount).toBe(3);
      expect(firstPayload.items).toHaveLength(2);

      const secondPage = await req.get(
        `/api/v1/app/business?Filter=${suffix}&Sorting=${sorting}&SkipCount=2&MaxResultCount=2`,
      );
      const secondPayload = (await secondPage.json()) as {
        items: { code: string }[];
      };
      expect(secondPayload.items).toHaveLength(1);
      // The second page returns rows the first page did not.
      const firstCodes = new Set(firstPayload.items.map((x) => x.code));
      expect(firstCodes.has(secondPayload.items[0].code)).toBeFalsy();

      // Real UI: the full unfiltered list has more than one page; navigating to
      // page 2 loads a fresh set of rows from the backend.
      await page.goto("/businesses");
      await expect(firstRowCodeCell(page)).toBeVisible({ timeout: 10_000 });

      const pageTwo = page.locator(".ant-pagination-item-2");
      await expect(pageTwo).toBeVisible({ timeout: 10_000 });

      const pageOneRows = await page
        .locator(".ant-table-tbody tr.ant-table-row")
        .count();
      expect(pageOneRows).toBe(PAGE_SIZE);
      const pageOneFirst = await firstRowCodeCell(page).textContent();

      await pageTwo.click();
      await expect(async () => {
        const pageTwoFirst = await firstRowCodeCell(page).textContent();
        expect(pageTwoFirst).not.toBe(pageOneFirst);
      }).toPass({ timeout: 10_000 });
    } finally {
      for (const row of cohort) {
        await deleteBusiness(page, headers, row.id);
      }
    }
  });
});
