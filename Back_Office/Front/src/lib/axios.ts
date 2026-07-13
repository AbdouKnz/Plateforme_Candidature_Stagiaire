import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios'
import { useAuthStore } from '@/stores/auth-store'
import { useAlertStore } from '@/stores/alert-store'
import { AlertEnum } from '@/models/alert-model'
import i18n from '@/lib/language/i18n/i18n'

const axiosApi: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Track if we're currently refreshing to avoid multiple refresh calls
let isRefreshing = false
let failedQueue: Array<{
  resolve: (value?: unknown) => void
  reject: (reason?: unknown) => void
}> = []

const processQueue = (error: AxiosError | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token)
    }
  })

  failedQueue = []
}

// ==========================================
// REQUEST INTERCEPTOR - Add token to headers
// ==========================================
axiosApi.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token
    
    if (config.headers) {
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
      config.headers['Accept-Language'] = i18n.language || 'en'
      if (config.data instanceof FormData) {
        delete config.headers['Content-Type'];
      }
    }
    
    return config
  },
  (error) => Promise.reject(error)
)

// ==========================================
// RESPONSE INTERCEPTOR - Handle errors
// ==========================================
axiosApi.interceptors.response.use(
  (response) => response,
  
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean }
    
    // ========================================
    // 401 UNAUTHORIZED - Token Expired
    // ========================================
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Don't retry refresh endpoint itself
      if (originalRequest.url?.includes('/auth/refresh-token')) {
        handleSessionExpired()
        return Promise.reject(error)
      }

      // If already refreshing, queue this request
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`
            }
            return axiosApi(originalRequest)
          })
          .catch((err) => Promise.reject(err))
      }

      originalRequest._retry = true
      isRefreshing = true

      const refreshToken = useAuthStore.getState().refreshToken

      if (!refreshToken) {
        // No refresh token available
        isRefreshing = false
        handleSessionExpired()
        return Promise.reject(error)
      }

      try {
        // Call refresh endpoint
        const { data } = await axios.post(
          `${import.meta.env.VITE_API_URL}/auth/refresh-token`,
          { refresh_token: refreshToken }
        )

        // Update tokens in store
        const newAccessToken = data.data?.token
        const newRefreshToken = data.data?.refresh_token

        if (newAccessToken && newRefreshToken) {
          useAuthStore.getState().updateTokens(newAccessToken, newRefreshToken)

          // Update original request with new token
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
          }

          // Process queued requests with new token
          processQueue(null, newAccessToken)
          isRefreshing = false

          // Retry original request
          return axiosApi(originalRequest)
        } else {
          throw new Error('Invalid refresh response')
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
        message: i18n.t('access_forbidden'),
      })
    }

    // ========================================
    // 500 INTERNAL SERVER ERROR
    // ========================================
    if (error.response?.status === 500) {
      useAlertStore.getState().showAlert({
        type: AlertEnum.ERROR,
        message: i18n.t('server_error'),
      })
    }

    // ========================================
    // NETWORK ERROR (No internet)
    // ========================================
    if (!error.response) {
      useAlertStore.getState().showAlert({
        type: AlertEnum.ERROR,
        message: i18n.t('network_error'),
      })
    }

    return Promise.reject(error)
  }
)

// ==========================================
// HELPER: Handle Session Expired
// ==========================================
function handleSessionExpired() {
  useAuthStore.getState().clearAuth()
  
  useAlertStore.getState().showAlert({
    type: AlertEnum.WARNING,
    message: i18n.t('session_expired'),
    onConfirm: () => {
      // Get current path for redirect after login
      const currentPath = window.location.pathname + window.location.search
      const redirectPath = currentPath !== '/sign-in' ? currentPath : '/'
      
      // Redirect to login with return URL
      window.location.href = `/sign-in?redirect=${encodeURIComponent(redirectPath)}`
    }
  })
}

export default axiosApi