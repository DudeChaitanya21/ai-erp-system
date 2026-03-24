// SalesOrderForm.tsx
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { salesService } from "../../services/salesService";
import { inventoryService } from "../../services/inventoryService";
import { purchasingService } from "../../services/purchasingService";

const SalesOrderForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [customerName, setCustomerName] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [warehouse, setWarehouse] = useState("");
  const [items, setItems] = useState<any[]>([{ product: "", quantity: "", unit_price: "" }]);
  const [products, setProducts] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([inventoryService.getAllProducts(), purchasingService.listWarehouses()])
      .then(([prods, whs]) => {
        setProducts(prods);
        setWarehouses(Array.isArray(whs) ? whs : whs?.results || []);
      })
      .catch(() => setError("Failed to load products/warehouses"));
  }, []);

  useEffect(() => {
    if (!isEdit) return;
    (async () => {
      try {
        const so = await salesService.getOrder(Number(id));
        setCustomerId(String(so.customer));
        setWarehouse(String(so.warehouse));
        setItems(so.items?.map((it: any) => ({ product: String(it.product), quantity: String(it.quantity), unit_price: String(it.unit_price) })) || []);
      } catch {
        setError("Failed to load order");
      }
    })();
  }, [id, isEdit]);

  const addRow = () => setItems((x)=>[...x, { product: "", quantity: "", unit_price: "" }]);
  const rmRow = (i: number) => setItems((x)=>x.filter((_,idx)=>idx!==i));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!customerId || !warehouse || items.length === 0) { setError("Fill customer, warehouse and at least 1 item."); return; }
    const payload = {
      customer: Number(customerId),
      warehouse: Number(warehouse),
      items: items.map(it => ({ product: Number(it.product), quantity: Number(it.quantity || 0), unit_price: Number(it.unit_price || 0) })),
      notes: "",
    };
    setSaving(true);
    try {
      if (isEdit) await salesService.updateOrder(Number(id), payload);
      else await salesService.createOrder(payload);
      navigate("/sales");
    } catch (e: any) {
      setError(e?.response?.data?.detail || "Failed to save order.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">{isEdit ? "Edit Sales Order" : "New Sales Order"}</h1>
      {error && <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded mb-4">{error}</div>}
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input className="border rounded px-3 py-2" placeholder="Customer name" value={customerName} onChange={(e)=>setCustomerName(e.target.value)} />
          <select className="border rounded px-3 py-2" value={warehouse} onChange={(e)=>setWarehouse(e.target.value)}>
            <option value="">Select warehouse</option>
            {warehouses.map((w)=> <option key={w.id} value={w.id}>{w.name}</option>)}
          </select>
        </div>

        <div className="bg-white border rounded-xl p-4 space-y-3">
          {items.map((it, idx) => (
            <div key={idx} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-center">
              <select className="border rounded px-3 py-2" value={it.product} onChange={(e)=>setItems(prev=>prev.map((x,i)=>i===idx?{...x, product:e.target.value}:x))}>
                <option value="">Product</option>
                {products.map((p)=> <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <input className="border rounded px-3 py-2" type="number" min="0" placeholder="Quantity" value={it.quantity} onChange={(e)=>setItems(prev=>prev.map((x,i)=>i===idx?{...x, quantity:e.target.value}:x))}/>
              <input className="border rounded px-3 py-2" type="number" min="0" step="0.01" placeholder="Unit price" value={it.unit_price} onChange={(e)=>setItems(prev=>prev.map((x,i)=>i===idx?{...x, unit_price:e.target.value}:x))}/>
              <button type="button" onClick={()=>rmRow(idx)} className="px-3 py-2 bg-red-600 text-white rounded">Remove</button>
            </div>
          ))}
          <button type="button" onClick={addRow} className="px-3 py-2 bg-gray-200 rounded">Add item</button>
        </div>

        <button disabled={saving} className="px-4 py-2 rounded bg-blue-600 text-white">{saving ? "Saving..." : "Save Order"}</button>
      </form>
    </div>
  );
};

export default SalesOrderForm;