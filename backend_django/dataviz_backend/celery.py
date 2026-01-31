"""
Celery Configuration for Background Tasks
"""
import os
from celery import Celery

# Set Django settings module
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'dataviz_backend.settings')

# Initialize Celery app
app = Celery('dataviz_backend')

# Load config from Django settings with CELERY_ prefix
app.config_from_object('django.conf:settings', namespace='CELERY')

# Auto-discover tasks in all installed apps
app.autodiscover_tasks()


@app.task(bind=True)
def debug_task(self):
    """Test task"""
    print(f'Request: {self.request!r}')
