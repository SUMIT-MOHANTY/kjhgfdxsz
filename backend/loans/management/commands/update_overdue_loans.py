from django.core.management.base import BaseCommand
from django.utils import timezone
from loans.models import Loan, LoanHistory

class Command(BaseCommand):
    help = 'Update overdue loan statuses and calculate fines'
    
    def handle(self, *args, **options):
        # Find loans that are overdue but still marked as active
        overdue_loans = Loan.objects.filter(
            status='active',
            due_date__lt=timezone.now()
        )
        
        updated_count = 0
        for loan in overdue_loans:
            loan.status = 'overdue'
            loan.calculate_fine()
            loan.save()
            
            # Create history record
            LoanHistory.objects.create(
                loan=loan,
                action='OVERDUE_UPDATE',
                details=f'Status updated to overdue. Fine: ${loan.fine_amount}'
            )
            
            updated_count += 1
        
        self.stdout.write(
            self.style.SUCCESS(
                f'Successfully updated {updated_count} overdue loans'
            )
        )