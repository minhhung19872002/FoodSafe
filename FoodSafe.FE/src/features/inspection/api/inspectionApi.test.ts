import { HttpResponse, http } from "msw";
import { describe, expect, it } from "vitest";
import { server } from "@/test/server";
import { inspectionPlanApi, inspectionResultApi } from "./inspectionApi";

describe("inspectionApi", () => {
  it("inspectionPlanApi uses the expected list path contract", async () => {
    let requestedPath = "";
    server.use(
      http.get("*/api/v1/app/inspection-plan", ({ request }) => {
        requestedPath = new URL(request.url).pathname;
        return HttpResponse.json({ totalCount: 0, items: [] });
      }),
    );

    const result = await inspectionPlanApi.list({});

    expect(requestedPath).toBe("/api/v1/app/inspection-plan");
    expect(result.items).toEqual([]);
  });

  it("inspectionPlanApi uses the expected businessOptions path contract", async () => {
    let requestedPath = "";
    server.use(
      http.get(
        "*/api/v1/app/inspection-plan/business-options",
        ({ request }) => {
          requestedPath = new URL(request.url).pathname;
          return HttpResponse.json([
            { id: "business-1", code: "CS-01", name: "Cơ sở 01" },
          ]);
        },
      ),
    );

    const result = await inspectionPlanApi.businessOptions();

    expect(requestedPath).toBe(
      "/api/v1/app/inspection-plan/business-options",
    );
    expect(result).toEqual([
      { id: "business-1", code: "CS-01", name: "Cơ sở 01" },
    ]);
  });

  it("inspectionResultApi uses the expected list path contract", async () => {
    let requestedPath = "";
    server.use(
      http.get("*/api/v1/app/inspection-result", ({ request }) => {
        requestedPath = new URL(request.url).pathname;
        return HttpResponse.json({ totalCount: 0, items: [] });
      }),
    );

    const result = await inspectionResultApi.list({});

    expect(requestedPath).toBe("/api/v1/app/inspection-result");
    expect(result.items).toEqual([]);
  });
});
