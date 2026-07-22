from django.contrib import admin
from .models import Book, Category

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'description', 'created_at']
    search_fields = ['name', 'description']
    ordering = ['name']
    readonly_fields = ['created_at', 'updated_at']

@admin.register(Book)
class BookAdmin(admin.ModelAdmin):
    list_display = [
        'title', 'author', 'isbn', 'category', 'status',
        'copies_available', 'copies_total', 'is_available'
    ]
    list_filter = ['status', 'category', 'publication_date']
    search_fields = ['title', 'author', 'isbn']
    ordering = ['title']
    readonly_fields = ['created_at', 'updated_at', 'is_available']
    
    fieldsets = [
        ('Book Information', {
            'fields': ['isbn', 'title', 'author', 'category']
        }),
        ('Publication Details', {
            'fields': ['publication_date', 'publisher', 'pages', 'description']
        }),
        ('Availability', {
            'fields': ['status', 'copies_total', 'copies_available']
        }),
        ('Timestamps', {
            'fields': ['created_at', 'updated_at'],
            'classes': ['collapse']
        })
    ]
    
    def save_model(self, request, obj, form, change):
        super().save_model(request, obj, form, change)
        obj.update_availability()