import { useMemo } from "react";
import { CircleMarker, MapContainer, Popup, TileLayer } from "react-leaflet";
import { Empty } from "antd";
import {
  BUSINESS_STATUS_CONFIG,
  type Business,
  type BusinessStatus,
} from "../types/business.types";

interface BusinessLocationMapProps {
  businesses: Business[];
  onSelect?: (business: Business) => void;
}

const STATUS_COLORS: Record<BusinessStatus, string> = {
  1: "#52c41a",
  2: "#bfbfbf",
  3: "#ff4d4f",
};

const QUANG_NINH_CENTER: [number, number] = [21.0064, 107.2925];

export function BusinessLocationMap({
  businesses,
  onSelect,
}: BusinessLocationMapProps) {
  const mapped = useMemo(
    () =>
      businesses.filter(
        (b) =>
          b.addressLatitude !== undefined && b.addressLongitude !== undefined,
      ),
    [businesses],
  );

  if (mapped.length === 0) {
    return (
      <Empty
        description="Không có cơ sở nào có tọa độ trên bản đồ"
        style={{ padding: 40 }}
      />
    );
  }

  return (
    <MapContainer
      center={QUANG_NINH_CENTER}
      zoom={10}
      style={{ height: 520, width: "100%", borderRadius: 8 }}
    >
      <TileLayer
        attribution="&copy; OpenStreetMap contributors"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {mapped.map((b) => (
        <CircleMarker
          key={b.id}
          center={[b.addressLatitude!, b.addressLongitude!]}
          radius={8}
          pathOptions={{
            color: STATUS_COLORS[b.status] ?? "#1890ff",
            fillColor: STATUS_COLORS[b.status] ?? "#1890ff",
            fillOpacity: 0.7,
          }}
          eventHandlers={
            onSelect ? { click: () => onSelect(b) } : undefined
          }
        >
          <Popup>
            <div style={{ minWidth: 180 }}>
              <strong>{b.name}</strong>
              {b.code && (
                <div style={{ fontSize: 12, color: "#888" }}>
                  {b.code}
                </div>
              )}
              {b.addressStreet && <div>{b.addressStreet}</div>}
              {b.contactPhone && <div>SĐT: {b.contactPhone}</div>}
              <div style={{ marginTop: 4 }}>
                <span
                  style={{
                    display: "inline-block",
                    padding: "1px 6px",
                    borderRadius: 4,
                    fontSize: 12,
                    background:
                      STATUS_COLORS[b.status] ?? "#1890ff",
                    color: "#fff",
                  }}
                >
                  {BUSINESS_STATUS_CONFIG[b.status]?.label}
                </span>
              </div>
            </div>
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
