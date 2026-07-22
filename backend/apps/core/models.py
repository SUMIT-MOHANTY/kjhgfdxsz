from django.db import models
from django.contrib.auth.models import AbstractUser

# Model generated for API Integration and End-to-End Testing (TODO-09)
class ApiIntegrationAndEndToEndTesting(models.Model):
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=50, default='active')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'core_apiintegrationandendtoendtesting'

    def __str__(self):
        return self.title
