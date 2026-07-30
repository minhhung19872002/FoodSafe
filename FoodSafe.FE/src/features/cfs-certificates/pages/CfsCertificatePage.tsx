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
import type { SorterResult, SortOrder } from "antd/es/table/interface";
import { useAuthStore } from "@/features/auth/store/authStore";
import { ClearFiltersButton } from "@/components/ClearFiltersButton";
import { RefreshListButton } from "@/components/RefreshListButton";
import { extractApiError } from "@/lib/apiError";
import {
  useCreateCfsCertificate,
  useDeleteCfsCertificate,
  useDeleteCfsCertificateAttachment,
  useDownloadCfsCertificateAttachment,
  useDownloadCfsCertificatePdf,
  useExportCfsCertificates,
  useRevokeCfsCertificate,
  useUpdateCfsCertificate,
  useUploadCfsCertificateAttachment,
} from "../api/cfsCertificateMutations";
import {
  useCfsCertificateAttachments,
  useCfsCertificateBusinesses,
  useCfsCertificateCountries,
  useCfsCertificateProducts,
  useCfsCertificates,
} from "../api/cfsCertificateQueries";
import { ProductRegistrationAttachmentsModal } from "@/features/product-registrations/components/ProductRegistrationAttachmentsModal";
import { CfsCertificateEditorModal } from "../components/CfsCertificateEditorModal";
import {
  LICENSE_STATUS,
  type FileAttachment,
  type LicenseStatus,
  type CfsCertificate,
  type CfsCertificateInput,
} from "../types/cfsCertificate.types";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { ExpiryTag } from "@/components/ExpiryTag";
import { RevokeModal } from "@/components/RevokeModal";
import { RecordDetailDrawer } from "@/components/RecordDetailDrawer";
import { RowActions } from "@/components/RowActions";
import { saveDownload } from "@/utils/download";
import { useDebounce } from "@/hooks/useDebounce";
import { useTablePagination } from "@/hooks/useTablePagination";

export default function CfsCertificatePage() {
  const { message } = App.useApp();
  const hasPermission = useAuthStore((state) => state.hasPermission);
  const canCreate = hasPermission("FoodSafe.Licensing.CfsCertificates.Create");
  const canEdit = hasPermission("FoodSafe.Licensing.CfsCertificates.Edit");
  const canDelete = hasPermission("FoodSafe.Licensing.CfsCertificates.Delete");
  const pagination = useTablePagination(20);
  const [filter, setFilter] = useState("");
  const debouncedFilter = useDebounce(filter);
  const [businessId, setBusinessId] = useState<string>();
  const [destinationCountryId, setDestinationCountryId] = useState<string>();
  const [status, setStatus] = useState<LicenseStatus>();
  const [expiringWithinDays, setExpiringWithinDays] = useState<number>();
  const [sorting, setSorting] = useState<string>();
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<CfsCertificate>();
  const [editorBusinessId, setEditorBusinessId] = useState<string>();
  const [attachmentsFor, setAttachmentsFor] = useState<CfsCertificate>();
  const [revoking, setRevoking] = useState<CfsCertificate>();
  const [detailRecord, setDetailRecord] = useState<CfsCertificate | null>(null);

  const sortOrderFor = (field: string): SortOrder => {
    if (!sorting) return null;
    const [current, direction] = sorting.split(" ");
    if (current !== field) return null;
    return direction === "desc" ? "descend" : "ascend";
  };

  const handleSort = (
    sorter: SorterResult<CfsCertificate> | SorterResult<CfsCertificate>[],
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
    destinationCountryId,
    status,
    expiringWithinDays,
    sorting,
    skipCount: pagination.skipCount,
    maxResultCount: pagination.maxResultCount,
  };
  const registrations = useCfsCertificates(queryFilter);
  const businesses = useCfsCertificateBusinesses();
  const countries = useCfsCertificateCountries();
  const products = useCfsCertificateProducts(editorBusinessId);
  const attachments = useCfsCertificateAttachments(attachmentsFor?.id);
  const createMutation = useCreateCfsCertificate();
  const updateMutation = useUpdateCfsCertificate();
  const deleteMutation = useDeleteCfsCertificate();
  const revokeMutation = useRevokeCfsCertificate();
  const exportMutation = useExportCfsCertificates();
  const pdfMutation = useDownloadCfsCertificatePdf();
  const uploadMutation = useUploadCfsCertificateAttachment();
  const downloadMutation = useDownloadCfsCertificateAttachment();
  const deleteAttachmentMutation = useDeleteCfsCertificateAttachment();

  const refreshRegistrations = () => void registrations.refetch();

  const closeEditor = () => {
    setEditorOpen(false);
    setEditing(undefined);
    setEditorBusinessId(undefined);
  };

  const resetFilters = () => {
    setFilter("");
    setBusinessId(undefined);
    setDestinationCountryId(undefined);
    setStatus(undefined);
    setExpiringWithinDays(undefined);
    pagination.resetToFirstPage();
  };

  const save = (input: CfsCertificateInput) => {
    const options = {
      onSuccess: () => {
        void message.success("Đã lưu chứng nhận CFS.");
        closeEditor();
      },
      onError: (error: unknown) => void message.error(extractApiError(error)),
    };
    if (editing) updateMutation.mutate({ id: editing.id, input }, options);
    else createMutation.mutate(input, options);
  };

  const columns: ColumnsType<CfsCertificate> = [
    {
      title: "Số CFS",
      dataIndex: "certificateNumber",
      width: 155,
    },
    { title: "Cơ sở SXKD", dataIndex: "businessName", ellipsis: true },
    {
      title: "Sản phẩm",
      dataIndex: "linkedProductName",
      ellipsis: true,
      render: (value?: string) => value || "—",
    },
    {
      title: "Quốc gia nhập khẩu",
      dataIndex: "destinationCountryName",
      width: 155,
    },
    {
      title: "Ngày cấp",
      dataIndex: "issueDate",
      width: 125,
      sorter: true,
      sortOrder: sortOrderFor("issueDate"),
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
      render: (s) => <StatusBadge status={s} />,
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
                  onError: () =>
                    void message.error("Không thể tải bản PDF chứng nhận CFS."),
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
                setEditorBusinessId(item.businessId);
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
              confirm: "Xóa chứng nhận CFS này?",
              onClick: () =>
                deleteMutation.mutate(item.id, {
                  onSuccess: () =>
                    void message.success("Đã xóa chứng nhận CFS."),
                  onError: (error) =>
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
        title="Chứng nhận lưu hành tự do (CFS)"
        subtitle="Quản lý giấy chứng nhận lưu hành tự do cho xuất khẩu"
        actions={
          <Space>
            <Button
              icon={<ExportOutlined />}
              loading={exportMutation.isPending}
              onClick={() =>
                exportMutation.mutate(queryFilter, {
                  onSuccess: (file) => saveDownload(file.blob, file.fileName),
                  onError: (error) =>
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
                onClick={() => {
                  setEditing(undefined);
                  setEditorOpen(true);
                }}
              >
                Thêm CFS
              </Button>
            )}
          </Space>
        }
      />

      <div className="page-card">
        <div className="filter-toolbar" style={{ marginBottom: 16 }}>
          <Input.Search
            allowClear
            placeholder="Tìm theo số CFS"
            style={{ width: 310 }}
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
            loading={businesses.isLoading}
            value={businessId}
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
            showSearch
            optionFilterProp="label"
            placeholder="Tất cả quốc gia"
            style={{ width: 220 }}
            loading={countries.isLoading}
            value={destinationCountryId}
            options={(countries.data ?? []).map((item) => ({
              value: item.id,
              label: `${item.code} — ${item.name}`,
            }))}
            onChange={(value) => {
              setDestinationCountryId(value);
              pagination.resetToFirstPage();
            }}
          />
          <Select
            allowClear
            placeholder="Tất cả trạng thái"
            style={{ width: 170 }}
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
          <div className="filter-toolbar-actions">
            <ClearFiltersButton
              active={Boolean(
                filter.trim() ||
                businessId ||
                destinationCountryId ||
                status !== undefined ||
                expiringWithinDays !== undefined,
              )}
              onClick={resetFilters}
            />
            <RefreshListButton
              loading={registrations.isFetching}
              onClick={refreshRegistrations}
            />
          </div>
        </div>

        <Table
          sticky
          rowKey="id"
          size="middle"
          scroll={{ x: 1350 }}
          loading={registrations.isFetching}
          columns={columns}
          dataSource={registrations.data?.items ?? []}
          onRow={(record) => ({
            onDoubleClick: () => setDetailRecord(record),
            style: { cursor: "pointer" },
          })}
          onChange={(_, __, sorter) => handleSort(sorter)}
          pagination={pagination.buildConfig(
            registrations.data?.totalCount ?? 0,
          )}
        />
      </div>

      <RecordDetailDrawer
        title="Chi tiết giấy CFS"
        record={detailRecord}
        onClose={() => setDetailRecord(null)}
        fields={[
          { label: "Số CFS", render: (r) => r.certificateNumber },
          {
            label: "Trạng thái",
            render: (r) => <StatusBadge status={r.status} />,
          },
          { label: "Cơ sở SXKD", render: (r) => r.businessName, span: 2 },
          { label: "Sản phẩm", render: (r) => r.linkedProductName, span: 2 },
          { label: "Quốc gia nhập khẩu", render: (r) => r.destinationCountryName },
          { label: "Cơ quan cấp", render: (r) => r.certifyingAuthority },
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

      <CfsCertificateEditorModal
        open={editorOpen}
        registration={editing}
        businesses={businesses.data ?? []}
        products={products.data ?? []}
        countries={countries.data ?? []}
        productsLoading={products.isLoading}
        saving={createMutation.isPending || updateMutation.isPending}
        onBusinessChange={setEditorBusinessId}
        onCancel={closeEditor}
        onSubmit={save}
      />

      <ProductRegistrationAttachmentsModal
        documentNumber={attachmentsFor?.certificateNumber}
        titlePrefix="Tệp CFS"
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
        title={`Thu hồi CFS ${revoking?.certificateNumber ?? ""}`}
        confirmLoading={revokeMutation.isPending}
        onCancel={() => setRevoking(undefined)}
        onConfirm={(reason) => {
          if (!revoking) return;
          revokeMutation.mutate(
            { id: revoking.id, reason },
            {
              onSuccess: () => {
                void message.success("Đã thu hồi chứng nhận CFS.");
                setRevoking(undefined);
              },
              onError: (error) => void message.error(extractApiError(error)),
            },
          );
        }}
      />
    </div>
  );
}
