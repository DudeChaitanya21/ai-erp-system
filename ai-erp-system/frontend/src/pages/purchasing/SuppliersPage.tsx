import { useEffect, useState } from "react";
import { purchasingService } from "../../services/purchasingService";

const SuppliersPage = () => {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [form, setForm] = useState({ name: "", email: "", phone: "", address: "" });

  const load = async () => setSuppliers(await purchasingService.listSuppliers());

  useEffect(() => {
    load();
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await purchasingService.createSupplier(form);
    setForm({ name: "", email: "", phone: "", address: "" });
    load();
  };

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-2xl font-bold">Suppliers</h1>

      <form onSubmit={onSubmit} className="bg-white border rounded-xl p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
        <input className="border rounded px-3 py-2" placeholder="Name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <input className="border rounded px-3 py-2" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <input className="border rounded px-3 py-2" placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <input className="border rounded px-3 py-2" placeholder="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
        <button className="md:col-span-2 bg-blue-600 text-white rounded px-4 py-2">Add Supplier</button>
      </form>

      <div className="bg-white border rounded-xl">
        {suppliers.map((s) => (
          <div key={s.id} className="p-4 border-b">
            <div className="font-semibold">{s.name}</div>
            <div className="text-sm text-gray-600">{s.email || "-"} | {s.phone || "-"}</div>
          </div>
        ))}
        {suppliers.length === 0 && <div className="p-4 text-gray-500">No suppliers yet.</div>}
      </div>
    </div>
  );
};

export default SuppliersPage;