export const VSATTP_COMMITMENT_STATUS = {
  Submitted: 1,
  Confirmed: 2,
} as const;

export type VsattpCommitmentStatus =
  (typeof VSATTP_COMMITMENT_STATUS)[keyof typeof VSATTP_COMMITMENT_STATUS];

export const VSATTP_STATUS_CONFIG: Record<
  VsattpCommitmentStatus,
  { label: string; color: string }
> = {
  1: { label: "Đã nộp", color: "blue" },
  2: { label: "Đã xác nhận", color: "green" },
};

export interface VsattpCommitment {
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

export interface CreateVsattpCommitmentInput {
  businessId: string;
  commitmentDate: string;
  notes?: string;
}

export interface UpdateVsattpCommitmentInput {
  commitmentDate: string;
  notes?: string;
}

export interface VsattpCommitmentFilter {
  businessId?: string;
  organizationId?: string;
  status?: VsattpCommitmentStatus;
  skipCount?: number;
  maxResultCount?: number;
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
}
