import { HttpResponse, http } from "msw";
import { describe, expect, it } from "vitest";
import { server } from "@/test/server";
import {
  actionMonthReportApi,
  atpWorkReportApi,
  ndtpReportApi,
} from "./reportingApi";

describe("reportingApi", () => {
  it("ndtpReportApi.list uses correct path contract", async () => {
    let requestedPath = "";
    server.use(
      http.get("*/api/v1/app/ndtp-report", ({ request }) => {
        requestedPath = new URL(request.url).pathname;
        return HttpResponse.json({ totalCount: 0, items: [] });
      }),
    );

    await ndtpReportApi.list({});

    expect(requestedPath).toBe("/api/v1/app/ndtp-report");
  });

  it("ndtpReportApi.get uses correct path contract", async () => {
    let requestedPath = "";
    server.use(
      http.get("*/api/v1/app/ndtp-report/:id", ({ request }) => {
        requestedPath = new URL(request.url).pathname;
        return HttpResponse.json({
          id: "report-1",
          status: 1,
          totalCount: 0,
          items: [],
        });
      }),
    );

    await ndtpReportApi.get("report-1");

    expect(requestedPath).toBe("/api/v1/app/ndtp-report/report-1");
  });

  it("atpWorkReportApi.list uses correct path contract", async () => {
    let requestedPath = "";
    server.use(
      http.get("*/api/v1/app/atp-work-report", ({ request }) => {
        requestedPath = new URL(request.url).pathname;
        return HttpResponse.json({ totalCount: 0, items: [] });
      }),
    );

    await atpWorkReportApi.list({});

    expect(requestedPath).toBe("/api/v1/app/atp-work-report");
  });

  it("actionMonthReportApi.list uses correct path contract", async () => {
    let requestedPath = "";
    server.use(
      http.get("*/api/v1/app/action-month-report", ({ request }) => {
        requestedPath = new URL(request.url).pathname;
        return HttpResponse.json({ totalCount: 0, items: [] });
      }),
    );

    await actionMonthReportApi.list({});

    expect(requestedPath).toBe("/api/v1/app/action-month-report");
  });
});
