import { useMemo } from "react";
import { CircleMarker, MapContainer, Popup, TileLayer } from "react-leaflet";
import { Empty } from "antd";
import type { Business } from "../types/business.types";

interface ClassificationRef {
  id: string;
  riskLevel?: number;
  name?: string;
}

interface BusinessLocationMapProps {
  businesses: Business[];
  classifications?: ClassificationRef[];
  onSelect?: (business: Business) => void;
  /** Height of the map container in pixels. Defaults to 520. */
  height?: number;
}

/** BusinessRiskLevel enum values mirrored from the backend (MasterCatalogEnums.cs) */
const RISK_COLORS: Record<number, string> = {
  1: "#f5222d", // High  — đỏ
  2: "#fa8c16", // Medium — cam
  3: "#52c41a", // Low   — xanh lá
};

const RISK_LABELS: Record<number, string> = {
  1: "Nguy cơ cao",
  2: "Nguy cơ vừa",
  3: "Nguy cơ thấp",
};

const UNKNOWN_COLOR = "#8c8c8c";

const LEGEND_ITEMS = [
  { color: RISK_COLORS[1], label: RISK_LABELS[1] },
  { color: RISK_COLORS[2], label: RISK_LABELS[2] },
  { color: RISK_COLORS[3], label: RISK_LABELS[3] },
  { color: UNKNOWN_COLOR, label: "Chưa phân loại" },
];

const QUANG_NINH_CENTER: [number, number] = [21.0064, 107.2925];

export function BusinessLocationMap({
  businesses,
  classifications = [],
  onSelect,
  height = 520,
}: BusinessLocationMapProps) {
  const mapped = useMemo(
    () =>
      businesses.filter(
        (b) =>
          b.addressLatitude !== undefined && b.addressLongitude !== undefined,
      ),
    [businesses],
  );

  /** id → color derived from riskLevel */
  const classificationColorMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const c of classifications) {
      map[c.id] = RISK_COLORS[c.riskLevel ?? 0] ?? UNKNOWN_COLOR;
    }
    return map;
  }, [classifications]);

  /** id → label */
  const classificationLabelMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const c of classifications) {
      map[c.id] = c.name ?? "";
    }
    return map;
  }, [classifications]);

  if (mapped.length === 0) {
    return (
      <Empty
        description="Không có cơ sở nào có tọa độ trên bản đồ"
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
          const color =
            (b.businessClassificationId
              ? classificationColorMap[b.businessClassificationId]
              : undefined) ?? UNKNOWN_COLOR;
          return (
            <CircleMarker
              key={b.id}
              center={[b.addressLatitude!, b.addressLongitude!]}
              radius={8}
              pathOptions={{
                color,
                fillColor: color,
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
                    <div style={{ fontSize: 12, color: "#888" }}>{b.code}</div>
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
                        background: color,
                        color: "#fff",
                      }}
                    >
                      {b.businessClassificationId
                        ? (classificationLabelMap[b.businessClassificationId] ??
                          "Chưa phân loại")
                        : "Chưa phân loại"}
                    </span>
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
