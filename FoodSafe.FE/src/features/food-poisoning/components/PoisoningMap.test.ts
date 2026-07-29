import { describe, expect, it } from "vitest";
import { hasValidMapCoordinates } from "./poisoningMapCoordinates";

describe("hasValidMapCoordinates", () => {
  it("accepts coordinates stored for a food-poisoning record", () => {
    expect(
      hasValidMapCoordinates({
        locationLatitude: 20.951,
        locationLongitude: 107.082,
      }),
    ).toBe(true);
  });

  it("rejects missing, non-finite, and out-of-range coordinates", () => {
    expect(hasValidMapCoordinates({})).toBe(false);
    expect(
      hasValidMapCoordinates({
        locationLatitude: Number.NaN,
        locationLongitude: 107.082,
      }),
    ).toBe(false);
    expect(
      hasValidMapCoordinates({
        locationLatitude: 107.082,
        locationLongitude: 20.951,
      }),
    ).toBe(false);
  });
});
