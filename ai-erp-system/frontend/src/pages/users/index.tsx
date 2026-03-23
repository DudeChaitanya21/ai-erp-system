import { useEffect, useState } from "react";
import { usersService, type ManagedUser } from "../../services/usersService";

const UsersPage = () => {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await usersService.getUsers();
      setUsers(data);
      setError(null);
    } catch (err: any) {
      if (err?.response?.status === 403) {
        setError("You are not allowed to view users. Admin or Manager role is required.");
      } else {
        setError("Failed to load users.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const changeRole = async (user: ManagedUser, role: "admin" | "manager" | "staff") => {
    try {
      await usersService.updateUser(user.id, {
        profile: { ...user.profile, role },
      } as Partial<ManagedUser>);
      fetchUsers();
    } catch (err: any) {
      if (err?.response?.status === 403) {
        setError("You are not allowed to update user roles.");
      } else {
        setError("Failed to update role.");
      }
    }
  };

  if (loading) return <div className="p-8">Loading users...</div>;
  if (error) return <div className="p-8 text-red-700 bg-red-50 border border-red-200 rounded-xl">{error}</div>;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">User Management</h1>
      <div className="space-y-3">
        {users.map((u) => (
          <div key={u.id} className="bg-white p-4 rounded-xl border flex items-center justify-between">
            <div>
              <div className="font-semibold">{u.username} ({u.email})</div>
              <div className="text-sm text-gray-500">{u.profile?.department || "No department"}</div>
            </div>
            <select
              className="border rounded px-3 py-2"
              value={u.profile?.role || "staff"}
              onChange={(e) => changeRole(u, e.target.value as "admin" | "manager" | "staff")}
            >
              <option value="admin">admin</option>
              <option value="manager">manager</option>
              <option value="staff">staff</option>
            </select>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UsersPage;