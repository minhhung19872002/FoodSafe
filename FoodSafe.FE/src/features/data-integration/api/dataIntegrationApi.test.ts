import { HttpResponse, http } from "msw";
import { describe, expect, it } from "vitest";
import { server } from "@/test/server";
import { dataIntegrationApi } from "./dataIntegrationApi";

// NOTE: dataIntegrationApi uses paths like `/api/app/api-endpoint` with axios
// baseURL `/api`, producing the full URL `/api/api/app/api-endpoint`. This is a
// known inconsistency — the CRUD paths double the `/api` prefix while the Excel
// export paths use `/v1/app/...` (no double prefix). These tests pin the current
// behavior so any unintended change is caught.

describe("dataIntegrationApi", () => {
  it("getEndpoints path contract includes /api/app/api-endpoint", async () => {
    let requestedPath = "";
    server.use(
      http.get("*/api/app/api-endpoint", ({ request }) => {
        requestedPath = new URL(request.url).pathname;
        return HttpResponse.json({ totalCount: 0, items: [] });
      }),
    );

    await dataIntegrationApi.getEndpoints({ skipCount: 0, maxResultCount: 10 });

    expect(requestedPath).toContain("/api/app/api-endpoint");
  });

  it("getCallLogs path contract includes /api/app/api-call-log", async () => {
    let requestedPath = "";
    server.use(
      http.get("*/api/app/api-call-log", ({ request }) => {
        requestedPath = new URL(request.url).pathname;
        return HttpResponse.json({ totalCount: 0, items: [] });
      }),
    );

    await dataIntegrationApi.getCallLogs({ skipCount: 0, maxResultCount: 10 });

    expect(requestedPath).toContain("/api/app/api-call-log");
  });
});
