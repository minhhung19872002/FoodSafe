import { type ReactNode, useState } from "react";
import { App, Button } from "antd";
import { extractApiError } from "@/lib/apiError";
import { useCatalogOptions } from "@/features/catalogs/api/catalogQueries";
import { useCreateProduct } from "../../api/businessMutations";
import { useProductBusinessOptions } from "../../api/businessQueries";
import { ProductEditorModal } from "../ProductEditorModal";
import type { ProductInput } from "../../types/business.types";

interface Props {
  businessId: string;
  children: ReactNode;
}

export function ProductTabContent({ businessId, children }: Props) {
  const { message } = App.useApp();
  const [creating, setCreating] = useState(false);
  const createMutation = useCreateProduct();
  const businesses = useProductBusinessOptions();
  const productGroups = useCatalogOptions("product-group");
  const countries = useCatalogOptions("country");

  return (
    <>
      <Button
        type="dashed"
        onClick={() => setCreating(true)}
        style={{ marginBottom: 12 }}
      >
        Thêm sản phẩm
      </Button>
      {children}
      <ProductEditorModal
        open={creating}
        defaultBusinessId={businessId}
        businesses={businesses.data ?? []}
        productGroups={productGroups.data?.items ?? []}
        countries={countries.data?.items ?? []}
        submitting={createMutation.isPending}
        onCancel={() => setCreating(false)}
        onSubmit={(input) =>
          createMutation.mutate(input as ProductInput, {
            onSuccess: () => {
              setCreating(false);
              void message.success("Đã thêm sản phẩm");
            },
            onError: (error) => void message.error(extractApiError(error)),
          })
        }
      />
    </>
  );
}
