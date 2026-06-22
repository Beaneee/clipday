import { api } from "@/lib/api";
import type { ApiResponse } from "@/types";

type LoginPayload = { email: string; password: string };
type LoginResult = { user: { id: string; email: string; name: string }; token: string };

export const authService = {
  login: (payload: LoginPayload) =>
    api.post<ApiResponse<LoginResult>>("/auth/login", payload).then((r) => r.data.data),

  logout: () => api.post("/auth/logout"),
};
