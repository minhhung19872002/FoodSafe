import {
  CircleMarker,
  MapContainer,
  TileLayer,
  useMapEvents,
} from "react-leaflet";
import type { LatLngExpression } from "leaflet";

interface MapPickerProps {
  latitude?: number;
  longitude?: number;
  onChange: (latitude: number, longitude: number) => void;
}

function ClickHandler({ onChange }: Pick<MapPickerProps, "onChange">) {
  useMapEvents({
    click: (event) => onChange(event.latlng.lat, event.latlng.lng),
  });
  return null;
}

export function MapPicker({ latitude, longitude, onChange }: MapPickerProps) {
  const position: LatLngExpression = [
    latitude ?? 21.0064,
    longitude ?? 107.2925,
  ];

  return (
    <div>
      <MapContainer
        center={position}
        zoom={latitude === undefined ? 9 : 15}
        style={{ height: 280, width: "100%", borderRadius: 8 }}
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ClickHandler onChange={onChange} />
        {latitude !== undefined && longitude !== undefined && (
          <CircleMarker center={[latitude, longitude]} radius={9} />
        )}
      </MapContainer>
      <small>
        Nhấp lên bản đồ để chọn tọa độ
        {latitude !== undefined &&
          `: ${latitude.toFixed(6)}, ${longitude?.toFixed(6)}`}
      </small>
    </div>
  );
}
