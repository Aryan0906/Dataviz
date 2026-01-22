# Quick Start Guide

## Running the Application

### Option 1: Run Both Servers Automatically (Windows)
```bash
start-dev.bat
```

### Option 2: Run Both Servers Automatically (macOS/Linux)
```bash
bash start-dev.sh
```

### Option 3: Run Servers Manually

**Terminal 1 - Start Backend**
```bash
cd backend
npm install
npm run dev
```

**Terminal 2 - Start Frontend**
```bash
cd frontend
npm install
npm run dev
```

Then open http://localhost:5173 in your browser.

## First Time Setup

1. Install dependencies in both directories
2. Configure `.env` files:
   - `backend/.env` (copy from `.env.example`)
   - `frontend/.env` (copy from `.env.example`)
3. Run the development servers

## Database

The SQLite database is automatically created in `backend/data/dataviz.db` on first run.

## Testing the Application

1. Navigate to http://localhost:5173
2. Create a new account or login
3. Add data points manually or upload a CSV file
4. Click "Analyze Data" to perform regression analysis
5. View the results and save analyses

## Common Issues

### Backend fails to start
- Ensure port 5000 is not in use
- Check that `backend/.env` is configured correctly
- Delete `backend/data/dataviz.db` to reset the database

### Frontend fails to start
- Ensure port 5173 is not in use
- Clear `frontend/node_modules` and reinstall
- Check that `VITE_API_URL` in `frontend/.env` points to your backend

### Can't login
- Verify backend is running on port 5000
- Check browser console for API errors
- Try creating a new account instead

## Project Structure

```
frontend/          - React frontend application
├── src/
│   ├── components/  - Reusable UI components
│   ├── context/     - Auth context provider
│   ├── pages/       - Page components
│   ├── lib/         - API utilities
│   └── App.tsx      - Main app component
└── vite.config.ts   - Vite configuration

backend/           - Express backend server
├── src/
│   ├── routes/      - API route handlers
│   ├── middleware/  - Express middleware
│   ├── database/    - Database configuration
│   └── server.ts    - Server entry point
└── data/
    └── dataviz.db   - SQLite database
```

## API Overview

All API endpoints are prefixed with `/api`

### Authentication
- `POST /auth/signup` - Create account
- `POST /auth/login` - Login
- `GET /auth/verify` - Verify token

### Data
- `POST /data/analyze` - Analyze regression
- `POST /data/save` - Save analysis
- `GET /data/analyses` - List analyses
- `DELETE /data/analyses/:id` - Delete analysis

See [backend/README.md](backend/README.md) for full API documentation.
