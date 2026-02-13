from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .models import Todo
from .serializers import TodoSerializer


class TodoViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Todo CRUD operations with filtering and custom actions.
    
    Endpoints:
    - GET /api/todos/ - List all todos
    - POST /api/todos/ - Create a new todo
    - GET /api/todos/{id}/ - Retrieve a specific todo
    - PUT /api/todos/{id}/ - Update a todo
    - PATCH /api/todos/{id}/ - Partial update a todo
    - DELETE /api/todos/{id}/ - Delete a todo
    - POST /api/todos/{id}/toggle/ - Toggle completion status
    - GET /api/todos/completed/ - List completed todos
    - GET /api/todos/pending/ - List pending todos
    """
    queryset = Todo.objects.all()
    serializer_class = TodoSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['completed', 'priority']
    search_fields = ['title', 'description']
    ordering_fields = ['created_at', 'updated_at', 'due_date', 'priority']
    ordering = ['-created_at']
    
    @action(detail=True, methods=['post'])
    def toggle(self, request, pk=None):
        """
        Toggle the completion status of a todo.
        """
        todo = self.get_object()
        todo.completed = not todo.completed
        todo.save()
        serializer = self.get_serializer(todo)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def completed(self, request):
        """
        List all completed todos.
        """
        completed_todos = self.queryset.filter(completed=True)
        serializer = self.get_serializer(completed_todos, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def pending(self, request):
        """
        List all pending (not completed) todos.
        """
        pending_todos = self.queryset.filter(completed=False)
        serializer = self.get_serializer(pending_todos, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['delete'])
    def clear_completed(self, request):
        """
        Delete all completed todos.
        """
        deleted_count, _ = self.queryset.filter(completed=True).delete()
        return Response(
            {'message': f'Deleted {deleted_count} completed todo(s)'},
            status=status.HTTP_204_NO_CONTENT
        )
