from django.test import TestCase
from django.utils import timezone
from datetime import timedelta
from rest_framework.test import APITestCase
from rest_framework import status
from .models import Todo
from .serializers import TodoSerializer


class TodoModelTest(TestCase):
    """Test cases for Todo model."""
    
    def setUp(self):
        """Set up test data."""
        self.todo = Todo.objects.create(
            title="Test Todo",
            description="Test Description",
            priority="high"
        )
    
    def test_todo_creation(self):
        """Test that a todo can be created."""
        self.assertEqual(self.todo.title, "Test Todo")
        self.assertEqual(self.todo.description, "Test Description")
        self.assertEqual(self.todo.priority, "high")
        self.assertFalse(self.todo.completed)
    
    def test_todo_str_representation(self):
        """Test string representation of todo."""
        self.assertIn("Test Todo", str(self.todo))
        self.assertIn("○", str(self.todo))  # Not completed
        
        self.todo.completed = True
        self.todo.save()
        self.assertIn("✓", str(self.todo))  # Completed
    
    def test_todo_ordering(self):
        """Test that todos are ordered by created_at descending."""
        todo2 = Todo.objects.create(title="Second Todo")
        todos = Todo.objects.all()
        self.assertEqual(todos[0], todo2)  # Most recent first
        self.assertEqual(todos[1], self.todo)
    
    def test_todo_default_values(self):
        """Test default values for todo fields."""
        todo = Todo.objects.create(title="Minimal Todo")
        self.assertEqual(todo.description, "")
        self.assertFalse(todo.completed)
        self.assertEqual(todo.priority, "medium")
        self.assertIsNone(todo.due_date)


class TodoSerializerTest(TestCase):
    """Test cases for TodoSerializer."""
    
    def test_valid_serializer(self):
        """Test serializer with valid data."""
        data = {
            'title': 'New Todo',
            'description': 'Description',
            'priority': 'low'
        }
        serializer = TodoSerializer(data=data)
        self.assertTrue(serializer.is_valid())
    
    def test_empty_title_validation(self):
        """Test that empty title is rejected."""
        data = {'title': ''}
        serializer = TodoSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('title', serializer.errors)
    
    def test_whitespace_title_validation(self):
        """Test that whitespace-only title is rejected."""
        data = {'title': '   '}
        serializer = TodoSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('title', serializer.errors)
    
    def test_title_trimming(self):
        """Test that title is trimmed of whitespace."""
        data = {'title': '  Trimmed Title  '}
        serializer = TodoSerializer(data=data)
        self.assertTrue(serializer.is_valid())
        self.assertEqual(serializer.validated_data['title'], 'Trimmed Title')
    
    def test_invalid_priority_validation(self):
        """Test that invalid priority is rejected."""
        data = {'title': 'Todo', 'priority': 'urgent'}
        serializer = TodoSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('priority', serializer.errors)
    
    def test_past_due_date_validation(self):
        """Test that past due date is rejected."""
        past_date = timezone.now() - timedelta(days=1)
        data = {'title': 'Todo', 'due_date': past_date.isoformat()}
        serializer = TodoSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('due_date', serializer.errors)
    
    def test_future_due_date_validation(self):
        """Test that future due date is accepted."""
        future_date = timezone.now() + timedelta(days=1)
        data = {'title': 'Todo', 'due_date': future_date.isoformat()}
        serializer = TodoSerializer(data=data)
        self.assertTrue(serializer.is_valid())


class TodoAPITest(APITestCase):
    """Test cases for Todo API endpoints."""
    
    def setUp(self):
        """Set up test data."""
        self.todo1 = Todo.objects.create(
            title="Todo 1",
            description="First todo",
            priority="high"
        )
        self.todo2 = Todo.objects.create(
            title="Todo 2",
            description="Second todo",
            priority="low",
            completed=True
        )
    
    def test_list_todos(self):
        """Test GET /api/todos/ - List all todos."""
        response = self.client.get('/api/todos/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)
    
    def test_create_todo(self):
        """Test POST /api/todos/ - Create a new todo."""
        data = {
            'title': 'New Todo',
            'description': 'New description',
            'priority': 'medium'
        }
        response = self.client.post('/api/todos/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Todo.objects.count(), 3)
        self.assertEqual(response.data['title'], 'New Todo')
    
    def test_create_todo_with_invalid_data(self):
        """Test POST /api/todos/ with invalid data."""
        data = {'title': ''}  # Empty title
        response = self.client.post('/api/todos/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_retrieve_todo(self):
        """Test GET /api/todos/{id}/ - Retrieve a specific todo."""
        response = self.client.get(f'/api/todos/{self.todo1.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['title'], 'Todo 1')
    
    def test_update_todo(self):
        """Test PUT /api/todos/{id}/ - Update a todo."""
        data = {
            'title': 'Updated Todo',
            'description': 'Updated description',
            'priority': 'low',
            'completed': True
        }
        response = self.client.put(f'/api/todos/{self.todo1.id}/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.todo1.refresh_from_db()
        self.assertEqual(self.todo1.title, 'Updated Todo')
        self.assertTrue(self.todo1.completed)
    
    def test_partial_update_todo(self):
        """Test PATCH /api/todos/{id}/ - Partial update a todo."""
        data = {'completed': True}
        response = self.client.patch(f'/api/todos/{self.todo1.id}/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.todo1.refresh_from_db()
        self.assertTrue(self.todo1.completed)
        self.assertEqual(self.todo1.title, 'Todo 1')  # Unchanged
    
    def test_delete_todo(self):
        """Test DELETE /api/todos/{id}/ - Delete a todo."""
        response = self.client.delete(f'/api/todos/{self.todo1.id}/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(Todo.objects.count(), 1)
    
    def test_toggle_todo(self):
        """Test POST /api/todos/{id}/toggle/ - Toggle completion status."""
        self.assertFalse(self.todo1.completed)
        response = self.client.post(f'/api/todos/{self.todo1.id}/toggle/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.todo1.refresh_from_db()
        self.assertTrue(self.todo1.completed)
        
        # Toggle again
        response = self.client.post(f'/api/todos/{self.todo1.id}/toggle/')
        self.todo1.refresh_from_db()
        self.assertFalse(self.todo1.completed)
    
    def test_list_completed_todos(self):
        """Test GET /api/todos/completed/ - List completed todos."""
        response = self.client.get('/api/todos/completed/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['id'], self.todo2.id)
    
    def test_list_pending_todos(self):
        """Test GET /api/todos/pending/ - List pending todos."""
        response = self.client.get('/api/todos/pending/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['id'], self.todo1.id)
    
    def test_clear_completed_todos(self):
        """Test DELETE /api/todos/clear_completed/ - Delete all completed todos."""
        response = self.client.delete('/api/todos/clear_completed/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(Todo.objects.filter(completed=True).count(), 0)
        self.assertEqual(Todo.objects.count(), 1)  # Only pending todo remains
    
    def test_filter_by_priority(self):
        """Test filtering todos by priority."""
        response = self.client.get('/api/todos/?priority=high')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['priority'], 'high')
    
    def test_filter_by_completed(self):
        """Test filtering todos by completed status."""
        response = self.client.get('/api/todos/?completed=true')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertTrue(response.data[0]['completed'])
    
    def test_search_todos(self):
        """Test searching todos by title/description."""
        response = self.client.get('/api/todos/?search=First')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['id'], self.todo1.id)
