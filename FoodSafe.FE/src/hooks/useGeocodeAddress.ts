import { useMutation } from "@tanstack/react-query";
import { geocodingApi } from "@/lib/geocodingApi";

/**
 * Resolves the address typed into a form into map coordinates.
 * Deliberately a mutation rather than a query: it runs when the user asks for
 * it, not on every keystroke, which keeps the upstream provider inside its
 * rate limit.
 */
export function useGeocodeAddress() {
  return useMutation({ mutationFn: geocodingApi.resolve });
}
