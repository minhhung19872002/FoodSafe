import { App, Button, Modal, Popconfirm, Table, Upload } from "antd";
import {
  DeleteOutlined,
  DownloadOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import { extractApiError } from "@/lib/apiError";
import { saveDownload } from "@/utils/download";
import {
  inspectionPlanAttachmentApi,
  inspectionResultAttachmentApi,
  type InspectionAttachment,
} from "../api/inspectionApi";

interface Props {
  ownerId?: string;
  ownerKind: "plan" | "result";
  title: string;
  canEdit: boolean;
  onClose: () => void;
}

export function InspectionAttachmentsModal({
  ownerId,
  ownerKind,
  title,
  canEdit,
  onClose,
}: Props) {
  const { message } = App.useApp();
  const queryClient = useQueryClient();
  const attachmentApi =
    ownerKind === "plan"
      ? inspectionPlanAttachmentApi
      : inspectionResultAttachmentApi;
  const queryKey = [
    "inspection-attachments",
    ownerKind,
    ownerId ?? "",
  ] as const;

  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: () => attachmentApi.list(ownerId!),
    enabled: Boolean(ownerId),
  });

  const refresh = () => void queryClient.invalidateQueries({ queryKey });

  const upload = useMutation({
    mutationFn: (file: File) => attachmentApi.upload(ownerId!, file),
    onSuccess: () => {
      refresh();
      void message.success("Đã tải lên tài liệu.");
    },
    onError: (error) => void message.error(extractApiError(error)),
  });
  const download = useMutation({
    mutationFn: (attachmentId: string) =>
      attachmentApi.download(ownerId!, attachmentId),
    onSuccess: (file) => saveDownload(file.blob, file.fileName),
    onError: (error) => void message.error(extractApiError(error)),
  });
  const remove = useMutation({
    mutationFn: (attachmentId: string) =>
      attachmentApi.remove(ownerId!, attachmentId),
    onSuccess: () => {
      refresh();
      void message.success("Đã xóa tài liệu.");
    },
    onError: (error) => void message.error(extractApiError(error)),
  });

  const columns: ColumnsType<InspectionAttachment> = [
    { title: "Tên file", dataIndex: "originalName", ellipsis: true },
    {
      title: "Kích thước",
      dataIndex: "sizeBytes",
      width: 110,
      render: (v: number) => `${(v / 1024).toFixed(0)} KB`,
    },
    {
      title: "Ngày tải",
      dataIndex: "creationTime",
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
      open={Boolean(ownerId)}
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
