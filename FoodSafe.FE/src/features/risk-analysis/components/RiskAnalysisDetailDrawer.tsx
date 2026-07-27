import type { ReactNode } from "react";
import { Alert, Button, Descriptions, Drawer, Empty, Spin, Tag } from "antd";
import axios from "axios";
import dayjs from "dayjs";
import { ALERT_CATEGORY_LABELS } from "@/features/alerts-news/types/alertsNews.types";
import { useRiskAnalysis } from "../api/riskAnalysisQueries";
import {
  RISK_ANALYSIS_STATUS_CONFIG,
  RISK_LEVEL_CONFIG,
  type RiskAnalysis,
} from "../types/riskAnalysis.types";

interface Props {
  riskAnalysisId: string | null;
  onClose: () => void;
}

const DASH = "—";

function short(value: string | null): ReactNode {
  return value?.trim() ? value : DASH;
}

function paragraph(value: string | null): ReactNode {
  return value?.trim() ? (
    <span style={{ whiteSpace: "pre-wrap" }}>{value}</span>
  ) : (
    DASH
  );
}

function dateTime(value: string | null): string {
  return value ? dayjs(value).format("DD/MM/YYYY HH:mm") : DASH;
}

function RiskAnalysisDetailView({ record }: { record: RiskAnalysis }) {
  const statusCfg = RISK_ANALYSIS_STATUS_CONFIG[record.status];
  const levelCfg = RISK_LEVEL_CONFIG[record.riskLevel];
  return (
    <Descriptions column={2} size="small" bordered>
      <Descriptions.Item label="Tiêu đề" span={2}>
        {record.title}
      </Descriptions.Item>
      <Descriptions.Item label="Chuyên mục">
        {ALERT_CATEGORY_LABELS[record.category] ?? DASH}
      </Descriptions.Item>
      <Descriptions.Item label="Mức độ nguy cơ">
        <Tag color={levelCfg.color}>{levelCfg.label}</Tag>
      </Descriptions.Item>
      <Descriptions.Item label="Trạng thái">
        <Tag color={statusCfg.color}>{statusCfg.label}</Tag>
      </Descriptions.Item>
      <Descriptions.Item label="Phạm vi">
        <Tag color={record.isPublic ? "blue" : "default"}>
          {record.isPublic ? "Công khai" : "Nội bộ"}
        </Tag>
      </Descriptions.Item>
      <Descriptions.Item label="Nội dung phân tích" span={2}>
        {paragraph(record.content)}
      </Descriptions.Item>
      <Descriptions.Item label="Sản phẩm liên quan" span={2}>
        {paragraph(record.relatedProducts)}
      </Descriptions.Item>
      <Descriptions.Item label="Bằng chứng" span={2}>
        {paragraph(record.evidence)}
      </Descriptions.Item>
      <Descriptions.Item label="Khuyến nghị" span={2}>
        {paragraph(record.recommendations)}
      </Descriptions.Item>
      <Descriptions.Item label="Người xuất bản">
        {short(record.publishedById)}
      </Descriptions.Item>
      <Descriptions.Item label="Thời điểm xuất bản">
        {dateTime(record.publishedAt)}
      </Descriptions.Item>
      <Descriptions.Item label="Ngày tạo">
        {dateTime(record.creationTime)}
      </Descriptions.Item>
      <Descriptions.Item label="Đơn vị">
        {record.organizationId}
      </Descriptions.Item>
      <Descriptions.Item label="Mã bản ghi" span={2}>
        {record.id}
      </Descriptions.Item>
    </Descriptions>
  );
}

export function RiskAnalysisDetailDrawer({ riskAnalysisId, onClose }: Props) {
  const { data, isLoading, isError, error, refetch } = useRiskAnalysis(
    riskAnalysisId ?? "",
  );
  const notFound = axios.isAxiosError(error) && error.response?.status === 404;

  return (
    <Drawer
      title="Chi tiết phân tích nguy cơ"
      open={riskAnalysisId !== null}
      onClose={onClose}
      width={760}
      destroyOnHidden
    >
      {isLoading && (
        <div style={{ textAlign: "center", padding: 24 }}>
          <Spin />
        </div>
      )}
      {isError && notFound && (
        <Empty description="Không tìm thấy phân tích nguy cơ. Bản ghi có thể đã bị xóa." />
      )}
      {isError && !notFound && (
        <Alert
          type="error"
          showIcon
          message="Không thể tải chi tiết phân tích nguy cơ."
          description={
            <Button size="small" onClick={() => void refetch()}>
              Thử lại
            </Button>
          }
        />
      )}
      {!isError && data && <RiskAnalysisDetailView record={data} />}
    </Drawer>
  );
}
