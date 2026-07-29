import { useMemo } from "react";
import {
  CircleMarker,
  MapContainer,
  Popup,
  TileLayer,
  Tooltip,
} from "react-leaflet";
import { Empty, Tag } from "antd";
import dayjs from "dayjs";
import type {
  FoodPoisoningCase,
  FoodPoisoningIncident,
} from "../types/foodPoisoning.types";
import { groupRecordsByCoordinates } from "./poisoningMapCoordinates";
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
  const caseGroups = useMemo(() => groupRecordsByCoordinates(cases), [cases]);

  const incidentGroups = useMemo(
    () => groupRecordsByCoordinates(incidents),
    [incidents],
  );

  const mappedCaseCount = caseGroups.reduce(
    (total, group) => total + group.items.length,
    0,
  );
  const mappedIncidentCount = incidentGroups.reduce(
    (total, group) => total + group.items.length,
    0,
  );

  if (mappedCaseCount === 0 && mappedIncidentCount === 0) {
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
          Ca nhỏ lẻ ({mappedCaseCount})
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
          Vụ ngộ độc ({mappedIncidentCount})
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
        {caseGroups.map((group) => (
          <CircleMarker
            key={`case-${group.key}`}
            center={[group.latitude, group.longitude]}
            radius={group.items.length > 1 ? 10 : 7}
            pathOptions={{
              color: "#faad14",
              fillColor: "#faad14",
              fillOpacity: 0.7,
            }}
          >
            {group.items.length > 1 && (
              <Tooltip permanent direction="top" offset={[0, -8]}>
                {group.items.length} ca
              </Tooltip>
            )}
            <Popup>
              <div style={{ minWidth: 220, maxHeight: 320, overflowY: "auto" }}>
                {group.items.length > 1 && (
                  <strong>{group.items.length} ca tại cùng vị trí</strong>
                )}
                {group.items.map((c, index) => (
                  <div
                    key={c.id}
                    style={{
                      marginTop: group.items.length > 1 ? 8 : 0,
                      paddingTop: index > 0 ? 8 : 0,
                      borderTop: index > 0 ? "1px solid #f0f0f0" : undefined,
                    }}
                  >
                    <strong>Ca: {c.caseCode}</strong>
                    {c.victimName && <div>Nạn nhân: {c.victimName}</div>}
                    {c.locationDescription && (
                      <div>{c.locationDescription}</div>
                    )}
                    {c.occurrenceDate && (
                      <div>
                        Ngày xảy ra:{" "}
                        {dayjs(c.occurrenceDate).format("DD/MM/YYYY")}
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
                ))}
              </div>
            </Popup>
          </CircleMarker>
        ))}
        {incidentGroups.map((group) => (
          <CircleMarker
            key={`incident-${group.key}`}
            center={[group.latitude, group.longitude]}
            radius={Math.min(
              6 + Math.max(...group.items.map((item) => item.affectedCount)),
              20,
            )}
            pathOptions={{
              color: "#ff4d4f",
              fillColor: "#ff4d4f",
              fillOpacity: 0.7,
              weight: 2,
            }}
          >
            {group.items.length > 1 && (
              <Tooltip permanent direction="top" offset={[0, -8]}>
                {group.items.length} vụ
              </Tooltip>
            )}
            <Popup>
              <div style={{ minWidth: 220, maxHeight: 320, overflowY: "auto" }}>
                {group.items.length > 1 && (
                  <strong>{group.items.length} vụ tại cùng vị trí</strong>
                )}
                {group.items.map((i, index) => (
                  <div
                    key={i.id}
                    style={{
                      marginTop: group.items.length > 1 ? 8 : 0,
                      paddingTop: index > 0 ? 8 : 0,
                      borderTop: index > 0 ? "1px solid #f0f0f0" : undefined,
                    }}
                  >
                    <strong>Vụ: {i.incidentCode}</strong>
                    {i.locationDescription && (
                      <div>{i.locationDescription}</div>
                    )}
                    {i.occurrenceDate && (
                      <div>
                        Ngày xảy ra:{" "}
                        {dayjs(i.occurrenceDate).format("DD/MM/YYYY")}
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
                ))}
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}
