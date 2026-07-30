import { useState } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { useProvinces } from "@/hooks/useGeography";
import { useTablePagination } from "@/hooks/useTablePagination";
import { App, Tag } from "antd";
import { useMutation } from "@tanstack/react-query";
import dayjs from "dayjs";
import { PageHeader } from "@/components/PageHeader";
import {
  RecordDetailDrawer,
  type DetailField,
} from "@/components/RecordDetailDrawer";
import { saveDownload } from "@/utils/download";
import { extractApiError } from "@/lib/apiError";
import { useAuthStore } from "@/features/auth/store/authStore";
import { exportTestingServices } from "../api/catalogApi";
import { useDeleteCatalog, useSaveCatalog } from "../api/catalogMutations";
import { useCatalog, useCatalogOptions } from "../api/catalogQueries";
import { CatalogEditorModal } from "../components/CatalogEditorModal";
import { MasterCatalogView } from "../components/MasterCatalogView";
import type {
  CatalogInput,
  CatalogItem,
  CatalogKind,
} from "../types/catalog.types";

const riskLevelLabels = ["", "Cao", "Trung bình", "Thấp"];

export default function MasterCatalogPage() {
  const { message } = App.useApp();
  const [kind, setKind] = useState<CatalogKind>("country");
  const [filter, setFilter] = useState("");
  const debouncedFilter = useDebounce(filter);
  const pagination = useTablePagination(20);
  const [productGroupSearch, setProductGroupSearch] = useState("");
  const [testingCenterSearch, setTestingCenterSearch] = useState("");
  const [editing, setEditing] = useState<CatalogItem | null | undefined>();
  const [detailItem, setDetailItem] = useState<CatalogItem | null>(null);
  const canCreate = useAuthStore((state) =>
    state.hasPermission("FoodSafe.Catalogs.Create"),
  );
  const canEdit = useAuthStore((state) =>
    state.hasPermission("FoodSafe.Catalogs.Edit"),
  );
  const canDelete = useAuthStore((state) =>
    state.hasPermission("FoodSafe.Catalogs.Delete"),
  );

  const catalog = useCatalog(kind, {
    filter: debouncedFilter || undefined,
    skipCount: pagination.skipCount,
    maxResultCount: pagination.maxResultCount,
  });
  const productGroups = useCatalogOptions("product-group", productGroupSearch);
  const testingCenters = useCatalogOptions(
    "testing-center",
    testingCenterSearch,
  );
  const provinces = useProvinces();
  const saveCatalog = useSaveCatalog(kind);
  const deleteCatalog = useDeleteCatalog(kind);
  const exportServices = useMutation({
    mutationFn: () => exportTestingServices(filter),
  });

  const closeEditor = () => {
    setEditing(undefined);
    setProductGroupSearch("");
    setTestingCenterSearch("");
  };

  const handleSave = (input: CatalogInput) => {
    saveCatalog.mutate(
      { input, id: editing?.id },
      {
        onSuccess: () => {
          closeEditor();
          void message.success("Đã lưu dữ liệu danh mục");
        },
        // Máy chủ trả về lý do cụ thể ("Mã danh mục đã tồn tại."...) — hiển
        // thị nguyên văn thay vì một câu chung chung (UIA-007).
        onError: (error) => void message.error(extractApiError(error)),
      },
    );
  };

  const handleDelete = (id: string) => {
    deleteCatalog.mutate(id, {
      onSuccess: () => void message.success("Đã xóa dữ liệu danh mục"),
      onError: (error) => void message.error(extractApiError(error)),
    });
  };

  const detailFields: DetailField<CatalogItem>[] = [
    { label: "Mã", render: (r) => r.code },
    { label: "Tên", render: (r) => r.name },
    ...(kind === "country"
      ? ([
          { label: "Mã Alpha-2", render: (r) => r.codeAlpha2 },
          { label: "Mã Alpha-3", render: (r) => r.codeAlpha3 },
          { label: "Tên tiếng Việt", render: (r) => r.nameVi },
          { label: "Tên tiếng Anh", render: (r) => r.nameEn },
        ] satisfies DetailField<CatalogItem>[])
      : []),
    ...(kind === "product-group"
      ? ([
          { label: "Cấp", render: (r) => r.level },
          {
            label: "Nhóm cha",
            render: (r) =>
              productGroups.data?.items.find((item) => item.id === r.parentId)
                ?.name,
          },
        ] satisfies DetailField<CatalogItem>[])
      : []),
    ...(kind === "business-classification"
      ? ([
          {
            label: "Mức rủi ro",
            render: (r) =>
              r.riskLevel !== undefined ? riskLevelLabels[r.riskLevel] : null,
          },
          { label: "Tiêu chí", render: (r) => r.criteria, span: 2 },
        ] satisfies DetailField<CatalogItem>[])
      : []),
    ...(kind === "testing-center"
      ? ([
          { label: "Địa chỉ", render: (r) => r.address, span: 2 },
          { label: "Người liên hệ", render: (r) => r.contactPerson },
          { label: "Điện thoại", render: (r) => r.phone },
          { label: "Email", render: (r) => r.email },
          { label: "Số công nhận", render: (r) => r.accreditationNumber },
          {
            label: "Hết hạn công nhận",
            render: (r) =>
              r.accreditationExpiresAt
                ? dayjs(r.accreditationExpiresAt).format("DD/MM/YYYY")
                : null,
          },
          {
            label: "Phạm vi công nhận",
            render: (r) => r.accreditationScope,
            span: 2,
          },
        ] satisfies DetailField<CatalogItem>[])
      : []),
    ...(kind === "testing-service"
      ? ([
          {
            label: "Trung tâm kiểm nghiệm",
            render: (r) =>
              testingCenters.data?.items.find(
                (item) => item.id === r.testingCenterId,
              )?.name,
          },
          { label: "Đơn vị tính", render: (r) => r.unit },
          { label: "Phương pháp", render: (r) => r.method },
          {
            label: "Đơn giá",
            render: (r) => r.price?.toLocaleString("vi-VN"),
          },
          {
            label: "Thời gian trả kết quả",
            render: (r) =>
              r.turnaroundDays !== undefined
                ? `${r.turnaroundDays} ngày`
                : null,
          },
        ] satisfies DetailField<CatalogItem>[])
      : []),
    { label: "Mô tả", render: (r) => r.description, span: 2 },
    { label: "Thứ tự", render: (r) => r.sortOrder },
    {
      label: "Trạng thái",
      render: (r) => (
        <Tag color={r.isActive ? "success" : "default"}>
          {r.isActive ? "Hoạt động" : "Ngừng"}
        </Tag>
      ),
    },
  ];

  return (
    <div className="page-container">
      <PageHeader
        title="Danh mục dùng chung"
        subtitle="Quản lý các danh mục hệ thống: loại hình, nhóm sản phẩm, trung tâm kiểm nghiệm"
      />
      <div className="page-card">
        <MasterCatalogView
          kind={kind}
          filter={filter}
          items={catalog.data?.items ?? []}
          pagination={pagination.buildConfig(catalog.data?.totalCount)}
          loading={catalog.isFetching}
          deleting={deleteCatalog.isPending}
          canCreate={canCreate}
          canEdit={canEdit}
          canDelete={canDelete}
          productGroupOptions={productGroups.data?.items ?? []}
          testingCenterOptions={testingCenters.data?.items ?? []}
          provinceOptions={(provinces.data?.items ?? []).map((item) => ({
            id: item.id,
            name: item.name,
          }))}
          onKindChange={(nextKind) => {
            setKind(nextKind);
            setFilter("");
            pagination.resetToFirstPage();
            setDetailItem(null);
          }}
          exporting={exportServices.isPending}
          onFilterChange={(nextFilter) => {
            setFilter(nextFilter);
            pagination.resetToFirstPage();
          }}
          onCreate={() => setEditing(null)}
          onEdit={setEditing}
          onShowDetail={setDetailItem}
          onDelete={handleDelete}
          onExport={() =>
            exportServices.mutate(undefined, {
              onSuccess: (file) => saveDownload(file.blob, file.fileName),
              onError: () =>
                void message.error("Không thể xuất danh sách dịch vụ."),
            })
          }
        />
      </div>
      <RecordDetailDrawer
        title="Chi tiết danh mục"
        record={detailItem}
        onClose={() => setDetailItem(null)}
        fields={detailFields}
      />
      <CatalogEditorModal
        kind={kind}
        item={editing ?? undefined}
        productGroups={productGroups.data?.items ?? []}
        testingCenters={testingCenters.data?.items ?? []}
        open={editing !== undefined}
        saving={saveCatalog.isPending}
        onProductGroupSearch={setProductGroupSearch}
        onTestingCenterSearch={setTestingCenterSearch}
        onCancel={closeEditor}
        onSave={handleSave}
      />
    </div>
  );
}
