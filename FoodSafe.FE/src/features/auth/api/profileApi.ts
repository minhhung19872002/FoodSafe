import { api } from "@/lib/axios";

export interface UserProfile {
  userName: string;
  fullName: string;
  email: string;
  phoneNumber?: string;
  position?: string;
  department?: string;
  organizationName?: string;
  hasAvatar: boolean;
}

export interface UpdateUserProfileInput {
  fullName: string;
  phoneNumber?: string;
}

const endpoint = "/v1/app/profile";

export const profileApi = {
  async get(): Promise<UserProfile> {
    return (await api.get<UserProfile>(endpoint)).data;
  },
  async update(input: UpdateUserProfileInput): Promise<UserProfile> {
    return (await api.put<UserProfile>(endpoint, input)).data;
  },
  async uploadAvatar(file: File): Promise<void> {
    const form = new FormData();
    form.append("file", file);
    await api.post(`${endpoint}/avatar`, form);
  },
  async deleteAvatar(): Promise<void> {
    await api.delete(`${endpoint}/avatar`);
  },
};

export const avatarUrl = "/api/v1/app/profile/avatar";
