from django.test import TestCase
from django.contrib.auth.models import User
from django.utils import timezone
from datetime import timedelta
from rest_framework.test import APITestCase
from rest_framework import status
from books.models import Book
from .models import Loan, LoanHistory


class LoanModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        self.book = Book.objects.create(
            title='Test Book',
            author='Test Author',
            isbn='1234567890123',
            total_copies=5,
            available_copies=5
        )
    
    def test_loan_creation(self):
        loan = Loan.objects.create(
            user=self.user,
            book=self.book
        )
        
        self.assertEqual(loan.status, 'active')
        self.assertTrue(loan.due_date)
        self.assertEqual(loan.fine_amount, 0)
        self.assertFalse(loan.fine_paid)
    
    def test_overdue_calculation(self):
        # Create overdue loan
        loan = Loan.objects.create(
            user=self.user,
            book=self.book,
            due_date=timezone.now() - timedelta(days=5)
        )
        
        self.assertTrue(loan.is_overdue())
        fine = loan.calculate_fine()
        self.assertEqual(fine, 5.00)
    
    def test_days_remaining(self):
        loan = Loan.objects.create(
            user=self.user,
            book=self.book,
            due_date=timezone.now() + timedelta(days=7)
        )
        
        self.assertEqual(loan.days_remaining(), 7)


class LoanAPITest(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        self.book = Book.objects.create(
            title='Test Book',
            author='Test Author',
            isbn='1234567890123',
            total_copies=5,
            available_copies=5
        )
        self.client.force_authenticate(user=self.user)
    
    def test_borrow_book(self):
        data = {'book_id': self.book.id}
        response = self.client.post('/api/loans/borrow/', data)
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(Loan.objects.filter(user=self.user, book=self.book).exists())
        
        # Check book availability updated
        self.book.refresh_from_db()
        self.assertEqual(self.book.available_copies, 4)
    
    def test_return_book(self):
        # First borrow a book
        loan = Loan.objects.create(user=self.user, book=self.book)
        self.book.available_copies -= 1
        self.book.save()
        
        # Return the book
        data = {'loan_id': loan.id}
        response = self.client.post('/api/loans/return/', data)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        loan.refresh_from_db()
        self.assertEqual(loan.status, 'returned')
        self.assertTrue(loan.returned_date)
        
        # Check book availability updated
        self.book.refresh_from_db()
        self.assertEqual(self.book.available_copies, 5)
    
    def test_loan_history(self):
        # Create some loans
        Loan.objects.create(user=self.user, book=self.book, status='returned')
        
        response = self.client.get('/api/loans/history/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)