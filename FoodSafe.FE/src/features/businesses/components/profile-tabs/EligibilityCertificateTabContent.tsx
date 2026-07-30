import { type ReactNode, useState } from "react";
import { App, Button } from "antd";
import { extractApiError } from "@/lib/apiError";
import { useCreateEligibilityCertificate } from "@/features/eligibility-certificates/api/eligibilityCertificateMutations";
import { EligibilityCertificateEditorModal } from "@/features/eligibility-certificates/components/EligibilityCertificateEditorModal";

interface Props {
  businessId: string;
  businessName: string;
  businessCode?: string;
  children: ReactNode;
}

export function EligibilityCertificateTabContent({
  businessId,
  businessName,
  businessCode,
  children,
}: Props) {
  const { message } = App.useApp();
  const [creating, setCreating] = useState(false);
  const createMutation = useCreateEligibilityCertificate();

  return (
    <>
      <Button
        type="dashed"
        onClick={() => setCreating(true)}
        style={{ marginBottom: 12 }}
      >
        Cấp GCN đủ điều kiện
      </Button>
      {children}
      <EligibilityCertificateEditorModal
        open={creating}
        defaultBusinessId={businessId}
        businesses={[{ id: businessId, name: businessName, code: businessCode }]}
        saving={createMutation.isPending}
        onCancel={() => setCreating(false)}
        onSubmit={(input) =>
          createMutation.mutate(input, {
            onSuccess: () => {
              setCreating(false);
              void message.success("Đã thêm GCN đủ điều kiện");
            },
            onError: (error) => void message.error(extractApiError(error)),
          })
        }
      />
    </>
  );
}
