from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion

class Migration(migrations.Migration):
    
    initial = True
    
    dependencies = [
        ('books', '0001_initial'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]
    
    operations = [
        migrations.CreateModel(
            name='Loan',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('borrowed_date', models.DateTimeField(auto_now_add=True)),
                ('due_date', models.DateTimeField()),
                ('returned_date', models.DateTimeField(blank=True, null=True)),
                ('status', models.CharField(choices=[('active', 'Active'), ('returned', 'Returned'), ('overdue', 'Overdue')], default='active', max_length=10)),
                ('fine_amount', models.DecimalField(decimal_places=2, default=0.0, max_digits=10)),
                ('fine_paid', models.BooleanField(default=False)),
                ('renewal_count', models.IntegerField(default=0)),
                ('max_renewals', models.IntegerField(default=2)),
                ('book', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='loans', to='books.book')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='loans', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'db_table': 'loans',
                'ordering': ['-borrowed_date'],
            },
        ),
        migrations.CreateModel(
            name='LoanHistory',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('action', models.CharField(max_length=50)),
                ('timestamp', models.DateTimeField(auto_now_add=True)),
                ('details', models.TextField(blank=True)),
                ('loan', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='history', to='loans.loan')),
            ],
            options={
                'db_table': 'loan_history',
                'ordering': ['-timestamp'],
            },
        ),
    ]