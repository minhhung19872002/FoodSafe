import { expect, test, type Page } from "@playwright/test";
import {
  ADMIN_STATE,
  NOPERM_STATE,
  READONLY_STATE,
  TEST_USER_PASSWORD,
  auditNavigate,
  recordFinding,
  recordIssues,
  settle,
  visibleTextLength,
  watchPage,
} from "./helpers";

/**
 * Luồng người dùng thật theo vai trò: đăng nhập qua UI thật, đi hết menu,
 * CRUD, tìm kiếm/lọc/phân trang, và kiểm tra giới hạn quyền của từng vai trò.
 */

/** Menu admin kỳ vọng — phải khớp NAV_CONFIG trong AppLayout.tsx. */
const ADMIN_MENU: Array<{ label: string; path: string }> = [
  { label: "Bảng điều khiển", path: "/dashboard" },
  { label: "Thống kê tổng hợp", path: "/statistics" },
  { label: "Cơ sở và sản phẩm", path: "/businesses" },
  { label: "Hồ sơ tự công bố", path: "/self-declarations" },
  { label: "Đăng ký công bố SP", path: "/product-registrations" },
  { label: "Đăng ký quảng cáo", path: "/advertisement-registrations" },
  { label: "Giấy đủ ĐK ATTP", path: "/eligibility-certificates" },
  { label: "Chứng nhận CFS", path: "/cfs-certificates" },
  { label: "GCN Xuất khẩu", path: "/export-food-certificates" },
  { label: "Thanh tra - Kiểm tra", path: "/inspection" },
  { label: "Ngộ độc thực phẩm", path: "/food-poisoning" },
  { label: "Cảnh báo và Tin tức", path: "/alerts-news" },
  { label: "Phân tích nguy cơ", path: "/risk-analysis" },
  { label: "Kết quả kiểm nghiệm", path: "/testing-results" },
  { label: "Văn bản pháp quy", path: "/documents" },
  { label: "Báo cáo", path: "/reporting" },
  { label: "Tài khoản và quyền", path: "/administration/identity" },
  { label: "Đơn vị", path: "/organizations" },
  { label: "Địa bàn", path: "/geography" },
  { label: "Danh mục dùng chung", path: "/catalogs" },
  { label: "Tích hợp dữ liệu", path: "/data-integration" },
  { label: "Nhật ký hoạt động", path: "/administration/audit-logs" },
  { label: "Cấu hình hệ thống", path: "/administration/settings" },
];

/** Các mục menu chỉ dành cho quản trị — vai trò thường không được thấy. */
const ADMIN_ONLY_MENU = [
  "Tài khoản và quyền",
  "Nhật ký hoạt động",
  "Cấu hình hệ thống",
];

/**
 * Chờ Turnstile phát token. KHÔNG bám vào iframe: tùy build mà Cloudflare
 * render widget có iframe hoặc hoàn toàn ẩn — dấu hiệu ổn định duy nhất là
 * input ẩn `cf-turnstile-response` được điền giá trị. Trả về false khi widget
 * không phát token trong hạn (hành vi sản phẩm: người dùng tải lại trang —
 * UIA-009).
 */
async function waitForCaptchaReady(page: Page): Promise<boolean> {
  try {
    await page.waitForFunction(
      () => {
        const tokenInput = document.querySelector<HTMLInputElement>(
          "input[name='cf-turnstile-response']",
        );
        return Boolean(tokenInput && tokenInput.value.length > 0);
      },
      { timeout: 15_000 },
    );
    await page.waitForTimeout(200); // callback đẩy token vào form state
    return true;
  } catch {
    return false;
  }
}

async function loginThroughUi(
  page: Page,
  user: string,
  password: string,
): Promise<void> {
  // Script Turnstile tải từ Cloudflare thỉnh thoảng không khởi tạo được ở lần
  // tải nguội (UIA-009). Sản phẩm yêu cầu người dùng tải lại trang — harness
  // mô phỏng đúng hành vi đó, tối đa 3 lần.
  for (let attempt = 1; attempt <= 3; attempt++) {
    await page.goto("/login");
    await page.getByPlaceholder("Tên đăng nhập hoặc email").fill(user);
    await page.getByPlaceholder("Mật khẩu").fill(password);
    if (!(await waitForCaptchaReady(page))) continue;

    await page.getByRole("button", { name: "Đăng nhập" }).click();
    try {
      await page.waitForURL((url) => !url.pathname.startsWith("/login"), {
        timeout: 10_000,
      });
      return;
    } catch {
      const tokenLate = await page
        .getByText("Vui lòng hoàn thành xác minh CAPTCHA")
        .isVisible()
        .catch(() => false);
      if (tokenLate) {
        await page.waitForTimeout(2_000);
        await page.getByRole("button", { name: "Đăng nhập" }).click();
        try {
          await page.waitForURL((url) => !url.pathname.startsWith("/login"), {
            timeout: 10_000,
          });
          return;
        } catch {
          // rơi xuống vòng thử lại kế tiếp
        }
      }
    }
  }
  throw new Error(
    `UI login failed for ${user} after 3 attempts (Turnstile widget instability)`,
  );
}

async function visibleMenuLabels(page: Page): Promise<string[]> {
  return page
    .locator(".ant-menu-item .ant-menu-title-content")
    .allInnerTexts()
    .then((labels) => labels.map((label) => label.trim()).filter(Boolean));
}

// ── Đăng nhập / đăng xuất qua UI thật ───────────────────────────────────────

test.describe("real login UI", () => {
  // Dùng tài khoản province.admin thay vì admin: ABP thu hồi session phía
  // server khi logout/đăng nhập lại, nên mọi thao tác login/logout trên tài
  // khoản admin sẽ giết storageState admin mà các test song song đang dùng.
  test("staff account logs in through the real login page and reaches dashboard", async ({
    page,
  }) => {
    const issues = watchPage(page);
    await loginThroughUi(
      page,
      "province.admin@foodsafe.local",
      TEST_USER_PASSWORD,
    );
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByRole("heading", { name: /Xin chào/ })).toBeVisible({
      timeout: 15_000,
    });
    recordIssues("user-flow", "login→dashboard", issues);
    expect.soft(issues.pageErrors, "page errors during login").toEqual([]);
  });

  test("login validation: empty submit shows Vietnamese field errors", async ({
    page,
  }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: "Đăng nhập" }).click();
    await expect(page.getByText("Vui lòng nhập tên đăng nhập")).toBeVisible();
    await expect(page.getByText("Vui lòng nhập mật khẩu")).toBeVisible();
  });

  test("expired-password account is forced to the change-password gate", async ({
    page,
  }) => {
    await loginThroughUi(page, "expired.pw@foodsafe.local", TEST_USER_PASSWORD);
    await page.goto("/dashboard");
    await page.waitForURL("**/account/change-password", { timeout: 20_000 });
    await expect(
      page.getByRole("heading", { name: "Đổi mật khẩu" }),
    ).toBeVisible();
  });
});

test.describe("logout", () => {
  // Phiên riêng qua UI login — không dùng ADMIN_STATE vì logout sẽ thu hồi
  // session đó phía server và làm chết các test song song.
  test("user dropdown → Đăng xuất returns to login", async ({ page }) => {
    await loginThroughUi(
      page,
      "province.admin@foodsafe.local",
      TEST_USER_PASSWORD,
    );
    await auditNavigate(page, "/dashboard");
    await page.locator(".app-header-user").hover();
    await page.getByText("Đăng xuất").click();
    await page.waitForURL(/\/login/, { timeout: 15_000 });
  });
});

// ── Admin: đi hết menu, CRUD, tìm kiếm / lọc / phân trang ───────────────────

test.describe("admin flows", () => {
  test.use({ storageState: ADMIN_STATE });

  test("full menu walk — every entry navigates and renders", async ({
    page,
  }) => {
    test.setTimeout(300_000);
    const issues = watchPage(page);
    await page.goto("/dashboard");
    await settle(page);

    const labels = await visibleMenuLabels(page);
    for (const entry of ADMIN_MENU) {
      expect
        .soft(labels, `menu entry "${entry.label}" visible for admin`)
        .toContain(entry.label);
    }
    for (const extra of labels.filter(
      (label) => !ADMIN_MENU.some((entry) => entry.label === label),
    )) {
      recordFinding({
        spec: "user-flow",
        route: "menu",
        type: "note",
        detail: `unexpected admin menu entry: "${extra}"`,
      });
    }

    for (const entry of ADMIN_MENU) {
      const item = page.getByRole("menuitem", {
        name: entry.label,
        exact: true,
      });
      if ((await item.count()) === 0) continue; // đã báo ở trên
      await item.click();
      await page.waitForURL(`**${entry.path}`, { timeout: 20_000 });
      await settle(page, 8_000);
      const selected = page.locator(".ant-menu-item-selected");
      await expect
        .soft(selected, `active state follows "${entry.label}"`)
        .toContainText(entry.label);
      const textLength = await visibleTextLength(page);
      expect
        .soft(textLength, `"${entry.label}" renders content`)
        .toBeGreaterThan(40);
    }

    recordIssues("user-flow", "menu-walk", issues);
    expect.soft(issues.pageErrors, "page errors during menu walk").toEqual([]);
    expect
      .soft(issues.failedRequests, "failed requests during menu walk")
      .toEqual([]);
  });

  test("catalog CRUD — create, edit, delete a UIAUDIT document type", async ({
    page,
  }) => {
    test.setTimeout(120_000);
    const issues = watchPage(page);

    // Dọn bản ghi UIAUDIT- sót lại từ lần chạy trước (best effort).
    const request = page.context().request;
    const stale = await request.get(
      "/api/v1/app/master-catalog/document-types?Filter=UIAUDIT-&MaxResultCount=100",
    );
    if (stale.ok()) {
      const staleItems = (await stale.json()) as {
        items: Array<{ id: string; code: string }>;
      };
      await page.goto("/catalogs");
      const xsrf = (await page.context().cookies()).find(
        (cookie) => cookie.name === "XSRF-TOKEN",
      );
      for (const item of staleItems.items.filter((entry) =>
        entry.code.startsWith("UIAUDIT-"),
      )) {
        await request.delete(
          `/api/v1/app/master-catalog/${item.id}/document-type`,
          {
            headers: {
              RequestVerificationToken: decodeURIComponent(xsrf?.value ?? ""),
            },
          },
        );
      }
    }

    await page.goto("/catalogs");
    await expect(
      page.getByRole("heading", { name: "Danh mục dùng chung" }),
    ).toBeVisible();
    await page.getByRole("tab", { name: "Loại văn bản" }).click();

    const suffix = Date.now().toString().slice(-8);
    const code = `UIAUDIT-${suffix}`;
    const initialName = `UI audit ${suffix}`;
    const updatedName = `${initialName} sửa`;

    await page.getByRole("button", { name: /thêm mới/i }).click();
    await page.getByRole("textbox", { name: "Mã", exact: true }).fill(code);
    await page
      .getByRole("textbox", { name: "Tên", exact: true })
      .fill(initialName);
    await page.getByRole("button", { name: "Lưu", exact: true }).click();
    await expect(page.getByText("Đã lưu dữ liệu danh mục")).toBeVisible({
      timeout: 10_000,
    });

    let row = page.getByRole("row").filter({ hasText: code });
    await expect(row).toContainText(initialName);

    await row.getByRole("button", { name: `Sửa ${initialName}` }).click();
    await page
      .getByRole("textbox", { name: "Tên", exact: true })
      .fill(updatedName);
    await page.getByRole("button", { name: "Lưu", exact: true }).click();
    await expect(page.getByText("Đã lưu dữ liệu danh mục")).toBeVisible({
      timeout: 10_000,
    });

    row = page.getByRole("row").filter({ hasText: code });
    await expect(row).toContainText(updatedName);

    await row.getByRole("button", { name: `Xóa ${updatedName}` }).click();
    await page.getByRole("button", { name: "Xóa", exact: true }).click();
    await expect(page.getByText("Đã xóa dữ liệu danh mục")).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByRole("row").filter({ hasText: code })).toHaveCount(
      0,
    );

    recordIssues("user-flow", "catalog-crud", issues);
    expect.soft(issues.pageErrors, "page errors during CRUD").toEqual([]);
  });

  test("businesses list — search, filter, pagination, empty state", async ({
    page,
  }) => {
    test.setTimeout(120_000);
    const issues = watchPage(page);
    await auditNavigate(page, "/businesses");

    const search = page.getByPlaceholder("Tên, mã, MST hoặc địa chỉ");
    await expect(search).toBeVisible();

    // Tìm kiếm không có kết quả → empty state phải hiện.
    await search.fill("zzz-uiaudit-khong-the-ton-tai-999");
    await search.press("Enter");
    await settle(page, 8_000);
    await expect
      .soft(
        page.locator(".ant-table .ant-empty, .ant-empty").first(),
        "empty state after nonsense search",
      )
      .toBeVisible({ timeout: 10_000 });

    // Xóa từ khóa → dữ liệu quay lại.
    await search.clear();
    await search.press("Enter");
    await settle(page, 8_000);
    const rows = page.locator(".ant-table-tbody tr.ant-table-row");
    const rowCount = await rows.count();
    if (rowCount === 0) {
      recordFinding({
        spec: "user-flow",
        route: "/businesses",
        type: "note",
        detail: "businesses table has no data — list checks limited",
      });
    }

    // Bộ lọc trạng thái.
    const statusFilter = page
      .locator(".ant-select", { hasText: "Trạng thái" })
      .first();
    if (await statusFilter.count()) {
      await statusFilter.click();
      const option = page
        .locator(".ant-select-dropdown .ant-select-item")
        .first();
      if (await option.count()) {
        await option.click();
        await settle(page, 8_000);
      }
      await page.keyboard.press("Escape");
    }

    // Phân trang nếu có nhiều trang.
    const page2 = page.locator(".ant-pagination-item-2").first();
    if (await page2.count()) {
      await page2.click();
      await settle(page, 8_000);
      await expect
        .soft(
          page.locator(".ant-pagination-item-active"),
          "page 2 becomes active",
        )
        .toHaveText("2");
    } else {
      recordFinding({
        spec: "user-flow",
        route: "/businesses",
        type: "note",
        detail: "only one page of businesses — pagination not exercised",
      });
    }

    recordIssues("user-flow", "/businesses (search/filter)", issues);
    expect.soft(issues.pageErrors, "page errors in list flows").toEqual([]);
    expect
      .soft(issues.failedRequests, "failed requests in list flows")
      .toEqual([]);
  });
});

// ── Vai trò giới hạn ────────────────────────────────────────────────────────

test.describe("readonly (CommuneStaff) restrictions", () => {
  test.use({ storageState: READONLY_STATE });

  test("admin-only menu entries are hidden; direct URLs show 403", async ({
    page,
  }) => {
    const issues = watchPage(page);
    await auditNavigate(page, "/dashboard");

    const labels = await visibleMenuLabels(page);
    recordFinding({
      spec: "user-flow",
      route: "menu(readonly)",
      type: "note",
      detail: `readonly menu = [${labels.join(", ")}]`,
    });
    for (const adminOnly of ADMIN_ONLY_MENU) {
      expect
        .soft(labels, `"${adminOnly}" must be hidden from readonly user`)
        .not.toContain(adminOnly);
    }

    for (const path of [
      "/administration/identity",
      "/administration/settings",
      "/administration/audit-logs",
    ]) {
      await page.goto(path);
      await settle(page, 8_000);
      await expect
        .soft(
          page.getByText("Không có quyền truy cập"),
          `403 UI on ${path} for readonly user`,
        )
        .toBeVisible();
    }
    recordIssues("user-flow", "readonly-restrictions", issues);
  });
});

test.describe("no-permission account", () => {
  test.use({ storageState: NOPERM_STATE });

  test("business pages deny access without crashing", async ({ page }) => {
    const issues = watchPage(page);
    await auditNavigate(page, "/dashboard");
    const labels = await visibleMenuLabels(page);
    recordFinding({
      spec: "user-flow",
      route: "menu(noperm)",
      type: "note",
      detail: `noperm menu = [${labels.join(", ")}]`,
    });

    for (const path of ["/businesses", "/reporting", "/catalogs"]) {
      await page.goto(path);
      await settle(page, 8_000);
      await expect
        .soft(
          page.getByText("Không có quyền truy cập"),
          `403 UI on ${path} for noperm user`,
        )
        .toBeVisible();
    }
    expect.soft(issues.pageErrors, "no crash for noperm user").toEqual([]);
    recordIssues("user-flow", "noperm-restrictions", issues);
  });

  test("statistics page (ungated route) — probe behavior for noperm", async ({
    page,
  }) => {
    // /statistics là route duy nhất không bọc PermissionRoute — ghi nhận
    // hành vi thực tế: trang trắng? lỗi API 403? hay render bình thường?
    const { issues } = await auditNavigate(page, "/statistics");
    const textLength = await visibleTextLength(page);
    recordFinding({
      spec: "user-flow",
      route: "/statistics (noperm)",
      type: issues.failedRequests.length > 0 ? "failed-request" : "note",
      detail: `noperm on /statistics: textLen=${textLength}, failedRequests=[${issues.failedRequests.join("; ")}], consoleErrors=${issues.consoleErrors.length}`,
    });
    recordIssues("user-flow", "/statistics (noperm)", issues);
  });
});
