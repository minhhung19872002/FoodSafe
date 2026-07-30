import { type ReactNode, useCallback, useState } from "react";
import { App, Button } from "antd";
import { extractApiError } from "@/lib/apiError";
import { useCreateCfsCertificate } from "@/features/cfs-certificates/api/cfsCertificateMutations";
import {
  useCfsCertificateCountries,
  useCfsCertificateProducts,
} from "@/features/cfs-certificates/api/cfsCertificateQueries";
import { CfsCertificateEditorModal } from "@/features/cfs-certificates/components/CfsCertificateEditorModal";

interface Props {
  businessId: string;
  businessName: string;
  businessCode?: string;
  children: ReactNode;
}

export function CfsTabContent({
  businessId,
  businessName,
  businessCode,
  children,
}: Props) {
  const { message } = App.useApp();
  const [creating, setCreating] = useState(false);
  const createMutation = useCreateCfsCertificate();
  const products = useCfsCertificateProducts(businessId);
  const countries = useCfsCertificateCountries();
  const onBusinessChange = useCallback(() => {}, []);

  return (
    <>
      <Button
        type="dashed"
        onClick={() => setCreating(true)}
        style={{ marginBottom: 12 }}
      >
        Thêm giấy CFS
      </Button>
      {children}
      <CfsCertificateEditorModal
        open={creating}
        defaultBusinessId={businessId}
        businesses={[{ id: businessId, name: businessName, code: businessCode }]}
        products={products.data ?? []}
        countries={countries.data ?? []}
        productsLoading={products.isLoading}
        saving={createMutation.isPending}
        onBusinessChange={onBusinessChange}
        onCancel={() => setCreating(false)}
        onSubmit={(input) =>
          createMutation.mutate(input, {
            onSuccess: () => {
              setCreating(false);
              void message.success("Đã thêm giấy CFS");
            },
            onError: (error) => void message.error(extractApiError(error)),
          })
        }
      />
    </>
  );
}
