// === Request interceptor ===
import axios, { AxiosError, AxiosHeaders, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';

const storage = {
  getAccessToken: () => localStorage.getItem('access_token'),
  setAccessToken: (token: string) =>
    localStorage.setItem('access_token', token),
  removeAccessToken: () => localStorage.removeItem('access_token'),

  getRefreshToken: () => localStorage.getItem('refresh_token'),
  setRefreshToken: (token: string) =>
    localStorage.setItem('refresh_token', token),
  removeRefreshToken: () => localStorage.removeItem('refresh_token'),
};

// === Refresh Token logic ===
let isRefreshing = false;
let failedQueue: {
  resolve: (value?: unknown) => void;
  reject: (reason?: any) => void;
}[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    error ? prom.reject(error) : prom.resolve(token);
  });
  failedQueue = [];
};

const refreshToken = async (): Promise<string | null> => {
  try {
    const refreshToken = storage.getRefreshToken();
    if (!refreshToken) return null;

    const response = await axios.post(
      `${import.meta.env.VITE_API_URL}/auth/refresh`,
      { refreshToken }
    );

    const newAccessToken = response.data.accessToken;
    const newRefreshToken = response.data.refreshToken;

    storage.setAccessToken(newAccessToken);
    storage.setRefreshToken(newRefreshToken);

    return newAccessToken;
  } catch (error) {
    storage.removeAccessToken();
    storage.removeRefreshToken();
    return null;
  }
};

// === Axios instance ===
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 10000,
  // headers: {
  //   'Content-Type': 'application/json',
  // },
});

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = storage.getAccessToken();

    if (!config.headers) {
      config.headers = new AxiosHeaders();
    }

    if (token) {
      config.headers.set("Authorization", `Bearer ${token}`);
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// === Response interceptor ===
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & {
      _retry?: boolean;
    };

    if (error.response?.status === 401 && !originalRequest._retry) {
      storage.removeAccessToken();
      if (window.location.pathname !== '/login' && window.location.pathname !== '/auth/signin') {
        window.location.href = '/login';
      }
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          if (token && originalRequest.headers) {
            originalRequest.headers['Authorization'] = 'Bearer ' + token;
          }
          return apiClient(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const newToken = await refreshToken();
        if (!newToken) throw new Error('Token refresh failed');

        processQueue(null, newToken);

        if (originalRequest.headers) {
          originalRequest.headers['Authorization'] = 'Bearer ' + newToken;
        }

        return apiClient(originalRequest);
      } catch (err) {
        processQueue(err, null);
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);
