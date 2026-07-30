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
import {
  App,
  Button,
  Empty,
  Input,
  Select,
  Space,
  Table,
  Typography,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import type { SorterResult, SortOrder } from "antd/es/table/interface";
import { useAuthStore } from "@/features/auth/store/authStore";
import { ClearFiltersButton } from "@/components/ClearFiltersButton";
import { RefreshListButton } from "@/components/RefreshListButton";
import { ProductRegistrationAttachmentsModal } from "@/features/product-registrations/components/ProductRegistrationAttachmentsModal";
import { ExpiryTag } from "@/components/ExpiryTag";
import { PageHeader } from "@/components/PageHeader";
import { RecordDetailDrawer } from "@/components/RecordDetailDrawer";
import { RevokeModal } from "@/components/RevokeModal";
import { RowActions } from "@/components/RowActions";
import { StatusBadge } from "@/components/StatusBadge";
import { extractApiError } from "@/lib/apiError";
import { saveDownload } from "@/utils/download";
import { formatDate } from "@/utils/format";
import { useDebounce } from "@/hooks/useDebounce";
import { useTablePagination } from "@/hooks/useTablePagination";
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
  const pagination = useTablePagination(20);
  const [filter, setFilter] = useState("");
  const debouncedFilter = useDebounce(filter);
  const [businessId, setBusinessId] = useState<string>();
  const [status, setStatus] = useState<LicenseStatus>();
  const [expiringWithinDays, setExpiringWithinDays] = useState<number>();
  const [sorting, setSorting] = useState<string>();
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<EligibilityCertificate>();
  const [attachmentsFor, setAttachmentsFor] =
    useState<EligibilityCertificate>();
  const [revoking, setRevoking] = useState<EligibilityCertificate>();
  const [detailRecord, setDetailRecord] =
    useState<EligibilityCertificate | null>(null);
  const sortOrderFor = (field: string): SortOrder => {
    if (!sorting) return null;
    const [current, direction] = sorting.split(" ");
    if (current !== field) return null;
    return direction === "desc" ? "descend" : "ascend";
  };

  const handleSort = (
    sorter:
      | SorterResult<EligibilityCertificate>
      | SorterResult<EligibilityCertificate>[],
  ) => {
    const active = Array.isArray(sorter) ? sorter[0] : sorter;
    const next =
      active?.order && typeof active.field === "string"
        ? `${active.field} ${active.order === "descend" ? "desc" : "asc"}`
        : undefined;
    if (next !== sorting) {
      setSorting(next);
      pagination.resetToFirstPage();
    }
  };

  const queryFilter = {
    filter: debouncedFilter.trim() || undefined,
    businessId,
    status,
    expiringWithinDays,
    sorting,
    skipCount: pagination.skipCount,
    maxResultCount: pagination.maxResultCount,
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

  const refreshCertificates = () => void certificates.refetch();

  const closeEditor = () => {
    setEditorOpen(false);
    setEditing(undefined);
  };

  const resetFilters = () => {
    setFilter("");
    setBusinessId(undefined);
    setStatus(undefined);
    setExpiringWithinDays(undefined);
    pagination.resetToFirstPage();
  };

  const save = (input: EligibilityCertificateInput) => {
    const options = {
      onSuccess: () => {
        void message.success("Đã lưu giấy chứng nhận.");
        closeEditor();
      },
      onError: (error: unknown) => void message.error(extractApiError(error)),
    };
    if (editing) updateMutation.mutate({ id: editing.id, input }, options);
    else createMutation.mutate(input, options);
  };

  const columns: ColumnsType<EligibilityCertificate> = [
    { title: "Số giấy", dataIndex: "certificateNumber", width: 160 },
    {
      title: "Cơ sở SXKD",
      dataIndex: "businessName",
      ellipsis: true,
      render: (value?: string) =>
        value || (
          <Typography.Text type="secondary">(Cơ sở đã xóa)</Typography.Text>
        ),
    },
    {
      title: "Ngày cấp",
      dataIndex: "issueDate",
      width: 115,
      sorter: true,
      sortOrder: sortOrderFor("issueDate"),
      render: (value: string) => formatDate(value),
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
      width: 120,
      render: (_, item) => (
        <RowActions
          overflowAriaLabel={`Thao tác ${item.certificateNumber}`}
          actions={[
            {
              key: "files",
              label: "Tệp",
              ariaLabel: `Tệp ${item.certificateNumber}`,
              icon: <FileTextOutlined />,
              onClick: () => setAttachmentsFor(item),
            },
            {
              key: "pdf",
              label: "Tải PDF",
              ariaLabel: `Tải PDF ${item.certificateNumber}`,
              icon: <FilePdfOutlined />,
              disabled:
                pdfMutation.isPending && pdfMutation.variables === item.id,
              onClick: () =>
                pdfMutation.mutate(item.id, {
                  onSuccess: (file) => saveDownload(file.blob, file.fileName),
                  onError: (error: unknown) =>
                    void message.error(extractApiError(error)),
                }),
            },
            {
              key: "edit",
              label: "Sửa",
              ariaLabel: `Sửa ${item.certificateNumber}`,
              icon: <EditOutlined />,
              hidden: !canEdit || item.status === LICENSE_STATUS.Revoked,
              onClick: () => {
                setEditing(item);
                setEditorOpen(true);
              },
            },
            {
              key: "revoke",
              label: "Thu hồi",
              ariaLabel: `Thu hồi ${item.certificateNumber}`,
              icon: <StopOutlined />,
              danger: true,
              hidden: !canEdit || item.status === LICENSE_STATUS.Revoked,
              onClick: () => setRevoking(item),
            },
            {
              key: "delete",
              label: "Xóa",
              ariaLabel: `Xóa ${item.certificateNumber}`,
              icon: <DeleteOutlined />,
              danger: true,
              hidden: !canDelete,
              confirm: `Xóa giấy chứng nhận ${item.certificateNumber}?`,
              onClick: () =>
                deleteMutation.mutate(item.id, {
                  onSuccess: () =>
                    void message.success("Đã xóa giấy chứng nhận."),
                  onError: (error: unknown) =>
                    void message.error(extractApiError(error)),
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
                  onError: (error: unknown) =>
                    void message.error(extractApiError(error)),
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
            value={filter}
            onChange={(event) => {
              setFilter(event.target.value);
              pagination.resetToFirstPage();
            }}
          />
          <Select
            allowClear
            showSearch
            optionFilterProp="label"
            placeholder="Tất cả cơ sở"
            style={{ width: 260 }}
            value={businessId}
            options={(businesses.data ?? []).map((x) => ({
              value: x.id,
              label: x.code ? `${x.code} — ${x.name}` : x.name,
            }))}
            onChange={(value) => {
              setBusinessId(value);
              pagination.resetToFirstPage();
            }}
          />
          <Select
            allowClear
            placeholder="Trạng thái"
            style={{ width: 160 }}
            value={status}
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
            value={expiringWithinDays}
            options={[30, 60, 90].map((value) => ({
              value,
              label: `Trong ${value} ngày`,
            }))}
            onChange={(value) => {
              setExpiringWithinDays(value);
              pagination.resetToFirstPage();
            }}
          />
          <div className="filter-toolbar-actions">
            <ClearFiltersButton
              active={Boolean(
                filter.trim() ||
                businessId ||
                status !== undefined ||
                expiringWithinDays !== undefined,
              )}
              onClick={resetFilters}
            />
            <RefreshListButton
              loading={certificates.isFetching}
              onClick={refreshCertificates}
            />
          </div>
        </div>
        <Table
          size="middle"
          rowKey="id"
          scroll={{ x: 1100 }}
          loading={certificates.isFetching}
          columns={columns}
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  filter || businessId || status || expiringWithinDays
                    ? "Không tìm thấy giấy chứng nhận phù hợp với bộ lọc"
                    : "Chưa có giấy chứng nhận đủ điều kiện nào"
                }
              />
            ),
          }}
          dataSource={certificates.data?.items ?? []}
          onRow={(record) => ({
            onDoubleClick: () => setDetailRecord(record),
            style: { cursor: "pointer" },
          })}
          onChange={(_, __, sorter) => handleSort(sorter)}
          pagination={pagination.buildConfig(
            certificates.data?.totalCount ?? 0,
          )}
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
          {
            label: "Cơ sở SXKD",
            render: (r) => r.businessName || "(Cơ sở đã xóa)",
            span: 2,
          },
          {
            label: "Ngày cấp",
            render: (r) => formatDate(r.issueDate),
          },
          {
            label: "Ngày hết hạn",
            render: (r) => (r.expiryDate ? formatDate(r.expiryDate) : null),
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
            render: (r) => (r.revokedAt ? formatDate(r.revokedAt) : null),
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
              onError: (error: unknown) =>
                void message.error(extractApiError(error)),
            },
          );
        }}
        onDownload={(attachment: FileAttachment) => {
          if (!attachmentsFor) return;
          downloadMutation.mutate(
            { id: attachmentsFor.id, attachmentId: attachment.id },
            {
              onSuccess: (file) => saveDownload(file.blob, file.fileName),
              onError: (error: unknown) =>
                void message.error(extractApiError(error)),
            },
          );
        }}
        onDelete={(attachmentId) => {
          if (!attachmentsFor) return;
          deleteAttachmentMutation.mutate(
            { id: attachmentsFor.id, attachmentId },
            {
              onSuccess: () => void message.success("Đã xóa tệp."),
              onError: (error: unknown) =>
                void message.error(extractApiError(error)),
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
              onError: (error: unknown) =>
                void message.error(extractApiError(error)),
            },
          );
        }}
      />
    </div>
  );
}
