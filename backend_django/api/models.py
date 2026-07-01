from django.db import models
from .sync_models import SyncModel

class AnalysisResult(SyncModel):
    # Store Supabase UUID as CharField
    user_id = models.CharField(max_length=100, db_index=True)
    workspace = models.ForeignKey('Workspace', null=True, blank=True, on_delete=models.CASCADE, related_name='analyses')
    title = models.CharField(max_length=255)
    data_points = models.JSONField()
    regression_type = models.CharField(max_length=50, blank=True, null=True)
    equation = models.TextField(blank=True, null=True)
    r_squared = models.FloatField(blank=True, null=True)
    is_public = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "analysis_results"


class Visualization(SyncModel):
    # Store Supabase UUID as CharField
    user_id = models.CharField(max_length=100, db_index=True)
    workspace = models.ForeignKey('Workspace', null=True, blank=True, on_delete=models.CASCADE, related_name='visualizations')
    title = models.CharField(max_length=200)
    chart_type = models.CharField(max_length=50)  # 'bar', 'pie', 'line', 'scatter'
    data = models.JSONField()  # Stores {"labels": ["A", "B"], "values": [10, 20]}
    is_public = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    # AI-powered analysis fields
    ai_summary = models.TextField(blank=True, null=True)  # AI-generated data quality insights
    chart_config = models.JSONField(blank=True, null=True)  # AI-generated chart configuration
    csv_file_path = models.CharField(max_length=500, blank=True, null=True)  # Path to uploaded CSV
    data_schema = models.JSONField(blank=True, null=True)  # Column names, types, sample stats
    processing_status = models.CharField(
        max_length=20, 
        default='pending',
        choices=[
            ('pending', 'Pending'),
            ('processing', 'Processing'),
            ('completed', 'Completed'),
            ('failed', 'Failed'),
        ]
    )
    error_message = models.TextField(blank=True, null=True)  # Error details if processing fails

    class Meta:
        db_table = "visualizations"


class DraftAnalysis(SyncModel):
    """Store in-progress analyses that auto-save as users work"""
    user_id = models.CharField(max_length=100, db_index=True)
    title = models.CharField(max_length=255, default="Untitled Analysis")
    data_points = models.JSONField(default=list)
    categories = models.JSONField(default=list)
    tab_type = models.CharField(max_length=20, default="regression")  # 'regression' or 'categorical'
    regression_type = models.CharField(max_length=50, null=True, blank=True)
    polynomial_degree = models.IntegerField(null=True, blank=True)
    is_draft = models.BooleanField(default=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "draft_analyses"
        ordering = ['-updated_at']


class PageSession(SyncModel):
    """Store user session data for each page to persist state across refreshes"""
    user_id = models.CharField(max_length=100, db_index=True)
    session_id = models.CharField(max_length=100, db_index=True, unique=True)  # Unique session identifier
    page_type = models.CharField(
        max_length=50, 
        choices=[
            ('categorical', 'Categorical Chat'),
            ('regression', 'Regression Plot'),
            ('curve', 'Curve Plot'),
        ]
    )
    state_data = models.JSONField()  # Complete page state (data, chartType, messages, etc.)
    last_accessed = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "page_sessions"
        ordering = ['-last_accessed']
        indexes = [
            models.Index(fields=['user_id', 'page_type']),
        ]


class UserHistory(SyncModel):
    """Store complete history of all user interactions across all pages"""
    user_id = models.CharField(max_length=100, db_index=True)
    page_type = models.CharField(max_length=50)
    action_type = models.CharField(
        max_length=50,
        choices=[
            ('create', 'Create'),
            ('update', 'Update'),
            ('delete', 'Delete'),
            ('view', 'View'),
            ('export', 'Export'),
        ]
    )
    title = models.CharField(max_length=255, blank=True, null=True)
    snapshot_data = models.JSONField()  # Complete data snapshot at time of action
    metadata = models.JSONField(blank=True, null=True)  # Additional context (chart type, file name, etc.)
    intent_cache = models.JSONField(blank=True, null=True)  # Cached intents for NLP
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "user_history"
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user_id', 'page_type', 'created_at']),
        ]




import uuid
from django.utils import timezone
from datetime import timedelta

class SharedLink(SyncModel):
    analysis = models.ForeignKey(AnalysisResult, on_delete=models.CASCADE, related_name='shared_links')
    token = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    revoked = models.BooleanField(default=False)
    
    def is_valid(self):
        if self.revoked:
            return False
        if self.expires_at and timezone.now() > self.expires_at:
            return False
        return True


class Workspace(SyncModel):
    name = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)
    
class WorkspaceMembership(SyncModel):
    user_id = models.CharField(max_length=100, db_index=True)
    workspace = models.ForeignKey(Workspace, on_delete=models.CASCADE, related_name='members')
    role = models.CharField(max_length=50, choices=[('owner', 'Owner'), ('editor', 'Editor'), ('viewer', 'Viewer')])
    created_at = models.DateTimeField(auto_now_add=True)
