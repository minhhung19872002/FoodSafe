import { HttpResponse, http } from "msw";
import { describe, expect, it } from "vitest";
import { server } from "@/test/server";
import { eligibilityCertificateApi } from "./eligibilityCertificateApi";

describe("eligibilityCertificateApi", () => {
  it("uses generated internal and explicit public routes", async () => {
    const paths: string[] = [];
    server.use(
      http.get(
        "*/api/v1/app/eligibility-certificate/business-options",
        ({ request }) => {
          paths.push(new URL(request.url).pathname);
          return HttpResponse.json([]);
        },
      ),
      http.get("*/api/v1/public/eligibility-certificates", ({ request }) => {
        paths.push(new URL(request.url).pathname);
        return HttpResponse.json({
          certificateNumber: "DDK-001",
          issueDate: "2026-07-25",
          businessName: "Cơ sở",
          status: 1,
        });
      }),
    );
    await eligibilityCertificateApi.businessOptions();
    await eligibilityCertificateApi.publicLookup("DDK-001");
    expect(paths).toEqual([
      "/api/v1/app/eligibility-certificate/business-options",
      "/api/v1/public/eligibility-certificates",
    ]);
  });
});
