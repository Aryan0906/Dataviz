# Dataviz - Interactive Data Visualization Platform

A full-stack data visualization and analysis platform built with React, Django, and machine learning capabilities. Provides automated regression modeling, interactive charting, smart data cleaning, and code generation features.

## Features

### Core Capabilities
- **Authentication System**: JWT-based secure user authentication with Supabase integration
- **Data Visualization**: Interactive charts (Bar, Pie, Scatter, Heatmap, Histogram) with Plotly and Highcharts
- **Advanced Analytics**: Automatic selection from 12 regression models (Linear to Random Forest)
- **Categorical Analysis**: NLP-powered chat interface for categorical data exploration
- **Mathematical Graphing**: Desmos integration for curve plotting
- **Export Options**: PNG, PDF, SVG with light/dark theme selection, and Python code generation

### Smart Analytics
- **Data Health Checks**: Automatic detection of missing values, duplicates, and type mismatches
- **Data Cleaning**: Six methods including mean/median imputation, forward fill, and drop
- **Correlation Analysis**: Interactive heatmap with click-to-select variables
- **Residual Analysis**: Scientific model validation with statistical interpretation
- **Code Export**: Generate Python scripts for regression, EDA, and data cleaning
- **Session Persistence**: Auto-save functionality with 2-second intervals

### Technical Features
- **Fast Processing**: 10-50x performance improvement with Polars
- **NLP Intelligence**: Fuzzy matching and entity extraction using spaCy
- **Smart Queries**: Natural language to Pandas/SQL conversion via LangChain
- **Data Validation**: Schema validation with Pandera
- **Background Tasks**: Async processing with Celery and Redis
- **Responsive Design**: Mobile, tablet, and desktop optimized UI
- **Theme Support**: Complete dark/light mode switching

## Technology Stack

### Frontend
- **Framework**: React 18.x with TypeScript
- **Build Tool**: Vite 5.x
- **Styling**: Tailwind CSS 3.x with shadcn/ui components
- **Charts**: Plotly.js 2.x, Highcharts 11.x, Recharts
- **State Management**: React Query 5.x
- **Routing**: React Router 6.x
- **Additional**: Papa Parse (CSV), Desmos API, React Syntax Highlighter

### Backend
- **Framework**: Django 5.x with Django REST Framework 3.x
- **Language**: Python 3.11+
- **Database**: PostgreSQL 15.x (Production), SQLite 3.x (Development)
- **ML Libraries**: scikit-learn 1.8+, scipy 1.17+, NumPy 2.x, Pandas 3.x, Polars 1.x
- **NLP**: spaCy 3.8+, TheFuzz 0.22+, LangChain 1.x
- **Task Queue**: Celery 5.x with Redis 7.x
- **Validation**: Pandera 0.29+
- **Authentication**: PyJWT 2.x with Supabase

## Prerequisites

| Requirement | Minimum Version | Check Command |
|-------------|----------------|---------------|
| Node.js | 18.0.0 | `node --version` |
| Python | 3.10.0 | `python --version` |
| npm | 9.0.0 | `npm --version` |
| Git | 2.30.0 | `git --version` |
| pip | 23.0.0 | `pip --version` |

### Optional
- PostgreSQL 15+ (for production deployment)
- Docker (for containerized deployment)

## Quick Start

### Windows
```batch
start-dev.bat
```

### macOS / Linux
```bash
chmod +x start-dev.sh
./start-dev.sh
```

The startup script will automatically:
- Create Python virtual environment
- Install backend dependencies
- Run database migrations
- Start Django server on port 8000
- Install frontend dependencies
- Start Vite dev server on port 5173
- Open browser to application

First-time setup takes approximately 3-5 minutes. Subsequent starts take ~10 seconds.

## Manual Setup

### Backend (Django)

```bash
# Create and activate virtual environment
python -m venv venv

# Windows
.\venv\Scripts\activate

# macOS/Linux
source venv/bin/activate

# Install dependencies
pip install -r backend_django/requirements.txt

# Run migrations
python backend_django/manage.py migrate

# Start server
python backend_django/manage.py runserver 8000
```

Backend will be available at: `http://localhost:8000`

### Frontend (React + Vite)

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend will be available at: `http://localhost:5173`

## Configuration

### Backend Environment Variables

Create `backend_django/.env`:

```env
# Database
DATABASE_URL=postgresql://user:pass@host:5432/db

# Django
DJANGO_SECRET_KEY=your-secret-key-here
DEBUG=False
ALLOWED_HOSTS=localhost,127.0.0.1

# JWT
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

### Frontend Environment Variables

Create `frontend/.env`:

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

## Regression Models

The platform automatically tests 12 regression models and selects the best fit:

### Basic Models
- **Linear Regression**: y = mx + b (straight-line trends)
- **Polynomial Regression**: y = a₀ + a₁x + a₂x² (curved patterns)
- **Logarithmic Regression**: y = a·ln(x) + b (diminishing returns)
- **Exponential Regression**: y = a·e^(bx) (explosive growth)
- **Power Regression**: y = ax^b (scaling relationships)

### Machine Learning Models
- **Ridge Regression**: Regularized regression for multicollinearity
- **Lasso Regression**: Feature selection via L1 regularization
- **Elastic Net**: Combined L1/L2 regularization
- **Support Vector Regression**: Kernel-based non-linear modeling
- **Decision Tree**: Rule-based regression
- **Random Forest**: Ensemble tree-based modeling
- **Quantile Regression**: Robust to outliers

**Selection Criteria**: Models ranked by Adjusted R² score to prevent overfitting.

**Metrics Provided**: R², Adjusted R², RMSE (Root Mean Squared Error), MAE (Mean Absolute Error)

## API Documentation

Base URL: `http://localhost:8000/api`

### Authentication Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/auth/signup` | Register new user | No |
| POST | `/auth/login` | User authentication | No |
| GET | `/auth/verify` | Verify JWT token | Yes |

### Data Analysis Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/data/analyze` | Perform regression analysis | No |
| POST | `/data/save` | Save analysis results | Yes |
| GET | `/data/analyses` | Get user's saved analyses | Yes |
| GET | `/data/analysis/:id` | Get specific analysis | Yes |
| DELETE | `/data/analysis/:id` | Delete analysis | Yes |

### Draft Management Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/draft/save` | Auto-save draft | Yes |
| GET | `/draft` | Get saved draft | Yes |
| DELETE | `/draft` | Delete draft | Yes |
| POST | `/draft/finalize` | Convert draft to analysis | Yes |

### Smart Analytics Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/data/check-health` | Data health check | No |
| POST | `/data/clean` | Apply cleaning operations | No |
| POST | `/data/correlation` | Calculate correlation matrix | No |
| POST | `/data/generate-code` | Generate Python code | No |

## Application Routes

| Route | Description | Auth Required |
|-------|-------------|---------------|
| `/` | Landing page | No |
| `/login` | User authentication | No |
| `/dashboard` | User's saved analyses | Yes |
| `/manual-plot` | Regression analysis tool | No |
| `/curve-plot` | Desmos mathematical graphing | No |
| `/categorical` | Categorical data visualization | No |
| `/smart-analytics` | Data cleaning and analytics | Yes |
| `/profile` | User profile | Yes |

## Project Structure

```
Dataviz/
├── backend_django/
│   ├── api/
│   │   ├── utils/
│   │   │   ├── ai_helpers.py
│   │   │   ├── code_generator.py
│   │   │   ├── data_cleaning.py
│   │   │   ├── data_validation.py
│   │   │   ├── langchain_helpers.py
│   │   │   ├── nlp_helpers.py
│   │   │   └── regression_models.py
│   │   ├── models.py
│   │   ├── views.py
│   │   └── admin.py
│   ├── dataviz_backend/
│   │   ├── settings.py
│   │   ├── urls.py
│   │   └── wsgi.py
│   ├── manage.py
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/
│   │   │   ├── AppLayout.jsx
│   │   │   ├── DataAnalyzer.jsx
│   │   │   ├── DataPlot.jsx
│   │   │   ├── DesmosPlot.jsx
│   │   │   ├── PlotlyChart.jsx
│   │   │   └── UniversalChart.jsx
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── LandingPage.jsx
│   │   │   ├── ManualPlotRegression.jsx
│   │   │   ├── ManualPlotCurve.jsx
│   │   │   └── CategoricalChatNLP.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   ├── lib/
│   │   │   ├── api.js
│   │   │   ├── chartExport.js
│   │   │   └── supabase.js
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
├── docker-compose.yml
├── start-dev.bat
├── start-dev.sh
├── .gitignore
└── README.md
```

## Testing

```bash
# Backend tests
cd backend_django
python manage.py test

# Frontend tests
cd frontend
npm run test

# Linting
npm run lint
```

## Deployment

### Docker Deployment

```bash
# Build and run
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Production Checklist

- [ ] Set `DEBUG=False` in Django settings
- [ ] Configure `ALLOWED_HOSTS` with production domain
- [ ] Update `CSRF_TRUSTED_ORIGINS` with production URLs
- [ ] Set environment variables securely
- [ ] Enable HTTPS/SSL (`SECURE_SSL_REDIRECT=True`)
- [ ] Update `VITE_API_URL` to production backend
- [ ] Configure CORS with specific origins
- [ ] Set up database backups
- [ ] Configure error monitoring
- [ ] Run security audits (`pip-audit`, `npm audit`)
- [ ] Generate strong `SECRET_KEY` and `JWT_SECRET`
- [ ] Run `collectstatic` for Django static files
- [ ] Set up CDN for media files
- [ ] Enable rate limiting on API endpoints

## Troubleshooting

### Port Already in Use

```bash
# Windows
netstat -ano | findstr :8000
taskkill /PID <PID> /F

# macOS/Linux
lsof -ti:8000 | xargs kill -9
```

### Module Not Found Errors

```bash
# Backend
pip install -r backend_django/requirements.txt

# Frontend
cd frontend && npm install
```

### Database Migration Errors

```bash
# Reset database (development only)
rm backend_django/db.sqlite3
python backend_django/manage.py migrate
```

## Contributing

Contributions are welcome. Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/YourFeature`)
3. Commit your changes (`git commit -m 'Add YourFeature'`)
4. Push to the branch (`git push origin feature/YourFeature`)
5. Open a Pull Request

### Code Style

- JavaScript/TypeScript: Follow ESLint configuration
- Python: Follow PEP 8 guidelines
- CSS: Use Tailwind utility classes

## License

Distributed under the MIT License. See LICENSE for more information.

## Support

- GitHub Issues: For bug reports and feature requests
- Documentation: Available in repository wiki
- Email: your-email@example.com

## Acknowledgments

- shadcn/ui - Component library
- Recharts - Charting library
- Highcharts - Advanced charting
- Plotly - Interactive 3D charts
- Desmos - Mathematical graphing
- Supabase - Backend infrastructure
- scikit-learn - Machine learning models
- Tailwind CSS - Styling framework
