from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse

def home(request):
    return JsonResponse({"message": "ERP API Running Successfully"})

urlpatterns = [
    path('', home),
    path('admin/', admin.site.urls),
    path('api/inventory/', include('apps.inventory.urls')),
    path('api/chatbot/', include('apps.chatbot.urls')),  
    path("api/auth/", include("apps.authentication.urls")),
    path("api/users/", include("apps.users.urls")),
    path("api/sales/", include("apps.sales.urls")),
]