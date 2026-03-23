import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { purchasingService } from "../../services/purchasingService";
import { inventoryService } from "../../services/inventoryService";

const POView = () => {
  const { id } = useParams();
  const [po, setPo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [productNameMap, setProductNameMap] = useState<Record<number, string>>({});

  useEffect(() => {
    inventoryService.getAllProducts().then((products) => {
      const map: Record<number, string> = {};
      products.forEach((product: any) => {
        if (product.id) {
          map[Number(product.id)] = product.name;
        }
      });
      setProductNameMap(map);
    });
  }, []);

  const loadPO = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await purchasingService.getPO(Number(id));
      setPo(data);
      setError(null);
    } catch {
      setError("Failed to load purchase order.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPO();
  }, [id]);

  const approvePO = async () => {
    if (!id || !po || po.status !== "DRAFT") return;
    setApproving(true);
    try {
      await purchasingService.approvePO(Number(id));
      await loadPO();
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Failed to approve purchase order.");
    } finally {
      setApproving(false);
    }
  };
  const cancelPO = async () => {
    if (!id || !po || po.status === "RECEIVED" || po.status === "CANCELLED") return;
    setApproving(true);
    try {
      await purchasingService.cancelPO(Number(id));
      await loadPO();
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Failed to cancel purchase order.");
    } finally {
      setApproving(false);
    }
  };

  if (loading) return <div className="p-8">Loading PO...</div>;
  if (!po) return <div className="p-8">{error || "PO not found"}</div>;

  const statusClass =
    po.status === "RECEIVED"
      ? "bg-green-100 text-green-700"
      : po.status === "APPROVED"
        ? "bg-blue-100 text-blue-700"
        : po.status === "CANCELLED"
          ? "bg-red-100 text-red-700"
          : "bg-gray-100 text-gray-700";

  return (
    <div className="p-8 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">PO#{po.id}</h1>
        <div className="flex items-center gap-3">
          {po.status === "DRAFT" && (
            <button
              type="button"
              onClick={approvePO}
              disabled={approving}
              className="px-3 py-2 rounded-lg bg-emerald-600 text-white disabled:opacity-60"
            >
              {approving ? "Approving..." : "Approve PO"}
            </button>
          )}
          {po.status === "APPROVED" && (
            <Link to="/purchasing/grn" className="px-3 py-2 rounded-lg bg-blue-600 text-white">
              Create GRN
            </Link>
          )}
          {po.status !== "RECEIVED" && po.status !== "CANCELLED" && (
            <button
              type="button"
              onClick={cancelPO}
              disabled={approving}
              className="px-3 py-2 rounded-lg bg-red-600 text-white disabled:opacity-60"
            >
              {approving ? "Cancelling..." : "Cancel PO"}
            </button>
          )}
          <Link to="/purchasing/po" className="text-blue-600">Back to list</Link>
        </div>
      </div>
      {error && <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700">{error}</div>}

      <div className="bg-white border rounded-xl p-4">
        <div>Supplier: <b>{po.supplier}</b></div>
        <div>Warehouse: <b>{po.warehouse}</b></div>
        <div>
          Status:{" "}
          <span className={`inline-flex px-2 py-1 rounded-lg text-xs font-semibold ${statusClass}`}>
            {po.status}
          </span>
        </div>
        <div>Order Date: <b>{po.order_date}</b></div>
        <div>Expected Date: <b>{po.expected_date || "-"}</b></div>
        <div className="mt-4">
          <h2 className="font-semibold mb-2">Items</h2>
          <div className="border rounded">
            {po.items?.map((it: any, i: number) => (
              <div key={i} className="p-3 border-b flex justify-between">
                <div>{productNameMap[Number(it.product)] || `Product #${it.product}`}</div>
                <div>Qty: {it.quantity}</div>
                <div>Price: {it.unit_price}</div>
              </div>
            ))}
            {!po.items?.length && <div className="p-3 text-gray-500">No items</div>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default POView;