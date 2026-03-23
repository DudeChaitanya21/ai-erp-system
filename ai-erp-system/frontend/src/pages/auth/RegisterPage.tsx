import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authService } from "../../services/authService";

const RegisterPage = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    username: "",
    email: "",
    first_name: "",
    last_name: "",
    password: "",
    password2: "",
    role: "staff" as "admin" | "manager" | "staff",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await authService.register(form);
      navigate("/login", { replace: true });
    } catch (err: any) {
      setError(JSON.stringify(err?.response?.data || "Registration failed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center bg-gray-50 p-4">
      <form onSubmit={onSubmit} className="w-full max-w-md bg-white rounded-2xl shadow p-6 space-y-4">
        <h1 className="text-2xl font-bold">Register</h1>

        {error && <div className="text-sm text-red-600 bg-red-50 p-2 rounded break-words">{error}</div>}

        <input className="w-full border rounded-lg px-3 py-2" placeholder="Username" required value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
        <input className="w-full border rounded-lg px-3 py-2" type="email" placeholder="Email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <input className="w-full border rounded-lg px-3 py-2" placeholder="First name" value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} />
        <input className="w-full border rounded-lg px-3 py-2" placeholder="Last name" value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} />
        <input className="w-full border rounded-lg px-3 py-2" type="password" placeholder="Password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        <input className="w-full border rounded-lg px-3 py-2" type="password" placeholder="Confirm password" required value={form.password2} onChange={(e) => setForm({ ...form, password2: e.target.value })} />

        <select className="w-full border rounded-lg px-3 py-2" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as "admin" | "manager" | "staff" })}>
          <option value="staff">staff</option>
          <option value="manager">manager</option>
          <option value="admin">admin</option>
        </select>

        <button disabled={loading} className="w-full bg-blue-600 text-white rounded-lg py-2 disabled:opacity-60">
          {loading ? "Creating..." : "Create account"}
        </button>

        <p className="text-sm text-gray-600">
          Already have an account? <Link to="/login" className="text-blue-600">Login</Link>
        </p>
      </form>
    </div>
  );
};

export default RegisterPage;