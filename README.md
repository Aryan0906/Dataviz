<div align="center">

# 📊 Dataviz

**A full-stack intelligent data visualization and analytics platform**

[![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org)
[![Django](https://img.shields.io/badge/Django-4.x-092E20?style=for-the-badge&logo=django&logoColor=white)](https://djangoproject.com)
[![React](https://img.shields.io/badge/React-18.x-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-5.x-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.x-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)

Dataviz transforms raw CSV data into interactive charts, regression models, and AI-powered insights — with full workspace collaboration and a public community gallery.

[Features](#-features) • [Tech Stack](#-tech-stack) • [Quick Start](#-quick-start) • [API Reference](#-api-reference) • [Project Structure](#-project-structure)

</div>

---

## ✨ Features

### 📈 Analytics & Regression
- **Auto Model Selection** — Intelligently selects the best-fit model from Linear, Polynomial (Degree 2–4), Exponential, Logarithmic, and Power Regression
- **Multivariate Regression** — Support for multiple input features with full coefficient breakdown
- **Classification Models** — K-Nearest Neighbors, Decision Tree, and Naive Bayes for categorical targets
- **Statistical Hypothesis Testing** — Run Welch's t-test or one-way ANOVA across data groups, with plain-English verdicts and p-value display
- **Model Validation** — R², Adjusted R², RMSE, MAE, and residual plots for every model

### 🤖 AI & NLP
- **Natural Language Queries** — Ask questions about your data in plain English powered by LangChain + OpenAI
- **AI Chart Suggestions** — Automatic chart type recommendations based on detected data shape
- **Smart Analytics** — AI-generated data quality summaries and insight cards
- **Jupyter Notebook Export** — Export any analysis as a ready-to-run `.ipynb` notebook

### 📊 Visualizations
- **Universal Chart Engine** — Bar, Pie, Line, Scatter, Heatmap, and Histogram charts
- **Interactive Graphing** — Powered by Plotly.js and Highcharts with zoom, pan, and tooltip support
- **Mathematical Graphing** — Desmos API integration for mathematical curve plotting
- **Export Options** — Download charts as PNG or generate detailed PDF reports with full model summary

### 👥 Workspaces & Collaboration
- **Multi-Workspace Support** — Create isolated workspaces and scope analyses per team or project
- **Team Invitations** — Invite collaborators via real SMTP email (Gmail/SMTP-compatible)
- **Context-Aware Saving** — All analyses and charts save to the currently active workspace
- **Shareable Links** — Generate public share links and embeddable iframes for any chart

### 🌐 Public Gallery
- **Explore Page** — Browse the community gallery of publicly shared analyses at `/explore`
- **Make Public Toggle** — One click to share an analysis with the community

### ⚡ Platform
- **Guest / Demo Mode** — Try the platform without signing up
- **Background Tasks** — Long-running analyses run via Celery + Redis, with real-time polling
- **Onboarding Tour** — Guided interactive walkthrough for new users (react-joyride)
- **Command Palette** — Keyboard-driven navigation across the app
- **Dark / Light Mode** — Full theme system with persistence
- **Auto-save Drafts** — Never lose work with automatic draft persistence

---

## 🛠 Tech Stack

### Backend
| Layer | Technology |
|-------|-----------|
| Framework | Django 4.x + Django REST Framework |
| API | Django Ninja (async-first endpoints) |
| Authentication | PyJWT 2.x + Supabase |
| Database | PostgreSQL (via psycopg2 + dj-database-url) |
| Task Queue | Celery 5.x + Redis |
| ML Models | scikit-learn, scipy, numpy, pandas |
| NLP | LangChain, OpenAI API, spaCy, thefuzz |
| Email | Django SMTP (Gmail-compatible) |
| Server | Gunicorn + WhiteNoise |

### Frontend
| Layer | Technology |
|-------|-----------|
| Framework | React 18.x (with JSX) |
| Build Tool | Vite 5.x |
| Styling | Tailwind CSS 3.x + shadcn/ui |
| Charts | Plotly.js, Highcharts, Desmos API |
| Routing | React Router 6.x |
| State | React Context + Hooks |
| CSV Parsing | PapaParse |
| PDF Export | jsPDF + html2canvas |
| Icons | Lucide React |
| Toasts | Sonner |

---

## 🚀 Quick Start

### Prerequisites

| Tool | Minimum Version | Check |
|------|----------------|-------|
| Node.js | 18.0.0 | `node --version` |
| Python | 3.10.0 | `python --version` |
| npm | 9.0.0 | `npm --version` |
| Git | 2.30.0 | `git --version` |
| Redis | 6.0.0 | `redis-cli --version` |

### 1. Clone the Repository

```bash
git clone https://github.com/Aryan0906/Dataviz.git
cd Dataviz
```

### 2. Backend Setup

```bash
# Create and activate a virtual environment
python -m venv venv
source venv/bin/activate       # macOS / Linux
venv\Scripts\activate          # Windows

# Install dependencies
pip install -r backend_django/requirements.txt

# Download spaCy NLP model
python -m spacy download en_core_web_sm

# Configure environment variables (see Configuration section below)
cp .env.example backend_django/.env

# Run database migrations
cd backend_django
python manage.py migrate

# Start the development server
python manage.py runserver 8000
```

Backend available at: **http://localhost:8000**

### 3. Frontend Setup

```bash
# From the project root
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend available at: **http://localhost:5173**

### 4. Start Background Workers (Optional — for async analysis)

```bash
# In a separate terminal, from backend_django/
celery -A dataviz_backend worker --loglevel=info
```

---

## ⚙️ Configuration

### Backend — `backend_django/.env`

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/dataviz

# Supabase Auth
SUPABASE_JWT_SECRET=your-supabase-jwt-secret

# OpenAI (for AI features)
OPENAI_API_KEY=sk-...

# SMTP Email (for workspace invitations)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
DEFAULT_FROM_EMAIL=your-email@gmail.com

# Redis (for Celery background tasks)
CELERY_BROKER_URL=redis://localhost:6379/0

# Frontend URL (for CORS and share links)
FRONTEND_URL=http://localhost:5173
```

### Frontend — `frontend/.env`

```env
# Backend API base URL
VITE_API_URL=http://localhost:8000/api

# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

---

## 📡 API Reference

**Base URL:** `http://localhost:8000/api`

### Authentication

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST` | `/auth/signup` | Register a new user | ❌ |
| `POST` | `/auth/login` | Authenticate and receive JWT | ❌ |
| `GET` | `/auth/verify` | Verify a JWT token | ✅ |

### Data Analysis

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST` | `/data/analyze` | Run regression / classification | ❌ |
| `POST` | `/data/save` | Save an analysis result | ✅ |
| `GET` | `/data/analyses` | List user's analyses (filterable by workspace) | ✅ |
| `GET` | `/data/analyses/:id` | Get a single analysis | ✅ |
| `DELETE` | `/data/analyses/:id/delete` | Delete an analysis | ✅ |
| `POST` | `/data/categorical` | Analyze categorical data | ❌ |
| `POST` | `/data/export-code` | Generate Python export code | ❌ |
| `POST` | `/analysis/hypothesis` | Run t-test or ANOVA hypothesis test | ❌ |

### AI & NLP

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST` | `/ai/query` | Natural language data query | ✅ |
| `GET` | `/ai/latest` | Fetch latest AI-generated visualization | ✅ |
| `POST` | `/ai/save` | Save AI visualization to history | ✅ |

### Workspaces

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/workspaces` | List user's workspaces | ✅ |
| `POST` | `/workspaces` | Create a new workspace | ✅ |
| `POST` | `/workspaces/:id/invite` | Invite a user to a workspace | ✅ |

### Public Gallery

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/public/analyses` | Fetch all public analyses | ❌ |

### Share & Embed

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST` | `/share` | Generate a shareable link | ✅ |
| `GET` | `/share/:token` | Resolve a share token | ❌ |

### Draft & Session Management

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST` | `/draft/save` | Auto-save a draft | ✅ |
| `GET` | `/draft` | Retrieve saved draft | ✅ |
| `DELETE` | `/draft` | Clear draft | ✅ |
| `POST` | `/draft/finalize` | Promote draft to saved analysis | ✅ |
| `POST` | `/session/save` | Persist page session state | ✅ |
| `GET` | `/session/:page` | Restore session state | ✅ |

---

## 🗺 Application Routes

| Route | Description | Auth |
|-------|-------------|------|
| `/` | Landing page | ❌ |
| `/login` | Sign in / Sign up | ❌ |
| `/onboarding` | Guided onboarding wizard | ✅ |
| `/dashboard` | Modern analytics dashboard | ✅ |
| `/journey` | Alternative journey-style dashboard | ✅ |
| `/manual-plot/regression` | Regression analysis tool | ✅ |
| `/manual-plot/curve` | Desmos mathematical graphing | ✅ |
| `/manual-plot/categorical` | Categorical data visualization | ✅ |
| `/categorical` | NLP-powered chat analytics | ✅ |
| `/smart-analytics` | AI-powered SmartAnalytics | ✅ |
| `/workspaces` | Workspace management | ✅ |
| `/explore` | Public community gallery | ❌ |
| `/profile` | User profile and settings | ✅ |
| `/documentation` | Platform documentation | ✅ |
| `/share/:token` | View a shared analysis | ❌ |
| `/embed/:token` | Embeddable chart iframe | ❌ |

---

## 📁 Project Structure

```
Dataviz/
├── backend_django/
│   ├── api/
│   │   ├── utils/
│   │   │   ├── regression_models.py       # All regression + classification logic
│   │   │   ├── stats_tests.py             # Scipy-based hypothesis testing
│   │   │   ├── classification_models.py   # KNN, Decision Tree, Naive Bayes
│   │   │   ├── code_generator.py          # Python code & notebook export
│   │   │   ├── langchain_helpers.py       # LangChain + OpenAI NLP pipeline
│   │   │   └── ai_helpers.py              # AI chart suggestion logic
│   │   ├── migrations/                    # Database migration history
│   │   ├── models.py                      # AnalysisResult, Visualization, Workspace, etc.
│   │   ├── views.py                       # Core API endpoints
│   │   ├── views_workspaces.py            # Workspace & invite endpoints
│   │   ├── share_views.py                 # Share link endpoints
│   │   ├── tasks.py                       # Celery async task definitions
│   │   └── admin.py                       # Django admin config
│   ├── dataviz_backend/
│   │   ├── settings.py                    # Django settings
│   │   ├── urls.py                        # URL routing
│   │   └── wsgi.py
│   ├── manage.py
│   └── requirements.txt
│
├── frontend/
│   └── src/
│       ├── components/                    # Reusable UI components
│       │   ├── ui/                        # shadcn/ui primitives
│       │   ├── AppLayout.jsx              # App shell with nav
│       │   ├── EnhancedDataAnalyzer.jsx   # Main CSV analysis workbench
│       │   ├── StatsTester.jsx            # Hypothesis testing UI
│       │   ├── UniversalChart.jsx         # Chart renderer
│       │   ├── DataTable.jsx              # Sortable/filterable data table
│       │   ├── CommandPalette.jsx         # Keyboard-driven navigation
│       │   ├── DashboardTour.jsx          # Onboarding tour steps
│       │   └── CodeExportModal.jsx        # Python / Notebook export modal
│       ├── context/
│       │   ├── AuthContext.jsx            # JWT auth state
│       │   ├── WorkspaceContext.jsx       # Active workspace state
│       │   ├── ThemeContext.jsx           # Dark/light mode
│       │   └── StorytellingContext.jsx    # AI story state
│       ├── hooks/
│       │   ├── usePageSession.js          # Page-level session persistence
│       │   └── useTaskPolling.js          # Celery task status polling
│       ├── lib/
│       │   ├── api.js                     # Typed API client
│       │   ├── chartExport.js             # PNG / PDF export helpers
│       │   └── templates.js              # Analysis template presets
│       ├── pages/                         # Route-level page components
│       │   ├── ModernDashboard.jsx
│       │   ├── ExplorePage.jsx            # Public gallery
│       │   ├── WorkspacesPage.jsx
│       │   ├── SmartAnalytics.jsx
│       │   ├── SharedAnalysis.jsx
│       │   └── ...
│       ├── App.jsx                        # Router configuration
│       └── main.jsx                       # Entry point
│
├── .env.example
├── render.yaml                            # Render.com deploy config
├── README.md
└── .gitignore
```

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Commit your changes (keep commits small and focused)
4. Push to your branch: `git push origin feature/your-feature-name`
5. Open a Pull Request against `Main_Project`

Please follow PEP 8 for Python and the project's ESLint config for JavaScript.

---

## 📄 License

This project is for academic and educational use.

---

## 🙏 Acknowledgments

- [shadcn/ui](https://ui.shadcn.com/) — Beautiful, accessible component library
- [Plotly.js](https://plotly.com/javascript/) — Interactive scientific charting
- [Highcharts](https://www.highcharts.com/) — Advanced data visualization
- [Desmos](https://www.desmos.com/api/v1.9/docs/index.html) — Mathematical graphing engine
- [Supabase](https://supabase.com/) — Auth and database infrastructure
- [scikit-learn](https://scikit-learn.org/) — Machine learning models
- [LangChain](https://langchain.com/) — LLM orchestration framework
- [Celery](https://docs.celeryq.dev/) — Distributed task queue
- [Tailwind CSS](https://tailwindcss.com/) — Utility-first styling
