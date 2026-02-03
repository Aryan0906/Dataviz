# Dataviz - Interactive Data Visualization Platform

A full-stack data visualization and analysis platform built with React, Django, and machine learning capabilities. Provides automated regression modeling, interactive charting, and Python code generation features.

## Features

### Core Capabilities
- **Authentication System**: JWT-based secure user authentication with Supabase integration
- **Data Visualization**: Interactive charts (Bar, Pie, Scatter, Heatmap, Histogram) with Plotly and Highcharts
- **Advanced Analytics**: Automatic selection from multiple regression models (Linear, Polynomial, Exponential, Logarithmic, Power)
- **Categorical Analysis**: AI-powered chat interface for categorical data exploration with natural language processing
- **Mathematical Graphing**: Desmos integration for curve plotting and mathematical function visualization
- **Export Options**: PNG, PDF, SVG with light/dark theme selection, and Python code generation for all chart types

### Regression Analysis
- **Multiple Model Types**: Linear, Polynomial (degrees 2-4), Exponential, Logarithmic, and Power regression
- **Automatic Model Selection**: Analyzes data and recommends the best-fit model
- **Comprehensive Metrics**: R², Adjusted R², RMSE, MAE, and detailed residual analysis
- **Visual Validation**: Interactive charts with regression lines, confidence intervals, and residual plots
- **Python Code Export**: Generate ready-to-run Python scripts for Matplotlib, Seaborn, and Plotly

### Categorical Data Analysis
- **NLP-Powered Chat**: Natural language queries to explore categorical data patterns
- **Multiple Chart Types**: Bar charts, pie charts, histograms, scatter plots, and heatmaps
- **Smart Insights**: Automatic pattern detection and statistical summaries
- **Interactive Visualizations**: Hover tooltips, zoom, pan, and drill-down capabilities
- **Code Generation**: Export analysis as Python scripts for reproducibility

### Technical Features
- **Session Persistence**: Auto-save functionality with real-time state management
- **Theme Support**: Complete dark/light mode with theme-aware exports
- **Responsive Design**: Mobile, tablet, and desktop optimized UI
- **Fast Processing**: Efficient data handling and visualization rendering
- **Reusable Components**: Standardized export buttons and modals across all pages

## Technology Stack

### Backend
- **Framework**: Django 5.x with Django REST Framework 3.x
- **Language**: Python 3.11+
- **Database**: PostgreSQL 15.x (Production), SQLite 3.x (Development)
- **ML Libraries**: scikit-learn 1.8+, scipy 1.17+, NumPy 2.x
- **Data Processing**: Pandas 2.x for data manipulation
- **Validation**: Built-in data validation and error handling
- **Authentication**: PyJWT 2.x with Supabase

### Frontend
- **Framework**: React 18.x with JSX
- **Build Tool**: Vite 5.x for fast development and builds
- **Styling**: Tailwind CSS 3.x with shadcn/ui components
- **Charts**: Plotly.js 2.x, Highcharts 11.x, Desmos API
- **State Management**: React Context and Hooks
- **Routing**: React Router 6.x
- **Additional**: Papa Parse (CSV parsing), Lucide React (icons)

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

The platform supports multiple regression types with automatic model fitting:

### Available Models
- **Linear Regression**: y = mx + b (straight-line relationships)
- **Polynomial Regression (Degree 2-4)**: y = a₀ + a₁x + a₂x² + ... (curved patterns)
- **Exponential Regression**: y = a·e^(bx) (exponential growth/decay)
- **Logarithmic Regression**: y = a·ln(x) + b (diminishing returns)
- **Power Regression**: y = ax^b (power-law relationships)

**Selection Process**: The system analyzes your data pattern and recommends the most appropriate model type.

**Metrics Provided**: 
- R² (Coefficient of Determination)
- Adjusted R² (Adjusted for model complexity)
- RMSE (Root Mean Squared Error)
- MAE (Mean Absolute Error)
- Residual plots for model validation

**Code Export**: All regression models can be exported as Python scripts for Matplotlib, Seaborn, and Plotly, with the exact model type preserved.

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
| POST | `/data/categorical` | Analyze categorical data | No |
| POST | `/data/export-code` | Generate Python export code | No |

### Draft Management Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/draft/save` | Auto-save draft | Yes |
| GET | `/draft` | Get saved draft | Yes |
| DELETE | `/draft` | Delete draft | Yes |
| POST | `/draft/finalize` | Convert draft to analysis | Yes |

### Session Management Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/session/save` | Save page session state | Yes |
| GET | `/session/:page` | Retrieve session state | Yes |
| DELETE | `/session/:page` | Clear session state | Yes |

## Application Routes

| Route | Description | Auth Required |
|-------|-------------|---------------|
| `/` | Landing page with feature overview | No |
| `/login` | User authentication | No |
| `/dashboard` | User's saved analyses and dashboard | Yes |
| `/manual-plot/regression` | Regression analysis tool | No |
| `/manual-plot/curve` | Desmos mathematical graphing | No |
| `/manual-plot/categorical` | Categorical data visualization | No |
| `/categorical-chat` | NLP-powered categorical analysis | No |
| `/ai` | AI features and tools | Yes |
| `/profile` | User profile and settings | Yes |

## Project Structure

```
Dataviz/
├── backend_django/
│   ├── api/
│   │   ├── utils/
│   │   │   ├── ai_helpers.py
│   │   │   ├── code_generator.py
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
│   │   │   ├── DesmosPlot.jsx
│   │   │   ├── PlotlyChart.jsx
│   │   │   ├── ChartCodeExportModal.jsx
│   │   │   └── ExportCodeButton.jsx
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── LandingPage.jsx
│   │   │   ├── ManualPlotRegression.jsx
│   │   │   ├── ManualPlotCurve.jsx
│   │   │   ├── ManualPlotCategorical.jsx
│   │   │   └── CategoricalChatNLP.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   ├── hooks/
│   │   │   ├── usePageSession.js
│   │   │   └── use-toast.js
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

- shadcn/ui - Beautiful component library
- Plotly - Interactive charting library
- Highcharts - Advanced data visualization
- Desmos - Mathematical graphing engine
- Supabase - Authentication and backend infrastructure
- scikit-learn - Machine learning models
- Tailwind CSS - Utility-first styling framework
- Lucide React - Modern icon library
