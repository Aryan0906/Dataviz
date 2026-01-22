#!/bin/bash

# Dataviz Development Server Startup Script

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

# Start backend
echo "Starting backend server..."
cd backend
npm install --silent 2>/dev/null
npm run dev &
BACKEND_PID=$!
echo "Backend server started (PID: $BACKEND_PID)"
sleep 2

# Start frontend
echo ""
echo "Starting frontend server..."
cd ../frontend
npm install --silent 2>/dev/null
npm run dev &
FRONTEND_PID=$!
echo "Frontend server started (PID: $FRONTEND_PID)"
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
