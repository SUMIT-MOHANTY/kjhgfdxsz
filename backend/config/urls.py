from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('apps.auth.urls')),
    path('api/books/', include('apps.books.urls')),
    path('api/core/', include('apps.core.urls')),
]
