#!/bin/bash

# Dataviz Production Server Startup Script
# Requires: .env file in backend_django/ with DATABASE_URL set to Supabase

echo "Starting Dataviz Production Environment..."
echo ""

# Check if .env exists
if [ ! -f "backend_django/.env" ]; then
  echo "ERROR: backend_django/.env file not found!"
  echo ""
  echo "Please create backend_django/.env from .env.example and configure:"
  echo "  - DATABASE_URL (Supabase Postgres connection string)"
  echo "  - DJANGO_SECRET_KEY"
  echo "  - JWT_SECRET"
  echo "  - FRONTEND_URL"
  echo ""
  exit 1
fi

# Ensure Python venv exists
if [ ! -f "venv/bin/python" ]; then
  echo "Creating Python virtual environment..."
  python3 -m venv venv || { echo "Failed to create venv"; exit 1; }
fi

echo "Installing/updating backend dependencies..."
./venv/bin/python -m pip install -r backend_django/requirements.txt --quiet

echo "Running database migrations..."
./venv/bin/python backend_django/manage.py migrate

# Start Django backend in production mode
echo ""
echo "Starting Django backend server (production mode)..."
echo "Backend will run on http://localhost:5000"
echo ""
./venv/bin/python backend_django/manage.py runserver 5000
