from django.contrib import admin
from .models import Book, Category


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'description', 'books_count', 'created_at']
    search_fields = ['name', 'description']
    ordering = ['name']
    
    def books_count(self, obj):
        return obj.books.count()
    books_count.short_description = 'Number of Books'


@admin.register(Book)
class BookAdmin(admin.ModelAdmin):
    list_display = [
        'title', 'author', 'isbn', 'category', 'availability_status',
        'quantity_available', 'quantity_total', 'created_at'
    ]
    list_filter = [
        'availability_status', 'category', 'publication_date', 'created_at'
    ]
    search_fields = ['title', 'author', 'isbn', 'description']
    list_editable = ['availability_status', 'quantity_available']
    ordering = ['title']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('isbn', 'title', 'author', 'category')
        }),
        ('Publication Details', {
            'fields': ('publication_date', 'publisher', 'pages', 'description')
        }),
        ('Availability', {
            'fields': ('availability_status', 'quantity_total', 'quantity_available')
        })
    )
    
    def save_model(self, request, obj, form, change):
        super().save_model(request, obj, form, change)
        obj.update_availability()