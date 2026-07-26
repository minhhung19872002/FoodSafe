import { useMemo } from "react";
import { CircleMarker, MapContainer, Popup, TileLayer } from "react-leaflet";
import { Empty, Tag } from "antd";
import dayjs from "dayjs";
import type { FoodPoisoningCase, FoodPoisoningIncident } from "../types/foodPoisoning.types";
import {
  POISONING_CASE_STATUS_CONFIG,
  POISONING_INCIDENT_STATUS_CONFIG,
  TREATMENT_RESULT_CONFIG,
  type PoisoningCaseStatus,
  type PoisoningIncidentStatus,
} from "../types/foodPoisoning.types";

interface PoisoningMapProps {
  cases: FoodPoisoningCase[];
  incidents: FoodPoisoningIncident[];
}

const QUANG_NINH_CENTER: [number, number] = [21.0064, 107.2925];

export function PoisoningMap({ cases, incidents }: PoisoningMapProps) {
  const mappedCases = useMemo(
    () =>
      cases.filter(
        (c) =>
          c.locationLatitude !== undefined &&
          c.locationLongitude !== undefined,
      ),
    [cases],
  );

  const mappedIncidents = useMemo(
    () =>
      incidents.filter(
        (i) =>
          i.locationLatitude !== undefined &&
          i.locationLongitude !== undefined,
      ),
    [incidents],
  );

  if (mappedCases.length === 0 && mappedIncidents.length === 0) {
    return (
      <Empty
        description="Không có ca/vụ ngộ độc nào có tọa độ trên bản đồ"
        style={{ padding: 40 }}
      />
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 8, display: "flex", gap: 16, fontSize: 13 }}>
        <span>
          <span
            style={{
              display: "inline-block",
              width: 12,
              height: 12,
              borderRadius: "50%",
              background: "#faad14",
              marginRight: 4,
              verticalAlign: "middle",
            }}
          />
          Ca nhỏ lẻ ({mappedCases.length})
        </span>
        <span>
          <span
            style={{
              display: "inline-block",
              width: 12,
              height: 12,
              borderRadius: "50%",
              background: "#ff4d4f",
              marginRight: 4,
              verticalAlign: "middle",
            }}
          />
          Vụ ngộ độc ({mappedIncidents.length})
        </span>
      </div>
      <MapContainer
        center={QUANG_NINH_CENTER}
        zoom={10}
        style={{ height: 520, width: "100%", borderRadius: 8 }}
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {mappedCases.map((c) => (
          <CircleMarker
            key={`case-${c.id}`}
            center={[c.locationLatitude!, c.locationLongitude!]}
            radius={7}
            pathOptions={{
              color: "#faad14",
              fillColor: "#faad14",
              fillOpacity: 0.7,
            }}
          >
            <Popup>
              <div style={{ minWidth: 180 }}>
                <strong>Ca: {c.caseCode}</strong>
                {c.victimName && <div>Nạn nhân: {c.victimName}</div>}
                {c.locationDescription && <div>{c.locationDescription}</div>}
                {c.occurrenceDate && (
                  <div>
                    Ngày xảy ra: {dayjs(c.occurrenceDate).format("DD/MM/YYYY")}
                  </div>
                )}
                {c.suspectedFood && (
                  <div>Thực phẩm nghi ngờ: {c.suspectedFood}</div>
                )}
                {c.treatmentResult && (
                  <div>
                    Kết quả:{" "}
                    <Tag
                      color={
                        TREATMENT_RESULT_CONFIG[c.treatmentResult]?.color
                      }
                    >
                      {TREATMENT_RESULT_CONFIG[c.treatmentResult]?.label}
                    </Tag>
                  </div>
                )}
                <div style={{ marginTop: 4 }}>
                  <Tag
                    color={
                      POISONING_CASE_STATUS_CONFIG[
                        c.status as PoisoningCaseStatus
                      ]?.color
                    }
                  >
                    {
                      POISONING_CASE_STATUS_CONFIG[
                        c.status as PoisoningCaseStatus
                      ]?.label
                    }
                  </Tag>
                </div>
              </div>
            </Popup>
          </CircleMarker>
        ))}
        {mappedIncidents.map((i) => (
          <CircleMarker
            key={`incident-${i.id}`}
            center={[i.locationLatitude!, i.locationLongitude!]}
            radius={Math.min(6 + i.affectedCount, 20)}
            pathOptions={{
              color: "#ff4d4f",
              fillColor: "#ff4d4f",
              fillOpacity: 0.7,
              weight: 2,
            }}
          >
            <Popup>
              <div style={{ minWidth: 200 }}>
                <strong>Vụ: {i.incidentCode}</strong>
                {i.locationDescription && <div>{i.locationDescription}</div>}
                {i.occurrenceDate && (
                  <div>
                    Ngày xảy ra: {dayjs(i.occurrenceDate).format("DD/MM/YYYY")}
                  </div>
                )}
                <div>Tiếp xúc: {i.exposedCount}</div>
                <div>Bị ảnh hưởng: {i.affectedCount}</div>
                <div>Nhập viện: {i.hospitalizedCount}</div>
                {i.deathCount > 0 && (
                  <div style={{ color: "#ff4d4f" }}>
                    Tử vong: {i.deathCount}
                  </div>
                )}
                {i.suspectedFood && (
                  <div>Thực phẩm nghi ngờ: {i.suspectedFood}</div>
                )}
                <div style={{ marginTop: 4 }}>
                  <Tag
                    color={
                      POISONING_INCIDENT_STATUS_CONFIG[
                        i.status as PoisoningIncidentStatus
                      ]?.color
                    }
                  >
                    {
                      POISONING_INCIDENT_STATUS_CONFIG[
                        i.status as PoisoningIncidentStatus
                      ]?.label
                    }
                  </Tag>
                </div>
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}
