import { api } from "@/lib/axios";
import type {
  CreateVsattpCommitmentInput,
  PagedResult,
  UpdateVsattpCommitmentInput,
  VsattpCommitment,
  VsattpCommitmentFilter,
} from "../types/vsattpCommitment.types";

const endpoint = "/v1/app/vsattp-commitment";

export const vsattpCommitmentApi = {
  async list(
    filter: VsattpCommitmentFilter,
  ): Promise<PagedResult<VsattpCommitment>> {
    return (
      await api.get<PagedResult<VsattpCommitment>>(endpoint, {
        params: filter,
      })
    ).data;
  },

  async create(input: CreateVsattpCommitmentInput): Promise<VsattpCommitment> {
    return (await api.post<VsattpCommitment>(endpoint, input)).data;
  },

  async update(
    id: string,
    input: UpdateVsattpCommitmentInput,
  ): Promise<VsattpCommitment> {
    return (await api.put<VsattpCommitment>(`${endpoint}/${id}`, input)).data;
  },

  async delete(id: string) {
    await api.delete(`${endpoint}/${id}`);
  },

  async confirm(id: string): Promise<VsattpCommitment> {
    return (await api.post<VsattpCommitment>(`${endpoint}/${id}/confirm`)).data;
  },
};
