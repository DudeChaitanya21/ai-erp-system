import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8011/api",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let isRefreshing = false;
let refreshWaiters: Array<() => void> = [];

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error?.config;
    const isUnauthorized = error?.response?.status === 401;

    if (!isUnauthorized || !originalRequest) {
      return Promise.reject(error);
    }

    if (originalRequest.url?.includes("/auth/login/") || originalRequest.url?.includes("/auth/refresh/")) {
      return Promise.reject(error);
    }

    if (originalRequest._retry) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      await new Promise<void>((resolve) => {
        refreshWaiters.push(resolve);
      });
      const latestToken = localStorage.getItem("access_token");
      if (latestToken) {
        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers.Authorization = `Bearer ${latestToken}`;
      }
      return api(originalRequest);
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const refreshToken = localStorage.getItem("refresh_token");
      if (!refreshToken) {
        throw new Error("No refresh token");
      }

      const refreshResponse = await axios.post("http://localhost:8011/api/auth/refresh/", {
        refresh: refreshToken,
      });

      const newAccess = refreshResponse.data?.access;
      if (!newAccess) {
        throw new Error("No access token in refresh response");
      }

      localStorage.setItem("access_token", newAccess);

      originalRequest.headers = originalRequest.headers || {};
      originalRequest.headers.Authorization = `Bearer ${newAccess}`;

      refreshWaiters.forEach((resume) => resume());
      refreshWaiters = [];

      return api(originalRequest);
    } catch (refreshError) {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      try {
        // Basic session expiry toast without external deps
        alert("Your session has expired. Please sign in again.");
      } catch {}
      const returnTo = encodeURIComponent(window.location.pathname + window.location.search);
      window.location.href = `/login?returnTo=${returnTo}`;
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default api;