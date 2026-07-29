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
import { App, Button, Input, Select, Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import type { SorterResult, SortOrder } from "antd/es/table/interface";
import { useAuthStore } from "@/features/auth/store/authStore";
import { extractApiError } from "@/lib/apiError";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { ExpiryTag } from "@/components/ExpiryTag";
import { RevokeModal } from "@/components/RevokeModal";
import { RecordDetailDrawer } from "@/components/RecordDetailDrawer";
import { RowActions } from "@/components/RowActions";
import { saveDownload } from "@/utils/download";
import { useTablePagination } from "@/hooks/useTablePagination";
import {
  useCreateSelfDeclaration,
  useDeleteSelfDeclaration,
  useDeleteSelfDeclarationAttachment,
  useDownloadSelfDeclarationAttachment,
  useDownloadSelfDeclarationPdf,
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
  const pagination = useTablePagination(20);
  const [filter, setFilter] = useState("");
  const [businessId, setBusinessId] = useState<string>();
  const [status, setStatus] = useState<LicenseStatus>();
  const [expiringWithinDays, setExpiringWithinDays] = useState<number>();
  const [sorting, setSorting] = useState<string | undefined>(undefined);
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
    sorting,
    skipCount: pagination.skipCount,
    maxResultCount: pagination.maxResultCount,
  };

  // Server-side sorting: translate column-header clicks into the
  // "<field> <asc|desc>" string the backend's ApplySorting whitelist parses.
  const sortOrderFor = (field: string): SortOrder => {
    if (!sorting) return null;
    const [current, direction] = sorting.split(" ");
    if (current !== field) return null;
    return direction === "desc" ? "descend" : "ascend";
  };

  const handleSort = (
    sorter: SorterResult<SelfDeclaration> | SorterResult<SelfDeclaration>[],
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
  const declarations = useSelfDeclarations(queryFilter);
  const businesses = useSelfDeclarationBusinesses();
  const products = useSelfDeclarationProducts(editorBusinessId);
  const attachments = useSelfDeclarationAttachments(attachmentsFor?.id);
  const createMutation = useCreateSelfDeclaration();
  const updateMutation = useUpdateSelfDeclaration();
  const deleteMutation = useDeleteSelfDeclaration();
  const revokeMutation = useRevokeSelfDeclaration();
  const exportMutation = useExportSelfDeclarations();
  const pdfMutation = useDownloadSelfDeclarationPdf();
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
      onError: (error: unknown) => void message.error(extractApiError(error)),
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
      sorter: true,
      sortOrder: sortOrderFor("declarationDate"),
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
      width: 96,
      render: (_, item) => (
        <RowActions
          overflowAriaLabel={`Thao tác ${item.declarationNumber}`}
          actions={[
            {
              key: "files",
              label: "Tệp",
              ariaLabel: `Tệp ${item.declarationNumber}`,
              icon: <FileTextOutlined />,
              onClick: () => setAttachmentsFor(item),
            },
            {
              key: "pdf",
              label: "Tải PDF",
              ariaLabel: `Tải PDF ${item.declarationNumber}`,
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
              ariaLabel: `Sửa ${item.declarationNumber}`,
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
              ariaLabel: `Thu hồi ${item.declarationNumber}`,
              icon: <StopOutlined />,
              danger: true,
              hidden: !canEdit || item.status === LICENSE_STATUS.Revoked,
              onClick: () => setRevoking(item),
            },
            {
              key: "delete",
              label: "Xóa",
              ariaLabel: `Xóa ${item.declarationNumber}`,
              icon: <DeleteOutlined />,
              danger: true,
              hidden: !canDelete,
              confirm: "Xóa hồ sơ này?",
              onClick: () =>
                deleteMutation.mutate(item.id, {
                  onSuccess: () => void message.success("Đã xóa hồ sơ."),
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
              pagination.resetToFirstPage();
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
              pagination.resetToFirstPage();
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
              pagination.resetToFirstPage();
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
              pagination.resetToFirstPage();
            }}
          />
        </div>

        <Table
          rowKey="id"
          size="middle"
          scroll={{ x: 1000 }}
          loading={declarations.isFetching}
          columns={columns}
          dataSource={declarations.data?.items ?? []}
          onRow={(record) => ({
            onDoubleClick: () => setDetailRecord(record),
            style: { cursor: "pointer" },
          })}
          onChange={(_pagination, _filters, sorter) => handleSort(sorter)}
          pagination={pagination.buildConfig(
            declarations.data?.totalCount ?? 0,
          )}
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
              onError: (error) => void message.error(extractApiError(error)),
            },
          );
        }}
      />
    </div>
  );
}
