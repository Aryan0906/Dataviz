@echo off
REM Dataviz Development Server Startup Script for Windows (Django + React)

echo Starting Dataviz Development Environment...
echo.

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

echo Installing backend dependencies (if needed)...
venv\Scripts\python.exe -m pip install -r backend_django\requirements.txt >nul 2>&1

REM Start Django backend in a new window
echo Starting Django backend server...
start cmd /k "venv\Scripts\python.exe backend_django\manage.py runserver 5000"
timeout /t 3 /nobreak

REM Start frontend in a new window
echo Starting frontend server...
cd frontend
start cmd /k "npm install --silent && npm run dev"
cd ..

echo.
echo =========================================
echo Development servers are starting:
echo Frontend:  http://localhost:5173
echo Backend:   http://localhost:5000
echo =========================================
echo.
echo Check the new terminal windows for server logs.
echo.
pause
