import axios from "axios";
import {
  getAccessToken,
  getRefreshToken,
  saveTokens,
  logout,
} from "@/lib/auth";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://api.codeforgeapp.com/api/v1";

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

let isRefreshing = false;
let refreshQueue: Array<(token: string | null) => void> = [];

function resolveRefreshQueue(token: string | null) {
  refreshQueue.forEach((callback) => callback(token));
  refreshQueue = [];
}

api.interceptors.request.use(
  (config) => {
    const token = getAccessToken();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (!originalRequest) {
      return Promise.reject(error);
    }

    const status = error.response?.status;
    const isAuthRefreshRequest = originalRequest.url?.includes("/auth/refresh");

    if (status !== 401 || originalRequest._retry || isAuthRefreshRequest) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    const refreshToken = getRefreshToken();

    if (!refreshToken) {
      logout();
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        refreshQueue.push((newToken) => {
          if (!newToken) {
            reject(error);
            return;
          }

          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          resolve(api(originalRequest));
        });
      });
    }

    isRefreshing = true;

    try {
      const response = await axios.post(`${API_URL}/auth/refresh`, {
        refresh_token: refreshToken,
      });

      const newAccessToken = response.data.access_token;
      const newRefreshToken = response.data.refresh_token;

      saveTokens(newAccessToken, newRefreshToken);

      api.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;
      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

      resolveRefreshQueue(newAccessToken);

      return api(originalRequest);
    } catch (refreshError) {
      resolveRefreshQueue(null);
      logout();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);