import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { api } from "@/lib/axios";

export interface PasswordPolicy {
  requiredLength: number;
  maxLength: number;
  requireDigit: boolean;
  requireLowercase: boolean;
  requireUppercase: boolean;
  requireNonAlphanumeric: boolean;
}

export const DEFAULT_PASSWORD_POLICY: PasswordPolicy = {
  requiredLength: 8,
  maxLength: 128,
  requireDigit: true,
  requireLowercase: true,
  requireUppercase: true,
  requireNonAlphanumeric: true,
};

export function usePasswordPolicy() {
  return useQuery({
    queryKey: ["public-password-policy"] as const,
    queryFn: async () => {
      const response = await api.get<PasswordPolicy>("/v1/public/password-policy");
      return response.data;
    },
    staleTime: 300_000,
    retry: false,
  });
}

export function passwordPolicySchema(policy: PasswordPolicy) {
  let schema = z
    .string()
    .min(policy.requiredLength, `Mật khẩu phải có tối thiểu ${policy.requiredLength} ký tự`)
    .max(policy.maxLength, `Mật khẩu không được vượt quá ${policy.maxLength} ký tự`);
  if (policy.requireLowercase) {
    schema = schema.regex(/[a-z]/, "Mật khẩu phải có chữ thường");
  }
  if (policy.requireUppercase) {
    schema = schema.regex(/[A-Z]/, "Mật khẩu phải có chữ hoa");
  }
  if (policy.requireDigit) {
    schema = schema.regex(/[0-9]/, "Mật khẩu phải có chữ số");
  }
  if (policy.requireNonAlphanumeric) {
    schema = schema.regex(/[^A-Za-z0-9]/, "Mật khẩu phải có ký tự đặc biệt");
  }
  return schema;
}

export function describePasswordPolicy(policy: PasswordPolicy): string {
  const parts: string[] = [];
  if (policy.requireLowercase) parts.push("chữ thường");
  if (policy.requireUppercase) parts.push("chữ hoa");
  if (policy.requireDigit) parts.push("số");
  if (policy.requireNonAlphanumeric) parts.push("ký tự đặc biệt");
  const requirement = parts.length > 0 ? `, gồm ${parts.join(", ")}` : "";
  return `Từ ${policy.requiredLength} đến ${policy.maxLength} ký tự${requirement}.`;
}
