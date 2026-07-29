import { useEffect } from "react";
import {
  CircleMarker,
  MapContainer,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import type { LatLngExpression } from "leaflet";

interface MapPickerProps {
  latitude?: number;
  longitude?: number;
  onChange: (latitude: number, longitude: number) => void;
  /**
   * Renders the map as a plain viewer: no click handling and no "click to
   * pick" hint. Use this wherever the coordinates cannot actually be changed.
   */
  readOnly?: boolean;
}

const PROVINCE_CENTRE: LatLngExpression = [21.0064, 107.2925];
const PROVINCE_ZOOM = 9;
const LOCATED_ZOOM = 15;

function ClickHandler({ onChange }: Pick<MapPickerProps, "onChange">) {
  useMapEvents({
    click: (event) => onChange(event.latlng.lat, event.latlng.lng),
  });
  return null;
}

/**
 * Keeps the viewport on the current coordinates. `MapContainer` only reads
 * `center` on mount, so without this the map stays put when the coordinates
 * are set from outside — e.g. by the "Định vị theo địa chỉ" geocode button.
 */
function RecentreOnChange({
  latitude,
  longitude,
}: Pick<MapPickerProps, "latitude" | "longitude">) {
  const map = useMap();

  useEffect(() => {
    if (latitude === undefined || longitude === undefined) {
      map.setView(PROVINCE_CENTRE, PROVINCE_ZOOM);
      return;
    }
    map.setView([latitude, longitude], LOCATED_ZOOM);
  }, [map, latitude, longitude]);

  return null;
}

export function MapPicker({
  latitude,
  longitude,
  onChange,
  readOnly = false,
}: MapPickerProps) {
  const hasPoint = latitude !== undefined && longitude !== undefined;
  const position: LatLngExpression = hasPoint
    ? [latitude, longitude]
    : PROVINCE_CENTRE;

  return (
    <div>
      <MapContainer
        center={position}
        zoom={hasPoint ? LOCATED_ZOOM : PROVINCE_ZOOM}
        style={{ height: 280, width: "100%", borderRadius: 8 }}
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <RecentreOnChange latitude={latitude} longitude={longitude} />
        {!readOnly && <ClickHandler onChange={onChange} />}
        {hasPoint && <CircleMarker center={[latitude, longitude]} radius={9} />}
      </MapContainer>
      <small>
        {readOnly ? "Tọa độ" : "Nhấp lên bản đồ để chọn tọa độ"}
        {hasPoint && `: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`}
        {readOnly && !hasPoint && ": chưa có"}
      </small>
    </div>
  );
}
