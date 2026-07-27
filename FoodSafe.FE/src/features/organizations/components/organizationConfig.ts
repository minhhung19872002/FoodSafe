import type { OrganizationLevel } from "../types/organization.types";

export const organizationLevelConfig: Record<
  OrganizationLevel,
  { label: string; color: string }
> = {
  1: { label: "Tỉnh", color: "blue" },
  2: { label: "Huyện/TP", color: "cyan" },
  3: { label: "Xã/Phường", color: "green" },
};
