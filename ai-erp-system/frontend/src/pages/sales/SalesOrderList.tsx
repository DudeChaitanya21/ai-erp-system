// SalesOrderList.tsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { salesService } from "../../services/salesService";

const SalesOrderList = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: "", warehouse: "" });
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const params: any = {};
      if (filters.status) params.status = filters.status;
      if (filters.warehouse) params.warehouse = filters.warehouse;
      const res = await salesService.listOrders(params);
      setData(Array.isArray(res) ? res : res?.results || []);
    } catch (e) {
      setError("Failed to load sales orders.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [filters]);

  if (loading) return <div className="p-8">Loading sales orders...</div>;

  const badge = (s: string) =>
    s === "DISPATCHED" ? "bg-green-100 text-green-700" :
    s === "CONFIRMED" ? "bg-blue-100 text-blue-700" :
    s === "CANCELLED" ? "bg-red-100 text-red-700" :
    s === "PARTIALLY_DISPATCHED" ? "bg-amber-100 text-amber-700" :
    "bg-gray-100 text-gray-700";

  return (
    <div className="p-8 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Sales Orders</h1>
        <Link to="/sales/new" className="px-4 py-2 bg-blue-600 text-white rounded-lg">New Order</Link>
      </div>
      {error && <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded">{error}</div>}

      <div className="bg-white rounded-xl shadow-sm p-4 border">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <select className="border rounded px-3 py-2" value={filters.status} onChange={(e)=>setFilters({...filters, status: e.target.value})}>
            <option value="">All Status</option>
            <option value="DRAFT">Draft</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="PARTIALLY_DISPATCHED">Partially Dispatched</option>
            <option value="DISPATCHED">Dispatched</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
          <input className="border rounded px-3 py-2" placeholder="Warehouse ID" value={filters.warehouse} onChange={(e)=>setFilters({...filters, warehouse: e.target.value})}/>
          <button className="border rounded px-3 py-2" onClick={()=>setFilters({status:"", warehouse:""})}>Reset</button>
        </div>
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        {data.map((so) => (
          <div key={so.id} className="p-4 border-b flex items-center justify-between">
            <div>
              <div className="font-semibold flex items-center gap-2">
                <span>SO#{so.id}</span>
                <span className={`inline-flex px-2 py-1 rounded-lg text-xs font-semibold ${badge(so.status)}`}>{so.status}</span>
              </div>
              <div className="text-sm text-gray-600">Customer: {so.customer_name} | Warehouse: {so.warehouse}</div>
              <div className="text-sm text-gray-600">{so.order_date}</div>
            </div>
            <div className="flex items-center gap-3">
              <Link to={`/sales/orders/${so.id}`} className="text-blue-600">Open</Link>
            </div>
          </div>
        ))}
        {data.length === 0 && <div className="p-6 text-gray-500">No sales orders.</div>}
      </div>
    </div>
  );
};

export default SalesOrderList;