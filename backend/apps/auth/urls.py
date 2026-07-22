from django.urls import path
from .views import BuildUserAuthenticationUiComponentsAPIView

urlpatterns = [
    path('', BuildUserAuthenticationUiComponentsAPIView.as_view(), name='auth-api'),
]
