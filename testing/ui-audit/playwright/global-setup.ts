import { request, type FullConfig } from "@playwright/test";
import fs from "node:fs";
import {
  ADMIN_PASSWORD,
  ADMIN_STATE,
  AUTH_DIR,
  DUMMY_CAPTCHA_TOKEN,
  NOPERM_STATE,
  READONLY_STATE,
  TEST_USER_PASSWORD,
} from "./helpers";

/**
 * Đăng nhập THẬT qua API (đủ cửa antiforgery + CAPTCHA) một lần cho mỗi vai
 * trò rồi lưu storageState. Các spec dùng lại phiên này — đúng chính sách
 * "stored session created through a previous real login" của repo.
 */
async function createSession(
  baseURL: string,
  user: string,
  password: string,
  file: string,
): Promise<void> {
  const context = await request.newContext({ baseURL });
  const configuration = await context.get(
    "/api/abp/application-configuration?IncludeLocalizationResources=false",
  );
  if (!configuration.ok())
    throw new Error(
      `application-configuration ${configuration.status()} for ${user}`,
    );

  const xsrf = (await context.storageState()).cookies.find(
    (cookie) => cookie.name === "XSRF-TOKEN",
  );
  if (!xsrf) throw new Error(`XSRF-TOKEN cookie missing for ${user}`);

  const login = await context.post("/api/account/login", {
    headers: { RequestVerificationToken: decodeURIComponent(xsrf.value) },
    data: {
      userNameOrEmailAddress: user,
      password,
      captchaToken: DUMMY_CAPTCHA_TOKEN,
      rememberMe: false,
    },
  });
  if (!login.ok())
    throw new Error(
      `login ${login.status()} for ${user}: ${await login.text()}`,
    );
  const result = (await login.json()) as { result?: number };
  if (result.result !== 1)
    throw new Error(`login result=${result.result} for ${user}`);

  // BẮT BUỘC: làm mới antiforgery token SAU đăng nhập — token cấp cho phiên
  // ẩn danh không hợp lệ với phiên đã xác thực, mọi POST từ UI sẽ bị 400.
  const refresh = await context.get(
    "/api/abp/application-configuration?IncludeLocalizationResources=false",
  );
  if (!refresh.ok())
    throw new Error(`post-login refresh ${refresh.status()} for ${user}`);

  await context.storageState({ path: file });
  await context.dispose();
}

export default async function globalSetup(config: FullConfig): Promise<void> {
  const baseURL =
    (config.projects[0]?.use.baseURL as string | undefined) ??
    "http://127.0.0.1:8080";

  // Findings cộng dồn qua nhiều lần chạy theo giai đoạn (routes → responsive
  // → flows); xóa .results/findings.jsonl bằng tay khi bắt đầu một phiên audit
  // mới. Bộ gộp báo cáo tự khử trùng lặp.
  fs.mkdirSync(AUTH_DIR, { recursive: true });

  await createSession(baseURL, "admin", ADMIN_PASSWORD, ADMIN_STATE);
  await createSession(
    baseURL,
    "readonly@foodsafe.local",
    TEST_USER_PASSWORD,
    READONLY_STATE,
  );
  await createSession(
    baseURL,
    "noperm@foodsafe.local",
    TEST_USER_PASSWORD,
    NOPERM_STATE,
  );
}
