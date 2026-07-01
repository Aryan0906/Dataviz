#!/bin/bash

# Dataviz Startup Script
# This script starts the backend Django server, the frontend Vite server, and the Celery worker (if Redis is running).

# ANSI Color Codes for beautiful logging
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color
BOLD='\033[1m'

echo -e "${BLUE}${BOLD}==================================================${NC}"
echo -e "${BLUE}${BOLD}               📊 Starting Dataviz                ${NC}"
echo -e "${BLUE}${BOLD}==================================================${NC}"

# Function to prefix logs with service names
prefix_output() {
  local prefix="$1"
  local color="$2"
  while read -r line; do
    echo -e "${color}[${prefix}]${NC} ${line}"
  done
}

# Cleanup handler to stop all background processes on exit
cleanup() {
  echo -e "\n${RED}${BOLD}Shutting down all Dataviz services...${NC}"
  # Kill all background jobs started by this script
  local pids
  pids=$(jobs -p)
  if [ -n "$pids" ]; then
    # Send SIGTERM to all child jobs
    kill $pids 2>/dev/null
    sleep 1
    # Force kill if any are still running
    pids_remaining=$(jobs -p)
    if [ -n "$pids_remaining" ]; then
      kill -9 $pids_remaining 2>/dev/null
    fi
  fi
  echo -e "${GREEN}${BOLD}All services stopped successfully. Goodbye!${NC}"
  exit 0
}

# Trap Ctrl+C (SIGINT) and kill/exit signals to run cleanup
trap cleanup SIGINT SIGTERM EXIT

# 1. Virtual Environment Check & Activation
echo -e "${YELLOW}Checking Python virtual environment...${NC}"
if [ -f "venv/Scripts/activate" ]; then
  echo -e "${GREEN}Detected Windows-style virtual environment. Activating...${NC}"
  source venv/Scripts/activate
elif [ -f "venv/bin/activate" ]; then
  echo -e "${GREEN}Detected Unix-style virtual environment. Activating...${NC}"
  source venv/bin/activate
else
  echo -e "${RED}Error: Virtual environment 'venv' not found.${NC}"
  echo -e "${YELLOW}Please create it with: python -m venv venv${NC}"
  exit 1
fi

# Verify Python dependencies are installed
if ! python -c "import django, django_celery_results" 2>/dev/null; then
  echo -e "${YELLOW}Required python packages are not fully installed. Installing requirements...${NC}"
  pip install -r backend_django/requirements.txt
fi

# 2. Frontend Dependencies Check
echo -e "${YELLOW}Checking frontend dependencies...${NC}"
if [ ! -d "frontend/node_modules" ]; then
  echo -e "${YELLOW}node_modules not found in frontend directory. Running npm install...${NC}"
  (cd frontend && npm install)
fi

# 3. Redis & Celery Check
echo -e "${YELLOW}Checking Redis status...${NC}"
if redis-cli ping >/dev/null 2>&1; then
  echo -e "${GREEN}Redis is running. Background task worker (Celery) will be started.${NC}"
  RUN_CELERY=true
else
  echo -e "${YELLOW}Warning: Redis is not running or redis-cli is not available.${NC}"
  echo -e "${YELLOW}Celery tasks will fallback to default sync behavior or fail if async is required.${NC}"
  RUN_CELERY=false
fi

echo -e "${GREEN}${BOLD}Launching services... (Press Ctrl+C to stop everything)${NC}\n"

# 4. Start Django Backend
echo -e "${GREEN}Starting Django Backend on http://localhost:8000...${NC}"
(python backend_django/manage.py runserver 8000 2>&1 | prefix_output "Backend" "$GREEN") &

# 5. Start Vite Frontend
echo -e "${GREEN}Starting Vite Frontend on http://localhost:5173...${NC}"
(cd frontend && npm run dev 2>&1 | prefix_output "Frontend" "$BLUE") &

# 6. Start Celery Worker (if applicable)
if [ "$RUN_CELERY" = true ]; then
  echo -e "${GREEN}Starting Celery Worker...${NC}"
  (cd backend_django && celery -A dataviz_backend worker --loglevel=info 2>&1 | prefix_output "Celery " "$YELLOW") &
fi

# Keep the script running to wait for background jobs
wait

