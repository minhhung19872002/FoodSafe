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

    expect(requestedPath).toBe(
      "/api/v1/app/api-endpoint/abc-123/toggle-status",
    );
  });

  it("loads shareable alert options with the search filter", async () => {
    let requestedUrl = "";
    server.use(
      http.get("*/v1/app/data-sharing/alert-options", ({ request }) => {
        requestedUrl = request.url;
        return HttpResponse.json([
          { id: "alert-1", alertNumber: "CB-001", title: "Cảnh báo mẫu" },
        ]);
      }),
    );

    const result = await dataIntegrationApi.getAlertShareOptions("CB-001");

    const url = new URL(requestedUrl);
    expect(url.pathname).toBe("/api/v1/app/data-sharing/alert-options");
    expect(url.searchParams.get("filter")).toBe("CB-001");
    expect(result[0]?.id).toBe("alert-1");
  });

  it("loads shareable inspection-result options with the search filter", async () => {
    let requestedUrl = "";
    server.use(
      http.get(
        "*/v1/app/data-sharing/inspection-result-options",
        ({ request }) => {
          requestedUrl = request.url;
          return HttpResponse.json([
            {
              id: "result-1",
              businessName: "Cơ sở mẫu",
              inspectionDate: "2026-07-30T00:00:00",
              adminDecisionNumber: "QĐ-001",
            },
          ]);
        },
      ),
    );

    const result =
      await dataIntegrationApi.getInspectionResultShareOptions("QĐ-001");

    const url = new URL(requestedUrl);
    expect(url.pathname).toBe(
      "/api/v1/app/data-sharing/inspection-result-options",
    );
    expect(url.searchParams.get("filter")).toBe("QĐ-001");
    expect(result[0]?.id).toBe("result-1");
  });

  it("forwards the inbound-submission keyword filter", async () => {
    let requestedUrl = "";
    server.use(
      http.get("*/v1/app/partner-account/submissions", ({ request }) => {
        requestedUrl = request.url;
        return HttpResponse.json({ totalCount: 0, items: [] });
      }),
    );

    await dataIntegrationApi.getInboundSubmissions({
      filter: "REQ-001",
      dataType: 1,
      skipCount: 0,
      maxResultCount: 15,
    });

    const url = new URL(requestedUrl);
    expect(url.searchParams.get("filter")).toBe("REQ-001");
    expect(url.searchParams.get("dataType")).toBe("1");
  });
});
