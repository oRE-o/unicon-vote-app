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

export default api;
