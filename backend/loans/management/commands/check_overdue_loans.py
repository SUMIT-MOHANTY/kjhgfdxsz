from django.core.management.base import BaseCommand
from django.utils import timezone
from django.core.mail import send_mail
from django.conf import settings
from loans.models import Loan, LoanHistory


class Command(BaseCommand):
    help = 'Check for overdue loans and send notifications'
    
    def handle(self, *args, **options):
        overdue_loans = Loan.objects.filter(
            status='active',
            due_date__lt=timezone.now()
        ).select_related('user', 'book')
        
        for loan in overdue_loans:
            # Update loan status
            loan.status = 'overdue'
            loan.calculate_fine()
            loan.save()
            
            # Send notification
            self.send_overdue_notification(loan)
            
            # Update notification history
            history = loan.history
            history.notifications_sent += 1
            history.last_notification_date = timezone.now()
            history.save()
            
            self.stdout.write(
                self.style.SUCCESS(
                    f'Processed overdue loan: {loan.user.username} - {loan.book.title}'
                )
            )
    
    def send_overdue_notification(self, loan):
        subject = 'Library Book Overdue - Action Required'
        message = f"""
        Dear {loan.user.first_name or loan.user.username},
        
        Your borrowed book "{loan.book.title}" was due on {loan.due_date.strftime('%Y-%m-%d')} 
        and is now overdue.
        
        Current fine amount: ${loan.fine_amount}
        
        Please return the book as soon as possible to avoid additional fines.
        
        Thank you,
        Library Management System
        """
        
        try:
            send_mail(
                subject,
                message,
                settings.DEFAULT_FROM_EMAIL,
                [loan.user.email],
                fail_silently=False,
            )
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(
                    f'Failed to send email to {loan.user.email}: {str(e)}'
                )
            )