import { expect, test, type Page } from "@playwright/test";

/**
 * Public lookup entry points (STT 41–48).
 *
 * The seven per-type routes were consolidated in the July-2026 portal redesign:
 * they now redirect into two tabbed pages — `/tra-cuu-chung` (facility/product/
 * result lookups) and `/tra-cuu-giay-phep` (the five licence types plus
 * advertisement registrations). Each legacy URL must still land a citizen on
 * the right tab, and each tab must run a real search against the public API.
 */

interface LookupCase {
  /** Legacy route a citizen may still have bookmarked. */
  route: string;
  /** Consolidated page the route must land on. */
  landingPath: string;
  /** Tab that must be active after the redirect. */
  tabLabel: string;
  /** Page heading of the consolidated page. */
  heading: string;
  /** Search box placeholder of the active tab. */
  placeholder: string;
}

const LOOKUPS: LookupCase[] = [
  {
    route: "/tra-cuu-co-so",
    landingPath: "/tra-cuu-chung",
    tabLabel: "Cơ sở SXKD",
    heading: "Tra cứu thông tin an toàn thực phẩm",
    placeholder: "Tên hoặc mã cơ sở...",
  },
  {
    route: "/tra-cuu-tu-cong-bo",
    landingPath: "/tra-cuu-giay-phep",
    tabLabel: "Hồ sơ tự công bố",
    heading: "Tra cứu giấy phép & chứng nhận ATTP",
    placeholder: "Số hồ sơ, tên cơ sở...",
  },
  {
    route: "/tra-cuu-dang-ky-cong-bo",
    landingPath: "/tra-cuu-giay-phep",
    tabLabel: "Đăng ký công bố sản phẩm",
    heading: "Tra cứu giấy phép & chứng nhận ATTP",
    placeholder: "Số đăng ký, tên sản phẩm...",
  },
  {
    route: "/tra-cuu-giay-du-dieu-kien",
    landingPath: "/tra-cuu-giay-phep",
    tabLabel: "Giấy đủ ĐK ATTP",
    heading: "Tra cứu giấy phép & chứng nhận ATTP",
    placeholder: "Số giấy phép, tên cơ sở...",
  },
  {
    route: "/tra-cuu-cfs",
    landingPath: "/tra-cuu-giay-phep",
    tabLabel: "Chứng nhận CFS",
    heading: "Tra cứu giấy phép & chứng nhận ATTP",
    placeholder: "Số chứng nhận, tên cơ sở...",
  },
  {
    route: "/tra-cuu-gcn-xuat-khau",
    landingPath: "/tra-cuu-giay-phep",
    tabLabel: "GCN Xuất khẩu thực phẩm",
    heading: "Tra cứu giấy phép & chứng nhận ATTP",
    placeholder: "Số giấy chứng nhận, tên cơ sở...",
  },
  {
    route: "/tra-cuu-dang-ky-quang-cao",
    landingPath: "/tra-cuu-giay-phep",
    tabLabel: "Đăng ký quảng cáo",
    heading: "Tra cứu giấy phép & chứng nhận ATTP",
    placeholder: "Số đăng ký, tên cơ sở...",
  },
];

/**
 * The outermost active tab panel. Only the active panel is exposed as a
 * `tabpanel`; the facility tab nests a second (list/map) Tabs inside it, so
 * `.first()` picks the outer panel that contains both.
 */
function activePanel(page: Page) {
  return page.getByRole("tabpanel").first();
}

test.describe("public lookup pages", () => {
  test.setTimeout(45_000);

  for (const lookup of LOOKUPS) {
    test(`${lookup.route} lands on its tab and searches for real`, async ({
      page,
    }) => {
      await page.goto(lookup.route);

      // 1. The legacy route redirects into the consolidated page…
      await expect(page).toHaveURL(new RegExp(`${lookup.landingPath}\\?tab=`));
      await expect(
        page.getByRole("heading", { name: lookup.heading }),
      ).toBeVisible();

      // 2. …with the right tab already selected (not merely present).
      await expect(
        page.getByRole("tab", { name: lookup.tabLabel, exact: true }),
      ).toHaveAttribute("aria-selected", "true");

      // 3. The tab runs a real query: a keyword that cannot match anything
      //    must leave the table empty rather than showing stale rows.
      const panel = activePanel(page);
      const input = panel.getByPlaceholder(lookup.placeholder);
      await expect(input).toBeVisible();
      await input.fill("KHONG-TON-TAI-999999999");

      const searchResponse = page.waitForResponse(
        (response) =>
          response.url().includes("/api/v1/public/") && response.status() === 200,
      );
      await panel.getByRole("button", { name: "Tìm kiếm" }).click();
      await searchResponse;

      await expect(panel.getByText("Không có dữ liệu")).toBeVisible({
        timeout: 10_000,
      });
    });
  }

  test("licence page keeps every certificate type reachable by tab", async ({
    page,
  }) => {
    await page.goto("/tra-cuu-giay-phep");
    for (const tabLabel of [
      "Giấy đủ ĐK ATTP",
      "Hồ sơ tự công bố",
      "Đăng ký công bố sản phẩm",
      "Đăng ký quảng cáo",
      "Chứng nhận CFS",
      "GCN Xuất khẩu thực phẩm",
    ]) {
      await page.getByRole("tab", { name: tabLabel, exact: true }).click();
      await expect(
        page.getByRole("tab", { name: tabLabel, exact: true }),
      ).toHaveAttribute("aria-selected", "true");
      // Each panel owns a live search box — proof the tab really mounted.
      await expect(
        activePanel(page).getByRole("button", { name: "Tìm kiếm" }),
      ).toBeVisible();
    }
  });
});
