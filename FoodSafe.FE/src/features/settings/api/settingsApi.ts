import { api } from "@/lib/axios";
import type {
  BrandingImageKind,
  SystemSettings,
  UpdateSystemSettingsInput,
} from "../types/settings.types";

const endpoint = "/v1/app/system-settings";

export const settingsApi = {
  async get(): Promise<SystemSettings> {
    const response = await api.get<SystemSettings>(endpoint);
    return response.data;
  },

  async update(input: UpdateSystemSettingsInput): Promise<SystemSettings> {
    const response = await api.put<SystemSettings>(endpoint, input);
    return response.data;
  },

  async uploadImage(kind: BrandingImageKind, file: File): Promise<void> {
    const form = new FormData();
    form.append("file", file);
    await api.post(`${endpoint}/${kind}`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  async deleteImage(kind: BrandingImageKind): Promise<void> {
    await api.delete(`${endpoint}/${kind}`);
  },
};
