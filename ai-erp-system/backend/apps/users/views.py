from django.contrib.auth.models import User
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from .serializers import UserManagementSerializer
from .permissions import IsAdminOrManager


class UserListView(generics.ListAPIView):
    queryset = User.objects.select_related("profile").all().order_by("-date_joined")
    serializer_class = UserManagementSerializer
    permission_classes = [IsAuthenticated, IsAdminOrManager]


class UserDetailView(generics.RetrieveUpdateAPIView):
    queryset = User.objects.select_related("profile").all()
    serializer_class = UserManagementSerializer
    permission_classes = [IsAuthenticated, IsAdminOrManager]