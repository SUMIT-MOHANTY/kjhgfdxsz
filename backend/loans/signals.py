from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone
from .models import Loan, LoanHistory


@receiver(post_save, sender=Loan)
def create_loan_history(sender, instance, created, **kwargs):
    if created:
        LoanHistory.objects.get_or_create(loan=instance)


@receiver(post_save, sender=Loan)
def update_overdue_status(sender, instance, **kwargs):
    if instance.status == 'active' and instance.is_overdue():
        instance.status = 'overdue'
        instance.save(update_fields=['status'])