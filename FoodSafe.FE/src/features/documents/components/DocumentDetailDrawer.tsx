import type { ReactNode } from "react";
import { Alert, Button, Descriptions, Drawer, Empty, Spin, Tag } from "antd";
import axios from "axios";
import dayjs from "dayjs";
import { useDocument } from "../api/documentQueries";
import {
  DOCUMENT_STATUS_CONFIG,
  type AdministrativeDocument,
} from "../types/document.types";

interface Props {
  documentId: string | null;
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

function DocumentDetailView({ record }: { record: AdministrativeDocument }) {
  const statusCfg = DOCUMENT_STATUS_CONFIG[record.status];
  return (
    <Descriptions column={2} size="small" bordered>
      <Descriptions.Item label="Số văn bản">
        {record.documentNumber}
      </Descriptions.Item>
      <Descriptions.Item label="Trạng thái">
        <Tag color={statusCfg.color}>{statusCfg.label}</Tag>
      </Descriptions.Item>
      <Descriptions.Item label="Tiêu đề" span={2}>
        {record.title}
      </Descriptions.Item>
      <Descriptions.Item label="Loại văn bản">
        {short(record.documentTypeName)}
      </Descriptions.Item>
      <Descriptions.Item label="Cơ quan ban hành">
        {short(record.issuingAuthority)}
      </Descriptions.Item>
      <Descriptions.Item label="Ngày ban hành">
        {date(record.issuedDate)}
      </Descriptions.Item>
      <Descriptions.Item label="Ngày hiệu lực">
        {date(record.effectiveDate)}
      </Descriptions.Item>
      <Descriptions.Item label="Ngày hết hiệu lực">
        {date(record.expiryDate)}
      </Descriptions.Item>
      <Descriptions.Item label="Phạm vi">
        <Tag color={record.isPublic ? "blue" : "default"}>
          {record.isPublic ? "Công khai" : "Nội bộ"}
        </Tag>
      </Descriptions.Item>
      <Descriptions.Item label="Tóm tắt nội dung" span={2}>
        {paragraph(record.summary)}
      </Descriptions.Item>
      <Descriptions.Item label="Ngày tạo">
        {dateTime(record.creationTime)}
      </Descriptions.Item>
      <Descriptions.Item label="Đơn vị">
        {record.organizationId}
      </Descriptions.Item>
      <Descriptions.Item label="Mã loại văn bản">
        {record.documentTypeId}
      </Descriptions.Item>
      <Descriptions.Item label="Mã bản ghi">{record.id}</Descriptions.Item>
    </Descriptions>
  );
}

export function DocumentDetailDrawer({ documentId, onClose }: Props) {
  const { data, isLoading, isError, error, refetch } = useDocument(
    documentId ?? "",
  );
  const notFound = axios.isAxiosError(error) && error.response?.status === 404;

  return (
    <Drawer
      title="Chi tiết văn bản"
      open={documentId !== null}
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
        <Empty description="Không tìm thấy văn bản. Văn bản có thể đã bị xóa." />
      )}
      {isError && !notFound && (
        <Alert
          type="error"
          showIcon
          message="Không thể tải chi tiết văn bản."
          description={
            <Button size="small" onClick={() => void refetch()}>
              Thử lại
            </Button>
          }
        />
      )}
      {!isError && data && <DocumentDetailView record={data} />}
    </Drawer>
  );
}
