import axios from "axios";

const resolveApiBaseUrl = () => {
  const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();

  if (configuredBaseUrl) {
    const normalizedBaseUrl = configuredBaseUrl
      .replace(/\/+$/, "")
      .replace(/\/api$/, "");

    if (normalizedBaseUrl) {
      return normalizedBaseUrl;
    }
  }

  return import.meta.env.DEV ? "http://localhost:5001" : window.location.origin;
};

export const API_BASE_URL = resolveApiBaseUrl();

const api = axios.create({
  baseURL: API_BASE_URL,
});

const handleUnauthorized = () => {
  localStorage.removeItem("authToken");

  const currentPath = window.location.pathname;
  const nextPath = currentPath.startsWith("/admin")
    ? "/admin-required"
    : "/login-required";

  if (currentPath !== nextPath) {
    window.location.replace(nextPath);
  }
};

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("authToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      handleUnauthorized();
    }

    return Promise.reject(error);
  }
);

export default api;
