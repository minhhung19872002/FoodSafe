export const ORGANIZATION_LEVEL = {
  Province: 1,
  District: 2,
  Commune: 3,
} as const;

export type OrganizationLevel =
  (typeof ORGANIZATION_LEVEL)[keyof typeof ORGANIZATION_LEVEL];

export interface OrganizationDto {
  id: string;
  parentId: string | null;
  code: string;
  name: string;
  level: OrganizationLevel;
  address: string | null;
  phone: string | null;
  email: string | null;
  leaderName: string | null;
  provinceId: string | null;
  districtId: string | null;
  communeId: string | null;
  isActive: boolean;
}

export interface OrganizationTreeNode {
  id: string;
  code: string;
  name: string;
  level: OrganizationLevel;
  isActive: boolean;
  children: OrganizationTreeNode[];
}

export interface OrganizationListResponse {
  totalCount: number;
  items: OrganizationDto[];
}

export interface OrganizationTreeResponse {
  items: OrganizationTreeNode[];
}

export interface OrganizationFilter {
  filter?: string;
  level?: OrganizationLevel;
  isActive?: boolean;
  skipCount: number;
  maxResultCount: number;
}

export interface CreateOrganizationInput {
  parentId: string | null;
  code: string;
  name: string;
  level: OrganizationLevel;
  address: string | null;
  phone: string | null;
  email: string | null;
  leaderName: string | null;
  provinceId: string | null;
  districtId: string | null;
  communeId: string | null;
}

export interface UpdateOrganizationInput extends CreateOrganizationInput {
  isActive: boolean;
}
