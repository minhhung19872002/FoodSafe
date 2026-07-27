import { useMutation } from "@tanstack/react-query";
import { publicPortalApi } from "./publicPortalApi";
import type { AlertReportInput } from "../types/publicPortal.types";

export function useSubmitAlertReport() {
  return useMutation({
    mutationFn: (input: AlertReportInput) =>
      publicPortalApi.submitAlertReport(input),
  });
}
