import { type ReactNode, useCallback, useState } from "react";
import { App, Button } from "antd";
import { extractApiError } from "@/lib/apiError";
import { useCreateSelfDeclaration } from "@/features/self-declarations/api/selfDeclarationMutations";
import { useSelfDeclarationProducts } from "@/features/self-declarations/api/selfDeclarationQueries";
import { SelfDeclarationEditorModal } from "@/features/self-declarations/components/SelfDeclarationEditorModal";

interface Props {
  businessId: string;
  businessName: string;
  businessCode?: string;
  children: ReactNode;
}

export function SelfDeclarationTabContent({
  businessId,
  businessName,
  businessCode,
  children,
}: Props) {
  const { message } = App.useApp();
  const [creating, setCreating] = useState(false);
  const createMutation = useCreateSelfDeclaration();
  const products = useSelfDeclarationProducts(businessId);
  const onBusinessChange = useCallback(() => {}, []);

  return (
    <>
      <Button
        type="dashed"
        onClick={() => setCreating(true)}
        style={{ marginBottom: 12 }}
      >
        Thêm hồ sơ tự công bố
      </Button>
      {children}
      <SelfDeclarationEditorModal
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
              void message.success("Đã thêm hồ sơ tự công bố");
            },
            onError: (error) => void message.error(extractApiError(error)),
          })
        }
      />
    </>
  );
}
