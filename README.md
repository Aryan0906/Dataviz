# Dataviz - Interactive Data Visualization & Analysis Platform

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Django](https://img.shields.io/badge/Django-092E20?style=for-the-badge&logo=django&logoColor=white)
![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)

A full-stack web application designed for seamless data analysis and visualization. Dataviz empowers users to upload datasets, perform regression analysis, and generate interactive charts with a modern, responsive user interface.

## ✨ Features

- **🔐 Robust Authentication** - Secure signup and login functionality powered by JWT tokens.
- **📊 Interactive Visualization** - Dynamic charts and graphs using Recharts.
- **📈 Advanced Regression** - Automatic calculation of best-fit models (Linear, Polynomial) with predictive capabilities.
- **📁 Flexible Data Input** - Support for manual data entry or CSV file uploads.
- **💾 Cloud Persistence** - Save and manage your analyses securely with Supabase Postgres.
- **🌗 Dark/Light Mode** - Fully responsive UI with theme toggling support.
- **📱 Responsive Design** - Optimized for desktop, tablet, and mobile devices.

## 🛠️ Technology Stack

### Frontend
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS + shadcn/ui components
- **State Management**: React Query
- **Charting**: Recharts
- **Routing**: React Router v6

### Backend
- **Framework**: Django REST Framework (DRF)
- **Language**: Python 3.10+
- **Database**: PostgreSQL (Supabase) / SQLite (Local Dev fallback)
- **Math Engine**: NumPy, Pandas
- **Authentication**: Introduction of Simple JWT

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v18 or higher)
- **Python** (v3.10 or higher)
- **Git**

## 🚀 Quick Start

The fastest way to get the application running locally.

### Windows
Double-click `start-dev.bat` or run:
```powershell
.\start-dev.bat
```

### macOS / Linux
Run the shell script:
```bash
./start-dev.sh
```

These scripts will automatically set up the Python virtual environment, install dependencies, migrate the specific database, and launch both frontend and backend servers.

---

## 🔧 Manual Setup

If you prefer to run the services individually, follow these steps.

### 1. Backend Setup (Django)

Navigate to the project root in your terminal:

```bash
# Create and activate virtual environment
python -m venv venv
# Windows:
.\venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r backend_django/requirements.txt

# Apply database migrations
python backend_django/manage.py migrate

# Start the server (runs on port 5000)
python backend_django/manage.py runserver 5000
```

### 2. Frontend Setup (React)

Open a new terminal window:

```bash
cd frontend

# Install Node dependencies
npm install

# Start the development server (default port 5173)
npm run dev
```

Visit **http://localhost:5173** to use the application.

## ⚙️ Configuration

### Environment Variables

#### Backend (`backend_django/.env`)
The backend is pre-configured to use SQLite for local development. For production or to use Supabase, create a `.env` file in `backend_django/` based on `.env.example`:

```env
DATABASE_URL=postgresql://postgres:[PASSWORD]@[HOST]:[PORT]/postgres
DJANGO_SECRET_KEY=your-secret-key
JWT_SECRET=your-jwt-secret
FRONTEND_URL=http://localhost:5173
```

#### Frontend (`frontend/.env`)
Frontend variables are managed via Vite. Create a `.env` file if you need to override defaults:

```env
VITE_API_URL=http://localhost:5000/api
```

## 📚 API Documentation

Key endpoints available at `http://localhost:5000/api/`:

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/signup` | Register a new user |
| POST | `/auth/login` | Login an existing user |
| POST | `/data/analyze` | Perform regression analysis (public) |
| POST | `/data/save` | Save analysis results (Auth required) |
| GET | `/data/analyses` | Retrieve saved analyses (Auth required) |

See [backend_django/README.md](backend_django/README.md) for full API details.

## 🤝 Contributing

Contributions are welcome!
1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

Distributed under the MIT License. See `LICENSE` for more information.
