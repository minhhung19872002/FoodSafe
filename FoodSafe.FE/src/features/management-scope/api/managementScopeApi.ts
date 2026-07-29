import { api } from "@/lib/axios";
import type {
  CreateDataScopeAssignmentInput,
  DataScopeAssignment,
  DataScopeAssignmentListInput,
  PagedResult,
} from "../types/managementScope.types";

const endpoint = "/v1/data-scope-assignments";

export const managementScopeApi = {
  getAssignments: (
    params: DataScopeAssignmentListInput,
  ): Promise<PagedResult<DataScopeAssignment>> =>
    api
      .get<PagedResult<DataScopeAssignment>>(endpoint, { params })
      .then((r) => r.data),

  createAssignment: (
    input: CreateDataScopeAssignmentInput,
  ): Promise<DataScopeAssignment> =>
    api
      .post<DataScopeAssignment>(endpoint, input)
      .then((r) => r.data),

  deleteAssignment: (id: string): Promise<void> =>
    api.delete(`${endpoint}/${id}`).then(() => undefined),
};
