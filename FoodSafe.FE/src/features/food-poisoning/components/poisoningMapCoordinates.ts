interface LocatedRecord {
  locationLatitude?: number;
  locationLongitude?: number;
}

export interface CoordinateGroup<T extends LocatedRecord> {
  key: string;
  latitude: number;
  longitude: number;
  items: Array<
    T & {
      locationLatitude: number;
      locationLongitude: number;
    }
  >;
}

export function hasValidMapCoordinates<T extends LocatedRecord>(
  record: T,
): record is T & {
  locationLatitude: number;
  locationLongitude: number;
} {
  const { locationLatitude: latitude, locationLongitude: longitude } = record;
  return (
    latitude != null &&
    longitude != null &&
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  );
}

/**
 * Zoom-aware grid clustering (GAP-N4): records falling into the same
 * ~`clusterPixels`-wide screen cell at the given zoom level are merged into
 * one marker positioned at the cluster centroid. At high zoom the cells
 * shrink until every distinct coordinate stands alone.
 */
export function clusterRecordsByZoom<T extends LocatedRecord>(
  records: T[],
  zoom: number,
  clusterPixels = 64,
): CoordinateGroup<T>[] {
  const cellDegrees = (360 / (256 * 2 ** zoom)) * clusterPixels;
  const groups = new Map<string, CoordinateGroup<T>>();

  for (const record of records) {
    if (!hasValidMapCoordinates(record)) continue;

    const key =
      `${Math.floor(record.locationLatitude / cellDegrees)}:` +
      `${Math.floor(record.locationLongitude / cellDegrees)}`;
    const existing = groups.get(key);
    if (existing) {
      existing.items.push(record);
      continue;
    }
    groups.set(key, {
      key,
      latitude: record.locationLatitude,
      longitude: record.locationLongitude,
      items: [record],
    });
  }

  for (const group of groups.values()) {
    group.latitude =
      group.items.reduce((sum, item) => sum + item.locationLatitude, 0) /
      group.items.length;
    group.longitude =
      group.items.reduce((sum, item) => sum + item.locationLongitude, 0) /
      group.items.length;
  }

  return [...groups.values()];
}

export function groupRecordsByCoordinates<T extends LocatedRecord>(
  records: T[],
): CoordinateGroup<T>[] {
  const groups = new Map<string, CoordinateGroup<T>>();

  for (const record of records) {
    if (!hasValidMapCoordinates(record)) continue;

    const key = `${record.locationLatitude.toFixed(6)}:${record.locationLongitude.toFixed(6)}`;
    const existing = groups.get(key);
    if (existing) {
      existing.items.push(record);
      continue;
    }

    groups.set(key, {
      key,
      latitude: record.locationLatitude,
      longitude: record.locationLongitude,
      items: [record],
    });
  }

  return [...groups.values()];
}
