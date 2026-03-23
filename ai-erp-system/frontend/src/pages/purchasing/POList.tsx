import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { purchasingService } from "../../services/purchasingService";

const POList = () => {
  const [data, setData] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [suppliersMap, setSuppliersMap] = useState<Record<number, string>>({});
  const [warehousesMap, setWarehousesMap] = useState<Record<number, string>>({});
  const [approvingId, setApprovingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [supplierFilter, setSupplierFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const role = localStorage.getItem("me_role");
  const canApprove = role === "admin" || role === "manager";

  const statusClass = (status: string) => {
    if (status === "RECEIVED") return "bg-green-100 text-green-700";
    if (status === "APPROVED") return "bg-blue-100 text-blue-700";
    if (status === "CANCELLED") return "bg-red-100 text-red-700";
    return "bg-gray-100 text-gray-700";
  };

  const load = async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = {};
      if (statusFilter) params.status = statusFilter;
      if (supplierFilter) params.supplier = Number(supplierFilter);

      const [posRes, suppliersRes, warehousesRes] = await Promise.all([
        purchasingService.listPOs(params),
        purchasingService.listSuppliers(),
        purchasingService.listWarehouses(),
      ]);
      const pos = Array.isArray(posRes) ? posRes : posRes?.results || [];
      const suppliers = Array.isArray(suppliersRes) ? suppliersRes : suppliersRes?.results || [];
      const warehouses = Array.isArray(warehousesRes) ? warehousesRes : warehousesRes?.results || [];

      setData(pos);
      setSuppliers(suppliers);
      setSuppliersMap(
        suppliers.reduce((acc: Record<number, string>, supplier: any) => {
          acc[Number(supplier.id)] = supplier.name;
          return acc;
        }, {})
      );
      setWarehousesMap(
        warehouses.reduce((acc: Record<number, string>, warehouse: any) => {
          acc[Number(warehouse.id)] = warehouse.name;
          return acc;
        }, {})
      );
      setError(null);
    } catch {
      setError("Failed to load purchase orders.");
    } finally {
      setLoading(false);
    }
  };

  const approvePO = async (poId: number) => {
    if (!canApprove) return;
    setApprovingId(poId);
    try {
      await purchasingService.approvePO(poId);
      await load();
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Failed to approve purchase order.");
    } finally {
      setApprovingId(null);
    }
  };

  useEffect(() => {
    load();
  }, [statusFilter, supplierFilter]);

  const filteredByDate = data.filter((po) => {
    const orderDate = po.order_date ? new Date(po.order_date) : null;
    if (!orderDate) return true;
    if (fromDate && orderDate < new Date(fromDate)) return false;
    if (toDate && orderDate > new Date(toDate)) return false;
    return true;
  });

  if (loading) return <div className="p-8">Loading purchase orders...</div>;

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Purchase Orders</h1>
        <Link to="/purchasing/po/new" className="px-4 py-2 bg-blue-600 text-white rounded-lg">New PO</Link>
      </div>
      <div className="mb-4 bg-white rounded-xl border p-4 grid grid-cols-1 md:grid-cols-5 gap-3">
        <select
          className="border rounded px-3 py-2"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="DRAFT">Draft</option>
          <option value="APPROVED">Approved</option>
          <option value="RECEIVED">Received</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
        <select
          className="border rounded px-3 py-2"
          value={supplierFilter}
          onChange={(e) => setSupplierFilter(e.target.value)}
        >
          <option value="">All Suppliers</option>
          {suppliers.map((supplier) => (
            <option key={supplier.id} value={supplier.id}>
              {supplier.name}
            </option>
          ))}
        </select>
        <input
          className="border rounded px-3 py-2"
          type="date"
          value={fromDate}
          onChange={(e) => setFromDate(e.target.value)}
        />
        <input
          className="border rounded px-3 py-2"
          type="date"
          value={toDate}
          onChange={(e) => setToDate(e.target.value)}
        />
        <button
          type="button"
          className="px-3 py-2 rounded bg-gray-100 hover:bg-gray-200"
          onClick={() => {
            setStatusFilter("");
            setSupplierFilter("");
            setFromDate("");
            setToDate("");
          }}
        >
          Reset Filters
        </button>
      </div>
      {error && <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700">{error}</div>}

      <div className="bg-white rounded-xl border">
        {filteredByDate.map((po) => (
          <div key={po.id} className="p-4 border-b flex items-center justify-between">
            <div>
              <div className="font-semibold flex items-center gap-2">
                <span>PO#{po.id}</span>
                <span className={`inline-flex px-2 py-1 rounded-lg text-xs font-semibold ${statusClass(po.status)}`}>
                  {po.status}
                </span>
              </div>
              <div className="text-sm text-gray-600">
                Supplier: {suppliersMap[Number(po.supplier)] || po.supplier} | Warehouse:{" "}
                {warehousesMap[Number(po.warehouse)] || po.warehouse}
              </div>
              <div className="text-sm text-gray-600">{po.order_date}</div>
            </div>
            <div className="flex items-center gap-3">
              {canApprove && po.status === "DRAFT" && (
                <button
                  type="button"
                  onClick={() => approvePO(Number(po.id))}
                  disabled={approvingId === Number(po.id)}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-sm disabled:opacity-60"
                >
                  {approvingId === Number(po.id) ? "Approving..." : "Approve"}
                </button>
              )}
              {canApprove && po.status !== "RECEIVED" && po.status !== "CANCELLED" && (
                <button
                  type="button"
                  onClick={async () => {
                    setApprovingId(Number(po.id));
                    try {
                      await purchasingService.cancelPO(Number(po.id));
                      await load();
                    } catch (err: any) {
                      setError(err?.response?.data?.detail || "Failed to cancel purchase order.");
                    } finally {
                      setApprovingId(null);
                    }
                  }}
                  disabled={approvingId === Number(po.id)}
                  className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-sm disabled:opacity-60"
                >
                  {approvingId === Number(po.id) ? "Cancelling..." : "Cancel"}
                </button>
              )}
              <Link to={`/purchasing/po/${po.id}`} className="text-blue-600">Open</Link>
            </div>
          </div>
        ))}
        {filteredByDate.length === 0 && <div className="p-6 text-gray-500">No purchase orders.</div>}
      </div>
    </div>
  );
};

export default POList;