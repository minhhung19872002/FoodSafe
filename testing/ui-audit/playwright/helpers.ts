import { type Page } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

export const AUDIT_DIR = path.resolve(__dirname, "..");
export const RESULTS_DIR = path.resolve(__dirname, ".results");
export const AUTH_DIR = path.resolve(__dirname, ".auth");
export const SCREENSHOT_DIR = path.join(AUDIT_DIR, "screenshots");

export const ADMIN_STATE = path.join(AUTH_DIR, "admin.json");
export const READONLY_STATE = path.join(AUTH_DIR, "readonly.json");
export const NOPERM_STATE = path.join(AUTH_DIR, "noperm.json");

// Mật khẩu seed Development đã nằm công khai trong E2eTestDataSeedContributor;
// biến môi trường luôn thắng để chạy được trên môi trường cấu hình khác.
export const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? "Admin@2026!";
export const TEST_USER_PASSWORD =
  process.env.E2E_TEST_USER_PASSWORD ?? ADMIN_PASSWORD;
// Token bất kỳ đều qua cửa Turnstile khi backend dùng test key của Cloudflare.
export const DUMMY_CAPTCHA_TOKEN = "XXXX.DUMMY.TOKEN.XXXX";

export interface AuditRoute {
  /** Tên file screenshot, không dấu, không gạch chéo. */
  slug: string;
  path: string;
}

export const PUBLIC_ROUTES: AuditRoute[] = [
  { slug: "public-portal-home", path: "/cong-thong-tin" },
  { slug: "public-general-search", path: "/tra-cuu-chung" },
  { slug: "public-certificate-search", path: "/tra-cuu-giay-phep" },
  { slug: "public-warned-businesses", path: "/co-so-bi-canh-bao" },
  { slug: "public-news", path: "/tin-tuc" },
  { slug: "public-documents", path: "/tra-cuu-van-ban" },
  { slug: "citizen-alert-report", path: "/gui-phan-anh" },
  { slug: "citizen-news-report", path: "/gui-tin" },
  { slug: "lookup-eligibility", path: "/tra-cuu-giay-du-dieu-kien" },
  { slug: "lookup-cfs", path: "/tra-cuu-cfs" },
  { slug: "lookup-export-cert", path: "/tra-cuu-gcn-xuat-khau" },
  { slug: "lookup-product-registration", path: "/tra-cuu-dang-ky-cong-bo" },
  { slug: "lookup-business", path: "/tra-cuu-co-so" },
  { slug: "lookup-self-declaration", path: "/tra-cuu-tu-cong-bo" },
  { slug: "lookup-ad-registration", path: "/tra-cuu-dang-ky-quang-cao" },
  { slug: "login", path: "/login" },
  { slug: "forgot-password", path: "/account/forgot-password" },
  { slug: "reset-password", path: "/account/reset-password" },
];

export const PRIVATE_ROUTES: AuditRoute[] = [
  { slug: "dashboard", path: "/dashboard" },
  { slug: "statistics", path: "/statistics" },
  { slug: "businesses", path: "/businesses" },
  { slug: "self-declarations", path: "/self-declarations" },
  { slug: "product-registrations", path: "/product-registrations" },
  { slug: "advertisement-registrations", path: "/advertisement-registrations" },
  { slug: "eligibility-certificates", path: "/eligibility-certificates" },
  { slug: "cfs-certificates", path: "/cfs-certificates" },
  { slug: "export-food-certificates", path: "/export-food-certificates" },
  { slug: "inspection", path: "/inspection" },
  { slug: "food-poisoning", path: "/food-poisoning" },
  { slug: "alerts-news", path: "/alerts-news" },
  { slug: "risk-analysis", path: "/risk-analysis" },
  { slug: "testing-results", path: "/testing-results" },
  { slug: "documents", path: "/documents" },
  { slug: "reporting", path: "/reporting" },
  { slug: "identity-administration", path: "/administration/identity" },
  { slug: "organizations", path: "/organizations" },
  { slug: "geography", path: "/geography" },
  { slug: "catalogs", path: "/catalogs" },
  { slug: "data-integration", path: "/data-integration" },
  { slug: "audit-logs", path: "/administration/audit-logs" },
  { slug: "system-settings", path: "/administration/settings" },
  { slug: "change-password", path: "/account/change-password" },
  { slug: "profile", path: "/account/profile" },
];

// ── Console / network monitoring ────────────────────────────────────────────

export interface PageIssues {
  consoleErrors: string[];
  pageErrors: string[];
  failedRequests: string[];
  thirdPartyFailures: string[];
}

const IGNORED_CONSOLE = [/Download the React DevTools/i];
const THIRD_PARTY_HOSTS = [/challenges\.cloudflare\.com/i];

function isThirdParty(url: string): boolean {
  return THIRD_PARTY_HOSTS.some((h) => h.test(url));
}

/** Gắn listener thu lỗi console, lỗi runtime và request hỏng của MỘT trang. */
export function watchPage(page: Page): PageIssues {
  const issues: PageIssues = {
    consoleErrors: [],
    pageErrors: [],
    failedRequests: [],
    thirdPartyFailures: [],
  };
  page.on("console", (msg) => {
    if (msg.type() !== "error") return;
    const text = msg.text();
    if (IGNORED_CONSOLE.some((p) => p.test(text))) return;
    if (isThirdParty(msg.location().url ?? "")) {
      issues.thirdPartyFailures.push(text.slice(0, 500));
      return;
    }
    issues.consoleErrors.push(text.slice(0, 500));
  });
  page.on("pageerror", (error) => {
    issues.pageErrors.push(String(error).slice(0, 500));
  });
  page.on("response", (response) => {
    if (response.status() < 400) return;
    const url = response.url();
    const entry = `${response.status()} ${response.request().method()} ${url}`;
    if (isThirdParty(url)) issues.thirdPartyFailures.push(entry);
    else issues.failedRequests.push(entry);
  });
  page.on("requestfailed", (request) => {
    const failure = request.failure()?.errorText ?? "";
    // ERR_ABORTED là hủy request chủ động (điều hướng, React Query cancel).
    if (!failure || failure === "net::ERR_ABORTED") return;
    const entry = `FAILED(${failure}) ${request.method()} ${request.url()}`;
    if (isThirdParty(request.url())) issues.thirdPartyFailures.push(entry);
    else issues.failedRequests.push(entry);
  });
  return issues;
}

/** Chờ trang lắng: networkidle có trần thời gian vì trang login giữ kết nối. */
export async function settle(page: Page, timeoutMs = 12_000): Promise<void> {
  try {
    await page.waitForLoadState("networkidle", { timeout: timeoutMs });
  } catch {
    // Trang có long-poll/chunk chậm — tiếp tục sau trần chờ.
  }
  await page.waitForTimeout(250);
}

export interface NavigationAudit {
  issues: PageIssues;
  navMs: number;
}

export async function auditNavigate(
  page: Page,
  routePath: string,
): Promise<NavigationAudit> {
  const issues = watchPage(page);
  const started = Date.now();
  await page.goto(routePath, { waitUntil: "domcontentloaded" });
  await settle(page);
  return { issues, navMs: Date.now() - started };
}

/** Độ dài chữ hiển thị — phát hiện trang trắng/spinner chết. */
export async function visibleTextLength(page: Page): Promise<number> {
  return page.evaluate(() => {
    const root = document.querySelector("#root") ?? document.body;
    return (root.textContent ?? "").replace(/\s+/g, " ").trim().length;
  });
}

// ── Overflow detection ──────────────────────────────────────────────────────

export interface OverflowReport {
  hasHorizontalScroll: boolean;
  scrollWidth: number;
  clientWidth: number;
  offenders: string[];
}

/**
 * Trang không được cuộn ngang. Bảng/khối rộng phải tự cuộn trong container
 * `overflow-x: auto` riêng — những vùng đó không làm tăng scrollWidth của
 * documentElement nên không bị bắt nhầm.
 */
export async function checkHorizontalOverflow(
  page: Page,
): Promise<OverflowReport> {
  return page.evaluate(() => {
    const doc = document.documentElement;
    const viewport = doc.clientWidth;
    const hasHorizontalScroll = doc.scrollWidth > viewport + 1;
    const offenders: string[] = [];
    if (hasHorizontalScroll) {
      const reported: Element[] = [];
      for (const el of Array.from(
        document.querySelectorAll<HTMLElement>("body *"),
      )) {
        const rect = el.getBoundingClientRect();
        if (rect.right <= viewport + 1 || rect.width === 0 || rect.height === 0)
          continue;
        if (reported.some((parent) => parent.contains(el))) continue;
        reported.push(el);
        const id = el.id ? `#${el.id}` : "";
        const classes =
          typeof el.className === "string" && el.className.trim()
            ? "." + el.className.trim().split(/\s+/).slice(0, 3).join(".")
            : "";
        offenders.push(
          `${el.tagName.toLowerCase()}${id}${classes} (right=${Math.round(rect.right)}px, w=${Math.round(rect.width)}px)`,
        );
        if (offenders.length >= 8) break;
      }
    }
    return {
      hasHorizontalScroll,
      scrollWidth: doc.scrollWidth,
      clientWidth: viewport,
      offenders,
    };
  });
}

// ── Screenshots ─────────────────────────────────────────────────────────────

export function bucketFor(width: number): "desktop" | "tablet" | "mobile" {
  if (width >= 1366) return "desktop";
  if (width >= 768) return "tablet";
  return "mobile";
}

export async function captureRoute(
  page: Page,
  slug: string,
  width: number,
  options: { fullPage?: boolean } = {},
): Promise<string> {
  const dir = path.join(SCREENSHOT_DIR, bucketFor(width));
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `${slug}-${width}.png`);
  await page.screenshot({ path: file, fullPage: options.fullPage ?? true });
  return path.relative(AUDIT_DIR, file).replace(/\\/g, "/");
}

// ── Findings log (JSONL, gộp vào ui-bug-report.md sau khi chạy) ─────────────

export interface Finding {
  spec: string;
  route: string;
  viewport?: string;
  type:
    | "console-error"
    | "page-error"
    | "failed-request"
    | "overflow"
    | "blank-page"
    | "slow-load"
    | "redirect"
    | "visual"
    | "flow"
    | "note";
  detail: string;
  screenshot?: string;
}

export function recordFinding(finding: Finding): void {
  fs.mkdirSync(RESULTS_DIR, { recursive: true });
  fs.appendFileSync(
    path.join(RESULTS_DIR, "findings.jsonl"),
    JSON.stringify(finding) + "\n",
    "utf8",
  );
}

/** Ghi mọi lỗi thu được của một lần điều hướng vào findings log. */
export function recordIssues(
  spec: string,
  route: string,
  issues: PageIssues,
  viewport?: string,
): void {
  for (const detail of issues.consoleErrors)
    recordFinding({ spec, route, viewport, type: "console-error", detail });
  for (const detail of issues.pageErrors)
    recordFinding({ spec, route, viewport, type: "page-error", detail });
  for (const detail of issues.failedRequests)
    recordFinding({ spec, route, viewport, type: "failed-request", detail });
}
