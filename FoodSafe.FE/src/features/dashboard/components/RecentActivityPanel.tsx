import type { ReactNode } from "react";
import { Card, Empty, List, Tooltip } from "antd";
import {
  AlertOutlined,
  AuditOutlined,
  ExperimentOutlined,
  FileProtectOutlined,
  FileTextOutlined,
  MedicineBoxOutlined,
  SafetyCertificateOutlined,
  ShopOutlined,
  SolutionOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import type { RecentActivityItem } from "../types/dashboard.types";

interface ActivityTypeConfig {
  label: string;
  color: string;
  icon: ReactNode;
}

/**
 * Strategy map keyed by the `entityType` shipped by the backend.
 * Colours reuse the dashboard stat-card palette so the feed stays consistent
 * with the cards above it.
 */
const ACTIVITY_TYPE_CONFIG: Record<string, ActivityTypeConfig> = {
  Business: { label: "Cơ sở SXKD", color: "#00796B", icon: <ShopOutlined /> },
  SelfDeclaration: {
    label: "Tự công bố",
    color: "#0958D9",
    icon: <SolutionOutlined />,
  },
  ProductRegistration: {
    label: "Đăng ký công bố",
    color: "#0958D9",
    icon: <FileProtectOutlined />,
  },
  EligibilityCertificate: {
    label: "Giấy ĐĐK ATTP",
    color: "#389E0D",
    icon: <SafetyCertificateOutlined />,
  },
  CfsCertificate: {
    label: "Chứng nhận CFS",
    color: "#389E0D",
    icon: <SafetyCertificateOutlined />,
  },
  ExportFoodCertificate: {
    label: "GCN Xuất khẩu",
    color: "#389E0D",
    icon: <SafetyCertificateOutlined />,
  },
  AdvertisementRegistration: {
    label: "Quảng cáo",
    color: "#D48806",
    icon: <FileProtectOutlined />,
  },
  InspectionPlan: {
    label: "Kế hoạch thanh tra",
    color: "#722ED1",
    icon: <AuditOutlined />,
  },
  InspectionResult: {
    label: "Kết quả thanh tra",
    color: "#722ED1",
    icon: <AuditOutlined />,
  },
  FoodPoisoningCase: {
    label: "Ngộ độc thực phẩm",
    color: "#CF1322",
    icon: <MedicineBoxOutlined />,
  },
  AtpAlert: { label: "Cảnh báo", color: "#FA8C16", icon: <AlertOutlined /> },
  RiskAnalysis: {
    label: "Phân tích nguy cơ",
    color: "#FA8C16",
    icon: <AlertOutlined />,
  },
  TestingResult: {
    label: "Kiểm nghiệm",
    color: "#2F54EB",
    icon: <ExperimentOutlined />,
  },
};

const DEFAULT_ACTIVITY_ICON = <FileTextOutlined />;
const DEFAULT_ACTIVITY_COLOR = "#8C8C8C";

function resolveActivityType(entityType: string): ActivityTypeConfig {
  return (
    ACTIVITY_TYPE_CONFIG[entityType] ?? {
      label: entityType || "Hoạt động",
      color: DEFAULT_ACTIVITY_COLOR,
      icon: DEFAULT_ACTIVITY_ICON,
    }
  );
}

function formatActivityTime(value: string): string {
  const time = dayjs(value);
  return time.isValid() ? time.format("DD/MM/YYYY HH:mm") : "—";
}

interface RecentActivityPanelProps {
  items: RecentActivityItem[];
}

export function RecentActivityPanel({ items }: RecentActivityPanelProps) {
  return (
    <Card title="Hoạt động gần đây" size="small">
      <List
        size="small"
        dataSource={items}
        style={{ maxHeight: 360, overflowY: "auto" }}
        locale={{
          emptyText: (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="Chưa có hoạt động nào"
            />
          ),
        }}
        renderItem={(item, index) => {
          const type = resolveActivityType(item.entityType);
          return (
            <List.Item key={`${item.entityType}-${item.creationTime}-${index}`}>
              <List.Item.Meta
                avatar={
                  <Tooltip title={type.label}>
                    <span
                      aria-label={type.label}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        background: `${type.color}1A`,
                        color: type.color,
                      }}
                    >
                      {type.icon}
                    </span>
                  </Tooltip>
                }
                title={<span style={{ fontSize: 13 }}>{item.description}</span>}
                description={
                  <span style={{ fontSize: 12 }}>
                    {type.label}
                    {item.creatorName ? ` · ${item.creatorName}` : ""}
                    {` · ${formatActivityTime(item.creationTime)}`}
                  </span>
                }
              />
            </List.Item>
          );
        }}
      />
    </Card>
  );
}
