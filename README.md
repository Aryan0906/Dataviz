# Dataviz

Dataviz is a full-stack data visualization and analytics platform for uploading datasets, building charts, running statistical analysis, and generating AI-assisted insights. The application combines a Django backend with a React/Vite frontend and supports workspaces, shareable analyses, and long-running background tasks.

## Highlights

- Upload and explore tabular data with interactive charts and tables.
- Run regression, classification, and hypothesis testing workflows.
- Generate AI-assisted summaries and natural-language insights.
- Export analyses as charts, reports, or notebook-ready outputs.
- Organize work in isolated workspaces with share and embed support.
- Use Celery-backed background jobs for longer analysis tasks.

## Tech Stack

### Backend
- Django and Django REST Framework
- Django Ninja for API endpoints
- Celery and Redis for background processing
- PostgreSQL-compatible configuration via `dj-database-url`
- scikit-learn, NumPy, Pandas, SciPy, Matplotlib, Seaborn
- LangChain, OpenAI, spaCy, and fuzzy matching helpers

### Frontend
- React 18 with Vite
- Tailwind CSS and shadcn/ui components
- Plotly, Highcharts, and Desmos integrations
- React Router, Sonner, PapaParse, jsPDF, and html2canvas

## Repository Layout

- `backend_django/` Django project, API app, tasks, utilities, and migrations.
- `frontend/` Vite-based React application and reusable UI components.
- `media/` Uploaded files and generated assets.
- `render.yaml` Render deployment configuration.
- `start.bat` and `start.sh` Convenience scripts for local startup.

## Prerequisites

- Node.js 18 or later
- Python 3.10 or later
- Git
- Redis for background jobs
- PostgreSQL if you are not using the default local SQLite setup

## Local Setup

### 1. Clone the repository

```bash
git clone https://github.com/Aryan0906/Dataviz.git
cd Dataviz
```

### 2. Backend setup

```bash
cd backend_django
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver 8000
```

If you are on macOS or Linux, activate the virtual environment with:

```bash
source venv/bin/activate
```

Download the spaCy model if you use the NLP features:

```bash
python -m spacy download en_core_web_sm
```

### 3. Frontend setup

```bash
cd frontend
npm install
npm run dev
```

## Environment Variables

Create the required environment files before running the app in anything other than a default local setup.

### `backend_django/.env`

```env
DATABASE_URL=postgresql://user:password@localhost:5432/dataviz
SUPABASE_JWT_SECRET=your-secret
OPENAI_API_KEY=your-openai-key
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
DEFAULT_FROM_EMAIL=your-email@gmail.com
CELERY_BROKER_URL=redis://localhost:6379/0
FRONTEND_URL=http://localhost:5173
```

### `frontend/.env`

```env
VITE_API_URL=http://localhost:8000/api
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## Useful Commands

### Backend

```bash
python manage.py migrate
python manage.py runserver 8000
celery -A dataviz_backend worker --loglevel=info
```

### Frontend

```bash
npm install
npm run dev
npm run build
```

## Deployment

The repository includes `render.yaml` for Render deployment. Update environment variables and service settings to match your production database, Redis, authentication, and frontend host configuration.

## Contributing

1. Create a branch from `main`.
2. Keep changes focused and reviewable.
3. Run the relevant backend or frontend checks before opening a pull request.
4. Follow the existing Python and JavaScript style used in the repository.

## License

This project is provided for academic and educational use.
