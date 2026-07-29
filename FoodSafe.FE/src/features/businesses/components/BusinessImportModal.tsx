import { useEffect, useState } from "react";
import {
  DownloadOutlined,
  FileExcelOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import { Alert, Button, Modal, Space, Table, Typography, Upload } from "antd";
import type { ColumnsType } from "antd/es/table";
import type { RcFile } from "antd/es/upload/interface";
import type {
  ExcelImportError,
  ExcelImportPreview,
} from "../types/business.types";

interface Props {
  title?: string;
  entityLabel?: string;
  open: boolean;
  preview?: ExcelImportPreview;
  previewing: boolean;
  confirming: boolean;
  downloadingTemplate: boolean;
  onCancel: () => void;
  onDownloadTemplate: () => void;
  onFileChange: () => void;
  onPreview: (file: File) => void;
  onConfirm: (token: string) => void;
}

const errorColumns: ColumnsType<ExcelImportError> = [
  { title: "Dòng", dataIndex: "rowNumber", width: 80 },
  { title: "Trường", dataIndex: "field", width: 170 },
  { title: "Lỗi", dataIndex: "message" },
];

export function BusinessImportModal({
  title = "Import cơ sở từ Excel",
  entityLabel = "cơ sở",
  open,
  preview,
  previewing,
  confirming,
  downloadingTemplate,
  onCancel,
  onDownloadTemplate,
  onFileChange,
  onPreview,
  onConfirm,
}: Props) {
  const [file, setFile] = useState<RcFile>();

  useEffect(() => {
    if (!open) setFile(undefined);
  }, [open]);

  return (
    <Modal
      open={open}
      title={title}
      width={760}
      footer={null}
      onCancel={onCancel}
      destroyOnHidden
    >
      <Space direction="vertical" size="middle" style={{ width: "100%" }}>
        <Alert
          type="info"
          showIcon
          message="Dữ liệu chỉ được ghi sau khi toàn bộ file hợp lệ và bạn xác nhận."
        />
        <Button
          icon={<DownloadOutlined />}
          loading={downloadingTemplate}
          onClick={onDownloadTemplate}
        >
          Tải file mẫu
        </Button>
        <Upload.Dragger
          accept=".xlsx"
          maxCount={1}
          fileList={
            file
              ? [
                  {
                    uid: file.name,
                    name: file.name,
                    status: "done",
                    originFileObj: file,
                  },
                ]
              : []
          }
          beforeUpload={(selected) => {
            setFile(selected);
            onFileChange();
            return false;
          }}
          onRemove={() => {
            setFile(undefined);
            onFileChange();
            return true;
          }}
        >
          <p className="ant-upload-drag-icon">
            <FileExcelOutlined />
          </p>
          <p className="ant-upload-text">Chọn hoặc kéo file Excel vào đây</p>
        </Upload.Dragger>
        <Button
          type="primary"
          icon={<UploadOutlined />}
          disabled={!file}
          loading={previewing}
          onClick={() => file && onPreview(file)}
        >
          Kiểm tra và xem trước
        </Button>
        {preview && (
          <>
            <Typography.Text>
              Tổng số: {preview.totalRows} — Hợp lệ: {preview.validCount} — Lỗi:{" "}
              {preview.errorCount}
            </Typography.Text>
            {preview.errorCount > 0 ? (
              <Table
                rowKey={(item) =>
                  `${item.rowNumber}-${item.field}-${item.message}`
                }
                size="small"
                pagination={{ pageSize: 8 }}
                columns={errorColumns}
                dataSource={preview.errors}
              />
            ) : (
              <Alert
                type="success"
                showIcon
                message="File hợp lệ và sẵn sàng import"
              />
            )}
            {preview.confirmationToken && (
              <Button
                type="primary"
                loading={confirming}
                onClick={() => onConfirm(preview.confirmationToken!)}
              >
                Xác nhận import {preview.validCount} {entityLabel}
              </Button>
            )}
          </>
        )}
      </Space>
    </Modal>
  );
}
