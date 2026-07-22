# Generated migration file
from django.db import migrations, models
import django.db.models.deletion
import django.core.validators


class Migration(migrations.Migration):
    
    initial = True
    
    dependencies = [
    ]
    
    operations = [
        migrations.CreateModel(
            name='Category',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=100, unique=True)),
                ('description', models.TextField(blank=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'verbose_name_plural': 'categories',
                'ordering': ['name'],
            },
        ),
        migrations.CreateModel(
            name='Book',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('isbn', models.CharField(
                    help_text='ISBN-10 or ISBN-13',
                    max_length=17,
                    unique=True,
                    validators=[django.core.validators.RegexValidator(
                        message='Enter a valid ISBN number',
                        regex=r'^(?:ISBN(?:-1[03])?:? )?(?=[0-9X]{10}$|(?=(?:[0-9]+[- ]){3})[- 0-9X]{13}$|97[89][0-9]{10}$|(?=(?:[0-9]+[- ]){4})[- 0-9]{17}$)(?:97[89][- ]?)?[0-9]{1,5}[- ]?[0-9]+[- ]?[0-9]+[- ]?[0-9X]$'
                    )]
                )),
                ('title', models.CharField(max_length=255)),
                ('author', models.CharField(max_length=255)),
                ('publication_date', models.DateField(blank=True, null=True)),
                ('publisher', models.CharField(blank=True, max_length=255)),
                ('pages', models.PositiveIntegerField(blank=True, null=True)),
                ('description', models.TextField(blank=True)),
                ('availability_status', models.CharField(
                    choices=[('available', 'Available'), ('borrowed', 'Borrowed'), ('maintenance', 'Under Maintenance'), ('lost', 'Lost')],
                    default='available',
                    max_length=20
                )),
                ('quantity_total', models.PositiveIntegerField(default=1)),
                ('quantity_available', models.PositiveIntegerField(default=1)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('category', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='books', to='books.category')),
            ],
            options={
                'ordering': ['title'],
            },
        ),
        migrations.AddIndex(
            model_name='book',
            index=models.Index(fields=['isbn'], name='books_book_isbn_idx'),
        ),
        migrations.AddIndex(
            model_name='book',
            index=models.Index(fields=['title'], name='books_book_title_idx'),
        ),
        migrations.AddIndex(
            model_name='book',
            index=models.Index(fields=['author'], name='books_book_author_idx'),
        ),
        migrations.AddIndex(
            model_name='book',
            index=models.Index(fields=['category'], name='books_book_category_idx'),
        ),
        migrations.AddIndex(
            model_name='book',
            index=models.Index(fields=['availability_status'], name='books_book_availability_idx'),
        ),
    ]