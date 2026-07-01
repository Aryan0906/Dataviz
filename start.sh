#!/bin/bash

# Dataviz Startup Script (Part 1 - Setup & Backend)

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo "=================================================="
echo "               📊 Starting Dataviz                "
echo "=================================================="

# Function to prefix logs
prefix_output() {
  local prefix="$1"
  local color="$2"
  while read -r line; do
    echo -e "${color}[${prefix}]${NC} ${line}"
  done
}

# Cleanup handler
cleanup() {
  echo -e "\n${RED}Shutting down all Dataviz services...${NC}"
  local pids
  pids=$(jobs -p)
  if [ -n "$pids" ]; then
    kill $pids 2>/dev/null
  fi
  exit 0
}
trap cleanup SIGINT SIGTERM EXIT

# 1. Virtual Environment Activation
echo -e "${YELLOW}Checking Python virtual environment...${NC}"
if [ -f "venv/Scripts/activate" ]; then
  source venv/Scripts/activate
elif [ -f "venv/bin/activate" ]; then
  source venv/bin/activate
else
  echo -e "${RED}Error: Virtual environment 'venv' not found.${NC}"
  exit 1
fi

# Start Django Backend
echo -e "${GREEN}Starting Django Backend on http://localhost:8000...${NC}"
(python backend_django/manage.py runserver 8000 2>&1 | prefix_output "Backend" "$GREEN") &
