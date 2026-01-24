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

    class Meta:
        db_table = "visualizations"

