from rest_framework import serializers
from .models import Todo


class TodoSerializer(serializers.ModelSerializer):
    """
    Serializer for Todo model with comprehensive validation.
    """
    
    class Meta:
        model = Todo
        fields = [
            'id',
            'title',
            'description',
            'completed',
            'priority',
            'due_date',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def validate_title(self, value):
        """
        Validate that title is not empty or just whitespace.
        """
        if not value or not value.strip():
            raise serializers.ValidationError("Title cannot be empty or whitespace only.")
        
        if len(value.strip()) > 200:
            raise serializers.ValidationError("Title cannot exceed 200 characters.")
        
        return value.strip()
    
    def validate_priority(self, value):
        """
        Validate priority field.
        """
        valid_priorities = ['low', 'medium', 'high']
        if value not in valid_priorities:
            raise serializers.ValidationError(
                f"Priority must be one of: {', '.join(valid_priorities)}"
            )
        return value
    
    def validate(self, data):
        """
        Object-level validation.
        """
        # Ensure due_date is in the future if provided
        if 'due_date' in data and data['due_date']:
            from django.utils import timezone
            if data['due_date'] < timezone.now():
                raise serializers.ValidationError({
                    'due_date': 'Due date must be in the future.'
                })
        
        return data
