import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { purchasingService } from "../../services/purchasingService";
import { inventoryService } from "../../services/inventoryService";

const GRNForm = () => {
  const navigate = useNavigate();
  const [pos, setPos] = useState<any[]>([]);
  const [poId, setPoId] = useState<string>("");
  const [warehouse, setWarehouse] = useState<string>("");
  const [items, setItems] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [productNameMap, setProductNameMap] = useState<Record<number, string>>({});

  useEffect(() => {
    Promise.all([
      purchasingService.listPOs(),
      purchasingService.listWarehouses(),
      inventoryService.getAllProducts(),
    ]).then(([po, wh, products]) => {
      setPos(Array.isArray(po) ? po : po?.results || []);
      setWarehouses(Array.isArray(wh) ? wh : wh?.results || []);
      const map: Record<number, string> = {};
      products.forEach((product: any) => {
        if (product.id) {
          map[Number(product.id)] = product.name;
        }
      });
      setProductNameMap(map);
    });
  }, []);

  const onPoChange = async (id: string) => {
    setPoId(id);
    setError(null);
    if (!id) { setItems([]); return; }
    const po = await purchasingService.getPO(Number(id));
    if (po.status !== "APPROVED") {
      setItems([]);
      setError("Only APPROVED purchase orders can be received.");
      return;
    }

    const receiptsRaw = await purchasingService.listGRN({ po: Number(id) });
    const receipts = Array.isArray(receiptsRaw) ? receiptsRaw : receiptsRaw?.results || [];
    const receivedByProduct = new Map<number, number>();

    receipts.forEach((grn: any) => {
      (grn.items || []).forEach((item: any) => {
        const productId = Number(item.product);
        const prev = receivedByProduct.get(productId) || 0;
        receivedByProduct.set(productId, prev + Number(item.received_qty || 0));
      });
    });

    const preparedItems = po.items.map((it: any) => {
      const orderedQty = Number(it.quantity || 0);
      const alreadyReceived = receivedByProduct.get(Number(it.product)) || 0;
      const maxReceivable = Math.max(orderedQty - alreadyReceived, 0);
      return {
        product: Number(it.product),
        ordered_qty: orderedQty,
        already_received: alreadyReceived,
        max_receivable: maxReceivable,
        received_qty: maxReceivable,
      };
    });

    setItems(preparedItems);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!poId || !warehouse) {
      setError("Please select both PO and warehouse.");
      return;
    }

    const invalid = items.find((it) => Number(it.received_qty) < 0 || Number(it.received_qty) > Number(it.max_receivable));
    if (invalid) {
      const productName = productNameMap[Number(invalid.product)] || `Product #${invalid.product}`;
      setError(`Invalid quantity for ${productName}. Max receivable is ${invalid.max_receivable}.`);
      return;
    }

    const finalItems = items
      .map((it) => ({ product: Number(it.product), received_qty: Number(it.received_qty) }))
      .filter((it) => it.received_qty > 0);

    if (finalItems.length === 0) {
      setError("Enter at least one item quantity greater than 0.");
      return;
    }

    setSaving(true);
    try {
      await purchasingService.createGRN({
        po: Number(poId),
        warehouse: Number(warehouse),
        items: finalItems,
      });
      navigate("/purchasing/movements");
    } catch (err: any) {
      setError(err?.response?.data?.items || err?.response?.data?.po || "Failed to create GRN.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Goods Receipt (GRN)</h1>
      <form onSubmit={submit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
            {String(error)}
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <select className="border rounded px-3 py-2" value={poId} onChange={(e) => onPoChange(e.target.value)}>
            <option value="">Select PO</option>
            {pos.map((p) => <option key={p.id} value={p.id}>PO#{p.id} - {p.supplier}</option>)}
          </select>
          <select className="border rounded px-3 py-2" value={warehouse} onChange={(e) => setWarehouse(e.target.value)}>
            <option value="">Select warehouse</option>
            {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
          </select>
        </div>

        <div className="bg-white border rounded-xl p-4 space-y-3">
          {items.map((it, i) => (
            <div key={i} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-center">
              <div className="text-sm text-gray-700">
                {productNameMap[Number(it.product)] || `Product #${it.product}`}
              </div>
              <div className="text-xs text-gray-500">
                Ordered: {it.ordered_qty} | Received: {it.already_received} | Max: {it.max_receivable}
              </div>
              <input
                className="border rounded px-3 py-2"
                type="number"
                min="0"
                max={it.max_receivable}
                value={it.received_qty}
                onChange={(e) => {
                  const v = e.target.value;
                  setItems((prev) =>
                    prev.map((x, idx) =>
                      idx === i ? { ...x, received_qty: Number(v) } : x
                    )
                  );
                }}
              />
              <div className="text-xs text-gray-500">Allowed up to {it.max_receivable}</div>
            </div>
          ))}
        </div>

        <button disabled={saving} className="px-4 py-2 rounded bg-blue-600 text-white">Create GRN</button>
      </form>
    </div>
  );
};

export default GRNForm;