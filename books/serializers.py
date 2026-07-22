from rest_framework import serializers
from .models import Book, Category


class CategorySerializer(serializers.ModelSerializer):
    books_count = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = ['id', 'name', 'description', 'books_count', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']

    def get_books_count(self, obj):
        return obj.books.count()


class BookSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    is_available = serializers.SerializerMethodField()

    class Meta:
        model = Book
        fields = [
            'id', 'isbn', 'title', 'author', 'category', 'category_name',
            'publication_date', 'publisher', 'pages', 'description',
            'availability_status', 'quantity_total', 'quantity_available',
            'is_available', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']

    def get_is_available(self, obj):
        return obj.is_available()

    def validate(self, data):
        if data.get('quantity_available', 0) > data.get('quantity_total', 0):
            raise serializers.ValidationError(
                "Available quantity cannot exceed total quantity"
            )
        return data


class BookCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Book
        fields = [
            'isbn', 'title', 'author', 'category', 'publication_date',
            'publisher', 'pages', 'description', 'availability_status',
            'quantity_total', 'quantity_available'
        ]

    def validate(self, data):
        if data.get('quantity_available', 0) > data.get('quantity_total', 0):
            raise serializers.ValidationError(
                "Available quantity cannot exceed total quantity"
            )
        return data