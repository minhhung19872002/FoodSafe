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
import { ProductRegistrationAttachmentsModal } from "@/features/product-registrations/components/ProductRegistrationAttachmentsModal";
import { ExpiryTag } from "@/components/ExpiryTag";
import { PageHeader } from "@/components/PageHeader";
import { RecordDetailDrawer } from "@/components/RecordDetailDrawer";
import { RevokeModal } from "@/components/RevokeModal";
import { StatusBadge } from "@/components/StatusBadge";
import { saveDownload } from "@/utils/download";
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

const PAGE_SIZE = 20;

export default function AdvertisementRegistrationPage() {
  const { message } = App.useApp();
  const hasPermission = useAuthStore((state) => state.hasPermission);
  const canCreate = hasPermission("FoodSafe.Licensing.AdRegistrations.Create");
  const canEdit = hasPermission("FoodSafe.Licensing.AdRegistrations.Edit");
  const canDelete = hasPermission("FoodSafe.Licensing.AdRegistrations.Delete");
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState("");
  const [businessId, setBusinessId] = useState<string>();
  const [advertisementTypeId, setAdvertisementTypeId] = useState<string>();
  const [status, setStatus] = useState<LicenseStatus>();
  const [expiringWithinDays, setExpiringWithinDays] = useState<number>();
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<AdvertisementRegistration>();
  const [editorBusinessId, setEditorBusinessId] = useState<string>();
  const [attachmentsFor, setAttachmentsFor] =
    useState<AdvertisementRegistration>();
  const [revoking, setRevoking] = useState<AdvertisementRegistration>();
  const [detailRecord, setDetailRecord] =
    useState<AdvertisementRegistration | null>(null);

  const queryFilter = {
    filter: filter || undefined,
    businessId,
    advertisementTypeId,
    status,
    expiringWithinDays,
    skipCount: (page - 1) * PAGE_SIZE,
    maxResultCount: PAGE_SIZE,
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

  const closeEditor = () => {
    setEditorOpen(false);
    setEditing(undefined);
    setEditorBusinessId(undefined);
  };

  const save = (input: AdvertisementRegistrationInput) => {
    const options = {
      onSuccess: () => {
        void message.success("Đã lưu đăng ký quảng cáo.");
        closeEditor();
      },
      onError: () =>
        void message.error("Không thể lưu đăng ký. Vui lòng kiểm tra dữ liệu."),
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
      width: 180,
      render: (_, item) => (
        <Space size={2}>
          <Button
            size="small"
            type="text"
            aria-label={`Tệp ${item.registrationNumber}`}
            icon={<FileTextOutlined />}
            onClick={() => setAttachmentsFor(item)}
          />
          {canEdit && item.status !== LICENSE_STATUS.Revoked && (
            <>
              <Button
                size="small"
                type="text"
                aria-label={`Sửa ${item.registrationNumber}`}
                icon={<EditOutlined />}
                onClick={() => {
                  setEditing(item);
                  setEditorBusinessId(item.businessId);
                  setEditorOpen(true);
                }}
              />
              <Button
                size="small"
                type="text"
                danger
                aria-label={`Thu hồi ${item.registrationNumber}`}
                icon={<StopOutlined />}
                onClick={() => setRevoking(item)}
              />
            </>
          )}
          {canDelete && (
            <Popconfirm
              title="Xóa đăng ký này?"
              description="Số đăng ký vẫn được giữ và không thể dùng lại."
              okText="Xóa"
              cancelText="Hủy"
              onConfirm={() =>
                deleteMutation.mutate(item.id, {
                  onSuccess: () => void message.success("Đã xóa đăng ký."),
                  onError: () => void message.error("Không thể xóa đăng ký."),
                })
              }
            >
              <Button
                size="small"
                type="text"
                danger
                aria-label={`Xóa ${item.registrationNumber}`}
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
            style={{ width: 250 }}
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
            placeholder="Loại quảng cáo"
            style={{ width: 190 }}
            options={(types.data ?? []).map((x) => ({
              value: x.id,
              label: x.name,
            }))}
            onChange={(value) => {
              setAdvertisementTypeId(value);
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
          pagination={{
            current: page,
            pageSize: PAGE_SIZE,
            total: registrations.data?.totalCount ?? 0,
            showSizeChanger: false,
            showTotal: (total) => `${total} bản ghi`,
            onChange: setPage,
          }}
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
              onError: () => void message.error("Không thể thu hồi."),
            },
          );
        }}
      />
    </div>
  );
}
