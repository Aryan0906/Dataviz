from django.contrib import admin
from django.urls import path, include
from api import views as api
from api import views_workspaces as ws
from api import share_views

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/health", api.health),
    path("api/auth/signup", api.signup),
    path("api/auth/login", api.login),
    path("api/auth/verify", api.verify),
    path("api/data/save", api.save_analysis),
    path("api/data/analyses", api.list_analyses, name="list_analyses"),
    path("api/public/analyses", api.list_public_analyses, name="list_public_analyses"),
    path("api/data/analyses/<int:pk>/delete", api.delete_analysis),  # DELETE endpoint
    path("api/data/analyses/<int:pk>", api.get_analysis),
    path("api/data/analyze", api.analyze),
    path("api/tasks/<str:task_id>/status", api.check_task_status),
    
    # Share endpoints
    path("api/share/create/<int:analysis_id>", share_views.create_shared_link),
    path("api/share/<str:token>", share_views.get_shared_analysis),
    
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

    # Workspaces
    path("api/workspaces", ws.workspaces),
    path("api/workspaces/<int:workspace_id>/invite", ws.invite_to_workspace),

    # Statistical Testing
    path("api/analysis/hypothesis", api.test_hypothesis, name="test_hypothesis"),

    # Dual Database Sync
    path("api/db/sync-status", api.sync_status, name="sync_status"),
    path("api/db/sync", api.trigger_sync, name="trigger_sync"),

    # Todos API
    path("api/", include("todos.urls")),
]

