import { useState } from "react";
import {
  DeleteOutlined,
  EditOutlined,
  ExportOutlined,
  FileTextOutlined,
  PlusOutlined,
  StopOutlined,
} from "@ant-design/icons";
import { App, Button, Input, Select, Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import type { SorterResult, SortOrder } from "antd/es/table/interface";
import { useAuthStore } from "@/features/auth/store/authStore";
import { extractApiError } from "@/lib/apiError";
import { ProductRegistrationAttachmentsModal } from "@/features/product-registrations/components/ProductRegistrationAttachmentsModal";
import { ClearFiltersButton } from "@/components/ClearFiltersButton";
import { RefreshListButton } from "@/components/RefreshListButton";
import { ExpiryTag } from "@/components/ExpiryTag";
import { PageHeader } from "@/components/PageHeader";
import { RecordDetailDrawer } from "@/components/RecordDetailDrawer";
import { RevokeModal } from "@/components/RevokeModal";
import { RowActions } from "@/components/RowActions";
import { StatusBadge } from "@/components/StatusBadge";
import { saveDownload } from "@/utils/download";
import { useDebounce } from "@/hooks/useDebounce";
import { useTablePagination } from "@/hooks/useTablePagination";
import {
  useCreateAdvertisementRegistration,
  useDeleteAdvertisementAttachment,
  useDeleteAdvertisementRegistration,
  useDownloadAdvertisementAttachment,
  useExportAdvertisementRegistrations,
  useRevokeAdvertisementRegistration,
  useUpdateAdvertisementRegistration,
  useUploadAdvertisementAttachment,
} from "../api/advertisementRegistrationMutations";
import {
  useAdvertisementAttachments,
  useAdvertisementBusinesses,
  useAdvertisementProducts,
  useAdvertisementRegistrations,
  useAdvertisementTypes,
} from "../api/advertisementRegistrationQueries";
import { AdvertisementRegistrationEditorModal } from "../components/AdvertisementRegistrationEditorModal";
import {
  LICENSE_STATUS,
  type AdvertisementRegistration,
  type AdvertisementRegistrationInput,
  type FileAttachment,
  type LicenseStatus,
} from "../types/advertisementRegistration.types";

export default function AdvertisementRegistrationPage() {
  const { message } = App.useApp();
  const hasPermission = useAuthStore((state) => state.hasPermission);
  const canCreate = hasPermission("FoodSafe.Licensing.AdRegistrations.Create");
  const canEdit = hasPermission("FoodSafe.Licensing.AdRegistrations.Edit");
  const canDelete = hasPermission("FoodSafe.Licensing.AdRegistrations.Delete");
  const pagination = useTablePagination(20);
  const [filter, setFilter] = useState("");
  const debouncedFilter = useDebounce(filter);
  const [businessId, setBusinessId] = useState<string>();
  const [advertisementTypeId, setAdvertisementTypeId] = useState<string>();
  const [status, setStatus] = useState<LicenseStatus>();
  const [expiringWithinDays, setExpiringWithinDays] = useState<number>();
  const [sorting, setSorting] = useState<string>();
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<AdvertisementRegistration>();
  const [editorBusinessId, setEditorBusinessId] = useState<string>();
  const [attachmentsFor, setAttachmentsFor] =
    useState<AdvertisementRegistration>();
  const [revoking, setRevoking] = useState<AdvertisementRegistration>();
  const [detailRecord, setDetailRecord] =
    useState<AdvertisementRegistration | null>(null);

  const sortOrderFor = (field: string): SortOrder => {
    if (!sorting) return null;
    const [current, direction] = sorting.split(" ");
    if (current !== field) return null;
    return direction === "desc" ? "descend" : "ascend";
  };

  const handleSort = (
    sorter:
      | SorterResult<AdvertisementRegistration>
      | SorterResult<AdvertisementRegistration>[],
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
    advertisementTypeId,
    status,
    expiringWithinDays,
    sorting,
    skipCount: pagination.skipCount,
    maxResultCount: pagination.maxResultCount,
  };
  const registrations = useAdvertisementRegistrations(queryFilter);
  const businesses = useAdvertisementBusinesses();
  const products = useAdvertisementProducts(editorBusinessId);
  const types = useAdvertisementTypes();
  const attachments = useAdvertisementAttachments(attachmentsFor?.id);
  const createMutation = useCreateAdvertisementRegistration();
  const updateMutation = useUpdateAdvertisementRegistration();
  const deleteMutation = useDeleteAdvertisementRegistration();
  const revokeMutation = useRevokeAdvertisementRegistration();
  const exportMutation = useExportAdvertisementRegistrations();
  const uploadMutation = useUploadAdvertisementAttachment();
  const downloadMutation = useDownloadAdvertisementAttachment();
  const deleteAttachmentMutation = useDeleteAdvertisementAttachment();

  const refreshRegistrations = () => void registrations.refetch();

  const closeEditor = () => {
    setEditorOpen(false);
    setEditing(undefined);
    setEditorBusinessId(undefined);
  };

  const resetFilters = () => {
    setFilter("");
    setBusinessId(undefined);
    setAdvertisementTypeId(undefined);
    setStatus(undefined);
    setExpiringWithinDays(undefined);
    pagination.resetToFirstPage();
  };

  const save = (input: AdvertisementRegistrationInput) => {
    const options = {
      onSuccess: () => {
        void message.success("Đã lưu đăng ký quảng cáo.");
        closeEditor();
      },
      onError: (error: unknown) => void message.error(extractApiError(error)),
    };
    if (editing) updateMutation.mutate({ id: editing.id, input }, options);
    else createMutation.mutate(input, options);
  };

  const columns: ColumnsType<AdvertisementRegistration> = [
    { title: "Số đăng ký", dataIndex: "registrationNumber", width: 155 },
    { title: "Cơ sở SXKD", dataIndex: "businessName", ellipsis: true },
    {
      title: "Loại quảng cáo",
      dataIndex: "advertisementTypeName",
      width: 150,
      render: (value?: string) => value || "—",
    },
    {
      title: "Sản phẩm",
      ellipsis: true,
      render: (_, item) => item.products.map((x) => x.name).join(", "),
    },
    {
      title: "Ngày cấp",
      dataIndex: "registrationDate",
      width: 115,
      sorter: true,
      sortOrder: sortOrderFor("registrationDate"),
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
      render: (value: LicenseStatus) => <StatusBadge status={value} />,
    },
    {
      title: "Thao tác",
      fixed: "right",
      width: 120,
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
        title="Đăng ký nội dung quảng cáo"
        subtitle="Quản lý đăng ký quảng cáo thực phẩm"
        actions={
          <>
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
                onClick={() => setEditorOpen(true)}
              >
                Thêm đăng ký
              </Button>
            )}
          </>
        }
      />
      <div className="page-card">
        <div className="filter-toolbar" style={{ marginBottom: 16 }}>
          <Input.Search
            allowClear
            placeholder="Số đăng ký, phương tiện, nội dung"
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
            style={{ width: 250 }}
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
            placeholder="Loại quảng cáo"
            style={{ width: 190 }}
            value={advertisementTypeId}
            options={(types.data ?? []).map((x) => ({
              value: x.id,
              label: x.name,
            }))}
            onChange={(value) => {
              setAdvertisementTypeId(value);
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
                advertisementTypeId ||
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
          rowKey="id"
          size="middle"
          scroll={{ x: 1250 }}
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
        title="Chi tiết đăng ký quảng cáo"
        record={detailRecord}
        onClose={() => setDetailRecord(null)}
        fields={[
          { label: "Số đăng ký", render: (r) => r.registrationNumber },
          {
            label: "Trạng thái",
            render: (r) => <StatusBadge status={r.status} />,
          },
          { label: "Cơ sở SXKD", render: (r) => r.businessName, span: 2 },
          { label: "Loại quảng cáo", render: (r) => r.advertisementTypeName },
          { label: "Phương tiện", render: (r) => r.medium },
          {
            label: "Sản phẩm",
            render: (r) => r.products.map((x) => x.name).join(", "),
            span: 2,
          },
          {
            label: "Nội dung quảng cáo",
            render: (r) => r.contentDescription,
            span: 2,
          },
          {
            label: "Ngày cấp",
            render: (r) =>
              new Date(r.registrationDate).toLocaleDateString("vi-VN"),
          },
          {
            label: "Ngày hết hạn",
            render: (r) =>
              r.expiryDate
                ? new Date(r.expiryDate).toLocaleDateString("vi-VN")
                : null,
          },
          { label: "Lý do thu hồi", render: (r) => r.revokeReason, span: 2 },
          { label: "Ghi chú", render: (r) => r.notes, span: 2 },
        ]}
      />
      <AdvertisementRegistrationEditorModal
        open={editorOpen}
        item={editing}
        businesses={businesses.data ?? []}
        products={products.data ?? []}
        types={types.data ?? []}
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
              onError: (error) => void message.error(extractApiError(error)),
            },
          );
        }}
      />
    </div>
  );
}
