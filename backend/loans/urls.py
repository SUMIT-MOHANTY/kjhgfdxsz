from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import LoanViewSet, LoanHistoryViewSet

router = DefaultRouter()
router.register(r'loans', LoanViewSet, basename='loan')
router.register(r'loan-history', LoanHistoryViewSet, basename='loanhistory')

urlpatterns = [
    path('api/', include(router.urls)),
]