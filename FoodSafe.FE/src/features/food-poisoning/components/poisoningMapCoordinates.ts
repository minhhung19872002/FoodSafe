interface LocatedRecord {
  locationLatitude?: number;
  locationLongitude?: number;
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
