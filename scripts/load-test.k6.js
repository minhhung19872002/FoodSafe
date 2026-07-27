// k6 load test for NFR-01..06 (docs/audit/60-customer-requirement-baseline.md §2.5)
//
// NFR-01: average response < 10s (main workflows, excluding reports)
// NFR-02: max response < 30s (all operations)
// NFR-05: >= 30 concurrent connections
// NFR-06: >= 5 active users simultaneously
//
// Run against the local Docker stack (WEB_PORT=8080):
//   docker run --rm -i --add-host=host.docker.internal:host-gateway `
//     -e BASE_URL=http://host.docker.internal:8080 `
//     -e ADMIN_PASSWORD=<SEED_ADMIN_PASSWORD from FoodSafe.BE/.env> `
//     grafana/k6 run - < scripts/load-test.k6.js
//
// Auth model: cookie session (ABP /api/account/login) + antiforgery header.
// Captcha uses Cloudflare Turnstile TEST keys locally, so any token passes.

import http from "k6/http";
import { check, sleep } from "k6";
import { Trend } from "k6/metrics";

const BASE_URL = __ENV.BASE_URL || "http://host.docker.internal:8080";
const USERNAME = __ENV.ADMIN_USERNAME || "admin";
const PASSWORD = __ENV.ADMIN_PASSWORD || "";

const loginDuration = new Trend("login_duration", true);

export const options = {
  // Keep the ABP session cookie across iterations (login happens once per VU).
  noCookiesReset: true,
  scenarios: {
    steady_30_users: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "30s", target: 30 }, // ramp up
        { duration: "2m", target: 30 }, // NFR-05: hold 30 concurrent users
        { duration: "15s", target: 0 },
      ],
      gracefulRampDown: "10s",
    },
  },
  thresholds: {
    // NFR-01: average < 10s
    http_req_duration: ["avg<10000", "max<30000"], // NFR-02: max < 30s
    // Practical sanity target well below the contractual ceiling:
    "http_req_duration{expected_response:true}": ["p(95)<5000"],
    http_req_failed: ["rate<0.01"],
    checks: ["rate>0.99"],
  },
};

function xsrfHeader(jar) {
  const cookies = jar.cookiesForURL(BASE_URL + "/");
  const token = cookies["XSRF-TOKEN"] ? cookies["XSRF-TOKEN"][0] : null;
  return token ? { RequestVerificationToken: token } : {};
}

function login(jar) {
  // Prime antiforgery cookie exactly like the SPA does.
  const cfg = http.get(
    `${BASE_URL}/api/abp/application-configuration?IncludeLocalizationResources=false`,
    { tags: { name: "app-configuration" } },
  );
  check(cfg, { "app-configuration 200": (r) => r.status === 200 });

  const res = http.post(
    `${BASE_URL}/api/account/login`,
    JSON.stringify({
      userNameOrEmailAddress: USERNAME,
      password: PASSWORD,
      captchaToken: "XXXX.DUMMY.TOKEN.XXXX",
      rememberMe: false,
    }),
    {
      headers: {
        "Content-Type": "application/json",
        ...xsrfHeader(jar),
      },
      tags: { name: "login" },
    },
  );
  loginDuration.add(res.timings.duration);
  if (res.status !== 200 && __ENV.DEBUG) {
    console.error(`login -> ${res.status}: ${String(res.body).slice(0, 300)}`);
  }
  const ok = check(res, {
    "login 200": (r) => r.status === 200,
    "login result Success": (r) => {
      try {
        return JSON.parse(r.body).result === 1;
      } catch {
        return false;
      }
    },
  });
  if (ok) {
    // Refresh antiforgery token for the authenticated session.
    http.get(
      `${BASE_URL}/api/abp/application-configuration?IncludeLocalizationResources=false`,
      { tags: { name: "app-configuration" } },
    );
  }
  return ok;
}

// Main-workflow read endpoints (NFR-01 scope: main flows, reports excluded).
const READS = [
  { name: "current-user-context", url: "/api/v1/app/current-user-context" },
  { name: "dashboard-stats", url: "/api/v1/app/dashboard/stats" },
  {
    name: "business-list",
    url: "/api/v1/app/business?SkipCount=0&MaxResultCount=15",
  },
  {
    name: "inspection-plan-list",
    url: "/api/v1/app/inspection-plan?SkipCount=0&MaxResultCount=15",
  },
  {
    name: "inspection-result-list",
    url: "/api/v1/app/inspection-result?SkipCount=0&MaxResultCount=15",
  },
  { name: "statistics", url: "/api/v1/app/statistics?Year=2026" },
];

export default function () {
  const jar = http.cookieJar();

  if (__ITER === 0) {
    if (!login(jar)) {
      sleep(5);
      return;
    }
  }

  for (const r of READS) {
    const res = http.get(`${BASE_URL}${r.url}`, { tags: { name: r.name } });
    if (res.status !== 200 && __ENV.DEBUG) {
      console.error(`${r.name} -> ${res.status}: ${String(res.body).slice(0, 200)}`);
    }
    check(res, { [`${r.name} 200`]: (x) => x.status === 200 });
    sleep(0.5 + Math.random());
  }

  // Think time between iterations (active users, NFR-06).
  sleep(1 + Math.random() * 2);
}

export function handleSummary(data) {
  const m = data.metrics;
  const d = m.http_req_duration.values;
  const lines = [
    "# k6 load test summary (NFR-01..06)",
    `requests: ${m.http_reqs.values.count}`,
    `failed rate: ${(m.http_req_failed.values.rate * 100).toFixed(2)}%`,
    `avg: ${d.avg.toFixed(0)}ms (NFR-01 limit 10000ms)`,
    `p95: ${d["p(95)"].toFixed(0)}ms`,
    `max: ${d.max.toFixed(0)}ms (NFR-02 limit 30000ms)`,
    `max VUs: ${m.vus_max.values.max} (NFR-05 target 30)`,
  ];
  return { stdout: lines.join("\n") + "\n" };
}
