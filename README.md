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
# Terminal 1 - Backend
cd backend && npm install && npm run dev

# Terminal 2 - Frontend
cd frontend && npm install && npm run dev
```

Then open **http://localhost:5173** in your browser.

## 📁 Project Structure

```
Dataviz/
├── frontend/        # React + TypeScript + Vite
├── backend/         # Express.js + TypeScript
├── QUICKSTART.md    # Quick start guide
└── ROOT_README.md   # Detailed documentation
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
- Express.js + TypeScript
- SQLite3
- JWT Authentication
- Regression Analysis

## 📖 Documentation

- **[QUICKSTART.md](QUICKSTART.md)** - Quick start guide and troubleshooting
- **[ROOT_README.md](ROOT_README.md)** - Comprehensive documentation
- **[backend/README.md](backend/README.md)** - Backend API documentation

## 🔐 Authentication

Create an account or login to access the data analysis features. Your session is secured with JWT tokens.

## 💾 Database

SQLite database automatically created in `backend/data/dataviz.db`

## 🎯 Usage

1. Sign up or login
2. Add data points (manually or via CSV)
3. Click "Analyze Data" 
4. View regression results and charts
5. Make predictions
6. Save your analysis

## 📝 License

MIT License - see LICENSE file for details

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

For detailed setup instructions and troubleshooting, see [QUICKSTART.md](QUICKSTART.md).

