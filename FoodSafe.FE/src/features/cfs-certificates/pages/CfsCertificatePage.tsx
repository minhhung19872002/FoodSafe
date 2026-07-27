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
import { saveDownload } from "@/utils/download";

const PAGE_SIZE = 20;

export default function CfsCertificatePage() {
  const { message } = App.useApp();
  const hasPermission = useAuthStore((state) => state.hasPermission);
  const canCreate = hasPermission("FoodSafe.Licensing.CfsCertificates.Create");
  const canEdit = hasPermission("FoodSafe.Licensing.CfsCertificates.Edit");
  const canDelete = hasPermission("FoodSafe.Licensing.CfsCertificates.Delete");
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState("");
  const [businessId, setBusinessId] = useState<string>();
  const [destinationCountryId, setDestinationCountryId] = useState<string>();
  const [status, setStatus] = useState<LicenseStatus>();
  const [expiringWithinDays, setExpiringWithinDays] = useState<number>();
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<CfsCertificate>();
  const [editorBusinessId, setEditorBusinessId] = useState<string>();
  const [attachmentsFor, setAttachmentsFor] = useState<CfsCertificate>();
  const [revoking, setRevoking] = useState<CfsCertificate>();

  const queryFilter = {
    filter: filter || undefined,
    businessId,
    destinationCountryId,
    status,
    expiringWithinDays,
    skipCount: (page - 1) * PAGE_SIZE,
    maxResultCount: PAGE_SIZE,
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

  const closeEditor = () => {
    setEditorOpen(false);
    setEditing(undefined);
    setEditorBusinessId(undefined);
  };

  const save = (input: CfsCertificateInput) => {
    const options = {
      onSuccess: () => {
        void message.success("Đã lưu chứng nhận CFS.");
        closeEditor();
      },
      onError: () =>
        void message.error(
          "Không thể lưu. Vui lòng kiểm tra số CFS và dữ liệu.",
        ),
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
      title: "Quốc gia đích",
      dataIndex: "destinationCountryName",
      width: 155,
    },
    {
      title: "Ngày cấp",
      dataIndex: "issueDate",
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
      render: (s) => <StatusBadge status={s} />,
    },
    {
      title: "Thao tác",
      fixed: "right",
      width: 180,
      render: (_, item) => (
        <Space size={2}>
          <Button
            type="text"
            size="small"
            aria-label={`Tệp ${item.certificateNumber}`}
            icon={<FileTextOutlined />}
            onClick={() => setAttachmentsFor(item)}
          />
          <Button
            type="text"
            size="small"
            aria-label={`Tải PDF ${item.certificateNumber}`}
            icon={<FilePdfOutlined />}
            loading={pdfMutation.isPending && pdfMutation.variables === item.id}
            onClick={() =>
              pdfMutation.mutate(item.id, {
                onSuccess: (file) => saveDownload(file.blob, file.fileName),
                onError: () =>
                  void message.error("Không thể tải bản PDF chứng nhận CFS."),
              })
            }
          />
          {canEdit && item.status !== LICENSE_STATUS.Revoked && (
            <>
              <Button
                type="text"
                size="small"
                aria-label={`Sửa ${item.certificateNumber}`}
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
                aria-label={`Thu hồi ${item.certificateNumber}`}
                icon={<StopOutlined />}
                onClick={() => setRevoking(item)}
              />
            </>
          )}
          {canDelete && (
            <Popconfirm
              title="Xóa chứng nhận CFS này?"
              description="Số CFS được giữ trong lịch sử và không thể dùng lại."
              okText="Xóa"
              cancelText="Hủy"
              onConfirm={() =>
                deleteMutation.mutate(item.id, {
                  onSuccess: () =>
                    void message.success("Đã xóa chứng nhận CFS."),
                  onError: () =>
                    void message.error("Không thể xóa chứng nhận CFS."),
                })
              }
            >
              <Button
                type="text"
                size="small"
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
                Thêm CFS
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
              placeholder="Tìm theo số CFS"
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
        </div>

        <Table
          rowKey="id"
          size="middle"
          scroll={{ x: 1350 }}
          loading={registrations.isLoading}
          columns={columns}
          dataSource={registrations.data?.items ?? []}
          pagination={{
            current: page,
            pageSize: PAGE_SIZE,
            total: registrations.data?.totalCount ?? 0,
            showSizeChanger: false,
            showTotal: (total) => `Tổng ${total} bản ghi`,
            onChange: setPage,
          }}
        />
      </div>

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
              onError: () =>
                void message.error("Không thể thu hồi chứng nhận CFS."),
            },
          );
        }}
      />
    </div>
  );
}
