import { useEffect, useState } from "react";
import { purchasingService } from "../../services/purchasingService";

const WarehousesPage = () => {
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [form, setForm] = useState({ name: "", code: "", address: "" });

  const load = async () => setWarehouses(await purchasingService.listWarehouses());

  useEffect(() => {
    load();
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await purchasingService.createWarehouse(form);
    setForm({ name: "", code: "", address: "" });
    load();
  };

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-2xl font-bold">Warehouses</h1>

      <form onSubmit={onSubmit} className="bg-white border rounded-xl p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
        <input className="border rounded px-3 py-2" placeholder="Name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <input className="border rounded px-3 py-2" placeholder="Code" required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
        <input className="border rounded px-3 py-2 md:col-span-2" placeholder="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
        <button className="md:col-span-2 bg-blue-600 text-white rounded px-4 py-2">Add Warehouse</button>
      </form>

      <div className="bg-white border rounded-xl">
        {warehouses.map((w) => (
          <div key={w.id} className="p-4 border-b">
            <div className="font-semibold">{w.name} ({w.code})</div>
            <div className="text-sm text-gray-600">{w.address || "-"}</div>
          </div>
        ))}
        {warehouses.length === 0 && <div className="p-4 text-gray-500">No warehouses yet.</div>}
      </div>
    </div>
  );
};

export default WarehousesPage;