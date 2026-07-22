from django.contrib import admin
from .models import Loan, LoanHistory


@admin.register(Loan)
class LoanAdmin(admin.ModelAdmin):
    list_display = [
        'user', 'book', 'borrowed_date', 'due_date', 
        'status', 'fine_amount', 'is_overdue'
    ]
    list_filter = ['status', 'borrowed_date', 'due_date']
    search_fields = ['user__username', 'book__title', 'book__isbn']
    readonly_fields = ['borrowed_date', 'fine_amount', 'is_overdue']
    date_hierarchy = 'borrowed_date'
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user', 'book')


@admin.register(LoanHistory)
class LoanHistoryAdmin(admin.ModelAdmin):
    list_display = [
        'loan', 'renewal_count', 'notifications_sent', 
        'last_notification_date'
    ]
    readonly_fields = ['loan']
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related(
            'loan__user', 'loan__book'
        )