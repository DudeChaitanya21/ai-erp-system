from django.db import models
from django.db.models import Sum
from rest_framework import status
from rest_framework.generics import ListCreateAPIView, RetrieveUpdateDestroyAPIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter

from apps.users.permissions import IsAdminOrManager
from .models import SalesOrder, Dispatch
from .serializers import SalesOrderSerializer, DispatchSerializer


class SalesOrderListCreateView(ListCreateAPIView):
    queryset = SalesOrder.objects.all().order_by("-created_at")
    serializer_class = SalesOrderSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ["status", "warehouse"]
    search_fields = ["customer_name", "notes"]
    ordering = ["-created_at"]


class SalesOrderDetailView(RetrieveUpdateDestroyAPIView):
    queryset = SalesOrder.objects.all()
    serializer_class = SalesOrderSerializer
    permission_classes = [IsAuthenticated]

    def update(self, request, *args, **kwargs):
        so: SalesOrder = self.get_object()
        if so.status != "DRAFT" and "items" in request.data:
            return Response({"detail": "Items cannot be modified unless order is in DRAFT."}, status=400)
        return super().update(request, *args, **kwargs)


class SalesOrderConfirmView(APIView):
    permission_classes = [IsAuthenticated, IsAdminOrManager]

    def post(self, request, pk):
        try:
            so = SalesOrder.objects.get(pk=pk)
        except SalesOrder.DoesNotExist:
            return Response({"detail": "Sales order not found."}, status=404)
        if so.status not in ("DRAFT",):
            return Response({"detail": "Only DRAFT orders can be confirmed."}, status=400)
        if so.items.count() == 0:
            return Response({"detail": "Order must have at least one item."}, status=400)
        so.status = "CONFIRMED"
        so.save(update_fields=["status"])
        return Response({"detail": "Sales order confirmed.", "status": so.status})


class SalesOrderCancelView(APIView):
    permission_classes = [IsAuthenticated, IsAdminOrManager]

    def post(self, request, pk):
        try:
            so = SalesOrder.objects.get(pk=pk)
        except SalesOrder.DoesNotExist:
            return Response({"detail": "Sales order not found."}, status=404)
        if so.status == "DISPATCHED":
            return Response({"detail": "Dispatched order cannot be cancelled."}, status=400)
        so.status = "CANCELLED"
        so.save(update_fields=["status"])
        return Response({"detail": "Sales order cancelled.", "status": so.status})


class SalesOrderDispatchSummaryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            so = SalesOrder.objects.get(pk=pk)
        except SalesOrder.DoesNotExist:
            return Response({"detail": "Sales order not found."}, status=404)

        lines = []
        for so_item in so.items.select_related("product"):
            dispatched = (
                Dispatch.objects.filter(sales_order=so)
                .values("items__product")
                .filter(items__product=so_item.product)
                .aggregate(total=Sum("items__dispatched_qty"))
                .get("total")
                or 0
            )
            pending = float(so_item.quantity - dispatched)
            lines.append(
                {
                    "product_id": so_item.product_id,
                    "product_name": so_item.product.name,
                    "ordered": float(so_item.quantity),
                    "dispatched": float(dispatched),
                    "pending": max(pending, 0.0),
                }
            )
        return Response({"sales_order": so.id, "warehouse": so.warehouse_id, "lines": lines})


class DispatchListCreateView(ListCreateAPIView):
    queryset = Dispatch.objects.all().order_by("-created_at")
    serializer_class = DispatchSerializer
    permission_classes = [IsAuthenticated, IsAdminOrManager]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ["sales_order", "warehouse"]
    ordering = ["-created_at"]

