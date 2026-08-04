import { describe, expect, it } from "vitest";
import {
  clusterRecordsByZoom,
  groupRecordsByCoordinates,
  hasValidMapCoordinates,
} from "./poisoningMapCoordinates";

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

describe("groupRecordsByCoordinates", () => {
  it("groups records stored at the same location without inventing coordinates", () => {
    const records = Array.from({ length: 5 }, (_, index) => ({
      id: `case-${index + 1}`,
      locationLatitude: 20.951,
      locationLongitude: 107.082,
    }));

    expect(groupRecordsByCoordinates(records)).toEqual([
      {
        key: "20.951000:107.082000",
        latitude: 20.951,
        longitude: 107.082,
        items: records,
      },
    ]);
  });

  it("keeps distinct locations separate and omits invalid records", () => {
    const groups = groupRecordsByCoordinates([
      {
        id: "case-1",
        locationLatitude: 20.951,
        locationLongitude: 107.082,
      },
      {
        id: "case-2",
        locationLatitude: 20.9581,
        locationLongitude: 107.0453,
      },
      { id: "case-without-coordinates" },
    ]);

    expect(groups).toHaveLength(2);
    expect(groups.map((group) => group.items[0].id)).toEqual([
      "case-1",
      "case-2",
    ]);
  });
});

describe("clusterRecordsByZoom", () => {
  const nearbyRecords = [
    { id: "case-1", locationLatitude: 20.951, locationLongitude: 107.082 },
    { id: "case-2", locationLatitude: 20.9581, locationLongitude: 107.0453 },
  ];

  it("merges nearby records into one cluster when zoomed out", () => {
    const clusters = clusterRecordsByZoom(nearbyRecords, 8);
    expect(clusters).toHaveLength(1);
    expect(clusters[0].items).toHaveLength(2);
    // Centroid sits between the two member coordinates.
    expect(clusters[0].latitude).toBeCloseTo((20.951 + 20.9581) / 2, 6);
    expect(clusters[0].longitude).toBeCloseTo((107.082 + 107.0453) / 2, 6);
  });

  it("splits the same records apart when zoomed in", () => {
    const clusters = clusterRecordsByZoom(nearbyRecords, 15);
    expect(clusters).toHaveLength(2);
  });

  it("omits records without valid coordinates", () => {
    const records: Array<{
      id: string;
      locationLatitude?: number;
      locationLongitude?: number;
    }> = [...nearbyRecords, { id: "no-coords" }];
    const clusters = clusterRecordsByZoom(records, 8);
    expect(clusters.flatMap((c) => c.items)).toHaveLength(2);
  });
});
