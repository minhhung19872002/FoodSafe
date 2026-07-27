import { describe, expect, it } from "vitest";
import { businessSchema } from "./businessSchema";

describe("businessSchema", () => {
  it("accepts ABP sequential GUID values", () => {
    const result = businessSchema.safeParse({
      organizationId: "3a22ab2f-d5b4-d30a-2357-a2300aef9677",
      name: "Cơ sở kiểm thử",
      productGroupIds: [],
      status: 1,
      hasEligibilityCertificate: false,
      hasVsattpCommitment: false,
    });

    expect(result.success).toBe(true);
  });
});
