import { Descriptions, Modal, Table, Tag } from "antd";
import dayjs from "dayjs";
import {
  POISONING_CASE_STATUS_CONFIG,
  TREATMENT_RESULT_CONFIG,
  VICTIM_GENDER_CONFIG,
  type FoodPoisoningCase,
  type TreatmentResult,
  type VictimGender,
} from "../types/foodPoisoning.types";

interface Props {
  open: boolean;
  item: FoodPoisoningCase | null;
  onClose: () => void;
}

const formatDate = (v?: string) => (v ? dayjs(v).format("DD/MM/YYYY") : "—");
const formatDateTime = (v?: string) =>
  v ? dayjs(v).format("DD/MM/YYYY HH:mm") : "—";

export function CaseDetailModal({ open, item, onClose }: Props) {
  if (!item) return null;

  const victimsList =
    item.victims && item.victims.length > 0
      ? item.victims
      : item.victimName
      ? [
          {
            name: item.victimName,
            age: item.victimAge,
            gender: item.victimGender,
            phone: item.victimPhone,
            address: item.victimAddress,
          },
        ]
      : [];

  const statusCfg = POISONING_CASE_STATUS_CONFIG[item.status];
  const treatmentCfg = item.treatmentResult
    ? TREATMENT_RESULT_CONFIG[item.treatmentResult]
    : null;

  return (
    <Modal
      open={open}
      title={
        <div style={{ fontSize: 18, fontWeight: 600 }}>
          Chi tiết ca ngộ độc — {item.caseCode}
        </div>
      }
      width={900}
      footer={null}
      onCancel={onClose}
      destroyOnHidden
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {/* Thông tin chung */}
        <Descriptions
          bordered
          size="small"
          column={{ xs: 1, sm: 2, md: 3 }}
          title={
            <span style={{ fontSize: 14, fontWeight: 600, color: "#1890ff" }}>
              Thông tin chung
            </span>
          }
        >
          <Descriptions.Item label="Mã ca">
            <strong>{item.caseCode}</strong>
          </Descriptions.Item>
          <Descriptions.Item label="Trạng thái">
            <Tag color={statusCfg.color}>{statusCfg.label}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Ngày báo cáo">
            {formatDate(item.reportDate)}
          </Descriptions.Item>
          <Descriptions.Item label="Thời điểm xảy ra">
            {formatDateTime(item.occurrenceDate)}
          </Descriptions.Item>
          <Descriptions.Item label="Thuộc vụ ngộ độc" span={2}>
            {item.incidentId ? item.incidentId : "— (Ca nhỏ lẻ)"}
          </Descriptions.Item>
          <Descriptions.Item label="Địa chỉ chi tiết" span={3}>
            {item.locationDescription || "—"}
          </Descriptions.Item>
        </Descriptions>

        {/* Danh sách nạn nhân */}
        <div>
          <div
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: "#1890ff",
              marginBottom: 8,
            }}
          >
            Danh sách nạn nhân ({victimsList.length} người)
          </div>
          {victimsList.length === 0 ? (
            <div style={{ color: "#8c8c8c", fontStyle: "italic" }}>
              Chưa có thông tin nạn nhân
            </div>
          ) : (
            <Table
              dataSource={victimsList}
              rowKey={(v, i) => (v.id ? v.id : `${i}-${v.name}`)}
              pagination={false}
              size="small"
              bordered
              columns={[
                {
                  title: "STT",
                  key: "stt",
                  width: 50,
                  align: "center",
                  render: (_: unknown, __: unknown, index: number) => index + 1,
                },
                {
                  title: "Họ tên",
                  dataIndex: "name",
                  width: 180,
                  render: (v: string) => <strong>{v}</strong>,
                },
                {
                  title: "Tuổi",
                  dataIndex: "age",
                  width: 70,
                  align: "right",
                  render: (v?: number) => (v != null ? `${v} tuổi` : "—"),
                },
                {
                  title: "Giới tính",
                  dataIndex: "gender",
                  width: 90,
                  render: (v?: VictimGender) =>
                    v ? VICTIM_GENDER_CONFIG[v]?.label : "—",
                },
                {
                  title: "Số điện thoại",
                  dataIndex: "phone",
                  width: 130,
                  render: (v?: string) => v || "—",
                },
                {
                  title: "Địa chỉ nạn nhân",
                  dataIndex: "address",
                  render: (v?: string) => v || "—",
                },
              ]}
            />
          )}
        </div>

        {/* Thông tin thực phẩm & Y tế */}
        <Descriptions
          bordered
          size="small"
          column={{ xs: 1, sm: 2 }}
          title={
            <span style={{ fontSize: 14, fontWeight: 600, color: "#1890ff" }}>
              Thông tin thực phẩm nghi ngờ & Y tế
            </span>
          }
        >
          <Descriptions.Item label="Thực phẩm nghi ngờ">
            {item.suspectedFood || "—"}
          </Descriptions.Item>
          <Descriptions.Item label="Triệu chứng">
            {item.symptoms || "—"}
          </Descriptions.Item>
          <Descriptions.Item label="Nguồn thực phẩm">
            {item.foodSource || "—"}
          </Descriptions.Item>
          <Descriptions.Item label="Ngày chế biến">
            {formatDate(item.foodPreparationDate)}
          </Descriptions.Item>
          <Descriptions.Item label="Thời gian khởi phát" span={2}>
            {formatDateTime(item.onsetTime)}
          </Descriptions.Item>

          <Descriptions.Item label="Cơ sở y tế">
            {item.medicalFacility || "—"}
          </Descriptions.Item>
          <Descriptions.Item label="Ngày điều trị">
            {formatDate(item.treatmentStartDate)}
          </Descriptions.Item>
          <Descriptions.Item label="Kết quả điều trị" span={2}>
            {treatmentCfg ? (
              <Tag color={treatmentCfg.color}>{treatmentCfg.label}</Tag>
            ) : (
              "—"
            )}
          </Descriptions.Item>
        </Descriptions>

        {/* Người báo cáo & Ghi chú */}
        <Descriptions
          bordered
          size="small"
          column={{ xs: 1, sm: 2 }}
          title={
            <span style={{ fontSize: 14, fontWeight: 600, color: "#1890ff" }}>
              Thông tin người báo cáo & Ghi chú
            </span>
          }
        >
          <Descriptions.Item label="Họ tên người báo">
            {item.reporterName || "—"}
          </Descriptions.Item>
          <Descriptions.Item label="SĐT người báo">
            {item.reporterPhone || "—"}
          </Descriptions.Item>
          <Descriptions.Item label="Đơn vị báo cáo">
            {item.reporterOrganization || "—"}
          </Descriptions.Item>
          <Descriptions.Item label="Mối quan hệ">
            {item.reporterRelation || "—"}
          </Descriptions.Item>
          <Descriptions.Item label="Ngày gửi báo cáo">
            {formatDate(item.reportedAt)}
          </Descriptions.Item>
          <Descriptions.Item label="Ngày xác minh">
            {formatDate(item.verifiedAt)}
          </Descriptions.Item>
          <Descriptions.Item label="Ngày tạo">
            {formatDate(item.creationTime)}
          </Descriptions.Item>
          <Descriptions.Item label="Ghi chú">
            {item.notes || "—"}
          </Descriptions.Item>
        </Descriptions>
      </div>
    </Modal>
  );
}
