from django.contrib import admin
from .models import Loan, LoanHistory

@admin.register(Loan)
class LoanAdmin(admin.ModelAdmin):
    list_display = [
        'id', 'user', 'book', 'borrowed_date', 'due_date', 
        'status', 'fine_amount', 'renewal_count'
    ]
    list_filter = ['status', 'borrowed_date', 'due_date']
    search_fields = ['user__username', 'book__title', 'book__isbn']
    readonly_fields = ['borrowed_date', 'fine_amount']
    
    actions = ['mark_returned', 'calculate_fines']
    
    def mark_returned(self, request, queryset):
        count = 0
        for loan in queryset.filter(status='active'):
            loan.return_book()
            count += 1
        self.message_user(request, f'{count} loans marked as returned.')
    mark_returned.short_description = 'Mark selected loans as returned'
    
    def calculate_fines(self, request, queryset):
        count = 0
        for loan in queryset:
            loan.calculate_fine()
            loan.save()
            count += 1
        self.message_user(request, f'Fines calculated for {count} loans.')
    calculate_fines.short_description = 'Recalculate fines for selected loans'

@admin.register(LoanHistory)
class LoanHistoryAdmin(admin.ModelAdmin):
    list_display = ['id', 'loan', 'action', 'timestamp']
    list_filter = ['action', 'timestamp']
    search_fields = ['loan__user__username', 'loan__book__title', 'action']
    readonly_fields = ['timestamp']