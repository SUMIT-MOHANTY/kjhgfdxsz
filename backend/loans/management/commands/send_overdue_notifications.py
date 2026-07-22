from django.core.management.base import BaseCommand
from django.core.mail import send_mail
from django.conf import settings
from django.utils import timezone
from loans.models import Loan

class Command(BaseCommand):
    help = 'Send email notifications for overdue loans'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be sent without actually sending emails'
        )
    
    def handle(self, *args, **options):
        overdue_loans = Loan.objects.filter(
            status='active',
            due_date__lt=timezone.now()
        ).select_related('user', 'book')
        
        sent_count = 0
        for loan in overdue_loans:
            days_overdue = (timezone.now() - loan.due_date).days
            fine_amount = loan.calculate_fine()
            
            subject = f'Overdue Book: {loan.book.title}'
            message = f'''Dear {loan.user.first_name or loan.user.username},

Your borrowed book "{loan.book.title}" is {days_overdue} days overdue.

Due Date: {loan.due_date.strftime('%Y-%m-%d')}
Fine Amount: ${fine_amount}

Please return the book as soon as possible to avoid additional fines.

Thank you,
Library Management System'''
            
            if options['dry_run']:
                self.stdout.write(
                    f'Would send to {loan.user.email}: {subject}'
                )
            else:
                try:
                    send_mail(
                        subject,
                        message,
                        settings.DEFAULT_FROM_EMAIL,
                        [loan.user.email],
                        fail_silently=False
                    )
                    sent_count += 1
                except Exception as e:
                    self.stderr.write(
                        f'Failed to send email to {loan.user.email}: {str(e)}'
                    )
        
        if not options['dry_run']:
            self.stdout.write(
                self.style.SUCCESS(
                    f'Successfully sent {sent_count} overdue notifications'
                )
            )
        else:
            self.stdout.write(
                f'Dry run: Would send {overdue_loans.count()} notifications'
            )