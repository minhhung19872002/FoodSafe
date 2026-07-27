import { HttpResponse, http } from "msw";
import { describe, expect, it } from "vitest";
import { server } from "@/test/server";
import { dataIntegrationApi } from "./dataIntegrationApi";

describe("dataIntegrationApi", () => {
  it("getEndpoints path contract is /api/v1/app/api-endpoint", async () => {
    let requestedPath = "";
    server.use(
      http.get("*/v1/app/api-endpoint", ({ request }) => {
        requestedPath = new URL(request.url).pathname;
        return HttpResponse.json({ totalCount: 0, items: [] });
      }),
    );

    await dataIntegrationApi.getEndpoints({ skipCount: 0, maxResultCount: 10 });

    expect(requestedPath).toBe("/api/v1/app/api-endpoint");
  });

  it("getCallLogs path contract is /api/v1/app/api-call-log", async () => {
    let requestedPath = "";
    server.use(
      http.get("*/v1/app/api-call-log", ({ request }) => {
        requestedPath = new URL(request.url).pathname;
        return HttpResponse.json({ totalCount: 0, items: [] });
      }),
    );

    await dataIntegrationApi.getCallLogs({ skipCount: 0, maxResultCount: 10 });

    expect(requestedPath).toBe("/api/v1/app/api-call-log");
  });

  it("toggleEndpointStatus path contract is /api/v1/app/api-endpoint/{id}/toggle-status", async () => {
    let requestedPath = "";
    server.use(
      http.post("*/v1/app/api-endpoint/*/toggle-status", ({ request }) => {
        requestedPath = new URL(request.url).pathname;
        return HttpResponse.json({});
      }),
    );

    await dataIntegrationApi.toggleEndpointStatus("abc-123");

    expect(requestedPath).toBe("/api/v1/app/api-endpoint/abc-123/toggle-status");
  });
});
