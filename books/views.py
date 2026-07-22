from django.db.models import Q
from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .models import Book, Category
from .serializers import BookSerializer, BookCreateUpdateSerializer, CategorySerializer
from .filters import BookFilter


class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'created_at']
    ordering = ['name']

    @action(detail=True, methods=['get'])
    def books(self, request, pk=None):
        """Get all books in this category"""
        category = self.get_object()
        books = category.books.all()
        
        # Apply search if provided
        search = request.query_params.get('search')
        if search:
            books = books.filter(
                Q(title__icontains=search) |
                Q(author__icontains=search) |
                Q(isbn__icontains=search)
            )
        
        serializer = BookSerializer(books, many=True)
        return Response(serializer.data)


class BookViewSet(viewsets.ModelViewSet):
    queryset = Book.objects.select_related('category').all()
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = BookFilter
    search_fields = ['title', 'author', 'isbn', 'description']
    ordering_fields = ['title', 'author', 'publication_date', 'created_at']
    ordering = ['title']

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return BookCreateUpdateSerializer
        return BookSerializer

    @action(detail=False, methods=['get'])
    def available(self, request):
        """Get all available books"""
        books = self.queryset.filter(
            availability_status='available',
            quantity_available__gt=0
        )
        
        # Apply filters and search
        books = self.filter_queryset(books)
        
        page = self.paginate_queryset(books)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(books, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def by_category(self, request):
        """Get books grouped by category"""
        categories = Category.objects.prefetch_related('books').all()
        result = []
        
        for category in categories:
            books = category.books.all()
            
            # Apply search if provided
            search = request.query_params.get('search')
            if search:
                books = books.filter(
                    Q(title__icontains=search) |
                    Q(author__icontains=search) |
                    Q(isbn__icontains=search)
                )
            
            if books.exists():
                result.append({
                    'category': CategorySerializer(category).data,
                    'books': BookSerializer(books, many=True).data
                })
        
        return Response(result)

    @action(detail=True, methods=['post'])
    def borrow(self, request, pk=None):
        """Mark a book as borrowed (decrease available quantity)"""
        book = self.get_object()
        
        if not book.is_available():
            return Response(
                {'error': 'Book is not available for borrowing'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        book.quantity_available -= 1
        book.update_availability()
        
        return Response({
            'message': f'Book "{book.title}" borrowed successfully',
            'available_quantity': book.quantity_available
        })

    @action(detail=True, methods=['post'])
    def return_book(self, request, pk=None):
        """Return a book (increase available quantity)"""
        book = self.get_object()
        
        if book.quantity_available >= book.quantity_total:
            return Response(
                {'error': 'All copies of this book are already available'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        book.quantity_available += 1
        book.update_availability()
        
        return Response({
            'message': f'Book "{book.title}" returned successfully',
            'available_quantity': book.quantity_available
        })

    @action(detail=False, methods=['get'])
    def search_advanced(self, request):
        """Advanced search with multiple criteria"""
        queryset = self.get_queryset()
        
        # Search parameters
        title = request.query_params.get('title')
        author = request.query_params.get('author')
        category_name = request.query_params.get('category')
        isbn = request.query_params.get('isbn')
        availability = request.query_params.get('availability')
        
        if title:
            queryset = queryset.filter(title__icontains=title)
        if author:
            queryset = queryset.filter(author__icontains=author)
        if category_name:
            queryset = queryset.filter(category__name__icontains=category_name)
        if isbn:
            queryset = queryset.filter(isbn__icontains=isbn)
        if availability:
            queryset = queryset.filter(availability_status=availability)
        
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)