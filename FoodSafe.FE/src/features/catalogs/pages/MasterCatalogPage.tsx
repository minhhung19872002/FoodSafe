import { useState } from "react";
import { App } from "antd";
import { useMutation } from "@tanstack/react-query";
import { PageHeader } from "@/components/PageHeader";
import { saveDownload } from "@/utils/download";
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

const defaultPageSize = 20;

export default function MasterCatalogPage() {
  const { message } = App.useApp();
  const [kind, setKind] = useState<CatalogKind>("country");
  const [filter, setFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);
  const [productGroupSearch, setProductGroupSearch] = useState("");
  const [testingCenterSearch, setTestingCenterSearch] = useState("");
  const [editing, setEditing] = useState<CatalogItem | null | undefined>();
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
    filter: filter || undefined,
    skipCount: (page - 1) * pageSize,
    maxResultCount: pageSize,
  });
  const productGroups = useCatalogOptions("product-group", productGroupSearch);
  const testingCenters = useCatalogOptions(
    "testing-center",
    testingCenterSearch,
  );
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
        onError: () =>
          void message.error(
            "Không thể lưu. Vui lòng kiểm tra mã và dữ liệu liên quan.",
          ),
      },
    );
  };

  const handleDelete = (id: string) => {
    deleteCatalog.mutate(id, {
      onSuccess: () => void message.success("Đã xóa dữ liệu danh mục"),
      onError: () =>
        void message.error("Không thể xóa dữ liệu đang được sử dụng."),
    });
  };

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
          totalCount={catalog.data?.totalCount ?? 0}
          page={page}
          pageSize={pageSize}
          loading={catalog.isFetching}
          deleting={deleteCatalog.isPending}
          canCreate={canCreate}
          canEdit={canEdit}
          canDelete={canDelete}
          onKindChange={(nextKind) => {
            setKind(nextKind);
            setFilter("");
            setPage(1);
          }}
          exporting={exportServices.isPending}
          onFilterChange={(nextFilter) => {
            setFilter(nextFilter);
            setPage(1);
          }}
          onPageChange={(nextPage, nextPageSize) => {
            setPage(nextPage);
            setPageSize(nextPageSize);
          }}
          onCreate={() => setEditing(null)}
          onEdit={setEditing}
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
