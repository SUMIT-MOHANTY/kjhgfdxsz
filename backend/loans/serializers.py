from rest_framework import serializers
from .models import Loan, LoanHistory
from books.serializers import BookSerializer
from django.contrib.auth.models import User

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']

class LoanSerializer(serializers.ModelSerializer):
    book_details = BookSerializer(source='book', read_only=True)
    user_details = UserSerializer(source='user', read_only=True)
    is_overdue = serializers.ReadOnlyField()
    can_renew = serializers.ReadOnlyField()
    days_overdue = serializers.SerializerMethodField()
    
    class Meta:
        model = Loan
        fields = [
            'id', 'user', 'book', 'borrowed_date', 'due_date', 
            'returned_date', 'status', 'fine_amount', 'fine_paid',
            'renewal_count', 'max_renewals', 'book_details', 'user_details',
            'is_overdue', 'can_renew', 'days_overdue'
        ]
        read_only_fields = ['borrowed_date', 'fine_amount', 'status']
    
    def get_days_overdue(self, obj):
        from django.utils import timezone
        if obj.status == 'active' and timezone.now() > obj.due_date:
            return (timezone.now() - obj.due_date).days
        return 0

class BorrowBookSerializer(serializers.Serializer):
    book_id = serializers.IntegerField()
    loan_period_days = serializers.IntegerField(default=14, min_value=1, max_value=30)
    
    def validate_book_id(self, value):
        from books.models import Book
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
            loan = Loan.objects.get(id=value, status='active')
            return value
        except Loan.DoesNotExist:
            raise serializers.ValidationError("Active loan not found.")

class LoanHistorySerializer(serializers.ModelSerializer):
    loan_details = LoanSerializer(source='loan', read_only=True)
    
    class Meta:
        model = LoanHistory
        fields = ['id', 'loan', 'action', 'timestamp', 'details', 'loan_details']
        read_only_fields = ['timestamp']