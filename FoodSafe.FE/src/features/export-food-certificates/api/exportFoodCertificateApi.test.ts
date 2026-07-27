import { HttpResponse, http } from "msw";
import { describe, expect, it } from "vitest";
import { server } from "@/test/server";
import { exportFoodCertificateApi } from "./exportFoodCertificateApi";

describe("exportFoodCertificateApi", () => {
  it("list uses the expected path contract", async () => {
    let requestedPath = "";
    server.use(
      http.get("*/api/v1/app/export-food-certificate", ({ request }) => {
        requestedPath = new URL(request.url).pathname;
        return HttpResponse.json({ totalCount: 0, items: [] });
      }),
    );
    const result = await exportFoodCertificateApi.list({
      skipCount: 0,
      maxResultCount: 20,
    });
    expect(requestedPath).toBe("/api/v1/app/export-food-certificate");
    expect(result.items).toEqual([]);
  });

  it("productOptions uses the expected path contract including the businessId segment", async () => {
    let requestedPath = "";
    server.use(
      http.get(
        "*/api/v1/app/export-food-certificate/product-options/:businessId",
        ({ request }) => {
          requestedPath = new URL(request.url).pathname;
          return HttpResponse.json([]);
        },
      ),
    );
    await exportFoodCertificateApi.productOptions("business-42");
    expect(requestedPath).toBe(
      "/api/v1/app/export-food-certificate/product-options/business-42",
    );
  });
});
