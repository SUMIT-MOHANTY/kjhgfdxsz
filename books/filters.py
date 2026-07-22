import django_filters
from .models import Book, Category


class BookFilter(django_filters.FilterSet):
    title = django_filters.CharFilter(lookup_expr='icontains')
    author = django_filters.CharFilter(lookup_expr='icontains')
    isbn = django_filters.CharFilter(lookup_expr='icontains')
    category = django_filters.ModelChoiceFilter(queryset=Category.objects.all())
    category_name = django_filters.CharFilter(
        field_name='category__name',
        lookup_expr='icontains'
    )
    availability_status = django_filters.ChoiceFilter(
        choices=Book.AVAILABILITY_CHOICES
    )
    is_available = django_filters.BooleanFilter(
        method='filter_is_available',
        label='Is Available'
    )
    publication_year = django_filters.NumberFilter(
        field_name='publication_date__year'
    )
    publication_year_gte = django_filters.NumberFilter(
        field_name='publication_date__year',
        lookup_expr='gte'
    )
    publication_year_lte = django_filters.NumberFilter(
        field_name='publication_date__year',
        lookup_expr='lte'
    )
    
    class Meta:
        model = Book
        fields = [
            'title', 'author', 'isbn', 'category', 'category_name',
            'availability_status', 'is_available', 'publication_year',
            'publication_year_gte', 'publication_year_lte'
        ]
    
    def filter_is_available(self, queryset, name, value):
        if value:
            return queryset.filter(
                availability_status='available',
                quantity_available__gt=0
            )
        else:
            return queryset.exclude(
                availability_status='available',
                quantity_available__gt=0
            )