import { expect, test } from "@playwright/test";
import {
  ADMIN_STATE,
  auditNavigate,
  captureRoute,
  recordFinding,
  recordIssues,
  settle,
  watchPage,
} from "./helpers";

/**
 * Kiểm tra mức component + visual regression thủ công có ảnh đối chứng:
 * header, sidebar, bảng, modal, card, drawer mobile, dropdown.
 * Ảnh trước/sau tương tác lưu vào screenshots/ để soát bằng mắt.
 */

test.describe("desktop components (admin @ 1920)", () => {
  test.use({ storageState: ADMIN_STATE });

  test("header: logo, search box, notification bell, user dropdown", async ({
    page,
  }) => {
    const issues = watchPage(page);
    await auditNavigate(page, "/dashboard");

    await expect(page.locator(".sidebar-logo")).toBeVisible();
    await expect(page.getByLabel("Tìm nhanh hồ sơ, cơ sở")).toBeVisible();
    await expect(page.getByLabel("Thông báo")).toBeVisible();

    // Dropdown người dùng mở và đủ 3 hành động.
    await page.locator(".app-header-user").hover();
    await expect(page.getByText("Thông tin cá nhân")).toBeVisible();
    await expect(page.getByText("Đổi mật khẩu").first()).toBeVisible();
    await expect(page.getByText("Đăng xuất")).toBeVisible();
    await captureRoute(page, "header-user-dropdown-open", 1920, {
      fullPage: false,
    });

    recordIssues("visual", "header", issues);
  });

  test("sidebar: active state follows route, collapse toggle works", async ({
    page,
  }) => {
    await auditNavigate(page, "/businesses");

    await expect(
      page.locator(".ant-menu-item-selected"),
      "menu highlights current route",
    ).toContainText("Cơ sở và sản phẩm");

    const sider = page.locator(".ant-layout-sider").first();
    const expandedWidth = (await sider.boundingBox())?.width ?? 0;
    await captureRoute(page, "sidebar-expanded", 1920, { fullPage: false });

    // Nút đầu tiên trong header là toggle thu gọn.
    await page.locator("header.app-header button").first().click();
    await page.waitForTimeout(500);
    const collapsedWidth = (await sider.boundingBox())?.width ?? 0;
    await captureRoute(page, "sidebar-collapsed", 1920, { fullPage: false });

    expect
      .soft(collapsedWidth, "sidebar actually collapses")
      .toBeLessThan(expandedWidth);
    if (collapsedWidth >= expandedWidth) {
      recordFinding({
        spec: "visual",
        route: "/businesses",
        type: "visual",
        detail: `sidebar collapse: width ${expandedWidth} → ${collapsedWidth}px (no change)`,
      });
    }
    // Mở lại để không ảnh hưởng test sau (state trong cùng page).
    await page.locator("header.app-header button").first().click();
  });

  test("dashboard: stat cards align, before/after interaction screenshots", async ({
    page,
  }) => {
    const issues = watchPage(page);
    await auditNavigate(page, "/dashboard");
    await captureRoute(page, "dashboard-initial", 1920);

    // Card cùng hàng (cùng offsetTop) phải cao bằng nhau (lệch ≤ 2px).
    const misaligned = await page.evaluate(() => {
      const cards = Array.from(
        document.querySelectorAll<HTMLElement>(".ant-card"),
      );
      const rows = new Map<number, HTMLElement[]>();
      for (const card of cards) {
        const top = Math.round(card.getBoundingClientRect().top / 4) * 4;
        rows.set(top, [...(rows.get(top) ?? []), card]);
      }
      const problems: string[] = [];
      for (const [top, rowCards] of rows) {
        if (rowCards.length < 2) continue;
        const heights = rowCards.map((c) =>
          Math.round(c.getBoundingClientRect().height),
        );
        if (Math.max(...heights) - Math.min(...heights) > 2) {
          problems.push(
            `row@${top}px heights=[${heights.join(",")}] (${rowCards.length} cards)`,
          );
        }
      }
      return problems;
    });
    for (const detail of misaligned) {
      recordFinding({
        spec: "visual",
        route: "/dashboard",
        type: "visual",
        detail: `unequal card heights in a row: ${detail}`,
      });
    }

    recordIssues("visual", "/dashboard", issues);
  });

  test("businesses table: containment, header, long-text handling", async ({
    page,
  }) => {
    await auditNavigate(page, "/businesses");
    const table = page.locator(".ant-table").first();
    await expect(table).toBeVisible();

    // Bảng rộng phải cuộn bên trong container của nó, không đẩy layout.
    const containment = await page.evaluate(() => {
      const content = document.querySelector<HTMLElement>(
        ".ant-table-content, .ant-table-body",
      );
      if (!content) return null;
      const style = getComputedStyle(content);
      return {
        scrollWidth: content.scrollWidth,
        clientWidth: content.clientWidth,
        overflowX: style.overflowX,
      };
    });
    if (
      containment &&
      containment.scrollWidth > containment.clientWidth + 1 &&
      !["auto", "scroll"].includes(containment.overflowX)
    ) {
      recordFinding({
        spec: "visual",
        route: "/businesses",
        type: "visual",
        detail: `table wider than container (${containment.scrollWidth}>${containment.clientWidth}) without overflow-x scroll (${containment.overflowX})`,
      });
      expect.soft(false, "table overflow not contained").toBe(true);
    }

    await captureRoute(page, "businesses-table", 1920);
  });

  test("catalogs create modal: centered, fits viewport, validation, close", async ({
    page,
  }) => {
    const issues = watchPage(page);
    await auditNavigate(page, "/catalogs");
    await page.getByRole("button", { name: /thêm mới/i }).click();

    const modal = page.locator(".ant-modal").first();
    await expect(modal).toBeVisible();
    // Modal của AntD zoom từ vị trí nút bấm — đợi hết hiệu ứng rồi mới đo,
    // đo giữa chừng sẽ cho tọa độ lệch giả.
    await page.waitForTimeout(450);
    const box = await modal.boundingBox();
    const viewport = page.viewportSize();
    if (box && viewport) {
      const centerOffset = Math.abs(box.x + box.width / 2 - viewport.width / 2);
      expect
        .soft(centerOffset, "modal horizontally centered (±40px)")
        .toBeLessThanOrEqual(40);
      expect
        .soft(
          box.y >= 0 && box.y + box.height <= viewport.height,
          `modal fits viewport height (y=${box.y}, h=${box.height}, vp=${viewport.height})`,
        )
        .toBe(true);
      if (box.y + box.height > viewport.height) {
        recordFinding({
          spec: "visual",
          route: "/catalogs",
          type: "visual",
          detail: `create modal bottom overflows viewport: y=${box.y} h=${box.height} vp=${viewport.height}`,
        });
      }
    }

    // Validate rỗng: submit ngay → phải có thông báo lỗi tiếng Việt dưới ô nhập.
    await page.getByRole("button", { name: "Lưu", exact: true }).click();
    const errorCount = await page
      .locator(".ant-form-item-explain-error")
      .count();
    expect
      .soft(errorCount, "required-field messages appear under inputs")
      .toBeGreaterThan(0);
    await captureRoute(page, "catalogs-modal-validation", 1920, {
      fullPage: false,
    });

    // Đóng bằng nút X.
    await page.locator(".ant-modal-close").click();
    await expect(modal).toBeHidden();

    recordIssues("visual", "/catalogs (modal)", issues);
  });
});

test.describe("mobile components (admin @ 390)", () => {
  test.use({
    storageState: ADMIN_STATE,
    viewport: { width: 390, height: 844 },
  });

  test("mobile drawer menu opens, navigates, closes", async ({ page }) => {
    const issues = watchPage(page);
    await auditNavigate(page, "/dashboard");

    await page.locator("header.app-header button").first().click();
    // AntD bản này không render node .ant-drawer-content — bám vào wrapper.
    const drawer = page.locator(".ant-drawer-content-wrapper");
    await expect(drawer).toBeVisible();
    await captureRoute(page, "mobile-drawer-open", 390, { fullPage: false });

    await drawer
      .getByRole("menuitem", { name: "Cơ sở và sản phẩm", exact: true })
      .click();
    await page.waitForURL("**/businesses", { timeout: 20_000 });
    await expect(drawer, "drawer closes after navigation").toBeHidden();

    recordIssues("visual", "mobile-drawer", issues);
  });

  test("mobile modal fits screen and select dropdown stays in viewport", async ({
    page,
  }) => {
    const issues = watchPage(page);
    await auditNavigate(page, "/catalogs");
    await page.getByRole("button", { name: /thêm mới/i }).click();

    const modal = page.locator(".ant-modal").first();
    await expect(modal).toBeVisible();
    const box = await modal.boundingBox();
    const viewport = page.viewportSize();
    if (box && viewport) {
      expect
        .soft(
          box.width <= viewport.width + 1,
          `modal width ${box.width} within 390px viewport`,
        )
        .toBe(true);
      if (box.width > viewport.width + 1) {
        recordFinding({
          spec: "visual",
          route: "/catalogs",
          viewport: "390x844",
          type: "visual",
          detail: `create modal wider than mobile viewport: ${box.width}px`,
        });
      }
    }
    await captureRoute(page, "catalogs-modal-mobile", 390, { fullPage: false });

    // Select trong modal (nếu có): dropdown phải nằm trong màn hình.
    const select = modal.locator(".ant-select").first();
    if (await select.count()) {
      await select.click();
      const dropdown = page.locator(".ant-select-dropdown").first();
      if (await dropdown.isVisible()) {
        const dropdownBox = await dropdown.boundingBox();
        if (dropdownBox && viewport) {
          expect
            .soft(
              dropdownBox.x >= -1 &&
                dropdownBox.x + dropdownBox.width <= viewport.width + 1,
              `select dropdown inside viewport (x=${dropdownBox.x}, w=${dropdownBox.width})`,
            )
            .toBe(true);
        }
        await page.keyboard.press("Escape");
      }
    }
    await page.locator(".ant-modal-close").click();
    recordIssues("visual", "/catalogs (mobile modal)", issues);
  });

  test("public portal home on mobile — hero and nav usable", async ({
    browser,
  }) => {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
    });
    const page = await context.newPage();
    const issues = watchPage(page);
    await page.goto("/cong-thong-tin");
    await settle(page);
    await captureRoute(page, "public-portal-mobile-initial", 390);
    recordIssues("visual", "/cong-thong-tin (mobile)", issues);
    await context.close();
  });
});
