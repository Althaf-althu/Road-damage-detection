import axios from "axios";
import Cookies from "js-cookie";

const TOKEN_KEY = "kerala_pwd_token";

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000",
  headers: { "Content-Type": "application/json" },
});

// Attach JWT Bearer token on every request
apiClient.interceptors.request.use((config) => {
  const token = Cookies.get(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auto-redirect on 401 (expired/invalid token)
apiClient.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      Cookies.remove(TOKEN_KEY);
      window.location.href = "/auth/login";
    }
    return Promise.reject(error);
  }
);

export const setAuthToken = (token: string) => {
  Cookies.set(TOKEN_KEY, token, { expires: 1, sameSite: "strict" });
};

export const clearAuthToken = () => {
  Cookies.remove(TOKEN_KEY);
};

export const getAuthToken = () => Cookies.get(TOKEN_KEY);

