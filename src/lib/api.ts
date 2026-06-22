import axios from "axios";

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000";

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10_000,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  // TODO: attach auth token from store
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    // TODO: handle 401 → logout
    return Promise.reject(err);
  }
);
