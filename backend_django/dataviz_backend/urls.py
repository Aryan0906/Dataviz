from django.contrib import admin
from django.urls import path, include
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
    # Page session management
    path("api/session/save", api.save_page_session),
    path("api/session/get", api.get_page_session),
    path("api/session/list", api.get_user_sessions),
    path("api/session/delete", api.delete_page_session),
    # User history tracking
    path("api/history/save", api.save_to_history),
    path("api/history/get", api.get_user_history),
    path("api/history/restore", api.restore_from_history),
    # Smart data cleaning endpoints
    path("api/data/check-health", api.check_data_health),
    path("api/data/clean", api.clean_data),
    path("api/data/correlation", api.get_correlation_matrix),
    path("api/data/generate-code", api.generate_code_snippet),
    path("api/data/nlp-query", api.nlp_query),
    path("api/data/categorical-query", api.categorical_query),
    # Todos API
    path("api/", include("todos.urls")),
]

