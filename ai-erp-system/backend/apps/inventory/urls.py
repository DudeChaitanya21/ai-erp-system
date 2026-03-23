from django.urls import path
from .views import (
    ProductListCreateView, ProductDetailView, CategoryListCreateView,
    SupplierListCreateView, WarehouseListCreateView, UnitListCreateView,
    PurchaseOrderListCreateView, PurchaseOrderDetailView, PurchaseOrderApproveView, PurchaseOrderCancelView,
    GoodsReceiptListCreateView, StockMovementListView, LowStockListView
)

urlpatterns = [
    path("products/", ProductListCreateView.as_view()),
    path("products/<int:pk>/", ProductDetailView.as_view()),
    path("categories/", CategoryListCreateView.as_view()),
    path("low-stock/", LowStockListView.as_view()),

    path("suppliers/", SupplierListCreateView.as_view()),
    path("warehouses/", WarehouseListCreateView.as_view()),
    path("units/", UnitListCreateView.as_view()),

    path("purchase-orders/", PurchaseOrderListCreateView.as_view()),
    path("purchase-orders/<int:pk>/", PurchaseOrderDetailView.as_view()),
    path("purchase-orders/<int:pk>/approve/", PurchaseOrderApproveView.as_view()),
    path("purchase-orders/<int:pk>/cancel/", PurchaseOrderCancelView.as_view()),

    path("goods-receipts/", GoodsReceiptListCreateView.as_view()),
    path("movements/", StockMovementListView.as_view()),
]