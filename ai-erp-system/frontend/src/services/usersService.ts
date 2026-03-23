import api from "./api";

export type ManagedUser = {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  is_active: boolean;
  is_staff: boolean;
  date_joined: string;
  profile: {
    role: "admin" | "manager" | "staff";
    phone: string;
    department: string;
  };
};

export const usersService = {
  async getUsers(): Promise<ManagedUser[]> {
    return (await api.get("/users/")).data;
  },

  async updateUser(id: number, payload: Partial<ManagedUser>) {
    return (await api.patch(`/users/${id}/`, payload)).data;
  },
};