# Full Project Context for Claude

This document contains a comprehensive overview of the `Dataviz` project. It synthesizes the information from the `README.md`, `package.json`, `requirements.txt`, and key architecture/feature documentation, providing enough context to fully understand the project without needing every individual file.

## 1. Project Overview & Architecture
**Project Name:** Dataviz
**Description:** A full-stack data visualization and analysis platform built with React, Django, and machine learning capabilities. It provides automated regression modeling, interactive charting, and Python code generation features, as well as an NLP-driven chatbot for analyzing categorical data.

**Monorepo Structure:**
```text
Dataviz/
├── backend_django/
│   ├── api/                  # Django REST API app (views, models, utils)
│   │   └── utils/            # ML/NLP helpers (ai_helpers.py, code_generator.py, nlp_helpers.py, regression_models.py)
│   ├── dataviz_backend/      # Core Django settings
│   └── requirements.txt      # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── components/       # UI components (UniversalChart, DataAnalyzer, etc.)
│   │   ├── pages/            # Main views (Dashboard, CategoricalChatNLP, etc.)
│   │   ├── context/          # React Context (AuthContext)
│   │   ├── lib/              # API and Utils (api.js, supabase.js, chartExport.js)
│   │   └── App.jsx           # React Router setup
│   ├── package.json          # Node dependencies
│   └── vite.config.js
└── docker-compose.yml
```

## 2. Tech Stack

### Frontend
- **Framework:** React 18 + Vite
- **Styling:** Tailwind CSS + shadcn/ui
- **Charting Libraries:** Plotly.js, Highcharts, Recharts, Desmos API
- **State management & Routing:** React Context, React Router DOM 7
- **Other Key Dependencies:** `papaparse` (CSV handling), `lucide-react` (icons), `@supabase/supabase-js` (Auth).

### Backend
- **Framework:** Django 5 with Django REST Framework, Django Ninja
- **Database:** PostgreSQL (Production) / SQLite (Dev)
- **Data & ML Libraries:**
  - `pandas`, `numpy`, `scipy`, `scikit-learn` (Modeling and data manipulation)
  - `matplotlib`, `seaborn` (for backend plotting logic/code generation)
  - `openai`, `langchain`, `spacy` (NLP & Chat intelligence)
  - `thefuzz`, `python-Levenshtein` (Fuzzy string matching for columns)
- **Authentication:** Supabase (JWT-based)
- **Task Queue:** Celery + Redis

## 3. Core Features & Capabilities

### Categorical Data Analysis (NLP Chatbot)
Implemented primarily in `frontend/src/pages/CategoricalChatNLP.jsx` and `frontend/src/components/UniversalChart.jsx`.
- **User Flow:** Upload a CSV -> System detects column metadata (categorical vs numerical) -> User asks natural language questions (e.g., "Show me total sales by City").
- **Backend NLP:** The backend (`/api/nlp-query`) parses intents, matches columns via fuzzy matching (`thefuzz`), aggregates data using pandas, and generates narrative insights.
- **Frontend UI (4 Quadrants):**
  1. **Dynamic Visualizer:** Shows the chart (Bar, Pie, Treemap) generated from the answer. Allows clicking on elements (e.g., bars) to filter the data table.
  2. **Intelligence Hub:** Chat interface, column metadata badges, CSV import button.
  3. **Categorical Insights:** NLP text summary (e.g., "New York leads with $500K"), cardinality, top/bottom performers, missing data stats.
  4. **Smart Data Table:** Paginated table that syncs with chart clicks.

### Automatic Regression Modeling
Implemented in `frontend/src/components/DataAnalyzer.jsx`.
- **Workflow:** You feed it X/Y numerical data (manual entry or CSV).
- **Backend Evaluation (12 Models Tested Automatically):**
  - **Basic Models:** Linear, Polynomial (degree 2-6), Logarithmic, Exponential, Power.
  - **Advanced Models:** Ridge, Lasso, Elastic Net, Support Vector Regression (SVR), Decision Tree, Random Forest, Quantile Regression.
- **Selection Algorithm:** Backend computes metrics (R², Adjusted R², RMSE, MAE) and automatically returns the best-fitting model ranked by **Adjusted R²**.
- **Output:** Frontend updates with the best-fit regression line, stats, and a breakdown of the top 5 models.

### Universal Exports & Code Generation
- Charts can be exported as PNG, PDF, or SVG (supporting light/dark themes).
- Users can export the exact visualizations as Python scripts (generating Matplotlib, Seaborn, or Plotly code).

## 4. API Endpoints Overview
The Django API operates from `http://localhost:8000/api`. Main surface areas:
- `/auth/signup`, `/auth/login`, `/auth/verify`
- `/data/analyze` (Runs automated regression and best model selection)
- `/data/categorical` (Processes NLP queries for categorical analytics)
- `/data/save`, `/data/analyses` (Saving session and chart data)
- `/data/export-code` (Generating Python export scripts)
- `/session/save`, `/session/:page` (Autosave page session states)

## 5. Typical Data Structures
**NLP Query Response Payload Example:**
```json
{
  "chart": {
    "title": "Total Sales by City",
    "type": "bar",
    "labels": ["New York", "London", "Surat"],
    "datasets": [{ "data": [500, 300, 150] }]
  },
  "insights": {
    "summary": "New York leads with 500 sales, 1.5x higher than average...",
    "cardinality": 3,
    "topPerformer": { "label": "New York", "value": 500 },
    "bottomPerformer": { "label": "Surat", "value": 150 },
    "missingData": 0,
    "totalCount": 950
  },
  "table_data": [...]
}
```

**Regression Result Payload Example:**
```json
{
  "model_name": "Polynomial Regression (Degree 3)",
  "model_type": "polynomial-3",
  "equation": "y = 0.0012x^3 - 0.1234x^2 + 1.5678x + 2.3456",
  "r2": 0.9876,
  "adjusted_r2": 0.9845,
  "predictions": [[...]],
  "all_models_tested": [...]
}
```
