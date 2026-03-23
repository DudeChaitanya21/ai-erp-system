import { useEffect, useState } from "react";
import { purchasingService } from "../../services/purchasingService";

const MovementsPage = () => {
  const [movements, setMovements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState("");
  const [warehouse, setWarehouse] = useState("");
  const [product, setProduct] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const loadMovements = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (type) params.movement_type = type;
      if (warehouse) params.warehouse = Number(warehouse);
      if (product) params.product = Number(product);
      const data = await purchasingService.listMovements(params);
      setMovements(Array.isArray(data) ? data : data?.results || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMovements();
  }, [type, warehouse, product]);

  const filtered = movements.filter((m) => {
    const created = m.created_at ? new Date(m.created_at) : null;
    if (!created) return true;
    if (fromDate && created < new Date(fromDate)) return false;
    if (toDate && created > new Date(toDate)) return false;
    return true;
  });

  const exportCSV = () => {
    const header = ["created_at", "movement_type", "product", "warehouse", "quantity"];
    const rows = filtered.map((m) => [
      m.created_at,
      m.movement_type,
      m.product,
      m.warehouse,
      m.quantity,
    ]);
    const csv = [header, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `movements_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <div className="p-8">Loading movements...</div>;

  return (
    <div className="p-8 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Stock Movements</h1>
        <button onClick={exportCSV} className="px-3 py-2 rounded bg-gray-100 hover:bg-gray-200 text-sm">
          Export CSV
        </button>
      </div>

      <div className="bg-white border rounded-xl p-4 grid grid-cols-1 md:grid-cols-6 gap-3">
        <select className="border rounded px-3 py-2" value={type} onChange={(e) => setType(e.target.value)}>
          <option value="">All Types</option>
          <option value="IN">Inbound</option>
          <option value="OUT">Outbound</option>
          <option value="ADJ">Adjustment</option>
          <option value="XFER">Transfer</option>
        </select>
        <input className="border rounded px-3 py-2" placeholder="Warehouse ID" value={warehouse} onChange={(e) => setWarehouse(e.target.value)} />
        <input className="border rounded px-3 py-2" placeholder="Product ID" value={product} onChange={(e) => setProduct(e.target.value)} />
        <input className="border rounded px-3 py-2" type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
        <input className="border rounded px-3 py-2" type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
        <button
          type="button"
          className="px-3 py-2 rounded bg-gray-100 hover:bg-gray-200 text-sm"
          onClick={() => {
            setType("");
            setWarehouse("");
            setProduct("");
            setFromDate("");
            setToDate("");
          }}
        >
          Reset
        </button>
      </div>

      <div className="bg-white border rounded-xl overflow-hidden">
        {filtered.map((movement) => (
          <div key={movement.id} className="grid grid-cols-1 md:grid-cols-5 gap-2 p-3 border-b text-sm">
            <div className="text-gray-600">{new Date(movement.created_at).toLocaleString()}</div>
            <div className="font-semibold">{movement.movement_type}</div>
            <div>Product: {movement.product}</div>
            <div>Warehouse: {movement.warehouse}</div>
            <div>Qty: {movement.quantity}</div>
          </div>
        ))}
        {filtered.length === 0 && <div className="p-4 text-gray-500">No movements found.</div>}
      </div>
    </div>
  );
};

export default MovementsPage;
