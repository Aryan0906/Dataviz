@echo off
setlocal enabledelayedexpansion

echo ==================================================
echo                📊 Starting Dataviz
echo ==================================================

REM 1. Check Python virtual environment
echo Checking Python virtual environment...
if not exist "venv\Scripts\activate.bat" (
    echo [ERROR] Virtual environment 'venv' not found!
    echo Please create it with: python -m venv venv
    pause
    exit /b 1
)

REM Activate virtualenv for dependencies check
call venv\Scripts\activate

REM Verify backend dependencies are installed
python -c "import django, django_celery_results" 2>nul
if %errorlevel% neq 0 (
    echo Required python packages are not fully installed. Installing/updating requirements...
    pip install -r backend_django\requirements.txt
)

REM 2. Check Node Modules
echo Checking frontend dependencies...
if not exist "frontend\node_modules\" (
    echo node_modules not found in frontend directory. Running npm install...
    pushd frontend
    call npm install
    popd
)

REM 3. Check Redis/Celery status
echo Checking if Redis is running...
netstat -ano | findstr 127.0.0.1:6379 >nul
if %errorlevel% equ 0 (
    echo Redis is running. Celery background task worker will be started.
    set RUN_CELERY=true
) else (
    netstat -ano | findstr [::1]:6379 >nul
    if !errorlevel! equ 0 (
        echo Redis is running. Celery background task worker will be started.
        set RUN_CELERY=true
    ) else (
        echo [Warning] Redis is not running on port 6379. Celery worker will not be started.
        set RUN_CELERY=false
    )
)

echo Launching services in separate windows...

REM 4. Start Django Backend
echo Starting Django Backend...
start "Dataviz Backend" cmd /k "call venv\Scripts\activate && cd backend_django && python manage.py runserver 8000"

REM 5. Start Vite Frontend
echo Starting Vite Frontend...
start "Dataviz Frontend" cmd /k "cd frontend && npm run dev"

REM 6. Start Celery Worker (if applicable)
if "!RUN_CELERY!"=="true" (
    echo Starting Celery Worker...
    start "Dataviz Celery" cmd /k "call venv\Scripts\activate && cd backend_django && celery -A dataviz_backend worker --loglevel=info"
)

echo.
echo ==================================================
echo All services launched! Keep this window open or close it.
echo ==================================================
pause
