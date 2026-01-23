#!/bin/bash

# Dataviz Development Server Startup Script (Django + React)

echo "Starting Dataviz Development Environment..."
echo ""

# Function to cleanup processes on exit
cleanup() {
  echo ""
  echo "Shutting down servers..."
  kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
  exit 0
}

trap cleanup SIGINT

# Ensure Python venv exists
if [ ! -f "venv/bin/python" ]; then
  echo "Creating Python virtual environment..."
  python3 -m venv venv || { echo "Failed to create venv"; exit 1; }
fi

# Install backend dependencies (idempotent)
./venv/bin/python -m pip install -r backend_django/requirements.txt >/dev/null 2>&1

# Start Django backend
echo "Starting Django backend server..."
./venv/bin/python backend_django/manage.py runserver 5000 &
BACKEND_PID=$!
echo "Backend server started (PID: $BACKEND_PID)"
sleep 2

# Start frontend
echo ""
echo "Starting frontend server..."
cd frontend
npm install --silent 2>/dev/null
npm run dev &
FRONTEND_PID=$!
echo "Frontend server started (PID: $FRONTEND_PID)"
cd ..

echo ""
echo "========================================="
echo "Development servers are running:"
echo "Frontend:  http://localhost:5173"
echo "Backend:   http://localhost:5000"
echo "========================================="
echo ""
echo "Press Ctrl+C to stop both servers"
echo ""

# Keep script running
wait $BACKEND_PID $FRONTEND_PID
