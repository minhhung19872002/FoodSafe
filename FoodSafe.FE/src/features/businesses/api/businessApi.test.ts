import { HttpResponse, http } from "msw";
import { describe, expect, it } from "vitest";
import { server } from "@/test/server";
import { businessApi, productApi, productAttachmentApi } from "./businessApi";

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

  it("uploads Excel for preview and confirms with the returned token", async () => {
    let uploaded = false;
    let confirmedToken = "";
    server.use(
      http.post("*/api/v1/app/business/excel/preview", async ({ request }) => {
        const form = await request.formData();
        uploaded = form.has("file");
        return HttpResponse.json({
          confirmationToken: "preview-token",
          totalRows: 1,
          validCount: 1,
          errorCount: 0,
          errors: [],
        });
      }),
      http.post("*/api/v1/app/business/excel/confirm", async ({ request }) => {
        const body = (await request.json()) as {
          confirmationToken: string;
        };
        confirmedToken = body.confirmationToken;
        return HttpResponse.json({ importedCount: 1 });
      }),
    );

    const preview = await businessApi.previewImport(
      new File(["xlsx"], "co-so.xlsx"),
    );
    const result = await businessApi.confirmImport(preview.confirmationToken!);

    expect(uploaded).toBe(true);
    expect(confirmedToken).toBe("preview-token");
    expect(result.importedCount).toBe(1);
  });

  it("uses the product Excel preview and confirm routes", async () => {
    let uploaded = false;
    let confirmedToken = "";
    server.use(
      http.post("*/api/v1/app/product/excel/preview", async ({ request }) => {
        uploaded = (await request.formData()).has("file");
        return HttpResponse.json({
          confirmationToken: "product-preview-token",
          totalRows: 1,
          validCount: 1,
          errorCount: 0,
          errors: [],
        });
      }),
      http.post("*/api/v1/app/product/excel/confirm", async ({ request }) => {
        confirmedToken = (
          (await request.json()) as { confirmationToken: string }
        ).confirmationToken;
        return HttpResponse.json({ importedCount: 1 });
      }),
    );

    const preview = await productApi.previewImport(
      new File(["xlsx"], "san-pham.xlsx"),
    );
    const result = await productApi.confirmImport(preview.confirmationToken!);

    expect(uploaded).toBe(true);
    expect(confirmedToken).toBe("product-preview-token");
    expect(result.importedCount).toBe(1);
  });

  it("uploads and deletes a product attachment through owned routes", async () => {
    let uploaded = false;
    let deleted = false;
    server.use(
      http.post(
        "*/api/v1/app/product/product-1/attachments",
        async ({ request }) => {
          uploaded = (await request.formData()).has("file");
          return HttpResponse.json({
            id: "attachment-1",
            documentOwnerId: "product-1",
            originalName: "chung-nhan.pdf",
            fileSize: 8,
            mimeType: "application/pdf",
            checksum: "a".repeat(64),
            virusScanStatus: 2,
            uploadTime: "2026-07-25T00:00:00Z",
          });
        },
      ),
      http.delete(
        "*/api/v1/app/product/product-1/attachments/attachment-1",
        () => {
          deleted = true;
          return new HttpResponse(null, { status: 204 });
        },
      ),
    );

    const attachment = await productAttachmentApi.upload(
      "product-1",
      new File(["%PDF-1.7"], "chung-nhan.pdf", {
        type: "application/pdf",
      }),
    );
    await productAttachmentApi.delete("product-1", attachment.id);

    expect(uploaded).toBe(true);
    expect(deleted).toBe(true);
  });
});
