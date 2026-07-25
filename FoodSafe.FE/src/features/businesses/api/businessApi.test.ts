import { HttpResponse, http } from "msw";
import { describe, expect, it } from "vitest";
import { server } from "@/test/server";
import { businessApi, productApi } from "./businessApi";

describe("business management API", () => {
  it("normalizes nullable business fields and uses the generated v1 route", async () => {
    server.use(
      http.get("*/api/v1/app/business", ({ request }) => {
        expect(new URL(request.url).searchParams.get("filter")).toBe("HL");
        return HttpResponse.json({
          totalCount: 1,
          items: [
            {
              id: "business-1",
              organizationId: "org-1",
              code: "HL-01",
              name: "Cơ sở Hạ Long",
              addressStreet: null,
              status: 1,
              hasEligibilityCertificate: false,
              hasVsattpCommitment: false,
              productGroupIds: null,
              handlers: null,
            },
          ],
        });
      }),
    );

    const result = await businessApi.list({
      filter: "HL",
      skipCount: 0,
      maxResultCount: 20,
    });

    expect(result.items[0].addressStreet).toBeUndefined();
    expect(result.items[0].productGroupIds).toEqual([]);
    expect(result.items[0].handlers).toEqual([]);
  });

  it("uses business-scoped product mutation routes", async () => {
    let body: unknown;
    server.use(
      http.put("*/api/v1/app/product/product-1", async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({
          id: "product-1",
          organizationId: "org-1",
          ...((body ?? {}) as object),
        });
      }),
    );

    await productApi.update("product-1", {
      businessId: "11111111-1111-1111-1111-111111111111",
      code: "P-01",
      name: "Sản phẩm",
      status: 1,
    });

    expect(body).toEqual(
      expect.objectContaining({
        businessId: "11111111-1111-1111-1111-111111111111",
        status: 1,
      }),
    );
  });

  it("uses nested routes for business handlers", async () => {
    let body: unknown;
    server.use(
      http.post(
        "*/api/v1/app/business/business-1/handler",
        async ({ request }) => {
          body = await request.json();
          return HttpResponse.json({
            id: "handler-1",
            businessId: "business-1",
            ...((body ?? {}) as object),
          });
        },
      ),
    );

    const handler = await businessApi.addHandler("business-1", {
      fullName: "Nguyễn Văn A",
      isActive: true,
    });

    expect(body).toEqual({ fullName: "Nguyễn Văn A", isActive: true });
    expect(handler.id).toBe("handler-1");
  });

  it("loads product-scoped business options", async () => {
    server.use(
      http.get("*/api/v1/app/product/business-options", () =>
        HttpResponse.json([
          { id: "business-1", code: "CS-01", name: "Cơ sở 01" },
        ]),
      ),
    );

    await expect(productApi.businessOptions()).resolves.toEqual([
      { id: "business-1", code: "CS-01", name: "Cơ sở 01" },
    ]);
  });
});
