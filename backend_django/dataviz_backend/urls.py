from django.contrib import admin
from django.urls import path
from api import views as api

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/health", api.health),
    path("api/auth/signup", api.signup),
    path("api/auth/login", api.login),
    path("api/auth/verify", api.verify),
    path("api/data/save", api.save_analysis),
    path("api/data/analyses", api.list_analyses),
    path("api/data/analyses/<int:pk>/delete", api.delete_analysis),  # DELETE endpoint
    path("api/data/analyses/<int:pk>", api.get_analysis),
    path("api/data/analyze", api.analyze),
    # Draft analysis endpoints
    path("api/data/draft/save", api.save_draft),
    path("api/data/draft/get", api.get_draft),
    path("api/data/draft/delete", api.delete_draft),
    path("api/data/draft/finalize", api.finalize_draft),
    # AI analysis endpoints
    path("api/ai/upload-csv", api.upload_csv),
    path("api/ai/query", api.query_ai),
    path("api/ai/latest", api.get_latest_visualization),
    path("api/ai/save", api.save_visualization_to_history),
]

