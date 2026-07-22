from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q
from .models import Book, Category
from .serializers import BookSerializer, BookListSerializer, CategorySerializer
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
        category = self.get_object()
        books = category.books.all()
        
        # Apply search if provided
        search = request.query_params.get('search', None)
        if search:
            books = books.filter(
                Q(title__icontains=search) |
                Q(author__icontains=search) |
                Q(isbn__icontains=search)
            )
        
        serializer = BookListSerializer(books, many=True)
        return Response(serializer.data)

class BookViewSet(viewsets.ModelViewSet):
    queryset = Book.objects.select_related('category')
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = BookFilter
    search_fields = ['title', 'author', 'isbn', 'description']
    ordering_fields = ['title', 'author', 'publication_date', 'created_at']
    ordering = ['title']
    
    def get_serializer_class(self):
        if self.action == 'list':
            return BookListSerializer
        return BookSerializer
    
    def get_queryset(self):
        queryset = Book.objects.select_related('category')
        
        # Filter by availability
        available_only = self.request.query_params.get('available_only', None)
        if available_only and available_only.lower() == 'true':
            queryset = queryset.filter(status='available', copies_available__gt=0)
        
        return queryset
    
    @action(detail=False, methods=['get'])
    def search(self, request):
        query = request.query_params.get('q', '')
        if not query:
            return Response({'results': []})
        
        books = self.get_queryset().filter(
            Q(title__icontains=query) |
            Q(author__icontains=query) |
            Q(isbn__icontains=query) |
            Q(description__icontains=query)
        )
        
        serializer = BookListSerializer(books, many=True)
        return Response({'results': serializer.data})
    
    @action(detail=True, methods=['post'])
    def checkout(self, request, pk=None):
        book = self.get_object()
        
        if not book.is_available:
            return Response(
                {'error': 'Book is not available for checkout'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        book.copies_available -= 1
        book.update_availability()
        
        serializer = self.get_serializer(book)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def checkin(self, request, pk=None):
        book = self.get_object()
        
        if book.copies_available >= book.copies_total:
            return Response(
                {'error': 'All copies are already checked in'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        book.copies_available += 1
        book.update_availability()
        
        serializer = self.get_serializer(book)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def by_category(self, request):
        category_id = request.query_params.get('category_id')
        if not category_id:
            return Response(
                {'error': 'category_id parameter is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        books = self.get_queryset().filter(category_id=category_id)
        serializer = BookListSerializer(books, many=True)
        return Response(serializer.data)