@echo off
REM Dataviz Production Server Startup Script for Windows
REM Requires: .env file in backend_django/ with DATABASE_URL set to Supabase

echo Starting Dataviz Production Environment...
echo.

REM Check if .env exists
if not exist backend_django\.env (
  echo ERROR: backend_django\.env file not found!
  echo.
  echo Please create backend_django\.env from .env.example and configure:
  echo   - DATABASE_URL (Supabase Postgres connection string)
  echo   - DJANGO_SECRET_KEY
  echo   - JWT_SECRET
  echo   - FRONTEND_URL
  echo.
  pause
  exit /b 1
)

REM Ensure Python venv exists
if not exist venv\Scripts\python.exe (
  echo Creating Python virtual environment...
  python -m venv venv
  if errorlevel 1 (
    echo Failed to create virtual environment. Ensure Python is installed.
    pause
    exit /b 1
  )
)

echo Installing/updating backend dependencies...
venv\Scripts\python.exe -m pip install -r backend_django\requirements.txt --quiet

echo Running database migrations...
venv\Scripts\python.exe backend_django\manage.py migrate

REM Start Django backend in production mode
echo.
echo Starting Django backend server (production mode)...
echo Backend will run on http://localhost:5000
echo.
venv\Scripts\python.exe backend_django\manage.py runserver 5000
