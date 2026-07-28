import { expect, test } from "@playwright/test";
import {
  ADMIN_STATE,
  PRIVATE_ROUTES,
  PUBLIC_ROUTES,
  auditNavigate,
  captureRoute,
  checkHorizontalOverflow,
  recordFinding,
  type AuditRoute,
} from "./helpers";

/**
 * Layout & overflow: mọi route × 6 viewport. Trang không được cuộn ngang —
 * bảng/khối rộng phải cuộn trong container riêng. Screenshot toàn trang tại
 * 1920/768/390 cho vòng soát mắt người.
 */

const VIEWPORTS = [
  { width: 1920, height: 1080 },
  { width: 1440, height: 900 },
  { width: 1366, height: 768 },
  { width: 768, height: 1024 },
  { width: 390, height: 844 },
  { width: 375, height: 812 },
];

const SCREENSHOT_WIDTHS = new Set([1920, 768, 390]);

function responsiveTest(route: AuditRoute, width: number, height: number) {
  test(`${route.path} @ ${width}x${height}`, async ({ page }) => {
    await auditNavigate(page, route.path);

    const overflow = await checkHorizontalOverflow(page);
    let screenshot: string | undefined;
    if (SCREENSHOT_WIDTHS.has(width)) {
      screenshot = await captureRoute(page, route.slug, width);
    }
    if (overflow.hasHorizontalScroll) {
      recordFinding({
        spec: "responsive",
        route: route.path,
        viewport: `${width}x${height}`,
        type: "overflow",
        detail: `scrollWidth=${overflow.scrollWidth} > viewport=${overflow.clientWidth}; offenders: ${overflow.offenders.join(" | ")}`,
        screenshot,
      });
    }
    expect
      .soft(
        overflow.hasHorizontalScroll,
        `horizontal overflow on ${route.path} @ ${width}px — ${overflow.offenders.join(" | ")}`,
      )
      .toBe(false);
  });
}

for (const { width, height } of VIEWPORTS) {
  test.describe(`responsive ${width}x${height} — public`, () => {
    test.use({ viewport: { width, height } });
    for (const route of PUBLIC_ROUTES) responsiveTest(route, width, height);
  });

  test.describe(`responsive ${width}x${height} — admin`, () => {
    test.use({ viewport: { width, height }, storageState: ADMIN_STATE });
    for (const route of PRIVATE_ROUTES) responsiveTest(route, width, height);
  });
}
