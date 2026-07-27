import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/axios";

export interface PublicBranding {
  homepageTitle?: string;
  homepageDescription?: string;
  contactPhone?: string;
  contactEmail?: string;
  contactAddress?: string;
  hasLogo: boolean;
  hasLoginBackground: boolean;
}

export const brandingLogoUrl = "/api/v1/public/branding/logo";
export const brandingLoginBackgroundUrl =
  "/api/v1/public/branding/login-background";

export function useBranding() {
  return useQuery({
    queryKey: ["public-branding"] as const,
    queryFn: async () => {
      const response = await api.get<PublicBranding>("/v1/public/branding");
      return response.data;
    },
    staleTime: 300_000,
    retry: false,
  });
}
