import type { ReactNode } from "react";
import { Alert, Button, Descriptions, Drawer, Empty, Spin, Tag } from "antd";
import axios from "axios";
import dayjs from "dayjs";
import { useTestingResult } from "../api/testingResultQueries";
import {
  TESTING_OUTCOME_CONFIG,
  type TestingResult,
} from "../types/testingResult.types";

interface Props {
  testingResultId: string | null;
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

function date(value: string | null): string {
  return value ? dayjs(value).format("DD/MM/YYYY") : DASH;
}

function dateTime(value: string | null): string {
  return value ? dayjs(value).format("DD/MM/YYYY HH:mm") : DASH;
}

function TestingResultDetailView({ record }: { record: TestingResult }) {
  const outcomeCfg = TESTING_OUTCOME_CONFIG[record.outcome];
  return (
    <Descriptions column={2} size="small" bordered>
      <Descriptions.Item label="Mã mẫu">{record.sampleCode}</Descriptions.Item>
      <Descriptions.Item label="Kết quả">
        <Tag color={outcomeCfg.color}>{outcomeCfg.label}</Tag>
      </Descriptions.Item>
      <Descriptions.Item label="Tên mẫu" span={2}>
        {record.sampleName}
      </Descriptions.Item>
      <Descriptions.Item label="Mô tả" span={2}>
        {paragraph(record.description)}
      </Descriptions.Item>
      <Descriptions.Item label="Cơ sở kiểm nghiệm">
        {short(record.testingCenterName)}
      </Descriptions.Item>
      <Descriptions.Item label="Dịch vụ kiểm nghiệm">
        {short(record.testingServiceName)}
      </Descriptions.Item>
      <Descriptions.Item label="Cơ sở lấy mẫu">
        {short(record.businessName)}
      </Descriptions.Item>
      <Descriptions.Item label="Sản phẩm">
        {short(record.productName)}
      </Descriptions.Item>
      <Descriptions.Item label="Ngày lấy mẫu">
        {date(record.sampleDate)}
      </Descriptions.Item>
      <Descriptions.Item label="Ngày nộp mẫu">
        {date(record.submissionDate)}
      </Descriptions.Item>
      <Descriptions.Item label="Ngày có kết quả">
        {date(record.resultDate)}
      </Descriptions.Item>
      <Descriptions.Item label="Số phiếu kiểm nghiệm">
        {short(record.certificateNumber)}
      </Descriptions.Item>
      <Descriptions.Item label="Chỉ tiêu không đạt" span={2}>
        {paragraph(record.failedCriteria)}
      </Descriptions.Item>
      <Descriptions.Item label="Phạm vi">
        <Tag color={record.isPublic ? "blue" : "default"}>
          {record.isPublic ? "Công khai" : "Nội bộ"}
        </Tag>
      </Descriptions.Item>
      <Descriptions.Item label="Ngày tạo">
        {dateTime(record.creationTime)}
      </Descriptions.Item>
      <Descriptions.Item label="Kết quả thanh kiểm tra liên quan">
        {short(record.inspectionResultId)}
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

export function TestingResultDetailDrawer({ testingResultId, onClose }: Props) {
  const { data, isLoading, isError, error, refetch } = useTestingResult(
    testingResultId ?? "",
  );
  const notFound = axios.isAxiosError(error) && error.response?.status === 404;

  return (
    <Drawer
      title="Chi tiết kết quả kiểm nghiệm"
      open={testingResultId !== null}
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
        <Empty description="Không tìm thấy kết quả kiểm nghiệm. Bản ghi có thể đã bị xóa." />
      )}
      {isError && !notFound && (
        <Alert
          type="error"
          showIcon
          message="Không thể tải chi tiết kết quả kiểm nghiệm."
          description={
            <Button size="small" onClick={() => void refetch()}>
              Thử lại
            </Button>
          }
        />
      )}
      {!isError && data && <TestingResultDetailView record={data} />}
    </Drawer>
  );
}
