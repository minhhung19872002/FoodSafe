import { HttpResponse, http } from "msw";
import { describe, expect, it } from "vitest";
import { server } from "@/test/server";
import { testingResultApi } from "./testingResultApi";

describe("testingResultApi", () => {
  it("uses the expected list path contract", async () => {
    let requestedPath = "";
    server.use(
      http.get("*/api/v1/app/testing-result", ({ request }) => {
        requestedPath = new URL(request.url).pathname;
        return HttpResponse.json({ totalCount: 0, items: [] });
      }),
    );

    const result = await testingResultApi.list({});

    expect(requestedPath).toBe("/api/v1/app/testing-result");
    expect(result.items).toEqual([]);
  });

  it("uses the expected get path contract with a specific id", async () => {
    let requestedPath = "";
    server.use(
      http.get("*/api/v1/app/testing-result/:id", ({ request }) => {
        requestedPath = new URL(request.url).pathname;
        return HttpResponse.json({
          id: "result-1",
          organizationId: "org-1",
          sampleCode: "MU-001",
        });
      }),
    );

    const result = await testingResultApi.get("result-1");

    expect(requestedPath).toBe("/api/v1/app/testing-result/result-1");
    expect(result.id).toBe("result-1");
  });

  it("loads sampled-facility options from the product lookup contract", async () => {
    let requestedPath = "";
    server.use(
      http.get("*/api/v1/app/product/business-options", ({ request }) => {
        requestedPath = new URL(request.url).pathname;
        return HttpResponse.json([
          { id: "business-1", code: "CS-01", name: "Cơ sở 01" },
          { id: "business-2", code: null, name: "Cơ sở 02" },
        ]);
      }),
    );

    const options = await testingResultApi.businessOptions();

    expect(requestedPath).toBe("/api/v1/app/product/business-options");
    expect(options).toEqual([
      { value: "business-1", label: "Cơ sở 01 (CS-01)" },
      { value: "business-2", label: "Cơ sở 02" },
    ]);
  });

  it("scopes product options to the selected facility", async () => {
    let requestedBusinessId = "";
    server.use(
      http.get("*/api/v1/app/product", ({ request }) => {
        requestedBusinessId =
          new URL(request.url).searchParams.get("businessId") ?? "";
        return HttpResponse.json({
          totalCount: 1,
          items: [{ id: "product-1", code: "SP-01", name: "Sản phẩm 01" }],
        });
      }),
    );

    const options = await testingResultApi.productOptions("business-1");

    expect(requestedBusinessId).toBe("business-1");
    expect(options).toEqual([
      { value: "product-1", label: "Sản phẩm 01 (SP-01)" },
    ]);
  });

  it("scopes inspection-result options to the selected facility", async () => {
    let requestedPath = "";
    let requestedBusinessId = "";
    server.use(
      http.get("*/api/v1/app/inspection-result", ({ request }) => {
        const url = new URL(request.url);
        requestedPath = url.pathname;
        requestedBusinessId = url.searchParams.get("businessId") ?? "";
        return HttpResponse.json({
          totalCount: 2,
          items: [
            {
              id: "ir-1",
              inspectionDate: "2026-03-05T00:00:00",
              adminDecisionNumber: "12/QD",
            },
            {
              id: "ir-2",
              inspectionDate: "2026-01-20T00:00:00",
              adminDecisionNumber: null,
            },
          ],
        });
      }),
    );

    const options =
      await testingResultApi.inspectionResultOptions("business-1");

    expect(requestedPath).toBe("/api/v1/app/inspection-result");
    expect(requestedBusinessId).toBe("business-1");
    expect(options).toEqual([
      { value: "ir-1", label: "05/03/2026 — QĐ 12/QD" },
      { value: "ir-2", label: "20/01/2026" },
    ]);
  });
});
