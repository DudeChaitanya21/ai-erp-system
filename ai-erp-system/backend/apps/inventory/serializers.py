from django.db import transaction
from django.db.models import Sum
from rest_framework import serializers
from .models import (
    Product, Category, Supplier, Warehouse, Unit,
    PurchaseOrder, PurchaseOrderItem,
    GoodsReceipt, GoodsReceiptItem, StockMovement, StockBalance, Transfer, TransferItem
)


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = "__all__"


class ProductSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source="category.name", read_only=True)
    is_low_stock = serializers.BooleanField(read_only=True)
    profit_margin = serializers.FloatField(read_only=True)

    class Meta:
        model = Product
        fields = "__all__"
        read_only_fields = ["created_at", "updated_at"]


class SupplierSerializer(serializers.ModelSerializer):
    class Meta:
        model = Supplier
        fields = "__all__"


class WarehouseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Warehouse
        fields = "__all__"


class UnitSerializer(serializers.ModelSerializer):
    class Meta:
        model = Unit
        fields = "__all__"


class PurchaseOrderItemSerializer(serializers.ModelSerializer):
    line_total = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)

    class Meta:
        model = PurchaseOrderItem
        fields = ["id", "product", "unit", "quantity", "unit_price", "line_total"]


class PurchaseOrderSerializer(serializers.ModelSerializer):
    items = PurchaseOrderItemSerializer(many=True)

    class Meta:
        model = PurchaseOrder
        fields = ["id", "supplier", "warehouse", "status", "order_date", "expected_date", "notes", "items"]

    def create(self, validated_data):
        items_data = validated_data.pop("items", [])
        po = PurchaseOrder.objects.create(**validated_data)
        for item in items_data:
            PurchaseOrderItem.objects.create(po=po, **item)
        return po

    def update(self, instance, validated_data):
        items_data = validated_data.pop("items", None)
        for k, v in validated_data.items():
            setattr(instance, k, v)
        instance.save()

        if items_data is not None:
            instance.items.all().delete()
            for item in items_data:
                PurchaseOrderItem.objects.create(po=instance, **item)

        return instance


class GoodsReceiptItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = GoodsReceiptItem
        fields = ["id", "product", "unit", "received_qty"]


class GoodsReceiptSerializer(serializers.ModelSerializer):
    items = GoodsReceiptItemSerializer(many=True)

    class Meta:
        model = GoodsReceipt
        fields = ["id", "po", "warehouse", "receipt_date", "reference", "notes", "items"]

    def validate(self, attrs):
        po = attrs.get("po")
        items = attrs.get("items", [])

        if not po:
            raise serializers.ValidationError({"po": "Purchase order is required."})

        if po.status != "APPROVED":
            raise serializers.ValidationError({"po": "Only APPROVED purchase orders can be received."})

        po_items = {po_item.product_id: po_item for po_item in po.items.all()}
        if not po_items:
            raise serializers.ValidationError({"po": "Purchase order has no items."})

        if not items:
            raise serializers.ValidationError({"items": "At least one receipt item is required."})

        for item in items:
            product = item["product"]
            product_id = product.id

            if product_id not in po_items:
                raise serializers.ValidationError(
                    {"items": f"Product {product_id} is not present in this purchase order."}
                )

            ordered_qty = po_items[product_id].quantity
            previously_received = (
                GoodsReceiptItem.objects.filter(grn__po=po, product=product)
                .aggregate(total=Sum("received_qty"))
                .get("total")
                or 0
            )
            new_received = item["received_qty"]

            if previously_received + new_received > ordered_qty:
                raise serializers.ValidationError(
                    {
                        "items": (
                            f"Received quantity for product {product_id} exceeds ordered quantity. "
                            f"Ordered={ordered_qty}, received={previously_received}, new={new_received}."
                        )
                    }
                )

        return attrs

    def create(self, validated_data):
        items_data = validated_data.pop("items", [])
        po = validated_data["po"]

        with transaction.atomic():
            grn = GoodsReceipt.objects.create(**validated_data)

            for item in items_data:
                GoodsReceiptItem.objects.create(grn=grn, **item)
                movement = StockMovement.objects.create(
                    product=item["product"],
                    warehouse=grn.warehouse,
                    movement_type="IN",
                    quantity=item["received_qty"],
                    reference=f"GRN#{grn.id}",
                )
                # Update balance
                bal, _ = StockBalance.objects.select_for_update().get_or_create(
                    product=item["product"], warehouse=grn.warehouse, defaults={"on_hand": 0}
                )
                bal.on_hand = (bal.on_hand or 0) + item["received_qty"]
                bal.save()

            # Mark PO RECEIVED only when all PO item quantities are fully received.
            all_fully_received = True
            for po_item in po.items.all():
                received_total = (
                    GoodsReceiptItem.objects.filter(grn__po=po, product=po_item.product)
                    .aggregate(total=Sum("received_qty"))
                    .get("total")
                    or 0
                )
                if received_total < po_item.quantity:
                    all_fully_received = False
                    break

            po.status = "RECEIVED" if all_fully_received else "APPROVED"
            po.save(update_fields=["status"])

            return grn


class TransferItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = TransferItem
        fields = ["id", "product", "unit", "quantity"]


class TransferSerializer(serializers.ModelSerializer):
    items = TransferItemSerializer(many=True)

    class Meta:
        model = Transfer
        fields = ["id", "source", "destination", "reference", "notes", "created_at", "items"]
        read_only_fields = ["created_at"]

    def validate(self, attrs):
        if attrs["source"] == attrs["destination"]:
            raise serializers.ValidationError({"destination": "Source and destination must be different."})
        return attrs

    def create(self, validated_data):
        items_data = validated_data.pop("items", [])
        source = validated_data["source"]
        destination = validated_data["destination"]

        with transaction.atomic():
            transfer = Transfer.objects.create(**validated_data)
            for item in items_data:
                TransferItem.objects.create(transfer=transfer, **item)

                # Stock check at source (no negative allowed)
                src_bal, _ = StockBalance.objects.select_for_update().get_or_create(
                    product=item["product"], warehouse=source, defaults={"on_hand": 0}
                )
                if (src_bal.on_hand or 0) < item["quantity"]:
                    raise serializers.ValidationError(
                        {"items": f"Insufficient stock for product {item['product'].id} at source warehouse."}
                    )

                # OUT from source
                StockMovement.objects.create(
                    product=item["product"],
                    warehouse=source,
                    movement_type="OUT",
                    quantity=item["quantity"],
                    reference=f"XFER#{transfer.id}",
                )
                src_bal.on_hand = (src_bal.on_hand or 0) - item["quantity"]
                src_bal.save()

                # IN to destination
                StockMovement.objects.create(
                    product=item["product"],
                    warehouse=destination,
                    movement_type="IN",
                    quantity=item["quantity"],
                    reference=f"XFER#{transfer.id}",
                )
                dst_bal, _ = StockBalance.objects.select_for_update().get_or_create(
                    product=item["product"], warehouse=destination, defaults={"on_hand": 0}
                )
                dst_bal.on_hand = (dst_bal.on_hand or 0) + item["quantity"]
                dst_bal.save()

            return transfer


class StockMovementSerializer(serializers.ModelSerializer):
    class Meta:
        model = StockMovement
        fields = "__all__"