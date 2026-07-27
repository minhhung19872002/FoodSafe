import { App, Button, Modal, Popconfirm, Table, Upload } from "antd";
import {
  DeleteOutlined,
  DownloadOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import { saveDownload } from "@/utils/download";
import {
  documentAttachmentApi,
  type DocumentAttachment,
} from "../api/documentApi";

interface Props {
  documentId?: string;
  title: string;
  canEdit: boolean;
  onClose: () => void;
}

export function DocumentAttachmentsModal({
  documentId,
  title,
  canEdit,
  onClose,
}: Props) {
  const { message } = App.useApp();
  const queryClient = useQueryClient();
  const queryKey = ["document-attachments", documentId ?? ""] as const;

  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: () => documentAttachmentApi.list(documentId!),
    enabled: Boolean(documentId),
  });

  const refresh = () => void queryClient.invalidateQueries({ queryKey });

  const upload = useMutation({
    mutationFn: (file: File) => documentAttachmentApi.upload(documentId!, file),
    onSuccess: () => {
      refresh();
      void message.success("Đã tải lên tài liệu.");
    },
    onError: () => void message.error("Không thể tải lên tài liệu."),
  });
  const download = useMutation({
    mutationFn: (attachmentId: string) =>
      documentAttachmentApi.download(documentId!, attachmentId),
    onSuccess: (file) => saveDownload(file.blob, file.fileName),
    onError: () => void message.error("Không thể tải tài liệu."),
  });
  const remove = useMutation({
    mutationFn: (attachmentId: string) =>
      documentAttachmentApi.remove(documentId!, attachmentId),
    onSuccess: () => {
      refresh();
      void message.success("Đã xóa tài liệu.");
    },
    onError: () => void message.error("Không thể xóa tài liệu."),
  });

  const columns: ColumnsType<DocumentAttachment> = [
    { title: "Tên file", dataIndex: "originalName", ellipsis: true },
    {
      title: "Kích thước",
      dataIndex: "fileSize",
      width: 110,
      render: (v: number) => `${(v / 1024).toFixed(0)} KB`,
    },
    {
      title: "Ngày tải",
      dataIndex: "uploadTime",
      width: 130,
      render: (v: string) => dayjs(v).format("DD/MM/YYYY HH:mm"),
    },
    {
      title: "Thao tác",
      width: 110,
      render: (_, item) => (
        <>
          <Button
            type="text"
            size="small"
            aria-label={`Tải ${item.originalName}`}
            icon={<DownloadOutlined />}
            loading={download.isPending && download.variables === item.id}
            onClick={() => download.mutate(item.id)}
          />
          {canEdit && (
            <Popconfirm
              title="Xóa tài liệu này?"
              okText="Xóa"
              cancelText="Hủy"
              onConfirm={() => remove.mutate(item.id)}
            >
              <Button
                type="text"
                size="small"
                danger
                aria-label={`Xóa ${item.originalName}`}
                icon={<DeleteOutlined />}
              />
            </Popconfirm>
          )}
        </>
      ),
    },
  ];

  return (
    <Modal
      title={title}
      open={Boolean(documentId)}
      onCancel={onClose}
      footer={null}
      width={680}
      destroyOnHidden
    >
      {canEdit && (
        <Upload
          maxCount={1}
          showUploadList={false}
          beforeUpload={(file) => {
            if (file.size > 20 * 1024 * 1024) {
              void message.error("File không được vượt quá 20MB.");
              return Upload.LIST_IGNORE;
            }
            upload.mutate(file);
            return false;
          }}
        >
          <Button
            icon={<UploadOutlined />}
            loading={upload.isPending}
            style={{ marginBottom: 12 }}
          >
            Tải tài liệu lên
          </Button>
        </Upload>
      )}
      <Table
        rowKey="id"
        size="small"
        loading={isLoading}
        columns={columns}
        dataSource={data ?? []}
        pagination={false}
        locale={{ emptyText: "Chưa có tài liệu đính kèm" }}
      />
    </Modal>
  );
}
