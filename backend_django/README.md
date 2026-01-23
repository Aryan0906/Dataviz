# Django Backend for Dataviz

This backend mirrors the existing Express API using Django + DRF and connects to Supabase Postgres.

## Setup (Windows PowerShell)

1. **Create environment file**:
   - Copy `.env.example` to `.env`
   - Fill in your values:
     - `DATABASE_URL`: Supabase Postgres connection string (format: `postgresql://user:pass@host:port/db?sslmode=require`)
     - `DJANGO_SECRET_KEY`: Generate with `python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"`
     - `JWT_SECRET`: Any secure random string
     - `FRONTEND_URL`: Your frontend URL (default: `http://localhost:5173`)

2. **Create virtual environment and install dependencies**:

```powershell
# From workspace root
python -m venv venv
.\venv\Scripts\activate
pip install -r backend_django/requirements.txt
```

3. **Apply migrations and run**:

```powershell
python backend_django/manage.py makemigrations
python backend_django/manage.py migrate
python backend_django/manage.py runserver 5000
```

## Quick Start Scripts

### Development (SQLite fallback)
```powershell
# Windows
.\start-dev.bat

# macOS/Linux
bash start-dev.sh
```

### Production (Requires Supabase .env)
```powershell
# Windows
.\start-prod.bat

# macOS/Linux
bash start-prod.sh
```

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Create new user account
- `POST /api/auth/login` - Login and receive JWT token
- `GET /api/auth/verify` - Verify JWT token validity

### Data Analysis
- `POST /api/data/save` - Save analysis result (requires auth)
- `GET /api/data/analyses` - List all user's analyses (requires auth)
- `GET /api/data/analyses/:id` - Get specific analysis (requires auth)
- `DELETE /api/data/analyses/:id` - Delete analysis (requires auth)
- `POST /api/data/analyze` - Perform linear regression analysis (public)

### Health Check
- `GET /api/health` - Server health check

## Database Configuration

### Development (SQLite)
No `.env` file needed - Django automatically falls back to SQLite at `backend_django/db.sqlite3`.

### Production (Supabase)
Create `backend_django/.env` with:
```env
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@[HOST]/postgres?sslmode=require
DJANGO_SECRET_KEY=[GENERATE-RANDOM-KEY]
JWT_SECRET=[GENERATE-RANDOM-KEY]
FRONTEND_URL=http://localhost:8081
```

Get your Supabase connection string from: Project Settings → Database → Connection string (URI)

## Models

### User
Django's built-in `User` model with fields:
- `username` (set to email)
- `email`
- `first_name` (stores display name)
- `password` (hashed)

### AnalysisResult
- `user` - Foreign key to User
- `title` - Analysis title
- `data_points` - JSON field storing [{x, y}] array
- `regression_type` - Type of regression (e.g., "linear")
- `equation` - Regression equation string
- `r_squared` - R² value
- `created_at` - Timestamp

## Admin Panel

Create a superuser to access Django admin:
```powershell
python backend_django/manage.py createsuperuser
```

Then visit http://localhost:5000/admin

## Notes

- JWT tokens expire after 24 hours
- CORS configured for frontend URL (default: localhost:5173)
- In DEBUG mode, CORS allows all origins
