from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.db import transaction
from .models import Loan, LoanHistory
from .serializers import (
    LoanSerializer, LoanHistorySerializer, 
    BorrowBookSerializer, ReturnBookSerializer
)
from books.models import Book


class LoanListView(generics.ListAPIView):
    serializer_class = LoanSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Loan.objects.filter(user=self.request.user)


class LoanDetailView(generics.RetrieveAPIView):
    serializer_class = LoanSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Loan.objects.filter(user=self.request.user)


class ActiveLoansView(generics.ListAPIView):
    serializer_class = LoanSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Loan.objects.filter(user=self.request.user, status='active')


class LoanHistoryView(generics.ListAPIView):
    serializer_class = LoanSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Loan.objects.filter(user=self.request.user).exclude(status='active')


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def borrow_book(request):
    serializer = BorrowBookSerializer(data=request.data)
    
    if serializer.is_valid():
        book_id = serializer.validated_data['book_id']
        due_date = serializer.validated_data.get('due_date')
        
        # Check if user already has an active loan for this book
        existing_loan = Loan.objects.filter(
            user=request.user, 
            book_id=book_id, 
            status='active'
        ).first()
        
        if existing_loan:
            return Response(
                {'error': 'You already have an active loan for this book.'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        with transaction.atomic():
            book = Book.objects.select_for_update().get(id=book_id)
            
            if book.available_copies <= 0:
                return Response(
                    {'error': 'Book is not available for borrowing.'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Create loan
            loan = Loan.objects.create(
                user=request.user,
                book=book,
                due_date=due_date
            )
            
            # Create loan history
            LoanHistory.objects.create(loan=loan)
            
            # Update book availability
            book.available_copies -= 1
            book.save()
            
            return Response(
                LoanSerializer(loan).data, 
                status=status.HTTP_201_CREATED
            )
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def return_book(request):
    serializer = ReturnBookSerializer(data=request.data)
    
    if serializer.is_valid():
        loan_id = serializer.validated_data['loan_id']
        
        with transaction.atomic():
            loan = get_object_or_404(
                Loan.objects.select_for_update(), 
                id=loan_id, 
                user=request.user
            )
            
            if loan.status != 'active':
                return Response(
                    {'error': 'This loan is not active.'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Calculate fine if overdue
            fine = loan.calculate_fine()
            
            # Update loan
            loan.returned_date = timezone.now()
            loan.status = 'returned'
            loan.save()
            
            # Update book availability
            book = loan.book
            book.available_copies += 1
            book.save()
            
            response_data = LoanSerializer(loan).data
            if fine > 0:
                response_data['message'] = f'Book returned successfully. Fine amount: ${fine}'
            else:
                response_data['message'] = 'Book returned successfully.'
            
            return Response(response_data, status=status.HTTP_200_OK)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def overdue_loans(request):
    loans = Loan.objects.filter(
        user=request.user, 
        status='active',
        due_date__lt=timezone.now()
    )
    
    # Update status and calculate fines
    for loan in loans:
        loan.status = 'overdue'
        loan.calculate_fine()
        loan.save()
    
    serializer = LoanSerializer(loans, many=True)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def renew_loan(request, loan_id):
    loan = get_object_or_404(Loan, id=loan_id, user=request.user)
    
    if loan.status != 'active':
        return Response(
            {'error': 'Only active loans can be renewed.'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Check renewal limit
    history = loan.history
    if history.renewal_count >= 2:
        return Response(
            {'error': 'Maximum renewal limit reached.'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Extend due date by 14 days
    from datetime import timedelta
    loan.due_date = loan.due_date + timedelta(days=14)
    loan.save()
    
    # Update history
    history.renewal_count += 1
    history.save()
    
    return Response(
        LoanSerializer(loan).data, 
        status=status.HTTP_200_OK
    )