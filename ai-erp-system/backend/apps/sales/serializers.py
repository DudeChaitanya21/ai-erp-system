from django.db import transaction
from django.db.models import Sum
from rest_framework import serializers

from apps.inventory.models import StockBalance, StockMovement
from .models import SalesOrder, SalesOrderItem, Dispatch, DispatchItem


class SalesOrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = SalesOrderItem
        fields = ["id", "product", "quantity", "unit_price", "discount", "tax_rate"]


class SalesOrderSerializer(serializers.ModelSerializer):
    items = SalesOrderItemSerializer(many=True)
    customer_name = serializers.CharField(source="customer.name", read_only=True)

    class Meta:
        model = SalesOrder
        fields = [
            "id",
            "customer",
            "customer_name",
            "warehouse",
            "status",
            "order_date",
            "expected_date",
            "notes",
            "items",
        ]
        read_only_fields = ["status", "order_date", "customer_name"]

    def create(self, validated_data):
        items_data = validated_data.pop("items", [])
        order = SalesOrder.objects.create(**validated_data)
        for item in items_data:
            SalesOrderItem.objects.create(sales_order=order, **item)
        return order

    def update(self, instance, validated_data):
        items_data = validated_data.pop("items", None)
        if instance.status != "DRAFT" and items_data is not None:
            raise serializers.ValidationError("Cannot edit items unless order is in DRAFT.")
        for k, v in validated_data.items():
            setattr(instance, k, v)
        instance.save()
        if items_data is not None:
            instance.items.all().delete()
            for item in items_data:
                SalesOrderItem.objects.create(sales_order=instance, **item)
        return instance


class DispatchItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = DispatchItem
        fields = ["id", "product", "dispatched_qty"]


class DispatchSerializer(serializers.ModelSerializer):
    items = DispatchItemSerializer(many=True)

    class Meta:
        model = Dispatch
        fields = ["id", "sales_order", "warehouse", "reference", "created_at", "items"]
        read_only_fields = ["created_at"]

    # inside DispatchSerializer.validate
    def validate(self, attrs):
        so = attrs["sales_order"]

        # warehouse may be a model instance or a raw pk; normalize to id
        warehouse_val = attrs.get("warehouse")
        wh_id = getattr(warehouse_val, "id", None)
        if wh_id is None:
            try:
                wh_id = int(warehouse_val)
            except (TypeError, ValueError):
                raise serializers.ValidationError({"warehouse": "Invalid warehouse."})

        if so.status not in ("CONFIRMED", "PARTIALLY_DISPATCHED"):
            raise serializers.ValidationError({"sales_order": "Order must be CONFIRMED to dispatch."})

        if wh_id != so.warehouse_id:
            raise serializers.ValidationError({"warehouse": "Dispatch warehouse must match order warehouse."})

        items = attrs.get("items") or []
        if not items:
            raise serializers.ValidationError({"items": "At least one dispatch item is required."})

        return attrs

    def create(self, validated_data):
        items_data = validated_data.pop("items", [])
        so: SalesOrder = validated_data["sales_order"]

        with transaction.atomic():
            dsp = Dispatch.objects.create(**validated_data)

            for item in items_data:
                SalesOrderItem_obj = so.items.get(product=item["product"])
                already_dispatched = (
                    DispatchItem.objects.filter(dispatch__sales_order=so, product=item["product"])
                    .aggregate(total=Sum("dispatched_qty"))
                    .get("total")
                    or 0
                )
                pending = SalesOrderItem_obj.quantity - already_dispatched
                if item["dispatched_qty"] > pending:
                    raise serializers.ValidationError(
                        {"items": f"Dispatch exceeds pending qty for product {item['product'].id}."}
                    )

                # Stock check & update
                bal, _ = StockBalance.objects.select_for_update().get_or_create(
                    product=item["product"], warehouse=so.warehouse, defaults={"on_hand": 0}
                )
                if bal.on_hand < item["dispatched_qty"]:
                    raise serializers.ValidationError(
                        {"items": f"Insufficient stock for produc {item['product'].name}."}
                    )

                DispatchItem.objects.create(dispatch=dsp, **item)

                # Movement OUT
                StockMovement.objects.create(
                    product=item["product"],
                    warehouse=so.warehouse,
                    movement_type="OUT",
                    quantity=item["dispatched_qty"],
                    reference=f"DSP#{dsp.id}",
                )
                bal.on_hand = bal.on_hand - item["dispatched_qty"]
                bal.save(update_fields=["on_hand", "updated_at"])

            # Update SO status
            all_fully_dispatched = True
            for so_item in so.items.all():
                tot = (
                    DispatchItem.objects.filter(dispatch__sales_order=so, product=so_item.product)
                    .aggregate(total=Sum("dispatched_qty"))
                    .get("total")
                    or 0
                )
                if tot < so_item.quantity:
                    all_fully_dispatched = False
                    break

            so.status = "DISPATCHED" if all_fully_dispatched else "PARTIALLY_DISPATCHED"
            so.save(update_fields=["status"])

            return dsp

