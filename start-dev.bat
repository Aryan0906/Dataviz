@echo off
REM Dataviz Development Server Startup Script for Windows

echo Starting Dataviz Development Environment...
echo.

REM Start backend in a new window
echo Starting backend server...
cd backend
start cmd /k "npm install --silent && npm run dev"
timeout /t 3 /nobreak

REM Start frontend in a new window
echo Starting frontend server...
cd ..\frontend
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
