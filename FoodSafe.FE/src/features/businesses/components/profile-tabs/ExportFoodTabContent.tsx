import { type ReactNode, useCallback, useState } from "react";
import { App, Button } from "antd";
import { extractApiError } from "@/lib/apiError";
import { useCreateExportFoodCertificate } from "@/features/export-food-certificates/api/exportFoodCertificateMutations";
import {
  useExportFoodCertificateCountries,
  useExportFoodCertificateProducts,
} from "@/features/export-food-certificates/api/exportFoodCertificateQueries";
import { ExportFoodCertificateEditorModal } from "@/features/export-food-certificates/components/ExportFoodCertificateEditorModal";

interface Props {
  businessId: string;
  businessName: string;
  businessCode?: string;
  children: ReactNode;
}

export function ExportFoodTabContent({
  businessId,
  businessName,
  businessCode,
  children,
}: Props) {
  const { message } = App.useApp();
  const [creating, setCreating] = useState(false);
  const createMutation = useCreateExportFoodCertificate();
  const products = useExportFoodCertificateProducts(businessId);
  const countries = useExportFoodCertificateCountries();
  const onBusinessChange = useCallback(() => {}, []);

  return (
    <>
      <Button
        type="dashed"
        onClick={() => setCreating(true)}
        style={{ marginBottom: 12 }}
      >
        Thêm GCN xuất khẩu
      </Button>
      {children}
      <ExportFoodCertificateEditorModal
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
              void message.success("Đã thêm GCN xuất khẩu");
            },
            onError: (error) => void message.error(extractApiError(error)),
          })
        }
      />
    </>
  );
}
