from rest_framework import status
from django.db import models
from rest_framework.generics import ListCreateAPIView, RetrieveUpdateDestroyAPIView
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from apps.users.permissions import IsAdminOrManager
from .models import (
    Product, Category, Supplier, Warehouse, Unit,
    PurchaseOrder, GoodsReceipt, StockMovement
)
from .serializers import (
    ProductSerializer, CategorySerializer, SupplierSerializer, WarehouseSerializer, UnitSerializer,
    PurchaseOrderSerializer, GoodsReceiptSerializer, StockMovementSerializer
)

class LowStockListView(ListCreateAPIView):
    serializer_class = ProductSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Product.objects.filter(is_active=True).filter(stock__lte=models.F("min_stock_level")).order_by("stock")


class ProductListCreateView(ListCreateAPIView):
    queryset = Product.objects.filter(is_active=True)
    serializer_class = ProductSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ["category", "is_active"]
    search_fields = ["name", "sku", "barcode"]
    ordering_fields = ["name", "price", "stock", "created_at"]
    ordering = ["-created_at"]


class ProductDetailView(RetrieveUpdateDestroyAPIView):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [IsAuthenticated]

    def perform_destroy(self, instance):
        instance.is_active = False
        instance.save()


class CategoryListCreateView(ListCreateAPIView):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [IsAuthenticated]


class SupplierListCreateView(ListCreateAPIView):
    queryset = Supplier.objects.filter(is_active=True)
    serializer_class = SupplierSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ["name", "email", "phone"]
    ordering = ["name"]


class WarehouseListCreateView(ListCreateAPIView):
    queryset = Warehouse.objects.filter(is_active=True)
    serializer_class = WarehouseSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ["name", "code"]
    ordering = ["name"]


class UnitListCreateView(ListCreateAPIView):
    queryset = Unit.objects.all().order_by("code")
    serializer_class = UnitSerializer
    permission_classes = [IsAuthenticated]


class PurchaseOrderListCreateView(ListCreateAPIView):
    queryset = PurchaseOrder.objects.all().select_related("supplier", "warehouse")
    serializer_class = PurchaseOrderSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ["status", "supplier", "warehouse"]
    search_fields = ["notes", "supplier__name", "warehouse__name"]
    ordering = ["-created_at"]


class PurchaseOrderDetailView(RetrieveUpdateDestroyAPIView):
    queryset = PurchaseOrder.objects.all().select_related("supplier", "warehouse")
    serializer_class = PurchaseOrderSerializer
    permission_classes = [IsAuthenticated]

    def update(self, request, *args, **kwargs):
        po: PurchaseOrder = self.get_object()
        # Disallow editing items when not in DRAFT
        if po.status != "DRAFT" and "items" in request.data:
            return Response(
                {"detail": "Items cannot be modified unless PO is in DRAFT."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return super().update(request, *args, **kwargs)


class PurchaseOrderApproveView(APIView):
    permission_classes = [IsAuthenticated, IsAdminOrManager]

    def post(self, request, pk):
        try:
            po = PurchaseOrder.objects.get(pk=pk)
        except PurchaseOrder.DoesNotExist:
            return Response({"detail": "Purchase order not found."}, status=status.HTTP_404_NOT_FOUND)

        if po.status == "CANCELLED":
            return Response(
                {"detail": "Cancelled purchase order cannot be approved."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if po.status == "RECEIVED":
            return Response(
                {"detail": "Received purchase order is already closed."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        po.status = "APPROVED"
        po.save(update_fields=["status"])
        return Response({"detail": "Purchase order approved.", "status": po.status}, status=status.HTTP_200_OK)


class PurchaseOrderCancelView(APIView):
    permission_classes = [IsAuthenticated, IsAdminOrManager]

    def post(self, request, pk):
        try:
            po = PurchaseOrder.objects.get(pk=pk)
        except PurchaseOrder.DoesNotExist:
            return Response({"detail": "Purchase order not found."}, status=status.HTTP_404_NOT_FOUND)

        if po.status == "RECEIVED":
            return Response(
                {"detail": "Received purchase order cannot be cancelled."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        po.status = "CANCELLED"
        po.save(update_fields=["status"])
        return Response({"detail": "Purchase order cancelled.", "status": po.status}, status=status.HTTP_200_OK)


class GoodsReceiptListCreateView(ListCreateAPIView):
    queryset = GoodsReceipt.objects.all().select_related("po", "warehouse")
    serializer_class = GoodsReceiptSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ["po", "warehouse"]
    ordering = ["-created_at"]


class StockMovementListView(ListCreateAPIView):
    queryset = StockMovement.objects.all().select_related("product", "warehouse")
    serializer_class = StockMovementSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ["movement_type", "warehouse", "product"]
    search_fields = ["reference", "product__name", "warehouse__name"]
    ordering = ["-created_at"]