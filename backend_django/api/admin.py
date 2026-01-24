from django.contrib import admin
from .models import AnalysisResult, Visualization

@admin.register(AnalysisResult)
class AnalysisResultAdmin(admin.ModelAdmin):
    list_display = ("id", "user_id", "title", "r_squared", "created_at")
    search_fields = ("title", "user_id")


@admin.register(Visualization)
class VisualizationAdmin(admin.ModelAdmin):
    list_display = ("id", "user_id", "title", "chart_type", "created_at")
    search_fields = ("title", "user_id", "chart_type")

