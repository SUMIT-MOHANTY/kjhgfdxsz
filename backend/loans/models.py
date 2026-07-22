from django.db import models
from django.contrib.auth.models import User
from books.models import Book
from django.utils import timezone
from datetime import timedelta
from decimal import Decimal


class Loan(models.Model):
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('returned', 'Returned'),
        ('overdue', 'Overdue'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='loans')
    book = models.ForeignKey(Book, on_delete=models.CASCADE, related_name='loans')
    borrowed_date = models.DateTimeField(auto_now_add=True)
    due_date = models.DateTimeField()
    returned_date = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    fine_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    fine_paid = models.BooleanField(default=False)
    
    class Meta:
        ordering = ['-borrowed_date']
        
    def save(self, *args, **kwargs):
        if not self.due_date:
            self.due_date = timezone.now() + timedelta(days=14)
        super().save(*args, **kwargs)
    
    def calculate_fine(self):
        if self.status == 'returned' or not self.is_overdue():
            return Decimal('0.00')
        
        days_overdue = (timezone.now() - self.due_date).days
        if days_overdue > 0:
            fine = Decimal(str(days_overdue)) * Decimal('1.00')  # $1 per day
            self.fine_amount = fine
            self.save()
            return fine
        return Decimal('0.00')
    
    def is_overdue(self):
        return timezone.now() > self.due_date and self.status == 'active'
    
    def days_remaining(self):
        if self.status != 'active':
            return 0
        delta = self.due_date - timezone.now()
        return max(0, delta.days)
    
    def __str__(self):
        return f"{self.user.username} - {self.book.title} ({self.status})"


class LoanHistory(models.Model):
    loan = models.OneToOneField(Loan, on_delete=models.CASCADE, related_name='history')
    renewal_count = models.IntegerField(default=0)
    notifications_sent = models.IntegerField(default=0)
    last_notification_date = models.DateTimeField(null=True, blank=True)
    notes = models.TextField(blank=True)
    
    def __str__(self):
        return f"History for {self.loan}"