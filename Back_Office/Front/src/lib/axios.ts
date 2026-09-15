import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from "axios";
import { useAuthStore } from "@/stores/auth-store";
import { useAlertStore } from "@/stores/alert-store";
import { AlertEnum } from "@/models/alert-model";
import { router } from "@/main";

const getApiUrl = (): string => {
  // Server-side fallback (SSR / Node, if needed)
  if (typeof window === "undefined") {
    return import.meta.env.VITE_API_URL || "http://localhost:8300/api";
  }

  // Client-side logic
  const host = window.location.hostname;
  const protocol = window.location.protocol;

  if (host === "localhost") {
    return `${protocol}//${host}:8300/api`;
  }

  return `${protocol}//${host}/api`;
};

// Axios Instance
const axiosApi: AxiosInstance = axios.create({
  baseURL: getApiUrl(),

  headers: {
    "Content-Type": "application/json",
  },
});

// Track if we're currently refreshing to avoid multiple refresh calls
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (
  error: AxiosError | null,
  token: string | null = null,
) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

// ==========================================
// REQUEST INTERCEPTOR - Add token to headers
// ==========================================
axiosApi.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

// ==========================================
// RESPONSE INTERCEPTOR - Handle errors
// ==========================================
axiosApi.interceptors.response.use(
  (response) => response,

  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & {
      _retry?: boolean;
    };

    // ========================================
    // 401 UNAUTHORIZED - Token Expired
    // ========================================
    if (error.response?.status === 401 && !originalRequest._retry) {
      // No session exists yet on the login endpoint: a 401 here means wrong
      // credentials, so just reject and let the login form show the message.
      if (originalRequest.url?.includes("/auth/login")) {
        return Promise.reject(error);
      }
      // Reset endpoints return 401 for wrong password, not expired token
      if (originalRequest.url?.includes("/reset/prepare") || originalRequest.url?.includes("/reset/confirm")) {
        return Promise.reject(error);
      }
      // Don't retry refresh endpoint itself
      if (originalRequest.url?.includes("/auth/refresh-token")) {
        handleSessionExpired();
        return Promise.reject(error);
      }

      // If already refreshing, queue this request
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return axiosApi(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = useAuthStore.getState().refreshToken;

      if (!refreshToken) {
        // No refresh token available
        isRefreshing = false;
        handleSessionExpired();
        return Promise.reject(error);
      }

      try {
        // Call refresh endpoint using the dynamic getApiUrl() helper
        const { data } = await axios.post(`${getApiUrl()}/auth/refresh-token`, {
          refresh_token: refreshToken,
        });

        // Update tokens in store
        const newAccessToken = data.data?.token;
        const newRefreshToken = data.data?.refresh_token;

        if (newAccessToken && newRefreshToken) {
          useAuthStore.getState().updateTokens(newAccessToken, newRefreshToken);

          // Update original request with new token
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          }

          // Safely release the refresh lock BEFORE processing the queue
          isRefreshing = false;
          processQueue(null, newAccessToken);

          // Retry original request
          return axiosApi(originalRequest);
        } else {
          throw new Error("Invalid refresh response");
        }
      } catch (refreshError) {
        // Refresh token failed or expired

        processQueue(refreshError as AxiosError, null);
        isRefreshing = false;
        handleSessionExpired();
        return Promise.reject(refreshError);
      }
    }

    // ========================================
    // 403 FORBIDDEN
    // ========================================
    if (error.response?.status === 403) {
      useAlertStore.getState().showAlert({
        type: AlertEnum.WARNING,
        message:
          "Access Forbidden! You do not have permission to perform this action.",
      });
    }

    // ========================================
    // 500 INTERNAL SERVER ERROR
    // ========================================
    if (error.response?.status === 500) {
      useAlertStore.getState().showAlert({
        type: AlertEnum.ERROR,
        message: "Server Error! Please try again later.",
      });
    }

    // ========================================
    // NETWORK ERROR (No internet)
    // ========================================
    if (!error.response) {
      useAlertStore.getState().showAlert({
        type: AlertEnum.ERROR,
        message: "Network Error! Please check your internet connection.",
      });
    }

    return Promise.reject(error);
  },
);

// ==========================================
// HELPER: Handle Session Expired
// ==========================================
function handleSessionExpired() {
  useAuthStore.getState().clearAuth();

  useAlertStore.getState().showAlert({
    type: AlertEnum.WARNING,
    message: "Your session has expired. Please login again.",
    onConfirm: () => {
      const currentPath = window.location.pathname + window.location.search;
      const redirectPath = currentPath !== "/sign-in" ? currentPath : "/";

      router.navigate({
        to: "/sign-in",
        search: { redirect: redirectPath },
      });
    },
  });
}

export default axiosApi;