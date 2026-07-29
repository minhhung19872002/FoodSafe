import { Typography } from "antd";
import dayjs from "dayjs";
import type { Notification } from "../types/notification.types";

const ENTITY_ROUTES: Record<string, string> = {
  NdtpReport: "/reporting",
  AtpWorkReport: "/reporting",
  ActionMonthReport: "/reporting",
  FoodPoisoningCase: "/food-poisoning",
  FoodPoisoningIncident: "/food-poisoning",
  EligibilityCertificate: "/eligibility-certificates",
  ProductRegistration: "/product-registrations",
  AdvertisementRegistration: "/advertisement-registrations",
  CfsCertificate: "/cfs-certificates",
  ExportFoodCertificate: "/export-food-certificates",
};

export function getEntityRoute(entityType?: string): string | null {
  if (!entityType) return null;
  return ENTITY_ROUTES[entityType] ?? null;
}

interface Props {
  notification: Notification;
  onClick: (n: Notification) => void;
}

export function NotificationItem({ notification, onClick }: Props) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 2,
        padding: "10px 16px",
        cursor: "pointer",
        borderBottom: "1px solid #f0f0f0",
        background: notification.isRead ? "transparent" : "#f6ffed",
        transition: "background 0.2s",
      }}
      onClick={() => onClick(notification)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick(notification);
        }
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "#fafafa";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = notification.isRead
          ? "transparent"
          : "#f6ffed";
      }}
    >
      <Typography.Text strong={!notification.isRead} style={{ fontSize: 13 }}>
        {notification.title}
      </Typography.Text>
      <Typography.Paragraph
        type="secondary"
        style={{ fontSize: 12, margin: 0 }}
        ellipsis={{ rows: 2 }}
      >
        {notification.message}
      </Typography.Paragraph>
      <Typography.Text type="secondary" style={{ fontSize: 11 }}>
        {dayjs(notification.creationTime).format("DD/MM/YYYY HH:mm")}
      </Typography.Text>
    </div>
  );
}
