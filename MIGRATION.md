# Dataviz - Project Migration Complete

## ✅ What Changed

### Backend Migration
- **Old**: Express.js + TypeScript + SQLite (removed)
- **New**: Django + DRF + Supabase Postgres (`backend_django/`)

### Tech Stack Updates
- **Backend**: Django 5+ with Django REST Framework
- **Database**: Supabase Postgres (production) / SQLite (local dev fallback)
- **Authentication**: JWT via PyJWT
- **Analysis**: NumPy for linear regression
- **Frontend**: React (unchanged - same API contract)

### File Changes
1. **New Django Backend**: `backend_django/`
   - Complete Django project with DRF
   - API endpoints matching frontend expectations
   - Supabase-ready with SQLite fallback
   
2. **Updated Scripts**:
   - `start-dev.bat` / `start-dev.sh` - Start Django + React
   - `start-prod.bat` / `start-prod.sh` - Production mode with Supabase
   
3. **Frontend Updates**:
   - `.env` already configured for Django API
   - Fixed TypeScript event type errors in DataTable & DataAnalyzer
   
4. **Documentation**:
   - Updated `README.md` to reflect Django stack
   - Enhanced `backend_django/README.md` with setup guide
   - Removed old Express backend files

## 🚀 Quick Start

### Development Mode (SQLite)
```powershell
# Windows
start-dev.bat

# macOS/Linux
bash start-dev.sh
```

### Production Mode (Supabase)
1. Create `backend_django/.env` from `.env.example`
2. Set `DATABASE_URL` to your Supabase connection string
3. Run:
```powershell
# Windows
start-prod.bat

# macOS/Linux  
bash start-prod.sh
```

## 🔄 API Endpoint Compatibility

All endpoints remain the same - frontend needs no changes:

| Endpoint | Method | Auth Required |
|----------|--------|---------------|
| `/api/health` | GET | No |
| `/api/auth/signup` | POST | No |
| `/api/auth/login` | POST | No |
| `/api/auth/verify` | GET | Yes |
| `/api/data/save` | POST | Yes |
| `/api/data/analyses` | GET | Yes |
| `/api/data/analyses/:id` | GET/DELETE | Yes |
| `/api/data/analyze` | POST | No |

## 📦 Dependencies

### Backend (Python)
- Django >= 5.0
- djangorestframework >= 3.14
- django-cors-headers >= 4.3
- psycopg[binary] >= 3.2 (Postgres driver)
- PyJWT >= 2.8
- numpy >= 2.0

### Frontend (unchanged)
- React 18 + TypeScript
- Vite
- Recharts, Tailwind, shadcn/ui

## 🗄️ Database Migration

### Users Table
- Django's built-in `auth_user` table
- `username` = email
- `first_name` = display name

### Analysis Results Table
Same schema as before:
- `user_id` (FK to auth_user)
- `title`, `data_points` (JSON), `regression_type`, `equation`, `r_squared`, `created_at`

## ⚙️ Environment Variables

Create `backend_django/.env`:
```env
DATABASE_URL=postgresql://user:pass@host:port/db?sslmode=require
DJANGO_SECRET_KEY=<generate-random-key>
JWT_SECRET=<generate-random-key>
FRONTEND_URL=http://localhost:5173
```

Generate Django secret key:
```powershell
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

## 🎯 Next Steps

1. **Local Testing**: Run `start-dev.bat` - works immediately with SQLite
2. **Supabase Setup**:
   - Get connection string from Supabase dashboard
   - Create `.env` with `DATABASE_URL`
   - Run migrations: `python backend_django/manage.py migrate`
3. **Test Frontend**: Visit http://localhost:5173

## 📝 Notes

- Old Express backend removed - all development now uses Django
- Frontend requires no changes - API contracts maintained
- Django admin available at http://localhost:5000/admin (after creating superuser)
- CORS configured for local development
