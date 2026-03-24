from django.contrib import admin
from .models import SalesOrder, SalesOrderItem, Dispatch, DispatchItem

class SalesOrderItemInline(admin.TabularInline):
    model = SalesOrderItem
    extra = 0

@admin.register(SalesOrder)
class SalesOrderAdmin(admin.ModelAdmin):
    list_display = ("id", "customer", "warehouse", "status", "order_date")
    list_filter = ("status", "warehouse")
    search_fields = ("customer__name", "notes")
    inlines = [SalesOrderItemInline]

class DispatchItemInline(admin.TabularInline):
    model = DispatchItem
    extra = 0

@admin.register(Dispatch)
class DispatchAdmin(admin.ModelAdmin):
    list_display = ("id", "sales_order", "warehouse", "created_at")
    list_filter = ("warehouse",)
    inlines = [DispatchItemInline]