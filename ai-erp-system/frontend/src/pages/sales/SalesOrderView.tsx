// SalesOrderView.tsx
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { salesService } from "../../services/salesService";
import { inventoryService } from "../../services/inventoryService";

const SalesOrderView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [so, setSo] = useState<any>(null);
  const [productsMap, setProductsMap] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const role = localStorage.getItem("me_role");

  const load = async () => {
    setLoading(true);
    try {
      const [order, prods] = await Promise.all([
        salesService.getOrder(Number(id)),
        inventoryService.getAllProducts(),
      ]);
      setSo(order);
      setProductsMap(
        prods.reduce((acc: any, p: any) => { acc[p.id] = p.name; return acc; }, {})
      );
      setError(null);
    } catch {
      setError("Failed to load sales order.");
    } finally { setLoading(false); }
  };

  useEffect(() => { if (id) load(); }, [id]);

  const isManager = role === "admin" || role === "manager";
  const confirm = async () => { if (!isManager || !id) return; try { await salesService.confirmOrder(Number(id)); await load(); } catch (e: any) { setError(e?.response?.data?.detail || "Failed to confirm."); } };
  const cancel = async () => { if (!isManager || !id) return; if (!window.confirm("Cancel this order?")) return; try { await salesService.cancelOrder(Number(id)); await load(); } catch (e: any) { setError(e?.response?.data?.detail || "Failed to cancel."); } };

  if (loading) return <div className="p-8">Loading...</div>;
  if (!so) return <div className="p-8">{error || "Not found"}</div>;

  const badge = (s: string) =>
    s === "DISPATCHED" ? "bg-green-100 text-green-700" :
    s === "CONFIRMED" ? "bg-blue-100 text-blue-700" :
    s === "CANCELLED" ? "bg-red-100 text-red-700" :
    s === "PARTIALLY_DISPATCHED" ? "bg-amber-100 text-amber-700" :
    "bg-gray-100 text-gray-700";

  return (
    <div className="p-8 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">SO#{so.id}</h1>
        <div className="flex items-center gap-3">
          {isManager && so.status === "DRAFT" && (
            <button onClick={confirm} className="px-3 py-2 rounded bg-emerald-600 text-white">Confirm</button>
          )}
          {isManager && so.status !== "DISPATCHED" && so.status !== "CANCELLED" && (
            <button onClick={cancel} className="px-3 py-2 rounded bg-red-600 text-white">Cancel</button>
          )}
          {(so.status === "CONFIRMED" || so.status === "PARTIALLY_DISPATCHED") && (
            <button onClick={()=>navigate(`/sales/orders/${so.id}/dispatch`)} className="px-3 py-2 rounded bg-blue-600 text-white">Create Dispatch</button>
          )}
          <Link to="/sales" className="text-blue-600">Back</Link>
        </div>
      </div>
      {error && <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded">{error}</div>}

      <div className="bg-white border rounded-xl p-4 space-y-2">
        <div>Customer: <b>{so.customer_name}</b></div>
        <div>Warehouse: <b>{so.warehouse}</b></div>
        <div>Status: <span className={`inline-flex px-2 py-1 rounded-lg text-xs font-semibold ${badge(so.status)}`}>{so.status}</span></div>
        <div>Order Date: <b>{so.order_date}</b></div>
      </div>

      <div className="bg-white border rounded-xl p-4">
        <h2 className="font-semibold mb-2">Items</h2>
        <div className="border rounded">
          {so.items?.map((it: any, i: number) => (
            <div key={i} className="p-3 border-b flex justify-between text-sm">
              <div>{productsMap[it.product] || `Product #${it.product}`}</div>
              <div>Qty: {it.quantity}</div>
              <div>Price: {it.unit_price}</div>
            </div>
          ))}
          {!so.items?.length && <div className="p-3 text-gray-500">No items</div>}
        </div>
      </div>
    </div>
  );
};

export default SalesOrderView;