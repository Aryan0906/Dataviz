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
    path("api/data/analyses/<int:pk>", api.get_analysis),
    path("api/data/analyze", api.analyze),
]
