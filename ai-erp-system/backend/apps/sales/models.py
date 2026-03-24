from django.db import models
from django.core.validators import MinValueValidator
from decimal import Decimal
from apps.inventory.models import Product, Warehouse
from apps.customers.models import Customer

class SalesOrder(models.Model):
    STATUS = [
        ("DRAFT", "Draft"),
        ("CONFIRMED", "Confirmed"),
        ("PARTIALLY_DISPATCHED", "Partially Dispatched"),
        ("DISPATCHED", "Dispatched"),
        ("CANCELLED", "Cancelled"),
    ]
    customer = models.ForeignKey(
        Customer,
        on_delete=models.PROTECT,
        related_name="sales_orders",
        null=True,   
        blank=True,
    )
    warehouse = models.ForeignKey(Warehouse, on_delete=models.PROTECT, related_name="sales_orders")
    status = models.CharField(max_length=24, choices=STATUS, default="DRAFT")
    order_date = models.DateField(auto_now_add=True)
    expected_date = models.DateField(null=True, blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        customer_label = self.customer.name if self.customer else "No Customer"
        return f"SO#{self.id} - {customer_label}"


class SalesOrderItem(models.Model):
    sales_order = models.ForeignKey(SalesOrder, on_delete=models.CASCADE, related_name="items")
    product = models.ForeignKey(Product, on_delete=models.PROTECT)
    quantity = models.DecimalField(max_digits=12, decimal_places=2, validators=[MinValueValidator(Decimal("0.00"))])
    unit_price = models.DecimalField(max_digits=12, decimal_places=2, validators=[MinValueValidator(Decimal("0.00"))])
    discount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    tax_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0)


class Dispatch(models.Model):
    sales_order = models.ForeignKey(SalesOrder, on_delete=models.PROTECT, related_name="dispatches")
    warehouse = models.ForeignKey(Warehouse, on_delete=models.PROTECT, related_name="dispatches")
    reference = models.CharField(max_length=120, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"DSP#{self.id} for SO#{self.sales_order_id}"


class DispatchItem(models.Model):
    dispatch = models.ForeignKey(Dispatch, on_delete=models.CASCADE, related_name="items")
    product = models.ForeignKey(Product, on_delete=models.PROTECT)
    dispatched_qty = models.DecimalField(max_digits=12, decimal_places=2, validators=[MinValueValidator(Decimal("0.00"))])

