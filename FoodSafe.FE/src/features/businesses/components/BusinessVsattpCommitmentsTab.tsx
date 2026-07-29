import { CheckOutlined } from "@ant-design/icons";
import { App, Button, Space, Table, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/features/auth/store/authStore";
import { api } from "@/lib/axios";
import { extractApiError } from "@/lib/apiError";
import { formatDate } from "@/utils/format";

// ── Inlined types (cross-feature imports are forbidden) ──────────────────────

const VSATTP_COMMITMENT_STATUS = {
  Submitted: 1,
  Confirmed: 2,
} as const;

type VsattpCommitmentStatus =
  (typeof VSATTP_COMMITMENT_STATUS)[keyof typeof VSATTP_COMMITMENT_STATUS];

const VSATTP_STATUS_CONFIG: Record<
  VsattpCommitmentStatus,
  { label: string; color: string }
> = {
  1: { label: "Đã nộp", color: "blue" },
  2: { label: "Đã xác nhận", color: "green" },
};

interface VsattpCommitment {
  id: string;
  businessId: string;
  organizationId: string;
  commitmentDate: string;
  notes?: string;
  status: VsattpCommitmentStatus;
  confirmedByUserId?: string;
  confirmedAt?: string;
  creationTime: string;
}

interface PagedResult<T> {
  items: T[];
  totalCount: number;
}

// ── Internal API helpers ─────────────────────────────────────────────────────

const ENDPOINT = "/v1/app/vsattp-commitment";

async function fetchCommitments(
  businessId: string,
): Promise<PagedResult<VsattpCommitment>> {
  return (
    await api.get<PagedResult<VsattpCommitment>>(ENDPOINT, {
      params: { businessId, skipCount: 0, maxResultCount: 100 },
    })
  ).data;
}

async function confirmCommitment(id: string): Promise<VsattpCommitment> {
  return (await api.post<VsattpCommitment>(`${ENDPOINT}/${id}/confirm`)).data;
}

// ── Component ────────────────────────────────────────────────────────────────

interface Props {
  businessId: string;
  organizationId: string;
}

export function BusinessVsattpCommitmentsTab({
  businessId,
  organizationId: _organizationId,
}: Props) {
  const { message, modal } = App.useApp();
  const queryClient = useQueryClient();
  const canConfirm = useAuthStore((s) =>
    s.hasPermission("FoodSafe.Licensing.VsattpCommitments.Confirm"),
  );

  const queryKey = ["business-vsattp-commitments", businessId] as const;

  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: () => fetchCommitments(businessId),
  });

  const confirmMutation = useMutation({
    mutationFn: confirmCommitment,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey });
    },
  });

  function handleConfirm(record: VsattpCommitment) {
    modal.confirm({
      title: "Xác nhận cam kết VSATTP",
      content: `Xác nhận cam kết VSATTP ngày ${formatDate(record.commitmentDate)}? Hành động này không thể hoàn tác.`,
      okText: "Xác nhận",
      cancelText: "Hủy",
      onOk: async () => {
        try {
          await confirmMutation.mutateAsync(record.id);
          message.success("Xác nhận cam kết thành công");
        } catch (err) {
          message.error(extractApiError(err));
        }
      },
    });
  }

  const columns: ColumnsType<VsattpCommitment> = [
    {
      title: "Ngày cam kết",
      dataIndex: "commitmentDate",
      width: 130,
      render: (v: string) => formatDate(v),
    },
    {
      title: "Ghi chú",
      dataIndex: "notes",
      render: (v?: string) => v ?? "—",
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      width: 130,
      render: (v: VsattpCommitmentStatus) => {
        const cfg = VSATTP_STATUS_CONFIG[v];
        return <Tag color={cfg.color}>{cfg.label}</Tag>;
      },
    },
    {
      title: "Ngày xác nhận",
      dataIndex: "confirmedAt",
      width: 130,
      render: (v?: string) => (v ? formatDate(v) : "—"),
    },
    ...(canConfirm
      ? ([
          {
            title: "Thao tác",
            key: "actions",
            width: 110,
            render: (_: unknown, record: VsattpCommitment) => {
              const isSubmitted =
                record.status === VSATTP_COMMITMENT_STATUS.Submitted;
              if (!isSubmitted) return null;
              return (
                <Space size="small">
                  <Button
                    type="link"
                    size="small"
                    icon={<CheckOutlined />}
                    loading={confirmMutation.isPending}
                    onClick={() => handleConfirm(record)}
                  >
                    Xác nhận
                  </Button>
                </Space>
              );
            },
          },
        ] satisfies ColumnsType<VsattpCommitment>)
      : []),
  ];

  return (
    <Table
      rowKey="id"
      size="small"
      loading={isLoading}
      columns={columns}
      dataSource={data?.items}
      pagination={false}
    />
  );
}
