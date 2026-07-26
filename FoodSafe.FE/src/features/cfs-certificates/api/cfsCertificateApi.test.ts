import { HttpResponse, http } from "msw";
import { describe, expect, it } from "vitest";
import { server } from "@/test/server";
import { cfsCertificateApi } from "./cfsCertificateApi";

describe("cfsCertificateApi", () => {
  it("uses product options and public lookup route contracts", async () => {
    const paths: string[] = [];
    server.use(
      http.get(
        "*/api/v1/app/cfs-certificate/product-options/:businessId",
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
      http.get("*/api/v1/public/cfs-certificates", ({ request }) => {
        paths.push(new URL(request.url).pathname);
        const number = new URL(request.url).searchParams.get("number");
        return HttpResponse.json({
          certificateNumber: number,
          issueDate: "2026-07-01",
          productName: "Sản phẩm",
          destinationCountryName: "Nhật Bản",
          businessName: "Cơ sở",
          status: 1,
        });
      }),
    );

    await cfsCertificateApi.productOptions("business-1");
    const result = await cfsCertificateApi.publicLookup("CFS 01/2026");

    expect(paths).toEqual([
      "/api/v1/app/cfs-certificate/product-options/business-1",
      "/api/v1/public/cfs-certificates",
    ]);
    expect(result.destinationCountryName).toBe("Nhật Bản");
  });
});
