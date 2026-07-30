import { type ReactNode, useCallback, useState } from "react";
import { App, Button } from "antd";
import { extractApiError } from "@/lib/apiError";
import { useCreateAdvertisementRegistration } from "@/features/advertisement-registrations/api/advertisementRegistrationMutations";
import {
  useAdvertisementProducts,
  useAdvertisementTypes,
} from "@/features/advertisement-registrations/api/advertisementRegistrationQueries";
import { AdvertisementRegistrationEditorModal } from "@/features/advertisement-registrations/components/AdvertisementRegistrationEditorModal";

interface Props {
  businessId: string;
  businessName: string;
  businessCode?: string;
  children: ReactNode;
}

export function AdvertisementTabContent({
  businessId,
  businessName,
  businessCode,
  children,
}: Props) {
  const { message } = App.useApp();
  const [creating, setCreating] = useState(false);
  const createMutation = useCreateAdvertisementRegistration();
  const products = useAdvertisementProducts(businessId);
  const adTypes = useAdvertisementTypes();
  const onBusinessChange = useCallback(() => {}, []);

  return (
    <>
      <Button
        type="dashed"
        onClick={() => setCreating(true)}
        style={{ marginBottom: 12 }}
      >
        Thêm đăng ký quảng cáo
      </Button>
      {children}
      <AdvertisementRegistrationEditorModal
        open={creating}
        defaultBusinessId={businessId}
        businesses={[
          { id: businessId, name: businessName, code: businessCode },
        ]}
        products={products.data ?? []}
        types={adTypes.data ?? []}
        productsLoading={products.isLoading}
        saving={createMutation.isPending}
        onBusinessChange={onBusinessChange}
        onCancel={() => setCreating(false)}
        onSubmit={(input) =>
          createMutation.mutate(input, {
            onSuccess: () => {
              setCreating(false);
              void message.success("Đã thêm đăng ký quảng cáo");
            },
            onError: (error) => void message.error(extractApiError(error)),
          })
        }
      />
    </>
  );
}
