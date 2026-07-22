from django.db import models
from django.contrib.auth.models import User
from books.models import Book
from django.utils import timezone
from datetime import timedelta
from decimal import Decimal

class Loan(models.Model):
    LOAN_STATUS_CHOICES = [
        ('active', 'Active'),
        ('returned', 'Returned'),
        ('overdue', 'Overdue'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='loans')
    book = models.ForeignKey(Book, on_delete=models.CASCADE, related_name='loans')
    borrowed_date = models.DateTimeField(auto_now_add=True)
    due_date = models.DateTimeField()
    returned_date = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=10, choices=LOAN_STATUS_CHOICES, default='active')
    fine_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    fine_paid = models.BooleanField(default=False)
    renewal_count = models.IntegerField(default=0)
    max_renewals = models.IntegerField(default=2)
    
    class Meta:
        db_table = 'loans'
        ordering = ['-borrowed_date']
    
    def save(self, *args, **kwargs):
        if not self.due_date:
            self.due_date = timezone.now() + timedelta(days=14)
        super().save(*args, **kwargs)
    
    def calculate_fine(self):
        if self.status == 'returned' and self.returned_date:
            overdue_days = max(0, (self.returned_date - self.due_date).days)
        elif self.status in ['active', 'overdue']:
            overdue_days = max(0, (timezone.now() - self.due_date).days)
        else:
            overdue_days = 0
        
        fine_per_day = Decimal('0.50')
        self.fine_amount = Decimal(overdue_days) * fine_per_day
        return self.fine_amount
    
    def is_overdue(self):
        return timezone.now() > self.due_date and self.status == 'active'
    
    def can_renew(self):
        return (
            self.status == 'active' and
            self.renewal_count < self.max_renewals and
            not self.is_overdue()
        )
    
    def renew(self):
        if self.can_renew():
            self.due_date = self.due_date + timedelta(days=14)
            self.renewal_count += 1
            self.save()
            return True
        return False
    
    def return_book(self):
        self.returned_date = timezone.now()
        self.status = 'returned'
        self.calculate_fine()
        self.book.available_copies += 1
        self.book.save()
        self.save()
    
    def __str__(self):
        return f'{self.user.username} - {self.book.title} ({self.status})'

class LoanHistory(models.Model):
    loan = models.ForeignKey(Loan, on_delete=models.CASCADE, related_name='history')
    action = models.CharField(max_length=50)
    timestamp = models.DateTimeField(auto_now_add=True)
    details = models.TextField(blank=True)
    
    class Meta:
        db_table = 'loan_history'
        ordering = ['-timestamp']
    
    def __str__(self):
        return f'{self.loan} - {self.action} at {self.timestamp}'