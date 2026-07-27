import { useMutation } from "@tanstack/react-query";
import { publicPortalApi } from "./publicPortalApi";
import type { AlertReportInput } from "../types/publicPortal.types";

export function useSubmitAlertReport() {
  return useMutation({
    mutationFn: (input: AlertReportInput) =>
      publicPortalApi.submitAlertReport(input),
  });
}

export function useSubmitNewsReport() {
  return useMutation({
    mutationFn: (input: {
      title: string;
      content: string;
      reporterName?: string;
      reporterContact?: string;
      captchaToken: string;
    }) => publicPortalApi.submitNewsReport(input),
  });
}
