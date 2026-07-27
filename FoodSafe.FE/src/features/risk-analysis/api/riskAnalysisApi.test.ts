import { HttpResponse, http } from "msw";
import { describe, expect, it } from "vitest";
import { server } from "@/test/server";
import { riskAnalysisApi } from "./riskAnalysisApi";

describe("riskAnalysisApi", () => {
  it("list uses the expected path contract", async () => {
    let requestedPath = "";
    server.use(
      http.get("*/api/v1/app/risk-analysis", ({ request }) => {
        requestedPath = new URL(request.url).pathname;
        return HttpResponse.json({ totalCount: 0, items: [] });
      }),
    );
    const result = await riskAnalysisApi.list({});
    expect(requestedPath).toBe("/api/v1/app/risk-analysis");
    expect(result.items).toEqual([]);
  });

  it("get uses the expected path contract with id", async () => {
    let requestedPath = "";
    server.use(
      http.get("*/api/v1/app/risk-analysis/:id", ({ request }) => {
        requestedPath = new URL(request.url).pathname;
        return HttpResponse.json({
          id: "ra-1",
          title: "Phân tích nguy cơ kiểm thử",
        });
      }),
    );
    await riskAnalysisApi.get("ra-1");
    expect(requestedPath).toBe("/api/v1/app/risk-analysis/ra-1");
  });
});
