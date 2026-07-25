import { HttpResponse, http } from "msw";
import { describe, expect, it } from "vitest";
import { server } from "@/test/server";
import { productRegistrationApi } from "./productRegistrationApi";

describe("productRegistrationApi", () => {
  it("uses product options and public lookup route contracts", async () => {
    const paths: string[] = [];
    server.use(
      http.get(
        "*/api/v1/app/product-registration/product-options/:businessId",
        ({ params, request }) => {
          paths.push(new URL(request.url).pathname);
          return HttpResponse.json([
            {
              id: "product-1",
              businessId: params.businessId,
              name: "Sản phẩm",
            },
          ]);
        },
      ),
      http.get("*/api/v1/public/product-registrations", ({ request }) => {
        paths.push(new URL(request.url).pathname);
        const number = new URL(request.url).searchParams.get("number");
        return HttpResponse.json({
          registrationNumber: number,
          registrationDate: "2026-07-01",
          productName: "Sản phẩm",
          businessName: "Cơ sở",
          status: 1,
        });
      }),
    );

    await productRegistrationApi.productOptions("business-1");
    await productRegistrationApi.publicLookup("DKCB 01/2026");

    expect(paths).toEqual([
      "/api/v1/app/product-registration/product-options/business-1",
      "/api/v1/public/product-registrations",
    ]);
  });
});
