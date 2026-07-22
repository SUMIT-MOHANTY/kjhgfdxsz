from django.urls import path
from .views import BuildBookCatalogBackendApisAPIView

urlpatterns = [
    path('', BuildBookCatalogBackendApisAPIView.as_view(), name='books-api'),
]
