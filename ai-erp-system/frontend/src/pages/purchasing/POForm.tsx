import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { purchasingService } from "../../services/purchasingService.ts";
import { inventoryService } from "../../services/inventoryService";

const POForm = () => {
  const navigate = useNavigate();
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([{ product: "", quantity: 1, unit_price: 0 }]);
  const [form, setForm] = useState<any>({ supplier: "", warehouse: "", expected_date: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      purchasingService.listSuppliers(),
      purchasingService.listWarehouses(),
      inventoryService.getAllProducts(),
    ]).then(([s, w, p]) => {
      setSuppliers(s);
      setWarehouses(w);
      setProducts(p);
    });
  }, []);

  const addItem = () => setItems((prev) => [...prev, { product: "", quantity: 1, unit_price: 0 }]);
  const updateItem = (i: number, patch: any) => setItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));
  const removeItem = (i: number) => setItems((prev) => prev.filter((_, idx) => idx !== i));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await purchasingService.createPO({
        supplier: Number(form.supplier),
        warehouse: Number(form.warehouse),
        expected_date: form.expected_date || null,
        items: items
          .filter((it) => it.product)
          .map((it) => ({
            product: Number(it.product),
            quantity: Number(it.quantity),
            unit_price: Number(it.unit_price),
          })),
      });
      navigate("/purchasing/po");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">New Purchase Order</h1>
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <select className="border rounded px-3 py-2" value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })}>
            <option value="">Select supplier</option>
            {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <select className="border rounded px-3 py-2" value={form.warehouse} onChange={(e) => setForm({ ...form, warehouse: e.target.value })}>
            <option value="">Select warehouse</option>
            {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
          </select>
          <input className="border rounded px-3 py-2" type="date" value={form.expected_date} onChange={(e) => setForm({ ...form, expected_date: e.target.value })} />
        </div>

        <div className="bg-white rounded-xl border p-4 space-y-3">
          {items.map((it, i) => (
            <div key={i} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-center">
              <select className="border rounded px-3 py-2" value={it.product} onChange={(e) => updateItem(i, { product: e.target.value })}>
                <option value="">Product</option>
                {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <input className="border rounded px-3 py-2" type="number" min="0" value={it.quantity} onChange={(e) => updateItem(i, { quantity: e.target.value })} />
              <input className="border rounded px-3 py-2" type="number" min="0" step="0.01" value={it.unit_price} onChange={(e) => updateItem(i, { unit_price: e.target.value })} />
              <button type="button" className="text-red-600" onClick={() => removeItem(i)}>Remove</button>
            </div>
          ))}
          <button type="button" className="text-blue-600" onClick={addItem}>+ Add Item</button>
        </div>

        <div className="flex gap-3">
          <button disabled={saving} className="px-4 py-2 rounded bg-blue-600 text-white">Create PO</button>
        </div>
      </form>
    </div>
  );
};

export default POForm;