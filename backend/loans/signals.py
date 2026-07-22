from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone
from .models import Loan, LoanHistory

@receiver(post_save, sender=Loan)
def update_loan_status(sender, instance, **kwargs):
    # Update status to overdue if due date has passed
    if instance.status == 'active' and timezone.now() > instance.due_date:
        instance.status = 'overdue'
        instance.save(update_fields=['status'])
        
        # Create history record for overdue status
        LoanHistory.objects.create(
            loan=instance,
            action='OVERDUE',
            details=f'Loan became overdue on {timezone.now().strftime("%Y-%m-%d")}'
        )