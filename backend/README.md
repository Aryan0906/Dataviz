# Dataviz Backend

Backend API for the Dataviz data visualization and analysis tool. Built with Express.js and TypeScript.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env` file based on `.env.example`:
   ```bash
   cp .env.example .env
   ```

3. Update `.env` with your configuration:
   ```
   PORT=5000
   NODE_ENV=development
   JWT_SECRET=your_jwt_secret_key_change_in_production
   FRONTEND_URL=http://localhost:5173
   ```

## Running the Server

### Development
```bash
npm run dev
```

### Build
```bash
npm run build
```

### Production
```bash
npm start
```

## API Endpoints

### Authentication

- **POST /api/auth/signup** - Create a new user account
  ```json
  {
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123"
  }
  ```

- **POST /api/auth/login** - Login with email and password
  ```json
  {
    "email": "john@example.com",
    "password": "password123"
  }
  ```

- **GET /api/auth/verify** - Verify JWT token
  - Headers: `Authorization: Bearer <token>`

### Data Analysis

- **POST /api/data/analyze** - Perform regression analysis
  ```json
  {
    "dataPoints": [
      { "x": 1, "y": 2 },
      { "x": 2, "y": 4 },
      { "x": 3, "y": 6 }
    ]
  }
  ```

- **POST /api/data/save** - Save analysis result (requires auth)
  ```json
  {
    "title": "Sales Analysis",
    "dataPoints": [...],
    "regressionType": "linear",
    "equation": "y = 2x",
    "rSquared": 0.95
  }
  ```

- **GET /api/data/analyses** - Get all saved analyses (requires auth)

- **GET /api/data/analyses/:id** - Get specific analysis (requires auth)

- **DELETE /api/data/analyses/:id** - Delete analysis (requires auth)

## Database

Uses SQLite for data storage. Database file is created automatically at `data/dataviz.db`.

### Tables

- **users** - Stores user information with hashed passwords
- **analysis_results** - Stores saved data analysis results linked to users

## Technologies

- **Express.js** - Web framework
- **TypeScript** - Type-safe JavaScript
- **SQLite** - Database
- **JWT** - Token-based authentication
- **bcryptjs** - Password hashing
- **regression** - Statistical regression analysis

## Development Notes

- All endpoints return JSON responses
- Authentication is required for user-specific operations
- Tokens expire after 24 hours
- Passwords are hashed using bcryptjs with 10 salt rounds
