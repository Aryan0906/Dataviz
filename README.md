# 📊 Dataviz - Interactive Data Visualization & Analysis Platform

<div align="center">

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Django](https://img.shields.io/badge/Django-092E20?style=for-the-badge&logo=django&logoColor=white)
![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![scikit-learn](https://img.shields.io/badge/scikit--learn-F7931E?style=for-the-badge&logo=scikit-learn&logoColor=white)

**A powerful full-stack platform for seamless data analysis, visualization, and advanced regression modeling**

[Features](#-features) • [Quick Start](#-quick-start) • [Tech Stack](#-technology-stack) • [API Docs](#-api-documentation) • [Models](#-regression-models)

</div>

---

## ✨ Features

<table>
<tr>
<td width="50%">

### 🔐 Authentication & Security
- Secure JWT-based authentication
- User registration and login
- Protected routes and API endpoints
- Session management with Supabase

### 📊 Data Visualization
- Interactive charts (Line, Bar, Pie, Scatter)
- Real-time data plotting
- Heatmap visualization
- Categorical data analysis with NLP chat
- Desmos integration for curve plotting

</td>
<td width="50%">

### 📈 Advanced Analytics
- **12 Regression Models** auto-selection
- Linear to Machine Learning models
- Statistical metrics (R², RMSE, MAE)
- Predictive modeling
- Model comparison and ranking

### 💾 Data Management
- Manual data entry
- CSV file upload & paste
- Draft auto-save functionality
- Cloud storage with Supabase
- Export charts (PNG/PDF, Light/Dark)

</td>
</tr>
</table>

### 🎯 Key Highlights

| Feature | Description | Status |
|---------|-------------|--------|
| **Multi-Model Analysis** | Automatically tests 12+ regression models | ✅ Active |
| **Real-time Charting** | Dynamic visualization with Recharts & Highcharts | ✅ Active |
| **Dark/Light Theme** | Complete UI theme switching | ✅ Active |
| **Responsive Design** | Mobile, tablet, desktop optimized | ✅ Active |
| **Cloud Persistence** | PostgreSQL via Supabase | ✅ Active |
| **Export Capabilities** | PNG/PDF with theme selection | ✅ Active |
| **AI Integration** | OpenAI for chart suggestions (optional) | ⚠️ Optional |

---

## 🛠️ Technology Stack

<table>
<tr>
<td width="50%" valign="top">

### 🎨 Frontend
| Technology | Purpose | Version |
|------------|---------|---------|
| **React** | UI Framework | 18.x |
| **TypeScript** | Type Safety | 5.x |
| **Vite** | Build Tool | 5.x |
| **Tailwind CSS** | Styling | 3.x |
| **shadcn/ui** | Component Library | Latest |
| **Recharts** | Data Visualization | 2.x |
| **Highcharts** | Advanced Charts | 11.x |
| **React Router** | Navigation | 6.x |
| **React Query** | State Management | 5.x |
| **Desmos** | Mathematical Graphing | API v1.8 |

**🎯 Key Features:**
- Hot Module Replacement (HMR)
- Code splitting & lazy loading
- Responsive grid layouts
- Theme provider system
- Custom hooks & utilities

</td>
<td width="50%" valign="top">

### ⚙️ Backend
| Technology | Purpose | Version |
|------------|---------|---------|
| **Django** | Web Framework | 5.x |
| **Django REST** | API Framework | 3.x |
| **Python** | Language | 3.10+ |
| **PostgreSQL** | Database (Prod) | 15.x |
| **SQLite** | Database (Dev) | 3.x |
| **NumPy** | Numerical Computing | 1.26+ |
| **Pandas** | Data Analysis | 2.x |
| **scikit-learn** | Machine Learning | 1.7+ |
| **scipy** | Scientific Computing | 1.16+ |
| **PyJWT** | Authentication | 2.x |
| **OpenAI** | AI Integration | 1.x |

**🎯 Key Features:**
- RESTful API architecture
- JWT authentication
- CORS handling
- Database migrations
- Comprehensive regression models

</td>
</tr>
</table>

### 🗄️ Database & Infrastructure

| Component | Technology | Description |
|-----------|------------|-------------|
| **Primary DB** | Supabase PostgreSQL | Production database with real-time capabilities |
| **Dev DB** | SQLite | Local development fallback |
| **Storage** | Supabase Storage | File uploads and media storage |
| **Auth** | Supabase Auth | User authentication and session management |
| **Deployment** | Docker-ready | Containerized deployment support |

---

## 📋 Prerequisites

Ensure you have the following installed on your system:

| Requirement | Minimum Version | Recommended | Check Command |
|-------------|----------------|-------------|---------------|
| **Node.js** | 18.0.0 | 20.x LTS | `node --version` |
| **Python** | 3.10.0 | 3.11+ | `python --version` |
| **npm** | 9.0.0 | 10.x | `npm --version` |
| **Git** | 2.30.0 | Latest | `git --version` |
| **pip** | 23.0.0 | Latest | `pip --version` |

### Optional (for Production)
- **PostgreSQL** 15+ (for Supabase)
- **Docker** (for containerized deployment)

---

## 🚀 Quick Start

<details open>
<summary><b>🪟 Windows Users</b></summary>

### Option 1: Double-click
```
📁 start-dev.bat
```

### Option 2: Command Line
```powershell
.\start-dev.bat
```

</details>

<details>
<summary><b>🍎 macOS / 🐧 Linux Users</b></summary>

### Make script executable (first time only)
```bash
chmod +x start-dev.sh
```

### Run the script
```bash
./start-dev.sh
```

</details>

### 🎉 What Happens Automatically

```mermaid
graph LR
    A[Run Script] --> B[Create venv]
    B --> C[Install Backend Deps]
    C --> D[Run Migrations]
    D --> E[Start Django :8000]
    E --> F[Install Frontend Deps]
    F --> G[Start Vite :5173]
    G --> H[Open Browser]
```

✅ Python virtual environment created  
✅ Backend dependencies installed (Django 5.x, scikit-learn 1.7+, scipy 1.16+)  
✅ Database migrated  
✅ Django server running on `http://localhost:8000`  
✅ Frontend dependencies installed  
✅ Vite dev server running on `http://localhost:5173`  
✅ Browser opens automatically  
✅ 12 regression models ready for automatic selection  

**⚡ First-time setup:** ~3-5 minutes | **Subsequent starts:** ~10 seconds  

---

## 🔧 Manual Setup

<details>
<summary><b>Click to expand manual setup instructions</b></summary>

### 1️⃣ Backend Setup (Django)

```bash
# Navigate to project root
cd /path/to/Dataviz

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
.\venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r backend_django/requirements.txt

# Apply database migrations
python backend_django/manage.py migrate

# Create superuser (optional)
python backend_django/manage.py createsuperuser

# Start the Django server
python backend_django/manage.py runserver 8000
```

**Backend will be available at:** `http://localhost:8000`

---

### 2️⃣ Frontend Setup (React + Vite)

Open a **new terminal window**:

```bash
# Navigate to frontend directory
cd frontend

# Install Node dependencies
npm install

# Start the development server
npm run dev
```

**Frontend will be available at:** `http://localhost:5173`

---

### 3️⃣ Verify Installation

| Service | URL | Expected Response |
|---------|-----|-------------------|
| **Backend API** | http://localhost:8000/api/health | `{"status": "ok"}` |
| **Frontend** | http://localhost:5173 | Landing page loads |
| **Admin Panel** | http://localhost:8000/admin | Django admin login |

</details>

---

## 📊 Regression Models

The platform automatically tests **12 comprehensive regression models** and selects the best fit:

<table>
<tr>
<td width="50%" valign="top">

### 📐 Basic Models
| Model | Formula | Use Case |
|-------|---------|----------|
| **Linear** | `y = mx + b` | Straight-line trends |
| **Polynomial** | `y = a₀ + a₁x + a₂x²...` | Curved patterns |
| **Logarithmic** | `y = a·ln(x) + b` | Diminishing returns |
| **Exponential** | `y = a·e^(bx)` | Explosive growth |
| **Power** | `y = ax^b` | Scaling relationships |

**Requirements:** Minimum 2 data points

</td>
<td width="50%" valign="top">

### 🤖 Machine Learning Models
| Model | Type | Use Case |
|-------|------|----------|
| **Ridge** | Regularized | Multicollinearity |
| **Lasso** | Regularized | Feature selection |
| **Elastic Net** | Hybrid | Combined benefits |
| **SVR** | Kernel-based | Non-linear patterns |
| **Decision Tree** | Tree-based | If-then rules |
| **Random Forest** | Ensemble | Complex patterns |
| **Quantile** | Robust | Outlier handling |

**Requirements:** Minimum 10 data points

</td>
</tr>
</table>

### 🎯 Model Selection Process

```
Data Input → Test All Models → Calculate Metrics → Rank by Adj. R² → Return Best Model
```

**Metrics Calculated:**
- **R²** - Coefficient of determination
- **Adjusted R²** - Complexity-adjusted fit
- **RMSE** - Root mean squared error
- **MAE** - Mean absolute error

**Selection Criteria:** Models ranked by **Adjusted R²** (prevents overfitting)

> 📖 **Detailed Documentation:** See [REGRESSION_MODELS.md](REGRESSION_MODELS.md) for comprehensive model information

---

## ⚙️ Configuration

<table>
<tr>
<td width="50%" valign="top">

### 🔧 Backend Configuration

**Location:** `backend_django/.env`

```env
# Database (Production)
DATABASE_URL=postgresql://user:pass@host:5432/db

# Django Settings
DJANGO_SECRET_KEY=your-secret-key-here
DEBUG=False
ALLOWED_HOSTS=localhost,127.0.0.1

# JWT Authentication
JWT_SECRET=your-jwt-secret
JWT_EXP_HOURS=24

# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_KEY=your-supabase-key
SUPABASE_JWT_SECRET=your-jwt-secret

# Frontend
FRONTEND_URL=http://localhost:5173

# OpenAI (Optional)
OPENAI_API_KEY=sk-...
```

**Default:** Uses SQLite for local development

</td>
<td width="50%" valign="top">

### 🎨 Frontend Configuration

**Location:** `frontend/.env`

```env
# Backend API
VITE_API_URL=http://localhost:8000/api

# Supabase
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Feature Flags
VITE_ENABLE_AI=true
VITE_ENABLE_EXPORT=true
```

**Default:** Connects to `http://localhost:8000/api`

</td>
</tr>
</table>

### 🔐 Environment Setup Guide

1. **Copy example files:**
   ```bash
   cp backend_django/.env.example backend_django/.env
   cp frontend/.env.example frontend/.env
   ```

2. **Update with your credentials:**
   - Get Supabase credentials from [supabase.com](https://supabase.com)
   - Generate Django secret: `python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"`
   - Generate JWT secret: `python -c "import secrets; print(secrets.token_hex(32))"`

3. **Restart servers** to apply changes

> **⚠️ Important:** The backend MUST run on port **8000** (not 5000) to match frontend configuration. The startup script now uses port 8000 by default.

---

## 📚 API Documentation

### 🔗 Base URL
```
http://localhost:8000/api
```

### 🛣️ Available Endpoints

<table>
<tr>
<th width="15%">Method</th>
<th width="30%">Endpoint</th>
<th width="35%">Description</th>
<th width="20%">Auth Required</th>
</tr>

<!-- Authentication -->
<tr>
<td colspan="4"><b>🔐 Authentication</b></td>
</tr>
<tr>
<td><code>POST</code></td>
<td><code>/auth/signup</code></td>
<td>Register a new user account</td>
<td>❌ No</td>
</tr>
<tr>
<td><code>POST</code></td>
<td><code>/auth/login</code></td>
<td>Login with email & password</td>
<td>❌ No</td>
</tr>
<tr>
<td><code>GET</code></td>
<td><code>/auth/verify</code></td>
<td>Verify JWT token validity</td>
<td>✅ Yes</td>
</tr>

<!-- Data Analysis -->
<tr>
<td colspan="4"><b>📊 Data Analysis</b></td>
</tr>
<tr>
<td><code>POST</code></td>
<td><code>/data/analyze</code></td>
<td>Perform regression analysis on data points</td>
<td>❌ No</td>
</tr>
<tr>
<td><code>POST</code></td>
<td><code>/data/save</code></td>
<td>Save analysis results to database</td>
<td>✅ Yes</td>
</tr>
<tr>
<td><code>GET</code></td>
<td><code>/data/analyses</code></td>
<td>Retrieve user's saved analyses</td>
<td>✅ Yes</td>
</tr>
<tr>
<td><code>GET</code></td>
<td><code>/data/analysis/:id</code></td>
<td>Get specific analysis by ID</td>
<td>✅ Yes</td>
</tr>
<tr>
<td><code>DELETE</code></td>
<td><code>/data/analysis/:id</code></td>
<td>Delete saved analysis</td>
<td>✅ Yes</td>
</tr>

<!-- Draft Management -->
<tr>
<td colspan="4"><b>📝 Draft Management</b></td>
</tr>
<tr>
<td><code>POST</code></td>
<td><code>/draft/save</code></td>
<td>Auto-save draft analysis (real-time)</td>
<td>✅ Yes</td>
</tr>
<tr>
<td><code>GET</code></td>
<td><code>/draft</code></td>
<td>Retrieve saved draft</td>
<td>✅ Yes</td>
</tr>
<tr>
<td><code>DELETE</code></td>
<td><code>/draft</code></td>
<td>Delete saved draft</td>
<td>✅ Yes</td>
</tr>
<tr>
<td><code>POST</code></td>
<td><code>/draft/finalize</code></td>
<td>Convert draft to saved analysis</td>
<td>✅ Yes</td>
</tr>

<!-- System -->
<tr>
<td colspan="4"><b>⚡ System</b></td>
</tr>
<tr>
<td><code>GET</code></td>
<td><code>/health</code></td>
<td>Check API health status</td>
<td>❌ No</td>
</tr>

</table>

### 📋 Request/Response Examples

<details>
<summary><b>POST /data/analyze</b> - Perform Regression Analysis</summary>

**Request:**
```json
{
  "dataPoints": [
    {"x": 1, "y": 2},
    {"x": 2, "y": 4},
    {"x": 3, "y": 6},
    {"x": 4, "y": 8}
  ]
}
```

**Response:**
```json
{
  "model_name": "Linear Regression",
  "model_type": "linear",
  "equation": "y = 2.0000x + 0.0000",
  "r2": 1.0000,
  "adjusted_r2": 1.0000,
  "rmse": 0.0000,
  "mae": 0.0000,
  "predictions": [[1, 2], [2, 4], [3, 6], [4, 8]],
  "all_models_tested": [...]
}
```

</details>

<details>
<summary><b>POST /auth/signup</b> - User Registration</summary>

**Request:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123"
}
```

**Response:**
```json
{
  "message": "User created successfully",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

</details>

> 📖 **Full API Documentation:** See [backend_django/README.md](backend_django/README.md)

---

## 🎨 Application Pages

| Page | Route | Description | Auth Required |
|------|-------|-------------|---------------|
| **Landing** | `/` | Welcome page with features overview | ❌ |
| **Login** | `/login` | User authentication | ❌ |
| **Dashboard** | `/dashboard` | User's saved analyses | ✅ |
| **Regression Model** | `/manual-plot` | Advanced regression analysis | ❌ |
| **Curve Plotter** | `/curve-plot` | Desmos mathematical graphing | ❌ |
| **Categorical Chat** | `/categorical` | NLP-based categorical data viz | ❌ |
| **Profile** | `/profile` | User profile settings | ✅ |
| **AI Features** | `/ai` | AI-powered chart suggestions | ❌ |

---

## 🚢 Deployment

### 🐳 Docker Deployment

```bash
# Build and run with Docker Compose
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### ☁️ Production Deployment

<table>
<tr>
<th>Platform</th>
<th>Frontend</th>
<th>Backend</th>
<th>Database</th>
</tr>
<tr>
<td><b>Recommended</b></td>
<td>Vercel / Netlify</td>
<td>Railway / Render</td>
<td>Supabase</td>
</tr>
<tr>
<td><b>Alternative</b></td>
<td>AWS Amplify</td>
<td>Heroku / AWS</td>
<td>PostgreSQL RDS</td>
</tr>
</table>

**Production Checklist:**
- [ ] Set `DEBUG=False` in Django settings
- [ ] Configure `ALLOWED_HOSTS` with actual domain
- [ ] Update `CSRF_TRUSTED_ORIGINS` with production URLs
- [ ] Set up environment variables (.env files NOT in git)
- [ ] Enable HTTPS/SSL (configure `SECURE_SSL_REDIRECT=True`)
- [ ] Update `VITE_API_URL` to production backend URL
- [ ] Configure CORS with specific origins (disable `CORS_ALLOW_ALL_ORIGINS`)
- [ ] Set up database backups
- [ ] Configure error monitoring (Sentry recommended)
- [ ] Run security audits (`pip-audit`, `npm audit`)
- [ ] Set strong `SECRET_KEY` and `JWT_SECRET`
- [ ] Review and update `requirements.txt` dependencies
- [ ] Configure static file serving (`collectstatic`)
- [ ] Set up CDN for media files
- [ ] Enable rate limiting on API endpoints

> **📋 Full Checklist:** See [PRODUCTION_CHECKLIST.md](PRODUCTION_CHECKLIST.md) for detailed deployment guide

---

## 🧪 Testing

```bash
# Backend tests
cd backend_django
python manage.py test

# Test regression module specifically
python -c "from api.utils.regression_models import find_best_regression; result = find_best_regression([{'x': 1, 'y': 2}, {'x': 2, 'y': 4}]); print(f'Model: {result[\"model_name\"]}, R²: {result[\"r2\"]}')"

# Frontend tests
cd frontend
npm run test

# Lint checks
npm run lint

# Type checking
npx tsc --noEmit
```

### ✅ Verification Tests

**Quick Health Check:**
```bash
# Backend API health
curl http://localhost:8000/api/health

# Expected: {"status": "ok"}
```

**Test Regression Analysis:**
```bash
# Test the analyze endpoint
curl -X POST http://localhost:8000/api/data/analyze \
  -H "Content-Type: application/json" \
  -d '{"dataPoints": [{"x": 1, "y": 2}, {"x": 2, "y": 4}, {"x": 3, "y": 6}]}'

# Expected: JSON response with model_name, equation, r2, etc.
```

---

## 🤝 Contributing

We welcome contributions! Here's how you can help:

### 📝 Contribution Guidelines

<table>
<tr>
<td width="33%" align="center">

### 🐛 Report Bugs
Found a bug?  
[Open an issue](../../issues)

Include:
- Steps to reproduce
- Expected behavior
- Screenshots (if applicable)

</td>
<td width="33%" align="center">

### ✨ Request Features
Have an idea?  
[Submit a feature request](../../issues)

Include:
- Use case
- Expected behavior
- Benefits

</td>
<td width="33%" align="center">

### 🔧 Submit PRs
Want to contribute code?  
[Create a pull request](../../pulls)

Follow:
- Code style guide
- Add tests
- Update docs

</td>
</tr>
</table>

### 🔄 Development Workflow

```bash
# 1. Fork the repository
git clone https://github.com/YOUR_USERNAME/Dataviz.git

# 2. Create a feature branch
git checkout -b feature/AmazingFeature

# 3. Make your changes
# ... code, code, code ...

# 4. Commit your changes
git commit -m 'Add some AmazingFeature'

# 5. Push to your branch
git push origin feature/AmazingFeature

# 6. Open a Pull Request
```

### 📏 Code Style

| Language | Style Guide | Linter |
|----------|-------------|--------|
| **JavaScript/TypeScript** | ESLint + Prettier | `npm run lint` |
| **Python** | PEP 8 | `flake8` / `black` |
| **CSS** | BEM naming | Tailwind classes |

---

## 📄 Project Structure

```
Dataviz/
├── 📁 backend_django/           # Django backend
│   ├── 📁 api/                  # API application
│   │   ├── 📁 utils/            # Utility modules
│   │   │   ├── ai_helpers.py    # OpenAI integration
│   │   │   └── regression_models.py  # ML models
│   │   ├── models.py            # Database models
│   │   ├── views.py             # API endpoints
│   │   └── urls.py              # URL routing
│   ├── 📁 dataviz_backend/      # Project settings
│   ├── manage.py                # Django management
│   └── requirements.txt         # Python dependencies
│
├── 📁 frontend/                 # React frontend
│   ├── 📁 src/
│   │   ├── 📁 components/       # React components
│   │   │   ├── 📁 ui/           # shadcn/ui components
│   │   │   ├── AppLayout.jsx
│   │   │   ├── DataAnalyzer.jsx
│   │   │   ├── DataPlot.jsx
│   │   │   ├── DesmosPlot.jsx
│   │   │   └── UniversalChart.jsx
│   │   ├── 📁 pages/            # Page components
│   │   │   ├── Dashboard.jsx
│   │   │   ├── ManualPlotRegression.jsx
│   │   │   ├── ManualPlotCurve.jsx
│   │   │   └── CategoricalChat.jsx
│   │   ├── 📁 context/          # React context
│   │   ├── 📁 hooks/            # Custom hooks
│   │   ├── 📁 lib/              # Utilities
│   │   │   ├── api.js           # API client
│   │   │   ├── chartExport.js   # Export utilities
│   │   │   └── supabase.js      # Supabase client
│   │   ├── App.jsx              # Main component
│   │   └── main.jsx             # Entry point
│   ├── package.json             # Node dependencies
│   └── vite.config.js           # Vite configuration
│
├── 📁 media/                    # Uploaded files
├── 📄 docker-compose.yml        # Docker configuration
├── 📄 start-dev.bat             # Windows startup script
├── 📄 start-dev.sh              # Unix startup script
├── 📄 .gitignore                # Git ignore rules
├── 📄 README.md                 # This file
├── 📄 REGRESSION_MODELS.md      # Model documentation
└── 📄 IMPLEMENTATION_SUMMARY.md # Implementation details
```

---

## 🎓 Learning Resources

### 📚 Documentation
- [Django Documentation](https://docs.djangoproject.com/)
- [React Documentation](https://react.dev/)
- [Vite Guide](https://vitejs.dev/guide/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [scikit-learn](https://scikit-learn.org/stable/)
- [Supabase Docs](https://supabase.com/docs)

### 🎥 Tutorials
- [Django REST Framework Tutorial](https://www.django-rest-framework.org/tutorial/quickstart/)
- [React + TypeScript](https://react-typescript-cheatsheet.netlify.app/)
- [Machine Learning Basics](https://scikit-learn.org/stable/tutorial/index.html)

---

## 🐛 Troubleshooting

<details>
<summary><b>Port already in use</b></summary>

**Problem:** `Error: Port 8000 is already in use`

**Solution:**
```bash
# Find and kill process using port
# Windows:
netstat -ano | findstr :8000
taskkill /PID <PID> /F

# macOS/Linux:
lsof -ti:8000 | xargs kill -9

# Or use a different port:
python backend_django/manage.py runserver 8001
```

</details>

<details>
<summary><b>Failed to connect to backend</b></summary>

**Problem:** Frontend shows "Failed to analyze data" or "Failed to fetch"

**Solution:**
1. Verify backend is running: http://localhost:8000/api/health
2. Check frontend `.env` has correct URL: `VITE_API_URL=http://localhost:8000/api`
3. Restart both servers:
   ```bash
   # Kill all processes
   # Windows: taskkill /F /IM python.exe /IM node.exe
   # macOS/Linux: pkill python; pkill node
   
   # Restart with the script
   .\start-dev.bat   # Windows
   ./start-dev.sh    # macOS/Linux
   ```
4. Check browser console (F12) for detailed error messages

</details>

<details>
<summary><b>Module not found errors</b></summary>

**Problem:** `ModuleNotFoundError: No module named 'xyz'`

**Solution:**
```bash
# Backend
pip install -r backend_django/requirements.txt

# Frontend
cd frontend && npm install
```

</details>

<details>
<summary><b>Database migration errors</b></summary>

**Problem:** Migration conflicts or errors

**Solution:**
```bash
# Reset migrations (local dev only!)
rm backend_django/db.sqlite3
python backend_django/manage.py migrate
```

</details>

<details>
<summary><b>CORS errors in browser</b></summary>

**Problem:** `Access-Control-Allow-Origin` errors

**Solution:** Check `FRONTEND_URL` in backend `.env` matches your frontend URL

</details>

---

## 📊 Performance

| Metric | Value | Notes |
|--------|-------|-------|
| **Initial Load** | < 2s | First page load |
| **API Response** | < 200ms | Average endpoint response |
| **Regression Analysis** | < 1s | 12 models tested |
| **Chart Rendering** | < 100ms | Interactive updates |
| **Build Time** | < 30s | Production build |

---

## 🔐 Security

- ✅ JWT-based authentication
- ✅ Password hashing with Django's built-in hasher
- ✅ CORS protection
- ✅ SQL injection prevention (ORM)
- ✅ XSS protection (React escaping)
- ✅ CSRF tokens for state-changing operations
- ✅ Environment variable security
- ⚠️ Enable HTTPS in production
- ⚠️ Regular dependency updates

---

## 📝 License

Distributed under the **MIT License**. See [`LICENSE`](LICENSE) for more information.

```
MIT License - Copyright (c) 2026 Dataviz Contributors
```

---

## 👥 Authors & Contributors

<table>
<tr>
<td align="center">
<img src="https://via.placeholder.com/100" width="100" alt="Author"/><br/>
<b>Your Name</b><br/>
<sub>Creator</sub>
</td>
<td>

**Contributions Welcome!**

We appreciate all contributions, big or small.  
See our [contributing guidelines](#-contributing) to get started.

</td>
</tr>
</table>

---

## 🌟 Acknowledgments

- [shadcn/ui](https://ui.shadcn.com/) - Beautiful component library
- [Recharts](https://recharts.org/) - Composable charting library
- [Highcharts](https://www.highcharts.com/) - Advanced charting
- [Desmos](https://www.desmos.com/) - Mathematical graphing
- [Supabase](https://supabase.com/) - Backend infrastructure
- [scikit-learn](https://scikit-learn.org/) - Machine learning models
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS

---

## 📞 Support

Need help? Here's how to get support:

| Method | Link | Response Time |
|--------|------|---------------|
| **GitHub Issues** | [Open an issue](../../issues) | 24-48 hours |
| **Email** | your-email@example.com | 2-3 days |
| **Documentation** | [Wiki](../../wiki) | Instant |

---

<div align="center">

### ⭐ Star this repo if you find it helpful!

**Made with ❤️ by the Dataviz Team**

[⬆ Back to Top](#-dataviz---interactive-data-visualization--analysis-platform)

</div>
