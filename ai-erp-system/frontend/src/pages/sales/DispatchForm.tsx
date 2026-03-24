// DispatchForm.tsx
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { salesService } from "../../services/salesService";
import { inventoryService } from "../../services/inventoryService";

const DispatchForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [summary, setSummary] = useState<any>(null);
  const [lines, setLines] = useState<any[]>([]);
  const [productsMap, setProductsMap] = useState<Record<number, string>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [s, prods] = await Promise.all([
          salesService.getDispatchSummary(Number(id)),
          inventoryService.getAllProducts(),
        ]);
        setSummary(s);
        setLines(s.lines.map((ln: any) => ({ ...ln, dispatched_qty: ln.pending })));
        setProductsMap(prods.reduce((acc: any, p: any) => { acc[p.id] = p.name; return acc; }, {}));
      } catch {
        setError("Failed to load dispatch summary.");
      }
    })();
  }, [id]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const invalid = lines.find(l => Number(l.dispatched_qty) < 0 || Number(l.dispatched_qty) > Number(l.pending));
    if (invalid) { setError(`Invalid qty for product ${invalid.product_name || invalid.product_id}. Max ${invalid.pending}.`); return; }
    const payload = {
      sales_order: Number(id),
      warehouse: Number(summary?.warehouse),
      items: lines.filter(l => Number(l.dispatched_qty) > 0).map((l)=>({ product: l.product_id, dispatched_qty: Number(l.dispatched_qty) })),
    };
    if (payload.items.length === 0) { setError("Enter at least one positive quantity."); return; }
    setSaving(true);
    try {
      await salesService.createDispatch(payload);
      navigate(`/sales/orders/${id}`);
    } catch (e: any) {
      setError(e?.response?.data?.detail || e?.response?.data?.items || "Failed to create dispatch.");
    } finally {
      setSaving(false);
    }
  };

  if (!summary) return <div className="p-8">Loading...</div>;

  return (
    <div className="p-8 space-y-4">
      <h1 className="text-2xl font-bold">Create Dispatch for SO#{id}</h1>
      {error && <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded">{error}</div>}

      <form onSubmit={submit} className="space-y-3 bg-white border rounded-xl p-4">
        {lines.map((ln, i) => (
          <div key={i} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-center">
            <div className="text-sm font-medium">{productsMap[ln.product_id] || ln.product_name}</div>
            <div className="text-xs text-gray-500">Ordered: {ln.ordered} | Dispatched: {ln.dispatched} | Pending: {ln.pending}</div>
            <input
              className="border rounded px-3 py-2"
              type="number"
              min={0}
              max={ln.pending}
              value={ln.dispatched_qty}
              onChange={(e)=>setLines(prev=>prev.map((x,idx)=>idx===i?{...x, dispatched_qty: Number(e.target.value)}:x))}
            />
            <div className="text-xs text-gray-500">Max {ln.pending}</div>
          </div>
        ))}
        <button disabled={saving} className="px-4 py-2 rounded bg-blue-600 text-white">{saving ? "Posting..." : "Post Dispatch"}</button>
      </form>
    </div>
  );
};

export default DispatchForm;