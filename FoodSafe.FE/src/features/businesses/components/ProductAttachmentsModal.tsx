import { useState } from "react";
import {
  DeleteOutlined,
  DownloadOutlined,
  PaperClipOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import { Button, Modal, Popconfirm, Space, Table, Upload } from "antd";
import type { ColumnsType } from "antd/es/table";
import type { RcFile } from "antd/es/upload/interface";
import type { FileAttachment, Product } from "../types/business.types";

interface Props {
  product?: Product;
  attachments: FileAttachment[];
  loading: boolean;
  editable: boolean;
  uploading: boolean;
  onCancel: () => void;
  onUpload: (file: File) => void;
  onDownload: (attachment: FileAttachment) => void;
  onDelete: (attachmentId: string) => void;
}

function formatBytes(value: number) {
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

export function ProductAttachmentsModal(props: Props) {
  const [file, setFile] = useState<RcFile>();
  const columns: ColumnsType<FileAttachment> = [
    { title: "Tên file", dataIndex: "originalName" },
    {
      title: "Dung lượng",
      dataIndex: "fileSize",
      width: 120,
      render: formatBytes,
    },
    {
      title: "Thao tác",
      width: 120,
      render: (_, attachment) => (
        <Space>
          <Button
            type="text"
            aria-label={`Tải ${attachment.originalName}`}
            icon={<DownloadOutlined />}
            onClick={() => props.onDownload(attachment)}
          />
          {props.editable && (
            <Popconfirm
              title="Xóa file đính kèm này?"
              okText="Xóa"
              cancelText="Hủy"
              onConfirm={() => props.onDelete(attachment.id)}
            >
              <Button
                type="text"
                danger
                aria-label={`Xóa ${attachment.originalName}`}
                icon={<DeleteOutlined />}
              />
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <Modal
      open={Boolean(props.product)}
      title={`Tệp đính kèm — ${props.product?.name ?? ""}`}
      width={760}
      footer={null}
      onCancel={props.onCancel}
      destroyOnHidden
    >
      {props.editable && (
        <Space style={{ marginBottom: 16 }}>
          <Upload
            accept=".pdf,.png,.jpg,.jpeg,.docx,.xlsx"
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
              return false;
            }}
            onRemove={() => {
              setFile(undefined);
              return true;
            }}
          >
            <Button icon={<PaperClipOutlined />}>Chọn file</Button>
          </Upload>
          <Button
            type="primary"
            icon={<UploadOutlined />}
            disabled={!file}
            loading={props.uploading}
            onClick={() => {
              if (!file) return;
              props.onUpload(file);
              setFile(undefined);
            }}
          >
            Tải lên
          </Button>
        </Space>
      )}
      <Table
        rowKey="id"
        size="small"
        loading={props.loading}
        columns={columns}
        dataSource={props.attachments}
        pagination={false}
      />
    </Modal>
  );
}
