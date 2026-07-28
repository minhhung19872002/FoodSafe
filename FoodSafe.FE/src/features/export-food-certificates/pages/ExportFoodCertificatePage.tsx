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
import { extractApiError } from "@/lib/apiError";
import {
  useCreateExportFoodCertificate,
  useDeleteExportFoodCertificate,
  useDeleteExportFoodCertificateAttachment,
  useDownloadExportFoodCertificateAttachment,
  useDownloadExportFoodCertificatePdf,
  useExportExportFoodCertificates,
  useRevokeExportFoodCertificate,
  useUpdateExportFoodCertificate,
  useUploadExportFoodCertificateAttachment,
} from "../api/exportFoodCertificateMutations";
import {
  useExportFoodCertificateAttachments,
  useExportFoodCertificateBusinesses,
  useExportFoodCertificateCountries,
  useExportFoodCertificateProducts,
  useExportFoodCertificates,
} from "../api/exportFoodCertificateQueries";
import { ProductRegistrationAttachmentsModal } from "@/features/product-registrations/components/ProductRegistrationAttachmentsModal";
import { ExportFoodCertificateEditorModal } from "../components/ExportFoodCertificateEditorModal";
import {
  LICENSE_STATUS,
  type FileAttachment,
  type LicenseStatus,
  type ExportFoodCertificate,
  type ExportFoodCertificateInput,
} from "../types/exportFoodCertificate.types";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { ExpiryTag } from "@/components/ExpiryTag";
import { RevokeModal } from "@/components/RevokeModal";
import { RecordDetailDrawer } from "@/components/RecordDetailDrawer";
import { RowActions } from "@/components/RowActions";
import { saveDownload } from "@/utils/download";
import { useTablePagination } from "@/hooks/useTablePagination";

export default function ExportFoodCertificatePage() {
  const { message } = App.useApp();
  const hasPermission = useAuthStore((state) => state.hasPermission);
  const canCreate = hasPermission(
    "FoodSafe.Licensing.ExportCertificates.Create",
  );
  const canEdit = hasPermission("FoodSafe.Licensing.ExportCertificates.Edit");
  const canDelete = hasPermission(
    "FoodSafe.Licensing.ExportCertificates.Delete",
  );
  const pagination = useTablePagination(20);
  const [filter, setFilter] = useState("");
  const [businessId, setBusinessId] = useState<string>();
  const [destinationCountryId, setDestinationCountryId] = useState<string>();
  const [status, setStatus] = useState<LicenseStatus>();
  const [expiringWithinDays, setExpiringWithinDays] = useState<number>();
  const [sorting, setSorting] = useState<string>();
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<ExportFoodCertificate>();
  const [editorBusinessId, setEditorBusinessId] = useState<string>();
  const [attachmentsFor, setAttachmentsFor] = useState<ExportFoodCertificate>();
  const [revoking, setRevoking] = useState<ExportFoodCertificate>();
  const [detailRecord, setDetailRecord] =
    useState<ExportFoodCertificate | null>(null);

  const sortOrderFor = (field: string): SortOrder => {
    if (!sorting) return null;
    const [current, direction] = sorting.split(" ");
    if (current !== field) return null;
    return direction === "desc" ? "descend" : "ascend";
  };

  const handleSort = (
    sorter:
      | SorterResult<ExportFoodCertificate>
      | SorterResult<ExportFoodCertificate>[],
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
    filter: filter || undefined,
    businessId,
    destinationCountryId,
    status,
    expiringWithinDays,
    sorting,
    skipCount: pagination.skipCount,
    maxResultCount: pagination.maxResultCount,
  };
  const registrations = useExportFoodCertificates(queryFilter);
  const businesses = useExportFoodCertificateBusinesses();
  const countries = useExportFoodCertificateCountries();
  const products = useExportFoodCertificateProducts(editorBusinessId);
  const attachments = useExportFoodCertificateAttachments(attachmentsFor?.id);
  const createMutation = useCreateExportFoodCertificate();
  const updateMutation = useUpdateExportFoodCertificate();
  const deleteMutation = useDeleteExportFoodCertificate();
  const revokeMutation = useRevokeExportFoodCertificate();
  const exportMutation = useExportExportFoodCertificates();
  const pdfMutation = useDownloadExportFoodCertificatePdf();
  const uploadMutation = useUploadExportFoodCertificateAttachment();
  const downloadMutation = useDownloadExportFoodCertificateAttachment();
  const deleteAttachmentMutation = useDeleteExportFoodCertificateAttachment();

  const closeEditor = () => {
    setEditorOpen(false);
    setEditing(undefined);
    setEditorBusinessId(undefined);
  };

  const save = (input: ExportFoodCertificateInput) => {
    const options = {
      onSuccess: () => {
        void message.success("Đã lưu giấy chứng nhận xuất khẩu.");
        closeEditor();
      },
      onError: (error: unknown) => void message.error(extractApiError(error)),
    };
    if (editing) updateMutation.mutate({ id: editing.id, input }, options);
    else createMutation.mutate(input, options);
  };

  const columns: ColumnsType<ExportFoodCertificate> = [
    {
      title: "Số GCN XK",
      dataIndex: "certificateNumber",
      width: 160,
    },
    { title: "Cơ sở SXKD", dataIndex: "businessName", ellipsis: true },
    {
      title: "Sản phẩm",
      dataIndex: "linkedProductName",
      ellipsis: true,
      render: (value?: string) => value || "—",
    },
    {
      title: "Số lô",
      dataIndex: "lotNumber",
      width: 120,
      render: (value?: string) => value || "—",
    },
    {
      title: "Số lượng",
      width: 130,
      render: (_, item) => {
        if (item.quantity == null) return "—";
        return item.quantityUnit
          ? `${item.quantity.toLocaleString("vi-VN")} ${item.quantityUnit}`
          : item.quantity.toLocaleString("vi-VN");
      },
    },
    {
      title: "Quốc gia đích",
      dataIndex: "destinationCountryName",
      width: 155,
      render: (value?: string) => value || "—",
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
      width: 96,
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
                  onError: (error) =>
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
              confirm: "Xóa giấy chứng nhận xuất khẩu này?",
              onClick: () =>
                deleteMutation.mutate(item.id, {
                  onSuccess: () =>
                    void message.success("Đã xóa giấy chứng nhận xuất khẩu."),
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
        title="Giấy chứng nhận xuất khẩu thực phẩm"
        subtitle="Quản lý giấy chứng nhận xuất khẩu thực phẩm cho cơ sở SXKD"
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
                Thêm GCN XK
              </Button>
            )}
          </Space>
        }
      />

      <div className="page-card">
        <div className="filter-toolbar" style={{ marginBottom: 16 }}>
          <Space wrap>
            <Input.Search
              allowClear
              placeholder="Tìm theo số GCN"
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
              showSearch
              optionFilterProp="label"
              placeholder="Tất cả quốc gia"
              style={{ width: 220 }}
              loading={countries.isLoading}
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
          scroll={{ x: 1300 }}
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
        title="Chi tiết GCN thực phẩm xuất khẩu"
        record={detailRecord}
        onClose={() => setDetailRecord(null)}
        fields={[
          { label: "Số GCN XK", render: (r) => r.certificateNumber },
          {
            label: "Trạng thái",
            render: (r) => <StatusBadge status={r.status} />,
          },
          { label: "Cơ sở SXKD", render: (r) => r.businessName, span: 2 },
          { label: "Sản phẩm", render: (r) => r.linkedProductName, span: 2 },
          { label: "Số lô", render: (r) => r.lotNumber },
          {
            label: "Số lượng",
            render: (r) => {
              if (r.quantity == null) return null;
              return r.quantityUnit
                ? `${r.quantity.toLocaleString("vi-VN")} ${r.quantityUnit}`
                : r.quantity.toLocaleString("vi-VN");
            },
          },
          {
            label: "Quốc gia đích",
            render: (r) => r.destinationCountryName,
            span: 2,
          },
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

      <ExportFoodCertificateEditorModal
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
        titlePrefix="Tệp GCN XK"
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
              onError: (error) => void message.error(extractApiError(error)),
            },
          );
        }}
        onDownload={(attachment: FileAttachment) => {
          if (!attachmentsFor) return;
          downloadMutation.mutate(
            { id: attachmentsFor.id, attachmentId: attachment.id },
            {
              onSuccess: (file) => saveDownload(file.blob, file.fileName),
              onError: (error) => void message.error(extractApiError(error)),
            },
          );
        }}
        onDelete={(attachmentId) => {
          if (!attachmentsFor) return;
          deleteAttachmentMutation.mutate(
            { id: attachmentsFor.id, attachmentId },
            {
              onSuccess: () => void message.success("Đã xóa tệp."),
              onError: (error) => void message.error(extractApiError(error)),
            },
          );
        }}
      />

      <RevokeModal
        open={Boolean(revoking)}
        title={`Thu hồi GCN XK ${revoking?.certificateNumber ?? ""}`}
        confirmLoading={revokeMutation.isPending}
        onCancel={() => setRevoking(undefined)}
        onConfirm={(reason) => {
          if (!revoking) return;
          revokeMutation.mutate(
            { id: revoking.id, reason },
            {
              onSuccess: () => {
                void message.success("Đã thu hồi giấy chứng nhận xuất khẩu.");
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
