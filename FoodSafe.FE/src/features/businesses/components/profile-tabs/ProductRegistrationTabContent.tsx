import { type ReactNode, useCallback, useState } from "react";
import { App, Button } from "antd";
import { extractApiError } from "@/lib/apiError";
import { useCreateProductRegistration } from "@/features/product-registrations/api/productRegistrationMutations";
import { useProductRegistrationProducts } from "@/features/product-registrations/api/productRegistrationQueries";
import { ProductRegistrationEditorModal } from "@/features/product-registrations/components/ProductRegistrationEditorModal";

interface Props {
  businessId: string;
  businessName: string;
  businessCode?: string;
  children: ReactNode;
}

export function ProductRegistrationTabContent({
  businessId,
  businessName,
  businessCode,
  children,
}: Props) {
  const { message } = App.useApp();
  const [creating, setCreating] = useState(false);
  const createMutation = useCreateProductRegistration();
  const products = useProductRegistrationProducts(businessId);
  const onBusinessChange = useCallback(() => {}, []);

  return (
    <>
      <Button
        type="dashed"
        onClick={() => setCreating(true)}
        style={{ marginBottom: 12 }}
      >
        Thêm đăng ký công bố
      </Button>
      {children}
      <ProductRegistrationEditorModal
        open={creating}
        defaultBusinessId={businessId}
        businesses={[
          { id: businessId, name: businessName, code: businessCode },
        ]}
        products={products.data ?? []}
        productsLoading={products.isLoading}
        saving={createMutation.isPending}
        onBusinessChange={onBusinessChange}
        onCancel={() => setCreating(false)}
        onSubmit={(input) =>
          createMutation.mutate(input, {
            onSuccess: () => {
              setCreating(false);
              void message.success("Đã thêm đăng ký công bố");
            },
            onError: (error) => void message.error(extractApiError(error)),
          })
        }
      />
    </>
  );
}
