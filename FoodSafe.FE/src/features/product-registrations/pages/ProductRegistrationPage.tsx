import { useState } from "react";
import {
  DeleteOutlined,
  EditOutlined,
  ExportOutlined,
  FilePdfOutlined,
  FileTextOutlined,
  PlusOutlined,
  StopOutlined,
} from "@ant-design/icons";
import { App, Button, Input, Select, Space, Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useAuthStore } from "@/features/auth/store/authStore";
import { ExpiryTag } from "@/components/ExpiryTag";
import { PageHeader } from "@/components/PageHeader";
import { RecordDetailDrawer } from "@/components/RecordDetailDrawer";
import { RevokeModal } from "@/components/RevokeModal";
import { RowActions } from "@/components/RowActions";
import { StatusBadge } from "@/components/StatusBadge";
import { saveDownload } from "@/utils/download";
import { useTablePagination } from "@/hooks/useTablePagination";
import {
  useCreateProductRegistration,
  useDeleteProductRegistration,
  useDeleteProductRegistrationAttachment,
  useDownloadProductRegistrationAttachment,
  useDownloadProductRegistrationPdf,
  useExportProductRegistrations,
  useRevokeProductRegistration,
  useUpdateProductRegistration,
  useUploadProductRegistrationAttachment,
} from "../api/productRegistrationMutations";
import {
  useProductRegistrationAttachments,
  useProductRegistrationBusinesses,
  useProductRegistrationProducts,
  useProductRegistrations,
} from "../api/productRegistrationQueries";
import { ProductRegistrationAttachmentsModal } from "../components/ProductRegistrationAttachmentsModal";
import { ProductRegistrationEditorModal } from "../components/ProductRegistrationEditorModal";
import {
  LICENSE_STATUS,
  type FileAttachment,
  type LicenseStatus,
  type ProductRegistration,
  type ProductRegistrationInput,
} from "../types/productRegistration.types";

export default function ProductRegistrationPage() {
  const { message } = App.useApp();
  const hasPermission = useAuthStore((state) => state.hasPermission);
  const canCreate = hasPermission(
    "FoodSafe.Licensing.ProductRegistrations.Create",
  );
  const canEdit = hasPermission("FoodSafe.Licensing.ProductRegistrations.Edit");
  const canDelete = hasPermission(
    "FoodSafe.Licensing.ProductRegistrations.Delete",
  );
  const pagination = useTablePagination(20);
  const [filter, setFilter] = useState("");
  const [businessId, setBusinessId] = useState<string>();
  const [status, setStatus] = useState<LicenseStatus>();
  const [expiringWithinDays, setExpiringWithinDays] = useState<number>();
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<ProductRegistration>();
  const [editorBusinessId, setEditorBusinessId] = useState<string>();
  const [attachmentsFor, setAttachmentsFor] = useState<ProductRegistration>();
  const [revoking, setRevoking] = useState<ProductRegistration>();
  const [detailRecord, setDetailRecord] = useState<ProductRegistration | null>(
    null,
  );

  const queryFilter = {
    filter: filter || undefined,
    businessId,
    status,
    expiringWithinDays,
    skipCount: pagination.skipCount,
    maxResultCount: pagination.maxResultCount,
  };
  const registrations = useProductRegistrations(queryFilter);
  const businesses = useProductRegistrationBusinesses();
  const products = useProductRegistrationProducts(editorBusinessId);
  const attachments = useProductRegistrationAttachments(attachmentsFor?.id);
  const createMutation = useCreateProductRegistration();
  const updateMutation = useUpdateProductRegistration();
  const deleteMutation = useDeleteProductRegistration();
  const revokeMutation = useRevokeProductRegistration();
  const exportMutation = useExportProductRegistrations();
  const pdfMutation = useDownloadProductRegistrationPdf();
  const uploadMutation = useUploadProductRegistrationAttachment();
  const downloadMutation = useDownloadProductRegistrationAttachment();
  const deleteAttachmentMutation = useDeleteProductRegistrationAttachment();

  const closeEditor = () => {
    setEditorOpen(false);
    setEditing(undefined);
    setEditorBusinessId(undefined);
  };

  const save = (input: ProductRegistrationInput) => {
    const options = {
      onSuccess: () => {
        void message.success("Đã lưu đăng ký công bố.");
        closeEditor();
      },
      onError: () =>
        void message.error(
          "Không thể lưu. Vui lòng kiểm tra số đăng ký và dữ liệu.",
        ),
    };
    if (editing) updateMutation.mutate({ id: editing.id, input }, options);
    else createMutation.mutate(input, options);
  };

  const columns: ColumnsType<ProductRegistration> = [
    {
      title: "Số đăng ký",
      dataIndex: "registrationNumber",
      width: 155,
    },
    {
      title: "Số tiếp nhận",
      dataIndex: "receiptNumber",
      width: 145,
      render: (value?: string) => value || "—",
    },
    { title: "Cơ sở SXKD", dataIndex: "businessName", ellipsis: true },
    { title: "Sản phẩm", dataIndex: "productName", ellipsis: true },
    {
      title: "Ngày đăng ký",
      dataIndex: "registrationDate",
      width: 125,
      render: (value: string) => new Date(value).toLocaleDateString("vi-VN"),
    },
    {
      title: "Hết hạn",
      width: 145,
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
      width: 96,
      render: (_, item) => (
        <RowActions
          overflowAriaLabel={`Thao tác ${item.registrationNumber}`}
          actions={[
            {
              key: "files",
              label: "Tệp",
              ariaLabel: `Tệp ${item.registrationNumber}`,
              icon: <FileTextOutlined />,
              onClick: () => setAttachmentsFor(item),
            },
            {
              key: "pdf",
              label: "Tải PDF",
              ariaLabel: `Tải PDF ${item.registrationNumber}`,
              icon: <FilePdfOutlined />,
              disabled:
                pdfMutation.isPending && pdfMutation.variables === item.id,
              onClick: () =>
                pdfMutation.mutate(item.id, {
                  onSuccess: (file) => saveDownload(file.blob, file.fileName),
                  onError: () =>
                    void message.error(
                      "Không thể tải bản PDF đăng ký công bố.",
                    ),
                }),
            },
            {
              key: "edit",
              label: "Sửa",
              ariaLabel: `Sửa ${item.registrationNumber}`,
              icon: <EditOutlined />,
              hidden: !canEdit || item.status === LICENSE_STATUS.Revoked,
              onClick: () => {
                setEditing(item);
                setEditorBusinessId(item.businessId);
                setEditorOpen(true);
              },
            },
            {
              key: "revoke",
              label: "Thu hồi",
              ariaLabel: `Thu hồi ${item.registrationNumber}`,
              icon: <StopOutlined />,
              danger: true,
              hidden: !canEdit || item.status === LICENSE_STATUS.Revoked,
              onClick: () => setRevoking(item),
            },
            {
              key: "delete",
              label: "Xóa",
              ariaLabel: `Xóa ${item.registrationNumber}`,
              icon: <DeleteOutlined />,
              danger: true,
              hidden: !canDelete,
              confirm: "Xóa đăng ký này?",
              onClick: () =>
                deleteMutation.mutate(item.id, {
                  onSuccess: () => void message.success("Đã xóa đăng ký."),
                  onError: () => void message.error("Không thể xóa đăng ký."),
                }),
            },
          ]}
        />
      ),
    },
  ];

  return (
    <div className="page-container">
      <PageHeader
        title="Đăng ký công bố sản phẩm"
        subtitle="Quản lý DKCB và cảnh báo hết hạn 30/60/90 ngày"
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
                Thêm đăng ký
              </Button>
            )}
          </>
        }
      />

      <div className="page-card">
        <div className="filter-toolbar" style={{ marginBottom: 16 }}>
          <Space wrap>
            <Input.Search
              allowClear
              placeholder="Số đăng ký, tiếp nhận, sản phẩm"
              style={{ width: 310 }}
              onSearch={(value) => {
                setFilter(value.trim());
                pagination.resetToFirstPage();
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
                pagination.resetToFirstPage();
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
                pagination.resetToFirstPage();
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
                pagination.resetToFirstPage();
              }}
            />
          </Space>
        </div>

        <Table
          rowKey="id"
          size="middle"
          scroll={{ x: 1250 }}
          loading={registrations.isLoading}
          columns={columns}
          dataSource={registrations.data?.items ?? []}
          onRow={(record) => ({
            onDoubleClick: () => setDetailRecord(record),
            style: { cursor: "pointer" },
          })}
          pagination={pagination.buildConfig(
            registrations.data?.totalCount ?? 0,
          )}
        />
      </div>

      <RecordDetailDrawer
        title="Chi tiết đăng ký bản công bố"
        record={detailRecord}
        onClose={() => setDetailRecord(null)}
        fields={[
          { label: "Số đăng ký", render: (r) => r.registrationNumber },
          { label: "Số tiếp nhận", render: (r) => r.receiptNumber },
          { label: "Cơ sở SXKD", render: (r) => r.businessName, span: 2 },
          { label: "Sản phẩm", render: (r) => r.productName, span: 2 },
          {
            label: "Sản phẩm liên kết",
            render: (r) => r.linkedProductName,
            span: 2,
          },
          { label: "Nhà sản xuất", render: (r) => r.manufacturer, span: 2 },
          {
            label: "Cơ quan cấp",
            render: (r) => r.certifyingAuthority,
            span: 2,
          },
          {
            label: "Ngày đăng ký",
            render: (r) =>
              new Date(r.registrationDate).toLocaleDateString("vi-VN"),
          },
          {
            label: "Ngày tiếp nhận",
            render: (r) =>
              r.receiptDate
                ? new Date(r.receiptDate).toLocaleDateString("vi-VN")
                : null,
          },
          {
            label: "Ngày hết hạn",
            render: (r) =>
              r.expiryDate
                ? new Date(r.expiryDate).toLocaleDateString("vi-VN")
                : null,
          },
          {
            label: "Trạng thái",
            render: (r) => <StatusBadge status={r.status} />,
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

      <ProductRegistrationEditorModal
        open={editorOpen}
        registration={editing}
        businesses={businesses.data ?? []}
        products={products.data ?? []}
        productsLoading={products.isLoading}
        saving={createMutation.isPending || updateMutation.isPending}
        onBusinessChange={setEditorBusinessId}
        onCancel={closeEditor}
        onSubmit={save}
      />

      <ProductRegistrationAttachmentsModal
        registration={attachmentsFor}
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
            { id: attachmentsFor.id, attachmentId: attachment.id },
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
        title={`Thu hồi đăng ký ${revoking?.registrationNumber ?? ""}`}
        confirmLoading={revokeMutation.isPending}
        onCancel={() => setRevoking(undefined)}
        onConfirm={(reason) => {
          if (!revoking) return;
          revokeMutation.mutate(
            { id: revoking.id, reason },
            {
              onSuccess: () => {
                void message.success("Đã thu hồi đăng ký.");
                setRevoking(undefined);
              },
              onError: () => void message.error("Không thể thu hồi đăng ký."),
            },
          );
        }}
      />
    </div>
  );
}
