import api from "./api";

export type LoginPayload = { username: string; password: string };

export const authService = {
  async login(payload: LoginPayload) {
    const res = await api.post("/auth/login/", payload);
    localStorage.setItem("access_token", res.data.access);
    localStorage.setItem("refresh_token", res.data.refresh);
    return res.data;
  },

  async register(payload: {
    username: string;
    email: string;
    first_name?: string;
    last_name?: string;
    password: string;
    password2: string;
    role?: "admin" | "manager" | "staff";
  }) {
    return (await api.post("/auth/register/", payload)).data;
  },

  async me() {
    return (await api.get("/auth/me/")).data;
  },

  logout() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
  },
};