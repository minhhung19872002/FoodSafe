import { useState } from "react";
import { App } from "antd";
import { useAuthStore } from "@/features/auth/store/authStore";
import { useDeleteCatalog, useSaveCatalog } from "../api/catalogMutations";
import { useCatalog, useCatalogOptions } from "../api/catalogQueries";
import { CatalogEditorModal } from "../components/CatalogEditorModal";
import { MasterCatalogView } from "../components/MasterCatalogView";
import type {
  CatalogInput,
  CatalogItem,
  CatalogKind,
} from "../types/catalog.types";

export default function MasterCatalogPage() {
  const { message } = App.useApp();
  const [kind, setKind] = useState<CatalogKind>("country");
  const [filter, setFilter] = useState("");
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

  const catalog = useCatalog(kind, { filter, maxResultCount: 100 });
  const productGroups = useCatalogOptions("product-group");
  const testingCenters = useCatalogOptions("testing-center");
  const saveCatalog = useSaveCatalog(kind);
  const deleteCatalog = useDeleteCatalog(kind);

  const handleSave = (input: CatalogInput) => {
    saveCatalog.mutate(
      { input, id: editing?.id },
      {
        onSuccess: () => {
          setEditing(undefined);
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
    <>
      <MasterCatalogView
        kind={kind}
        filter={filter}
        items={catalog.data?.items ?? []}
        totalCount={catalog.data?.totalCount ?? 0}
        loading={catalog.isLoading}
        deleting={deleteCatalog.isPending}
        canCreate={canCreate}
        canEdit={canEdit}
        canDelete={canDelete}
        onKindChange={(nextKind) => {
          setKind(nextKind);
          setFilter("");
        }}
        onFilterChange={setFilter}
        onCreate={() => setEditing(null)}
        onEdit={setEditing}
        onDelete={handleDelete}
      />
      <CatalogEditorModal
        kind={kind}
        item={editing ?? undefined}
        productGroups={productGroups.data?.items ?? []}
        testingCenters={testingCenters.data?.items ?? []}
        open={editing !== undefined}
        saving={saveCatalog.isPending}
        onCancel={() => setEditing(undefined)}
        onSave={handleSave}
      />
    </>
  );
}
