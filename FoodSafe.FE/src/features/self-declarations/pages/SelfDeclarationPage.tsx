import { useState } from "react";
import {
  DeleteOutlined,
  EditOutlined,
  ExportOutlined,
  FileTextOutlined,
  PlusOutlined,
  StopOutlined,
} from "@ant-design/icons";
import { App, Button, Input, Popconfirm, Select, Space, Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useAuthStore } from "@/features/auth/store/authStore";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { ExpiryTag } from "@/components/ExpiryTag";
import { RevokeModal } from "@/components/RevokeModal";
import { RecordDetailDrawer } from "@/components/RecordDetailDrawer";
import { saveDownload } from "@/utils/download";
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

const PAGE_SIZE = 20;

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
  const [detailRecord, setDetailRecord] = useState<SelfDeclaration | null>(
    null,
  );

  const queryFilter = {
    filter: filter || undefined,
    businessId,
    status,
    expiringWithinDays,
    skipCount: (page - 1) * PAGE_SIZE,
    maxResultCount: PAGE_SIZE,
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
      width: 120,
      render: (value: string) => new Date(value).toLocaleDateString("vi-VN"),
    },
    {
      title: "Hết hạn",
      width: 140,
      render: (_, item) => (
        <ExpiryTag
          expiryDate={item.expiryDate}
          status={item.status}
          daysUntilExpiry={item.daysUntilExpiry}
        />
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      width: 125,
      render: (s: number) => <StatusBadge status={s} />,
    },
    {
      title: "Thao tác",
      fixed: "right",
      width: 160,
      render: (_, item) => (
        <Space size={2}>
          <Button
            type="text"
            size="small"
            aria-label={`Tệp ${item.declarationNumber}`}
            icon={<FileTextOutlined />}
            onClick={() => setAttachmentsFor(item)}
          />
          {canEdit && item.status !== LICENSE_STATUS.Revoked && (
            <>
              <Button
                type="text"
                size="small"
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
                size="small"
                danger
                aria-label={`Thu hồi ${item.declarationNumber}`}
                icon={<StopOutlined />}
                onClick={() => setRevoking(item)}
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
                size="small"
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
    <div className="page-container">
      <PageHeader
        title="Hồ sơ tự công bố"
        subtitle="Quản lý công bố sản phẩm và cảnh báo hết hạn 30/60/90 ngày"
        actions={
          <>
            <Button
              icon={<ExportOutlined />}
              loading={exportMutation.isPending}
              onClick={() =>
                exportMutation.mutate(queryFilter, {
                  onSuccess: (file) => saveDownload(file.blob, file.fileName),
                  onError: () =>
                    void message.error("Không thể xuất danh sách."),
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
          </>
        }
      />

      <div className="page-card">
        <div className="filter-toolbar" style={{ marginBottom: 16 }}>
          <Input.Search
            allowClear
            placeholder="Số hồ sơ, sản phẩm, nhà sản xuất"
            style={{ width: 280 }}
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
            style={{ width: 240 }}
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
            placeholder="Trạng thái"
            style={{ width: 160 }}
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
            style={{ width: 170 }}
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
        </div>

        <Table
          rowKey="id"
          size="middle"
          scroll={{ x: 1000 }}
          loading={declarations.isLoading}
          columns={columns}
          dataSource={declarations.data?.items ?? []}
          onRow={(record) => ({
            onDoubleClick: () => setDetailRecord(record),
            style: { cursor: "pointer" },
          })}
          pagination={{
            current: page,
            pageSize: PAGE_SIZE,
            total: declarations.data?.totalCount ?? 0,
            showSizeChanger: false,
            showTotal: (total) => `${total} bản ghi`,
            onChange: setPage,
          }}
        />
      </div>

      <RecordDetailDrawer
        title="Chi tiết tự công bố sản phẩm"
        record={detailRecord}
        onClose={() => setDetailRecord(null)}
        fields={[
          { label: "Số hồ sơ", render: (r) => r.declarationNumber },
          {
            label: "Trạng thái",
            render: (r) => <StatusBadge status={r.status} />,
          },
          { label: "Cơ sở SXKD", render: (r) => r.businessName, span: 2 },
          { label: "Sản phẩm", render: (r) => r.productName, span: 2 },
          {
            label: "Sản phẩm liên kết",
            render: (r) => r.linkedProductName,
            span: 2,
          },
          { label: "Nhà sản xuất", render: (r) => r.manufacturer, span: 2 },
          { label: "Mục đích", render: (r) => r.purpose, span: 2 },
          {
            label: "Ngày công bố",
            render: (r) =>
              new Date(r.declarationDate).toLocaleDateString("vi-VN"),
          },
          {
            label: "Ngày hết hạn",
            render: (r) =>
              r.expiryDate
                ? new Date(r.expiryDate).toLocaleDateString("vi-VN")
                : null,
          },
          { label: "Lý do thu hồi", render: (r) => r.revokeReason, span: 2 },
          {
            label: "Ngày thu hồi",
            render: (r) =>
              r.revokedAt
                ? new Date(r.revokedAt).toLocaleDateString("vi-VN")
                : null,
            span: 2,
          },
          { label: "Ghi chú", render: (r) => r.notes, span: 2 },
        ]}
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

      <RevokeModal
        open={Boolean(revoking)}
        title={`Thu hồi hồ sơ ${revoking?.declarationNumber ?? ""}`}
        confirmLoading={revokeMutation.isPending}
        onCancel={() => setRevoking(undefined)}
        onConfirm={(reason) => {
          if (!revoking) return;
          revokeMutation.mutate(
            { id: revoking.id, reason },
            {
              onSuccess: () => {
                void message.success("Đã thu hồi hồ sơ.");
                setRevoking(undefined);
              },
              onError: () => void message.error("Không thể thu hồi hồ sơ."),
            },
          );
        }}
      />
    </div>
  );
}
