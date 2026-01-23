# Dataviz - Interactive Data Visualization & Analysis Platform

A full-stack application for data analysis and visualization with user authentication, regression analysis, and interactive plotting.

## 🚀 Quick Start

### Automatic Setup (Windows)
```bash
start-dev.bat
```

### Automatic Setup (macOS/Linux)
```bash
bash start-dev.sh
```

### Manual Setup
```bash
# Terminal 1 - Backend (Django)
python -m venv venv
.\venv\Scripts\activate  # Windows
# or
source venv/bin/activate # macOS/Linux
pip install -r backend_django/requirements.txt
python backend_django/manage.py migrate
python backend_django/manage.py runserver 5000

# Terminal 2 - Frontend (React)
cd frontend && npm install && npm run dev
```

Then open **http://localhost:5173** in your browser.

## 📁 Project Structure

```
Dataviz/
├── frontend/         # React + TypeScript + Vite
├── backend_django/   # Django + DRF (Supabase-ready)
└── README.md         # This documentation
```

## ✨ Features

- **User Authentication** - Secure signup/login with JWT
- **Data Input** - Manual entry or CSV upload
- **Regression Analysis** - Automatic best-fit model selection
- **Visualization** - Interactive charts with Recharts
- **Predictions** - Predict Y from X and vice versa
- **Data Persistence** - Save analyses to database
- **Dark Mode** - Theme toggle support
- **Responsive Design** - Mobile-friendly UI

## 🛠️ Technology Stack

### Frontend
- React 18 + TypeScript
- Vite
- Tailwind CSS + shadcn/ui
- Recharts
- React Router

### Backend
- Django + Django REST Framework
- Supabase Postgres (or SQLite fallback)
- JWT Authentication
- NumPy for regression analysis

## 📖 Documentation

- **[backend_django/README.md](backend_django/README.md)** - Backend setup & API documentation

## 🔐 Authentication

Create an account or login to access the data analysis features. Your session is secured with JWT tokens.

## 💾 Database

- **Production**: Supabase Postgres via `DATABASE_URL` environment variable
- **Local Dev**: SQLite fallback at `backend_django/db.sqlite3`

## 🎯 Usage

1. Sign up or login
2. Add data points (manually or via CSV)
3. Click "Analyze Data"
4. View regression results and charts
5. Save your analysis

## 🚢 Production Deploy (quick notes)

- **Frontend build**
	```bash
	cd frontend
	npm install
	npm run build
	# serve the dist/ folder via your host (e.g., nginx) or `npm run preview`
	```
- **Frontend env**: set `VITE_API_URL` in `.env` (or use `.env.example`) to your public backend URL (e.g., `https://api.example.com/api`).
- **Backend env**: create `backend_django/.env` with `DATABASE_URL`, `DJANGO_SECRET_KEY`, `JWT_SECRET`, `FRONTEND_URL`. See [backend_django/README.md](backend_django/README.md) for full values.
- **Backend run**
	```bash
	cd backend_django
	pip install -r requirements.txt
	python manage.py migrate
	python manage.py collectstatic --noinput
	python manage.py runserver 0.0.0.0:5000  # or your WSGI/ASGI host
	```
- **Chunking**: Vite splits bundles into `react-vendor`, `radix-ui`, and `charts` chunks; keep `build.chunkSizeWarningLimit` at 1200 KB in [frontend/vite.config.ts](frontend/vite.config.ts).

## 📝 License

MIT License - see LICENSE file for details

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

For detailed setup instructions and Supabase configuration, see [backend_django/README.md](backend_django/README.md).

