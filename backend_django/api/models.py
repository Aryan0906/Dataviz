from django.db import models

class AnalysisResult(models.Model):
    # Store Supabase UUID as CharField
    user_id = models.CharField(max_length=100, db_index=True)
    title = models.CharField(max_length=255)
    data_points = models.JSONField()
    regression_type = models.CharField(max_length=50, blank=True, null=True)
    equation = models.TextField(blank=True, null=True)
    r_squared = models.FloatField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "analysis_results"


class Visualization(models.Model):
    # Store Supabase UUID as CharField
    user_id = models.CharField(max_length=100, db_index=True)
    title = models.CharField(max_length=200)
    chart_type = models.CharField(max_length=50)  # 'bar', 'pie', 'line', 'scatter'
    data = models.JSONField()  # Stores {"labels": ["A", "B"], "values": [10, 20]}
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


class DraftAnalysis(models.Model):
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


