import axios from "axios";
import { useAuthStore } from "@/features/auth/store/authStore";

export const api = axios.create({
  baseURL: "/api",
  withCredentials: true,
  xsrfCookieName: "XSRF-TOKEN",
  xsrfHeaderName: "RequestVerificationToken",
  headers: {
    "Content-Type": "application/json",
    // The interface is Vietnamese-only, so server messages must be too. Without
    // this the culture follows the browser and an English-locale Chrome gets
    // English business errors back.
    "Accept-Language": "vi",
  },
});

api.interceptors.request.use((config) => {
  if (config.data instanceof FormData) {
    config.headers.set("Content-Type", false);
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().clearAuth();
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  },
);
