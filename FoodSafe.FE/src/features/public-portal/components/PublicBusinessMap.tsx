import { useMemo } from "react";
import { CircleMarker, MapContainer, Popup, TileLayer } from "react-leaflet";
import { Empty, Tag } from "antd";
import { Link } from "react-router-dom";
import {
  BUSINESS_STATUS_CONFIG,
  type PublicBusiness,
} from "../types/publicPortal.types";

const QUANG_NINH_CENTER: [number, number] = [21.0064, 107.2925];

// Color palette for status badges on map markers
const STATUS_MARKER_COLORS: Record<number, string> = {
  1: "#52c41a", // Active  — green
  2: "#8c8c8c", // Inactive — gray
  3: "#f5222d", // Suspended — red
};

const LEGEND_ITEMS = [
  { color: STATUS_MARKER_COLORS[1], label: "Đang hoạt động" },
  { color: STATUS_MARKER_COLORS[2], label: "Ngừng hoạt động" },
  { color: STATUS_MARKER_COLORS[3], label: "Đình chỉ" },
];

interface PublicBusinessMapProps {
  businesses: PublicBusiness[];
  /** Height of the map container in pixels. Defaults to 480. */
  height?: number;
}

/**
 * Leaflet map component for public business portal.
 * Renders one circle marker per business that has coordinates.
 * Popup shows name, address, status badge, and a link to the general search page.
 *
 * NOTE: Coordinates (addressLatitude / addressLongitude) are optional fields on
 * PublicBusiness. The backend must include them in GET /v1/public/businesses/search
 * for markers to appear. Without coordinates the component renders an Empty state.
 */
export function PublicBusinessMap({
  businesses,
  height = 480,
}: PublicBusinessMapProps) {
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
        description={
          <span>
            Không có cơ sở nào có tọa độ trên bản đồ.
            <br />
            <small style={{ color: "rgba(0,0,0,0.45)" }}>
              (Tính năng cần BE bổ sung tọa độ vào kết quả tìm kiếm cơ sở
              công khai)
            </small>
          </span>
        }
        style={{ padding: 40 }}
      />
    );
  }

  return (
    <div>
      <MapContainer
        center={QUANG_NINH_CENTER}
        zoom={10}
        style={{ height, width: "100%", borderRadius: 8 }}
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {mapped.map((b) => {
          const markerColor =
            STATUS_MARKER_COLORS[b.status as number] ?? "#8c8c8c";
          const statusCfg = BUSINESS_STATUS_CONFIG[b.status];
          return (
            <CircleMarker
              key={b.code || b.name}
              center={[b.addressLatitude!, b.addressLongitude!]}
              radius={8}
              pathOptions={{
                color: markerColor,
                fillColor: markerColor,
                fillOpacity: 0.75,
              }}
            >
              <Popup>
                <div style={{ minWidth: 200 }}>
                  <strong>{b.name}</strong>
                  {b.code && (
                    <div style={{ fontSize: 12, color: "#888" }}>
                      Mã: {b.code}
                    </div>
                  )}
                  {b.businessTypeName && (
                    <div style={{ fontSize: 12 }}>{b.businessTypeName}</div>
                  )}
                  {b.addressText && (
                    <div style={{ fontSize: 12, marginTop: 2 }}>
                      {b.addressText}
                    </div>
                  )}
                  <div style={{ marginTop: 6, display: "flex", gap: 4, flexWrap: "wrap" }}>
                    {statusCfg && (
                      <Tag color={statusCfg.color} style={{ margin: 0 }}>
                        {statusCfg.label}
                      </Tag>
                    )}
                    {b.hasEligibilityCertificate && (
                      <Tag color="green" style={{ margin: 0 }}>
                        Đủ ĐK ATTP
                      </Tag>
                    )}
                  </div>
                  <div style={{ marginTop: 6, fontSize: 12 }}>
                    <Link
                      to={`/tra-cuu-chung?q=${encodeURIComponent(b.name)}`}
                    >
                      Tìm kiếm chi tiết
                    </Link>
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>

      <div
        style={{
          display: "flex",
          gap: 16,
          flexWrap: "wrap",
          padding: "8px 4px 0",
          fontSize: 12,
          color: "#595959",
        }}
      >
        {LEGEND_ITEMS.map((item) => (
          <span
            key={item.label}
            style={{ display: "flex", alignItems: "center", gap: 4 }}
          >
            <span
              style={{
                display: "inline-block",
                width: 12,
                height: 12,
                borderRadius: "50%",
                background: item.color,
                flexShrink: 0,
              }}
            />
            {item.label}
          </span>
        ))}
      </div>
    </div>
  );
}
