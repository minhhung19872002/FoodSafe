import { HttpResponse, http } from "msw";
import { describe, expect, it } from "vitest";
import { server } from "@/test/server";
import { documentApi } from "./documentApi";

describe("documentApi", () => {
  it("list uses the expected path contract", async () => {
    let requestedPath = "";
    server.use(
      http.get("*/api/v1/app/administrative-document", ({ request }) => {
        requestedPath = new URL(request.url).pathname;
        return HttpResponse.json({ totalCount: 0, items: [] });
      }),
    );
    const result = await documentApi.list({});
    expect(requestedPath).toBe("/api/v1/app/administrative-document");
    expect(result.items).toEqual([]);
  });

  it("get uses the expected path contract with id", async () => {
    let requestedPath = "";
    server.use(
      http.get("*/api/v1/app/administrative-document/:id", ({ request }) => {
        requestedPath = new URL(request.url).pathname;
        return HttpResponse.json({
          id: "doc-1",
          documentNumber: "VB-001",
          title: "Văn bản kiểm thử",
        });
      }),
    );
    await documentApi.get("doc-1");
    expect(requestedPath).toBe("/api/v1/app/administrative-document/doc-1");
  });
});
