from django.urls import path
from .views import ApiIntegrationAndEndToEndTestingAPIView

urlpatterns = [
    path('', ApiIntegrationAndEndToEndTestingAPIView.as_view(), name='core-api'),
]
