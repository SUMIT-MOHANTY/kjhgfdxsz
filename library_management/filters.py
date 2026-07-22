import django_filters
from .models import Book, Category

class BookFilter(django_filters.FilterSet):
    title = django_filters.CharFilter(lookup_expr='icontains')
    author = django_filters.CharFilter(lookup_expr='icontains')
    category = django_filters.ModelChoiceFilter(queryset=Category.objects.all())
    category_name = django_filters.CharFilter(
        field_name='category__name',
        lookup_expr='icontains'
    )
    status = django_filters.ChoiceFilter(choices=Book.STATUS_CHOICES)
    publication_year = django_filters.NumberFilter(
        field_name='publication_date__year'
    )
    publication_date_after = django_filters.DateFilter(
        field_name='publication_date',
        lookup_expr='gte'
    )
    publication_date_before = django_filters.DateFilter(
        field_name='publication_date',
        lookup_expr='lte'
    )
    available_only = django_filters.BooleanFilter(
        method='filter_available_only'
    )
    
    class Meta:
        model = Book
        fields = [
            'title', 'author', 'category', 'category_name', 'status',
            'publication_year', 'publication_date_after', 'publication_date_before',
            'available_only'
        ]
    
    def filter_available_only(self, queryset, name, value):
        if value:
            return queryset.filter(status='available', copies_available__gt=0)
        return queryset