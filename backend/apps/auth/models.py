from django.db import models
from django.contrib.auth.models import AbstractUser

# Model generated for Build User Authentication UI Components (TODO-05)
class BuildUserAuthenticationUiComponents(models.Model):
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=50, default='active')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'auth_builduserauthenticationuicomponents'

    def __str__(self):
        return self.title
