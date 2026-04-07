import { client } from "../client/client.gen";
import { refreshToken as refreshTokenApi } from "../client/sdk.gen";
import { STORAGE_KEYS } from "../context/auth-context";

const api = client.instance;

// Track whether a refresh is already in-flight to avoid concurrent refresh calls
let isRefreshing = false;
let refreshSubscribers: Array<{ resolve: (token: string) => void; reject: (err: unknown) => void }> = [];

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Only intercept 401s; skip the refresh endpoint itself to avoid infinite loops
    if (
      error.response?.status !== 401 ||
      originalRequest._retry ||
      originalRequest.url?.includes('/api/v1/auth/refresh')
    ) {
      return Promise.reject(error);
    }

    // If a refresh is already in-flight, queue this request
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        refreshSubscribers.push({
          resolve: (newToken) => {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            resolve(api(originalRequest));
          },
          reject,
        });
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const storedRefreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
      if (!storedRefreshToken) throw new Error('No refresh token available');

      const { data } = await refreshTokenApi({
        throwOnError: true,
        body: { refresh_token: storedRefreshToken },
      });

      // Persist the new tokens
      const expiresAt = Date.now() + data.expires_in * 1000;
      localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, data.access_token);
      localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, data.refresh_token);
      localStorage.setItem(STORAGE_KEYS.EXPIRES_AT, expiresAt.toString());

      // Drain queued requests and retry the original
      refreshSubscribers.forEach(({ resolve }) => resolve(data.access_token));
      refreshSubscribers = [];
      originalRequest.headers.Authorization = `Bearer ${data.access_token}`;
      return api(originalRequest);
    } catch (refreshError) {
      // Refresh failed — reject all queued requests and clear storage
      refreshSubscribers.forEach(({ reject }) => reject(refreshError));
      refreshSubscribers = [];
      localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.EXPIRES_AT);
      window.dispatchEvent(new Event('auth:session-expired'));
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);