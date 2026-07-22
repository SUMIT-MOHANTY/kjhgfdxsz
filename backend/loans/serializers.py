from rest_framework import serializers
from .models import Loan, LoanHistory
from books.serializers import BookSerializer
from django.contrib.auth.models import User
from books.models import Book


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'email']


class LoanSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    book = BookSerializer(read_only=True)
    book_id = serializers.IntegerField(write_only=True)
    days_remaining = serializers.ReadOnlyField()
    is_overdue = serializers.ReadOnlyField()
    
    class Meta:
        model = Loan
        fields = [
            'id', 'user', 'book', 'book_id', 'borrowed_date', 'due_date',
            'returned_date', 'status', 'fine_amount', 'fine_paid',
            'days_remaining', 'is_overdue'
        ]
        read_only_fields = ['borrowed_date', 'fine_amount']
    
    def validate_book_id(self, value):
        try:
            book = Book.objects.get(id=value)
            if book.available_copies <= 0:
                raise serializers.ValidationError("This book is not available for borrowing.")
            return value
        except Book.DoesNotExist:
            raise serializers.ValidationError("Book not found.")


class LoanHistorySerializer(serializers.ModelSerializer):
    loan = LoanSerializer(read_only=True)
    
    class Meta:
        model = LoanHistory
        fields = '__all__'


class BorrowBookSerializer(serializers.Serializer):
    book_id = serializers.IntegerField()
    due_date = serializers.DateTimeField(required=False)
    
    def validate_book_id(self, value):
        try:
            book = Book.objects.get(id=value)
            if book.available_copies <= 0:
                raise serializers.ValidationError("This book is not available for borrowing.")
            return value
        except Book.DoesNotExist:
            raise serializers.ValidationError("Book not found.")


class ReturnBookSerializer(serializers.Serializer):
    loan_id = serializers.IntegerField()
    
    def validate_loan_id(self, value):
        try:
            loan = Loan.objects.get(id=value)
            if loan.status != 'active':
                raise serializers.ValidationError("This loan is not active.")
            return value
        except Loan.DoesNotExist:
            raise serializers.ValidationError("Loan not found.")