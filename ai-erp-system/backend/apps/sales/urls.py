from django.urls import path
from .views import (
    SalesOrderListCreateView,
    SalesOrderDetailView,
    SalesOrderConfirmView,
    SalesOrderCancelView,
    SalesOrderDispatchSummaryView,
    DispatchListCreateView,
)

urlpatterns = [
    path("orders/", SalesOrderListCreateView.as_view()),
    path("orders/<int:pk>/", SalesOrderDetailView.as_view()),
    path("orders/<int:pk>/confirm/", SalesOrderConfirmView.as_view()),
    path("orders/<int:pk>/cancel/", SalesOrderCancelView.as_view()),
    path("orders/<int:pk>/dispatch-summary/", SalesOrderDispatchSummaryView.as_view()),
    path("dispatches/", DispatchListCreateView.as_view()),
]

