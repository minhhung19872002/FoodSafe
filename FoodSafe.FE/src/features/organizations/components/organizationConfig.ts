import type { OrganizationLevel } from "../types/organization.types";

interface OrganizationLevelDisplay {
  label: string;
  color: string;
}

export const organizationLevelConfig: Record<
  OrganizationLevel,
  OrganizationLevelDisplay
> = {
  1: { label: "Tỉnh", color: "blue" },
  2: { label: "Xã/Phường", color: "green" },
};

const unknownOrganizationLevelConfig: OrganizationLevelDisplay = {
  label: "Không xác định",
  color: "default",
};

export function getOrganizationLevelConfig(
  level: unknown,
): OrganizationLevelDisplay {
  if (
    typeof level !== "number" ||
    !Object.prototype.hasOwnProperty.call(organizationLevelConfig, level)
  ) {
    return unknownOrganizationLevelConfig;
  }

  return organizationLevelConfig[level as OrganizationLevel];
}
