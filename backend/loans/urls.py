from django.urls import path
from . import views

app_name = 'loans'

urlpatterns = [
    path('', views.LoanListView.as_view(), name='loan-list'),
    path('<int:pk>/', views.LoanDetailView.as_view(), name='loan-detail'),
    path('active/', views.ActiveLoansView.as_view(), name='active-loans'),
    path('history/', views.LoanHistoryView.as_view(), name='loan-history'),
    path('overdue/', views.overdue_loans, name='overdue-loans'),
    path('borrow/', views.borrow_book, name='borrow-book'),
    path('return/', views.return_book, name='return-book'),
    path('<int:loan_id>/renew/', views.renew_loan, name='renew-loan'),
]