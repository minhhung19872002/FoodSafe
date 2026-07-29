import { api } from "@/lib/axios";

export interface GeocodeAddressInput {
  street?: string;
  provinceId?: string;
  districtId?: string;
  communeId?: string;
}

export interface GeocodeResult {
  latitude: number;
  longitude: number;
  /** Address the provider matched, shown so the user can sanity-check it. */
  matchedAddress: string;
  /** Query the server actually sent, useful when a match looks wrong. */
  query: string;
}

const geocodingEndpoint = "/v1/app/geocoding";

export const geocodingApi = {
  /**
   * Resolves an address to coordinates. The server answers 204 when the
   * provider finds no match, which axios surfaces as an empty body — that is a
   * legitimate "not found", not an error.
   */
  async resolve(input: GeocodeAddressInput): Promise<GeocodeResult | null> {
    const response = await api.post<GeocodeResult | "">(
      `${geocodingEndpoint}/resolve`,
      input,
    );
    return response.status === 204 || !response.data ? null : response.data;
  },
};
