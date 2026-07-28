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
import { App, Button, Input, Popconfirm, Select, Space, Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useAuthStore } from "@/features/auth/store/authStore";
import { ProductRegistrationAttachmentsModal } from "@/features/product-registrations/components/ProductRegistrationAttachmentsModal";
import { ExpiryTag } from "@/components/ExpiryTag";
import { PageHeader } from "@/components/PageHeader";
import { RecordDetailDrawer } from "@/components/RecordDetailDrawer";
import { RevokeModal } from "@/components/RevokeModal";
import { StatusBadge } from "@/components/StatusBadge";
import { saveDownload } from "@/utils/download";
import {
  useCreateEligibilityCertificate,
  useDeleteEligibilityAttachment,
  useDeleteEligibilityCertificate,
  useDownloadEligibilityAttachment,
  useDownloadEligibilityCertificatePdf,
  useExportEligibilityCertificates,
  useRevokeEligibilityCertificate,
  useUpdateEligibilityCertificate,
  useUploadEligibilityAttachment,
} from "../api/eligibilityCertificateMutations";
import {
  useEligibilityAttachments,
  useEligibilityBusinesses,
  useEligibilityCertificates,
} from "../api/eligibilityCertificateQueries";
import { EligibilityCertificateEditorModal } from "../components/EligibilityCertificateEditorModal";
import {
  LICENSE_STATUS,
  type EligibilityCertificate,
  type EligibilityCertificateInput,
  type FileAttachment,
  type LicenseStatus,
} from "../types/eligibilityCertificate.types";

const PAGE_SIZE = 20;

export default function EligibilityCertificatePage() {
  const { message } = App.useApp();
  const hasPermission = useAuthStore((state) => state.hasPermission);
  const canCreate = hasPermission(
    "FoodSafe.Licensing.EligibilityCertificates.Create",
  );
  const canEdit = hasPermission(
    "FoodSafe.Licensing.EligibilityCertificates.Edit",
  );
  const canDelete = hasPermission(
    "FoodSafe.Licensing.EligibilityCertificates.Delete",
  );
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState("");
  const [businessId, setBusinessId] = useState<string>();
  const [status, setStatus] = useState<LicenseStatus>();
  const [expiringWithinDays, setExpiringWithinDays] = useState<number>();
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<EligibilityCertificate>();
  const [attachmentsFor, setAttachmentsFor] =
    useState<EligibilityCertificate>();
  const [revoking, setRevoking] = useState<EligibilityCertificate>();
  const [detailRecord, setDetailRecord] =
    useState<EligibilityCertificate | null>(null);
  const queryFilter = {
    filter: filter || undefined,
    businessId,
    status,
    expiringWithinDays,
    skipCount: (page - 1) * PAGE_SIZE,
    maxResultCount: PAGE_SIZE,
  };
  const certificates = useEligibilityCertificates(queryFilter);
  const businesses = useEligibilityBusinesses();
  const attachments = useEligibilityAttachments(attachmentsFor?.id);
  const createMutation = useCreateEligibilityCertificate();
  const updateMutation = useUpdateEligibilityCertificate();
  const deleteMutation = useDeleteEligibilityCertificate();
  const revokeMutation = useRevokeEligibilityCertificate();
  const exportMutation = useExportEligibilityCertificates();
  const pdfMutation = useDownloadEligibilityCertificatePdf();
  const uploadMutation = useUploadEligibilityAttachment();
  const downloadMutation = useDownloadEligibilityAttachment();
  const deleteAttachmentMutation = useDeleteEligibilityAttachment();

  const closeEditor = () => {
    setEditorOpen(false);
    setEditing(undefined);
  };

  const save = (input: EligibilityCertificateInput) => {
    const options = {
      onSuccess: () => {
        void message.success("Đã lưu giấy chứng nhận.");
        closeEditor();
      },
      onError: () =>
        void message.error("Không thể lưu giấy chứng nhận. Kiểm tra dữ liệu."),
    };
    if (editing) updateMutation.mutate({ id: editing.id, input }, options);
    else createMutation.mutate(input, options);
  };

  const columns: ColumnsType<EligibilityCertificate> = [
    { title: "Số giấy", dataIndex: "certificateNumber", width: 160 },
    { title: "Cơ sở SXKD", dataIndex: "businessName", ellipsis: true },
    {
      title: "Ngày cấp",
      dataIndex: "issueDate",
      width: 115,
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
      title: "Cơ quan cấp",
      dataIndex: "certifyingAuthority",
      ellipsis: true,
      render: (value?: string) => value || "—",
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      width: 125,
      render: (value: LicenseStatus) => <StatusBadge status={value} />,
    },
    {
      title: "Thao tác",
      fixed: "right",
      width: 180,
      render: (_, item) => (
        <Space size={2}>
          <Button
            size="small"
            type="text"
            aria-label={`Tệp ${item.certificateNumber}`}
            icon={<FileTextOutlined />}
            onClick={() => setAttachmentsFor(item)}
          />
          <Button
            size="small"
            type="text"
            aria-label={`Tải PDF ${item.certificateNumber}`}
            icon={<FilePdfOutlined />}
            loading={pdfMutation.isPending && pdfMutation.variables === item.id}
            onClick={() =>
              pdfMutation.mutate(item.id, {
                onSuccess: (file) => saveDownload(file.blob, file.fileName),
                onError: () =>
                  void message.error("Không thể tải bản PDF giấy chứng nhận."),
              })
            }
          />
          {canEdit && item.status !== LICENSE_STATUS.Revoked && (
            <>
              <Button
                size="small"
                type="text"
                aria-label={`Sửa ${item.certificateNumber}`}
                icon={<EditOutlined />}
                onClick={() => {
                  setEditing(item);
                  setEditorOpen(true);
                }}
              />
              <Button
                size="small"
                type="text"
                danger
                aria-label={`Thu hồi ${item.certificateNumber}`}
                icon={<StopOutlined />}
                onClick={() => setRevoking(item)}
              />
            </>
          )}
          {canDelete && (
            <Popconfirm
              title="Xóa giấy chứng nhận này?"
              description="Số giấy vẫn được giữ và không thể dùng lại."
              okText="Xóa"
              cancelText="Hủy"
              onConfirm={() =>
                deleteMutation.mutate(item.id, {
                  onSuccess: () =>
                    void message.success("Đã xóa giấy chứng nhận."),
                  onError: () =>
                    void message.error("Không thể xóa giấy chứng nhận."),
                })
              }
            >
              <Button
                size="small"
                type="text"
                danger
                aria-label={`Xóa ${item.certificateNumber}`}
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
        title="Giấy chứng nhận đủ điều kiện ATTP"
        subtitle="Quản lý giấy chứng nhận đủ điều kiện an toàn thực phẩm"
        actions={
          <Space>
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
                onClick={() => setEditorOpen(true)}
              >
                Cấp giấy
              </Button>
            )}
          </Space>
        }
      />
      <div className="page-card">
        <div className="filter-toolbar" style={{ marginBottom: 16 }}>
          <Input.Search
            allowClear
            placeholder="Số giấy, cơ quan cấp, phạm vi"
            style={{ width: 300 }}
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
            options={(businesses.data ?? []).map((x) => ({
              value: x.id,
              label: x.code ? `${x.code} — ${x.name}` : x.name,
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
            style={{ width: 180 }}
            options={[30, 60, 90].map((value) => ({
              value,
              label: `Trong ${value} ngày`,
            }))}
            onChange={(value) => {
              setExpiringWithinDays(value);
              setPage(1);
            }}
          />
        </div>
        <Table
          size="middle"
          rowKey="id"
          scroll={{ x: 1100 }}
          loading={certificates.isLoading}
          columns={columns}
          dataSource={certificates.data?.items ?? []}
          onRow={(record) => ({
            onDoubleClick: () => setDetailRecord(record),
            style: { cursor: "pointer" },
          })}
          pagination={{
            current: page,
            pageSize: PAGE_SIZE,
            total: certificates.data?.totalCount ?? 0,
            showSizeChanger: false,
            showTotal: (total) => `Tổng ${total} bản ghi`,
            onChange: setPage,
          }}
        />
      </div>
      <RecordDetailDrawer
        title="Chi tiết giấy chứng nhận đủ điều kiện"
        record={detailRecord}
        onClose={() => setDetailRecord(null)}
        fields={[
          { label: "Số giấy", render: (r) => r.certificateNumber },
          {
            label: "Trạng thái",
            render: (r) => <StatusBadge status={r.status} />,
          },
          { label: "Cơ sở SXKD", render: (r) => r.businessName, span: 2 },
          {
            label: "Ngày cấp",
            render: (r) => new Date(r.issueDate).toLocaleDateString("vi-VN"),
          },
          {
            label: "Ngày hết hạn",
            render: (r) =>
              r.expiryDate
                ? new Date(r.expiryDate).toLocaleDateString("vi-VN")
                : null,
          },
          {
            label: "Cơ quan cấp",
            render: (r) => r.certifyingAuthority,
            span: 2,
          },
          {
            label: "Phạm vi chứng nhận",
            render: (r) => r.certificationScope,
            span: 2,
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
      <EligibilityCertificateEditorModal
        open={editorOpen}
        item={editing}
        businesses={businesses.data ?? []}
        saving={createMutation.isPending || updateMutation.isPending}
        onCancel={closeEditor}
        onSubmit={save}
      />
      <ProductRegistrationAttachmentsModal
        documentNumber={attachmentsFor?.certificateNumber}
        titlePrefix="Tệp giấy chứng nhận"
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
                void message.error("Tệp không vượt qua kiểm tra an toàn."),
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
        title={`Thu hồi giấy ${revoking?.certificateNumber ?? ""}`}
        confirmLoading={revokeMutation.isPending}
        onCancel={() => setRevoking(undefined)}
        onConfirm={(reason) => {
          if (!revoking) return;
          revokeMutation.mutate(
            { id: revoking.id, reason },
            {
              onSuccess: () => {
                void message.success("Đã thu hồi giấy chứng nhận.");
                setRevoking(undefined);
              },
              onError: () => void message.error("Không thể thu hồi."),
            },
          );
        }}
      />
    </div>
  );
}
