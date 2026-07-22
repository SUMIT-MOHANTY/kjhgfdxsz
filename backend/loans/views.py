from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.db import transaction
from .models import Loan, LoanHistory
from .serializers import (
    LoanSerializer, BorrowBookSerializer, ReturnBookSerializer,
    LoanHistorySerializer
)
from books.models import Book
from datetime import timedelta

class LoanViewSet(viewsets.ModelViewSet):
    serializer_class = LoanSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = Loan.objects.select_related('user', 'book').all()
        
        # Filter by user if specified
        user_id = self.request.query_params.get('user_id')
        if user_id:
            queryset = queryset.filter(user_id=user_id)
        
        # Filter by status
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        # Filter overdue loans
        overdue = self.request.query_params.get('overdue')
        if overdue == 'true':
            queryset = queryset.filter(
                status='active',
                due_date__lt=timezone.now()
            )
        
        return queryset
    
    @action(detail=False, methods=['post'])
    def borrow_book(self, request):
        serializer = BorrowBookSerializer(data=request.data)
        if serializer.is_valid():
            book_id = serializer.validated_data['book_id']
            loan_period = serializer.validated_data['loan_period_days']
            
            # Check if user has any overdue books
            overdue_loans = Loan.objects.filter(
                user=request.user,
                status='active',
                due_date__lt=timezone.now()
            )
            if overdue_loans.exists():
                return Response(
                    {'error': 'Cannot borrow books while having overdue items'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Check borrowing limit (max 5 active loans)
            active_loans = Loan.objects.filter(
                user=request.user,
                status='active'
            ).count()
            if active_loans >= 5:
                return Response(
                    {'error': 'Maximum borrowing limit (5 books) reached'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            with transaction.atomic():
                book = get_object_or_404(Book, id=book_id)
                
                if book.available_copies <= 0:
                    return Response(
                        {'error': 'Book not available'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                # Create loan
                loan = Loan.objects.create(
                    user=request.user,
                    book=book,
                    due_date=timezone.now() + timedelta(days=loan_period)
                )
                
                # Update book availability
                book.available_copies -= 1
                book.save()
                
                # Create history record
                LoanHistory.objects.create(
                    loan=loan,
                    action='BORROWED',
                    details=f'Book borrowed for {loan_period} days'
                )
                
                serializer = LoanSerializer(loan)
                return Response(serializer.data, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['post'])
    def return_book(self, request):
        serializer = ReturnBookSerializer(data=request.data)
        if serializer.is_valid():
            loan_id = serializer.validated_data['loan_id']
            
            with transaction.atomic():
                loan = get_object_or_404(
                    Loan,
                    id=loan_id,
                    user=request.user,
                    status='active'
                )
                
                # Calculate fine if overdue
                fine_amount = loan.calculate_fine()
                
                # Return the book
                loan.return_book()
                
                # Create history record
                details = f'Book returned'
                if fine_amount > 0:
                    details += f' with fine: ${fine_amount}'
                
                LoanHistory.objects.create(
                    loan=loan,
                    action='RETURNED',
                    details=details
                )
                
                serializer = LoanSerializer(loan)
                return Response(serializer.data)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def renew(self, request, pk=None):
        loan = get_object_or_404(
            Loan,
            pk=pk,
            user=request.user,
            status='active'
        )
        
        if loan.renew():
            LoanHistory.objects.create(
                loan=loan,
                action='RENEWED',
                details=f'Loan renewed. New due date: {loan.due_date.strftime("%Y-%m-%d")}'
            )
            
            serializer = LoanSerializer(loan)
            return Response(serializer.data)
        else:
            return Response(
                {'error': 'Cannot renew this loan'},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=False, methods=['get'])
    def my_loans(self, request):
        loans = self.get_queryset().filter(user=request.user)
        serializer = LoanSerializer(loans, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def overdue_notifications(self, request):
        overdue_loans = Loan.objects.filter(
            status='active',
            due_date__lt=timezone.now()
        ).select_related('user', 'book')
        
        notifications = []
        for loan in overdue_loans:
            days_overdue = (timezone.now() - loan.due_date).days
            fine_amount = loan.calculate_fine()
            
            notifications.append({
                'loan_id': loan.id,
                'user': {
                    'id': loan.user.id,
                    'username': loan.user.username,
                    'email': loan.user.email
                },
                'book': {
                    'id': loan.book.id,
                    'title': loan.book.title,
                    'isbn': loan.book.isbn
                },
                'days_overdue': days_overdue,
                'fine_amount': str(fine_amount),
                'due_date': loan.due_date
            })
        
        return Response(notifications)
    
    @action(detail=False, methods=['get'])
    def statistics(self, request):
        from django.db.models import Count, Avg, Sum
        
        stats = {
            'total_loans': Loan.objects.count(),
            'active_loans': Loan.objects.filter(status='active').count(),
            'overdue_loans': Loan.objects.filter(
                status='active',
                due_date__lt=timezone.now()
            ).count(),
            'total_fines': Loan.objects.aggregate(
                total=Sum('fine_amount')
            )['total'] or 0,
            'unpaid_fines': Loan.objects.filter(
                fine_paid=False
            ).aggregate(
                total=Sum('fine_amount')
            )['total'] or 0
        }
        
        return Response(stats)

class LoanHistoryViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = LoanHistorySerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = LoanHistory.objects.select_related('loan__user', 'loan__book').all()
        
        # Filter by loan if specified
        loan_id = self.request.query_params.get('loan_id')
        if loan_id:
            queryset = queryset.filter(loan_id=loan_id)
        
        # Filter by user
        user_id = self.request.query_params.get('user_id')
        if user_id:
            queryset = queryset.filter(loan__user_id=user_id)
        
        return queryset