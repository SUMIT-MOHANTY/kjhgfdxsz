from django.db import models
from django.core.validators import RegexValidator
from django.utils import timezone


class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "categories"
        ordering = ['name']

    def __str__(self):
        return self.name


class Book(models.Model):
    AVAILABILITY_CHOICES = [
        ('available', 'Available'),
        ('borrowed', 'Borrowed'),
        ('maintenance', 'Under Maintenance'),
        ('lost', 'Lost'),
    ]

    isbn_validator = RegexValidator(
        regex=r'^(?:ISBN(?:-1[03])?:? )?(?=[0-9X]{10}$|(?=(?:[0-9]+[- ]){3})[- 0-9X]{13}$|97[89][0-9]{10}$|(?=(?:[0-9]+[- ]){4})[- 0-9]{17}$)(?:97[89][- ]?)?[0-9]{1,5}[- ]?[0-9]+[- ]?[0-9]+[- ]?[0-9X]$',
        message='Enter a valid ISBN number'
    )
    
    isbn = models.CharField(
        max_length=17,
        unique=True,
        validators=[isbn_validator],
        help_text='ISBN-10 or ISBN-13'
    )
    title = models.CharField(max_length=255)
    author = models.CharField(max_length=255)
    category = models.ForeignKey(
        Category,
        on_delete=models.CASCADE,
        related_name='books'
    )
    publication_date = models.DateField(null=True, blank=True)
    publisher = models.CharField(max_length=255, blank=True)
    pages = models.PositiveIntegerField(null=True, blank=True)
    description = models.TextField(blank=True)
    availability_status = models.CharField(
        max_length=20,
        choices=AVAILABILITY_CHOICES,
        default='available'
    )
    quantity_total = models.PositiveIntegerField(default=1)
    quantity_available = models.PositiveIntegerField(default=1)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['title']
        indexes = [
            models.Index(fields=['isbn']),
            models.Index(fields=['title']),
            models.Index(fields=['author']),
            models.Index(fields=['category']),
            models.Index(fields=['availability_status']),
        ]

    def __str__(self):
        return f"{self.title} by {self.author}"

    def is_available(self):
        return self.availability_status == 'available' and self.quantity_available > 0

    def update_availability(self):
        if self.quantity_available <= 0:
            self.availability_status = 'borrowed'
        elif self.quantity_available > 0 and self.availability_status == 'borrowed':
            self.availability_status = 'available'
        self.save()