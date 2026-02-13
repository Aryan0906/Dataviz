from django.db import models
from django.core.validators import MinLengthValidator


class Todo(models.Model):
    """
    Todo model with title, description, completion status, and timestamps.
    """
    PRIORITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
    ]
    
    title = models.CharField(
        max_length=200,
        validators=[MinLengthValidator(1, "Title must not be empty")],
        help_text="Title of the todo item"
    )
    description = models.TextField(
        blank=True,
        default="",
        help_text="Detailed description of the todo"
    )
    completed = models.BooleanField(
        default=False,
        help_text="Whether the todo is completed"
    )
    priority = models.CharField(
        max_length=10,
        choices=PRIORITY_CHOICES,
        default='medium',
        help_text="Priority level of the todo"
    )
    due_date = models.DateTimeField(
        null=True,
        blank=True,
        help_text="Optional due date for the todo"
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        help_text="Timestamp when todo was created"
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        help_text="Timestamp when todo was last updated"
    )

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Todo'
        verbose_name_plural = 'Todos'

    def __str__(self):
        status = "✓" if self.completed else "○"
        return f"{status} {self.title}"
