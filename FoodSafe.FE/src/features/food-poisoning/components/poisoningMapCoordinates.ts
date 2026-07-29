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
