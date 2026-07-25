import { useState } from "react";
import {
  DeleteOutlined,
  EditOutlined,
  ExportOutlined,
  FileTextOutlined,
  PlusOutlined,
  StopOutlined,
} from "@ant-design/icons";
import {
  App,
  Button,
  Input,
  Modal,
  Popconfirm,
  Select,
  Space,
  Table,
  Tag,
  Typography,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { useAuthStore } from "@/features/auth/store/authStore";
import {
  useCreateSelfDeclaration,
  useDeleteSelfDeclaration,
  useDeleteSelfDeclarationAttachment,
  useDownloadSelfDeclarationAttachment,
  useExportSelfDeclarations,
  useRevokeSelfDeclaration,
  useUpdateSelfDeclaration,
  useUploadSelfDeclarationAttachment,
} from "../api/selfDeclarationMutations";
import {
  useSelfDeclarationAttachments,
  useSelfDeclarationBusinesses,
  useSelfDeclarationProducts,
  useSelfDeclarations,
} from "../api/selfDeclarationQueries";
import { SelfDeclarationAttachmentsModal } from "../components/SelfDeclarationAttachmentsModal";
import { SelfDeclarationEditorModal } from "../components/SelfDeclarationEditorModal";
import {
  LICENSE_STATUS,
  type FileAttachment,
  type LicenseStatus,
  type SelfDeclaration,
  type SelfDeclarationInput,
} from "../types/selfDeclaration.types";

const pageSize = 20;

function saveDownload(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}

function statusTag(status: LicenseStatus) {
  if (status === LICENSE_STATUS.Active)
    return <Tag color="green">Còn hiệu lực</Tag>;
  if (status === LICENSE_STATUS.Expired)
    return <Tag color="orange">Hết hạn</Tag>;
  return <Tag color="red">Đã thu hồi</Tag>;
}

function expiryText(item: SelfDeclaration) {
  if (!item.expiryDate) return "Không thời hạn";
  const date = new Date(item.expiryDate).toLocaleDateString("vi-VN");
  if (
    item.status === LICENSE_STATUS.Active &&
    item.daysUntilExpiry !== undefined &&
    item.daysUntilExpiry <= 90
  )
    return (
      <Space orientation="vertical" size={0}>
        <span>{date}</span>
        <Tag color={item.daysUntilExpiry <= 30 ? "red" : "gold"}>
          Còn {item.daysUntilExpiry} ngày
        </Tag>
      </Space>
    );
  return date;
}

export default function SelfDeclarationPage() {
  const { message } = App.useApp();
  const hasPermission = useAuthStore((state) => state.hasPermission);
  const canCreate = hasPermission(
    "FoodSafe.BusinessManagement.SelfDeclarations.Create",
  );
  const canEdit = hasPermission(
    "FoodSafe.BusinessManagement.SelfDeclarations.Edit",
  );
  const canDelete = hasPermission(
    "FoodSafe.BusinessManagement.SelfDeclarations.Delete",
  );
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState("");
  const [businessId, setBusinessId] = useState<string>();
  const [status, setStatus] = useState<LicenseStatus>();
  const [expiringWithinDays, setExpiringWithinDays] = useState<number>();
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<SelfDeclaration>();
  const [editorBusinessId, setEditorBusinessId] = useState<string>();
  const [attachmentsFor, setAttachmentsFor] = useState<SelfDeclaration>();
  const [revoking, setRevoking] = useState<SelfDeclaration>();
  const [revokeReason, setRevokeReason] = useState("");

  const queryFilter = {
    filter: filter || undefined,
    businessId,
    status,
    expiringWithinDays,
    skipCount: (page - 1) * pageSize,
    maxResultCount: pageSize,
  };
  const declarations = useSelfDeclarations(queryFilter);
  const businesses = useSelfDeclarationBusinesses();
  const products = useSelfDeclarationProducts(editorBusinessId);
  const attachments = useSelfDeclarationAttachments(attachmentsFor?.id);
  const createMutation = useCreateSelfDeclaration();
  const updateMutation = useUpdateSelfDeclaration();
  const deleteMutation = useDeleteSelfDeclaration();
  const revokeMutation = useRevokeSelfDeclaration();
  const exportMutation = useExportSelfDeclarations();
  const uploadMutation = useUploadSelfDeclarationAttachment();
  const downloadMutation = useDownloadSelfDeclarationAttachment();
  const deleteAttachmentMutation = useDeleteSelfDeclarationAttachment();

  const closeEditor = () => {
    setEditorOpen(false);
    setEditing(undefined);
    setEditorBusinessId(undefined);
  };

  const save = (input: SelfDeclarationInput) => {
    const options = {
      onSuccess: () => {
        void message.success("Đã lưu hồ sơ tự công bố.");
        closeEditor();
      },
      onError: () =>
        void message.error(
          "Không thể lưu hồ sơ. Vui lòng kiểm tra số hồ sơ và dữ liệu.",
        ),
    };
    if (editing) updateMutation.mutate({ id: editing.id, input }, options);
    else createMutation.mutate(input, options);
  };

  const columns: ColumnsType<SelfDeclaration> = [
    {
      title: "Số hồ sơ",
      dataIndex: "declarationNumber",
      width: 160,
    },
    {
      title: "Cơ sở SXKD",
      dataIndex: "businessName",
      ellipsis: true,
    },
    {
      title: "Sản phẩm",
      dataIndex: "productName",
      ellipsis: true,
    },
    {
      title: "Ngày công bố",
      dataIndex: "declarationDate",
      width: 125,
      render: (value: string) => new Date(value).toLocaleDateString("vi-VN"),
    },
    {
      title: "Hết hạn",
      width: 145,
      render: (_, item) => expiryText(item),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      width: 125,
      render: statusTag,
    },
    {
      title: "Thao tác",
      fixed: "right",
      width: 180,
      render: (_, item) => (
        <Space size={2}>
          <Button
            type="text"
            aria-label={`Tệp ${item.declarationNumber}`}
            icon={<FileTextOutlined />}
            onClick={() => setAttachmentsFor(item)}
          />
          {canEdit && item.status !== LICENSE_STATUS.Revoked && (
            <>
              <Button
                type="text"
                aria-label={`Sửa ${item.declarationNumber}`}
                icon={<EditOutlined />}
                onClick={() => {
                  setEditing(item);
                  setEditorBusinessId(item.businessId);
                  setEditorOpen(true);
                }}
              />
              <Button
                type="text"
                danger
                aria-label={`Thu hồi ${item.declarationNumber}`}
                icon={<StopOutlined />}
                onClick={() => {
                  setRevoking(item);
                  setRevokeReason("");
                }}
              />
            </>
          )}
          {canDelete && (
            <Popconfirm
              title="Xóa hồ sơ này?"
              description="Số hồ sơ vẫn được giữ trong lịch sử và không thể dùng lại."
              okText="Xóa"
              cancelText="Hủy"
              onConfirm={() =>
                deleteMutation.mutate(item.id, {
                  onSuccess: () => void message.success("Đã xóa hồ sơ."),
                  onError: () => void message.error("Không thể xóa hồ sơ."),
                })
              }
            >
              <Button
                type="text"
                danger
                aria-label={`Xóa ${item.declarationNumber}`}
                icon={<DeleteOutlined />}
              />
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <>
      <Space
        align="center"
        style={{
          width: "100%",
          justifyContent: "space-between",
          marginBottom: 16,
        }}
      >
        <div>
          <Typography.Title level={2} style={{ margin: 0 }}>
            Hồ sơ tự công bố
          </Typography.Title>
          <Typography.Text type="secondary">
            Quản lý công bố sản phẩm và cảnh báo hết hạn 30/60/90 ngày
          </Typography.Text>
        </div>
        <Space>
          <Button
            icon={<ExportOutlined />}
            loading={exportMutation.isPending}
            onClick={() =>
              exportMutation.mutate(queryFilter, {
                onSuccess: (file) => saveDownload(file.blob, file.fileName),
                onError: () => void message.error("Không thể xuất danh sách."),
              })
            }
          >
            Xuất Excel
          </Button>
          {canCreate && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setEditing(undefined);
                setEditorOpen(true);
              }}
            >
              Thêm hồ sơ
            </Button>
          )}
        </Space>
      </Space>

      <Space wrap style={{ marginBottom: 16 }}>
        <Input.Search
          allowClear
          placeholder="Số hồ sơ, sản phẩm, nhà sản xuất"
          style={{ width: 310 }}
          onSearch={(value) => {
            setFilter(value.trim());
            setPage(1);
          }}
        />
        <Select
          allowClear
          showSearch
          optionFilterProp="label"
          placeholder="Tất cả cơ sở"
          style={{ width: 260 }}
          loading={businesses.isLoading}
          options={(businesses.data ?? []).map((item) => ({
            value: item.id,
            label: item.code ? `${item.code} — ${item.name}` : item.name,
          }))}
          onChange={(value) => {
            setBusinessId(value);
            setPage(1);
          }}
        />
        <Select
          allowClear
          placeholder="Tất cả trạng thái"
          style={{ width: 170 }}
          options={[
            { value: LICENSE_STATUS.Active, label: "Còn hiệu lực" },
            { value: LICENSE_STATUS.Expired, label: "Hết hạn" },
            { value: LICENSE_STATUS.Revoked, label: "Đã thu hồi" },
          ]}
          onChange={(value) => {
            setStatus(value);
            setPage(1);
          }}
        />
        <Select
          allowClear
          placeholder="Cảnh báo hết hạn"
          style={{ width: 180 }}
          options={[
            { value: 30, label: "Trong 30 ngày" },
            { value: 60, label: "Trong 60 ngày" },
            { value: 90, label: "Trong 90 ngày" },
          ]}
          onChange={(value) => {
            setExpiringWithinDays(value);
            setPage(1);
          }}
        />
      </Space>

      <Table
        rowKey="id"
        scroll={{ x: 1100 }}
        loading={declarations.isLoading}
        columns={columns}
        dataSource={declarations.data?.items ?? []}
        pagination={{
          current: page,
          pageSize,
          total: declarations.data?.totalCount ?? 0,
          showSizeChanger: false,
          onChange: setPage,
        }}
      />

      <SelfDeclarationEditorModal
        open={editorOpen}
        declaration={editing}
        businesses={businesses.data ?? []}
        products={products.data ?? []}
        productsLoading={products.isLoading}
        saving={createMutation.isPending || updateMutation.isPending}
        onBusinessChange={setEditorBusinessId}
        onCancel={closeEditor}
        onSubmit={save}
      />

      <SelfDeclarationAttachmentsModal
        declaration={attachmentsFor}
        attachments={attachments.data ?? []}
        loading={attachments.isLoading}
        editable={canEdit && attachmentsFor?.status !== LICENSE_STATUS.Revoked}
        uploading={uploadMutation.isPending}
        onCancel={() => setAttachmentsFor(undefined)}
        onUpload={(file) => {
          if (!attachmentsFor) return;
          uploadMutation.mutate(
            { id: attachmentsFor.id, file },
            {
              onSuccess: () => void message.success("Đã tải tệp lên."),
              onError: () =>
                void message.error(
                  "Tệp không hợp lệ hoặc không vượt qua kiểm tra an toàn.",
                ),
            },
          );
        }}
        onDownload={(attachment: FileAttachment) => {
          if (!attachmentsFor) return;
          downloadMutation.mutate(
            {
              id: attachmentsFor.id,
              attachmentId: attachment.id,
            },
            {
              onSuccess: (file) => saveDownload(file.blob, file.fileName),
              onError: () => void message.error("Không thể tải tệp."),
            },
          );
        }}
        onDelete={(attachmentId) => {
          if (!attachmentsFor) return;
          deleteAttachmentMutation.mutate(
            { id: attachmentsFor.id, attachmentId },
            {
              onSuccess: () => void message.success("Đã xóa tệp."),
              onError: () => void message.error("Không thể xóa tệp."),
            },
          );
        }}
      />

      <Modal
        open={Boolean(revoking)}
        title={`Thu hồi hồ sơ ${revoking?.declarationNumber ?? ""}`}
        okText="Thu hồi"
        okButtonProps={{ danger: true, disabled: !revokeReason.trim() }}
        cancelText="Hủy"
        confirmLoading={revokeMutation.isPending}
        onCancel={() => setRevoking(undefined)}
        onOk={() => {
          if (!revoking || !revokeReason.trim()) return;
          revokeMutation.mutate(
            { id: revoking.id, reason: revokeReason.trim() },
            {
              onSuccess: () => {
                void message.success("Đã thu hồi hồ sơ.");
                setRevoking(undefined);
              },
              onError: () => void message.error("Không thể thu hồi hồ sơ."),
            },
          );
        }}
      >
        <Typography.Paragraph>
          Hồ sơ đã thu hồi không thể chỉnh sửa lại. Vui lòng ghi rõ lý do.
        </Typography.Paragraph>
        <Input.TextArea
          rows={4}
          maxLength={2000}
          showCount
          value={revokeReason}
          placeholder="Lý do thu hồi"
          onChange={(event) => setRevokeReason(event.target.value)}
        />
      </Modal>
    </>
  );
}
