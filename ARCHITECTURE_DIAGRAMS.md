# Dataviz - System Architecture Overview

This document provides visual representations of the current and recommended system architectures.

---

## 🏗️ Current System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      USER BROWSER                            │
│                  http://localhost:5173                       │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ HTTP/HTTPS
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                 FRONTEND (React + Vite)                      │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Components:                                           │ │
│  │  • Login.tsx                                          │ │
│  │  • Dashboard.tsx                                       │ │
│  │  • DataAnalyzer.tsx (main analysis logic)             │ │
│  │  • DataPlot.tsx (charting)                            │ │
│  │  • UniversalChart.tsx (Recharts wrapper)              │ │
│  │                                                        │ │
│  │  Context:                                             │ │
│  │  • AuthContext (JWT token management)                 │ │
│  │                                                        │ │
│  │  Libraries:                                           │ │
│  │  • Recharts (visualization)                           │ │
│  │  • regression.js (analysis)                           │ │
│  │  • PapaParse (CSV parsing)                            │ │
│  │  • shadcn/ui (UI components)                          │ │
│  └────────────────────────────────────────────────────────┘ │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ REST API (JSON)
                       │ Authorization: Bearer <JWT>
                       │
┌──────────────────────▼──────────────────────────────────────┐
│              BACKEND (Django + DRF)                          │
│                 http://localhost:5000                        │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  API Endpoints:                                        │ │
│  │  POST   /api/auth/signup         (public)            │ │
│  │  POST   /api/auth/login          (public)            │ │
│  │  GET    /api/auth/verify         (protected)         │ │
│  │  POST   /api/data/analyze        (public)            │ │
│  │  POST   /api/data/save           (protected)         │ │
│  │  GET    /api/data/analyses       (protected)         │ │
│  │  GET    /api/data/analyses/:id   (protected)         │ │
│  │  DELETE /api/data/analyses/:id   (protected)         │ │
│  │  GET    /api/health              (public)            │ │
│  │                                                        │ │
│  │  Authentication:                                       │ │
│  │  • PyJWT (24-hour tokens)                             │ │
│  │  • PBKDF2 password hashing                            │ │
│  │                                                        │ │
│  │  Analysis:                                            │ │
│  │  • NumPy for regression calculations                  │ │
│  └────────────────────────────────────────────────────────┘ │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ Django ORM
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                    DATABASE LAYER                            │
│  ┌─────────────────────┐  ┌─────────────────────────────┐  │
│  │  PRODUCTION         │  │  DEVELOPMENT                │  │
│  │  PostgreSQL         │  │  SQLite3                    │  │
│  │  (Supabase)         │  │  (db.sqlite3)               │  │
│  │                     │  │                             │  │
│  │  ✓ Managed service  │  │  ✓ Local file               │  │
│  │  ✓ Auto backups     │  │  ✓ No setup required        │  │
│  │  ✓ SSL/TLS          │  │  ✓ Fast iteration           │  │
│  │  ✓ Monitoring       │  │                             │  │
│  └─────────────────────┘  └─────────────────────────────┘  │
│                                                              │
│  Tables:                                                     │
│  • auth_user (Django built-in)                              │
│  • analysis_results (user analyses)                         │
│  • visualizations (saved charts)                            │
└──────────────────────────────────────────────────────────────┘
```

---

## 🔐 Current Authentication Flow

```
┌─────────┐                                      ┌─────────┐
│ Browser │                                      │ Backend │
└────┬────┘                                      └────┬────┘
     │                                                │
     │  POST /api/auth/signup                        │
     │  {email, password, display_name}              │
     ├──────────────────────────────────────────────►│
     │                                                │
     │                                          ┌─────▼─────┐
     │                                          │  Validate │
     │                                          │  password │
     │                                          └─────┬─────┘
     │                                                │
     │                                          ┌─────▼─────┐
     │                                          │   Hash    │
     │                                          │ password  │
     │                                          │ (PBKDF2)  │
     │                                          └─────┬─────┘
     │                                                │
     │                                          ┌─────▼─────┐
     │                                          │  Create   │
     │                                          │   User    │
     │                                          └─────┬─────┘
     │                                                │
     │                                          ┌─────▼─────┐
     │                                          │ Generate  │
     │                                          │    JWT    │
     │                                          │ (24 hours)│
     │                                          └─────┬─────┘
     │                                                │
     │  {token, user}                                │
     │◄──────────────────────────────────────────────┤
     │                                                │
┌────▼────┐                                          │
│  Store  │                                          │
│  token  │                                          │
│in localStorage                                     │
└────┬────┘                                          │
     │                                                │
     │  GET /api/data/analyses                       │
     │  Authorization: Bearer <token>                │
     ├──────────────────────────────────────────────►│
     │                                                │
     │                                          ┌─────▼─────┐
     │                                          │  Verify   │
     │                                          │    JWT    │
     │                                          └─────┬─────┘
     │                                                │
     │                                          ┌─────▼─────┐
     │                                          │  Extract  │
     │                                          │  user_id  │
     │                                          └─────┬─────┘
     │                                                │
     │                                          ┌─────▼─────┐
     │                                          │Query DB   │
     │                                          │for user's │
     │                                          │analyses   │
     │                                          └─────┬─────┘
     │                                                │
     │  {analyses: [...]}                            │
     │◄──────────────────────────────────────────────┤
     │                                                │
```

---

## 🚀 Recommended System Architecture (After Improvements)

```
┌─────────────────────────────────────────────────────────────┐
│                      USER BROWSER                            │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ HTTPS (enforced)
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                 FRONTEND (React + Vite)                      │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Enhanced Features:                                    │ │
│  │  • Auto token refresh (every 14 minutes)              │ │
│  │  • Email verification prompt                          │ │
│  │  • Password reset flow                                │ │
│  │  • Better error handling                              │ │
│  │                                                        │ │
│  │  Storage:                                             │ │
│  │  • Access token (memory/state) - 15 min              │ │
│  │  • Refresh token (localStorage) - 30 days            │ │
│  └────────────────────────────────────────────────────────┘ │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ REST API (JSON)
                       │ Authorization: Bearer <short-lived-JWT>
                       │
┌──────────────────────▼──────────────────────────────────────┐
│              BACKEND (Django + DRF)                          │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  New Endpoints:                                        │ │
│  │  POST   /api/auth/refresh         (refresh token)    │ │
│  │  POST   /api/auth/logout          (revoke token)     │ │
│  │  POST   /api/auth/forgot-password (password reset)   │ │
│  │  POST   /api/auth/reset-password  (confirm reset)    │ │
│  │  GET    /api/auth/verify-email    (email confirm)    │ │
│  │                                                        │ │
│  │  Security Enhancements:                               │ │
│  │  • Rate limiting (5/min login, 3/hr signup)          │ │
│  │  • Password strength validation                       │ │
│  │  • Account lockout (5 failed = 15 min)              │ │
│  │  • Login attempt tracking                             │ │
│  │  • Refresh token rotation                            │ │
│  │                                                        │ │
│  │  Middleware:                                          │ │
│  │  • django-ratelimit                                  │ │
│  │  • CORS (production domain only)                      │ │
│  │  • CSRF protection                                    │ │
│  └────────────────────────────────────────────────────────┘ │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ Django ORM (optimized)
                       │
┌──────────────────────▼──────────────────────────────────────┐
│              DATABASE + CACHE LAYER                          │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                PostgreSQL (Supabase)                  │  │
│  │                                                        │  │
│  │  Enhanced Tables:                                     │  │
│  │  • auth_user                                          │  │
│  │  • analysis_results                                   │  │
│  │    ├─ Added: rmse, mae, std_dev, variance           │  │
│  │    ├─ Indexes: user+created_at, regression_type      │  │
│  │    └─ Soft delete: is_deleted, deleted_at           │  │
│  │  • visualizations                                     │  │
│  │    └─ Indexes: user+created_at                       │  │
│  │                                                        │  │
│  │  New Tables:                                          │  │
│  │  • refresh_tokens (session management)               │  │
│  │  • email_verification_tokens                         │  │
│  │  • password_reset_tokens                             │  │
│  │  • login_attempts (security tracking)                │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Redis Cache (Optional)                   │  │
│  │                                                        │  │
│  │  • Analysis results (5 min TTL)                      │  │
│  │  • User sessions                                      │  │
│  │  • Rate limit counters                               │  │
│  └──────────────────────────────────────────────────────┘  │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                 EMAIL SERVICE (Optional)                     │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Providers: SendGrid / Mailgun / AWS SES             │  │
│  │                                                        │  │
│  │  Use Cases:                                           │  │
│  │  • Email verification on signup                       │  │
│  │  • Password reset emails                             │  │
│  │  • Account security alerts                           │  │
│  └──────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

---

## 🔐 Enhanced Authentication Flow (With Refresh Tokens)

```
┌─────────┐                                      ┌─────────┐
│ Browser │                                      │ Backend │
└────┬────┘                                      └────┬────┘
     │                                                │
     │  POST /api/auth/login                         │
     │  {email, password}                            │
     ├──────────────────────────────────────────────►│
     │                                                │
     │                                          ┌─────▼─────┐
     │                                          │Rate limit │
     │                                          │   check   │
     │                                          └─────┬─────┘
     │                                                │
     │                                          ┌─────▼─────┐
     │                                          │  Check    │
     │                                          │ lockout   │
     │                                          │(5 failed) │
     │                                          └─────┬─────┘
     │                                                │
     │                                          ┌─────▼─────┐
     │                                          │Authenticate│
     │                                          └─────┬─────┘
     │                                                │
     │                                          ┌─────▼─────┐
     │                                          │  Log      │
     │                                          │ attempt   │
     │                                          └─────┬─────┘
     │                                                │
     │                                          ┌─────▼─────┐
     │                                          │ Generate  │
     │                                          │Access JWT │
     │                                          │(15 min)   │
     │                                          └─────┬─────┘
     │                                                │
     │                                          ┌─────▼─────┐
     │                                          │ Generate  │
     │                                          │ Refresh   │
     │                                          │  Token    │
     │                                          │(30 days)  │
     │                                          └─────┬─────┘
     │                                                │
     │  {access_token, refresh_token, user}          │
     │◄──────────────────────────────────────────────┤
     │                                                │
┌────▼────┐                                          │
│  Store  │                                          │
│ access: │                                          │
│  memory │                                          │
│refresh: │                                          │
│localStorage                                        │
└────┬────┘                                          │
     │                                                │
     │  ... 14 minutes later ...                     │
     │                                                │
     │  POST /api/auth/refresh                       │
     │  {refresh_token}                              │
     ├──────────────────────────────────────────────►│
     │                                                │
     │                                          ┌─────▼─────┐
     │                                          │  Verify   │
     │                                          │ refresh   │
     │                                          │  token    │
     │                                          └─────┬─────┘
     │                                                │
     │                                          ┌─────▼─────┐
     │                                          │Check not  │
     │                                          │ revoked   │
     │                                          │& not      │
     │                                          │ expired   │
     │                                          └─────┬─────┘
     │                                                │
     │                                          ┌─────▼─────┐
     │                                          │ Generate  │
     │                                          │   New     │
     │                                          │Access JWT │
     │                                          │(15 min)   │
     │                                          └─────┬─────┘
     │                                                │
     │  {access_token, user}                         │
     │◄──────────────────────────────────────────────┤
     │                                                │
┌────▼────┐                                          │
│ Update  │                                          │
│ access  │                                          │
│  token  │                                          │
└─────────┘                                          │
     │                                                │
     │  ... user logs out ...                        │
     │                                                │
     │  POST /api/auth/logout                        │
     │  {refresh_token}                              │
     ├──────────────────────────────────────────────►│
     │                                                │
     │                                          ┌─────▼─────┐
     │                                          │  Revoke   │
     │                                          │ refresh   │
     │                                          │  token    │
     │                                          └─────┬─────┘
     │                                                │
     │  {message: "Logged out"}                      │
     │◄──────────────────────────────────────────────┤
     │                                                │
┌────▼────┐                                          │
│  Clear  │                                          │
│  all    │                                          │
│ tokens  │                                          │
└─────────┘                                          │
```

---

## 📊 Data Flow: Analysis Process

```
┌────────────┐
│    User    │
│  uploads   │
│CSV or enters│
│   data     │
└──────┬─────┘
       │
       ▼
┌──────────────────────┐
│   Frontend (React)   │
│                      │
│ • PapaParse         │
│   validates CSV      │
│ • Converts to       │
│   [{x, y}, ...]     │
└──────┬───────────────┘
       │
       │ POST /api/data/analyze
       │ {data_points: [...]}
       ▼
┌──────────────────────┐
│  Backend (Django)    │
│                      │
│ • Validates input   │
│ • NumPy processes   │
│ • Calculates:       │
│   - Regression      │
│   - R²              │
│   - RMSE            │
│   - MAE             │
│   - Equation        │
└──────┬───────────────┘
       │
       │ Returns analysis
       │ {equation, r_squared,
       │  regression_type, ...}
       ▼
┌──────────────────────┐
│   Frontend (React)   │
│                      │
│ • Recharts renders  │
│   scatter plot      │
│ • Displays stats    │
│ • Shows equation    │
└──────┬───────────────┘
       │
       │ User clicks "Save"
       │
       │ POST /api/data/save
       │ {title, data_points,
       │  regression_type,
       │  equation, r_squared}
       ▼
┌──────────────────────┐
│  Backend (Django)    │
│                      │
│ • Verifies JWT      │
│ • Creates           │
│   AnalysisResult    │
│ • Saves to DB       │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│  PostgreSQL          │
│                      │
│ analysis_results     │
│ ├─ id: 123          │
│ ├─ user_id: 1       │
│ ├─ title: "My Data" │
│ ├─ data_points: [{..}]│
│ ├─ equation: "y=2x+1"│
│ └─ r_squared: 0.95  │
└──────────────────────┘
```

---

## 🛡️ Security Layers

```
┌──────────────────────────────────────────────────────────┐
│                     EXTERNAL THREATS                      │
└────────────────────────┬─────────────────────────────────┘
                         │
                   ┌─────▼─────┐
                   │   HTTPS   │ ← Encryption in transit
                   └─────┬─────┘
                         │
            ┌────────────▼────────────┐
            │    Rate Limiting        │ ← 5 login/min, 3 signup/hr
            └────────────┬────────────┘
                         │
            ┌────────────▼────────────┐
            │   Account Lockout       │ ← 5 failed = 15 min lock
            └────────────┬────────────┘
                         │
            ┌────────────▼────────────┐
            │ Password Validation     │ ← 8+ chars, complexity
            └────────────┬────────────┘
                         │
            ┌────────────▼────────────┐
            │    Password Hashing     │ ← PBKDF2 with salt
            └────────────┬────────────┘
                         │
            ┌────────────▼────────────┐
            │   JWT Verification      │ ← Signature + expiry check
            └────────────┬────────────┘
                         │
            ┌────────────▼────────────┐
            │   CORS Validation       │ ← Allowed origins only
            └────────────┬────────────┘
                         │
            ┌────────────▼────────────┐
            │   Database Encryption   │ ← At-rest (Supabase)
            └────────────┬────────────┘
                         │
            ┌────────────▼────────────┐
            │   SQL Injection         │ ← Django ORM protection
            │   Protection            │
            └────────────┬────────────┘
                         │
            ┌────────────▼────────────┐
            │   XSS Protection        │ ← React auto-escaping
            └────────────┬────────────┘
                         │
                   ┌─────▼─────┐
                   │SECURE DATA│ ← Your application
                   └───────────┘
```

---

## 📈 Performance Optimization Layers

```
┌────────────┐
│   Client   │
└──────┬─────┘
       │
       ▼
┌─────────────────────────┐
│  Browser Cache          │ ← Static assets (JS, CSS, images)
│  (Vite build)          │    cached by browser
└──────┬──────────────────┘
       │
       ▼
┌─────────────────────────┐
│  CDN (Optional)         │ ← Serve static frontend
│  Vercel/Netlify        │    from edge locations
└──────┬──────────────────┘
       │
       ▼
┌─────────────────────────┐
│  Backend Server         │
│  Django                │
└──────┬──────────────────┘
       │
       ▼
┌─────────────────────────┐
│  Redis Cache            │ ← Cache analysis results
│  (Optional)            │    5 min TTL
│  • Analysis results    │
│  • User sessions       │
└──────┬──────────────────┘
       │ (cache miss)
       ▼
┌─────────────────────────┐
│  Database Indexes       │ ← B-tree indexes on:
│                        │    • user_id
│                        │    • created_at
│                        │    • regression_type
└──────┬──────────────────┘
       │
       ▼
┌─────────────────────────┐
│  Connection Pool        │ ← Reuse DB connections
│  (600s max age)        │    Avoid reconnect overhead
└──────┬──────────────────┘
       │
       ▼
┌─────────────────────────┐
│  PostgreSQL             │ ← Optimized queries with
│  (Supabase)            │    select_related()
│                        │    prefetch_related()
└─────────────────────────┘

Performance Gains:
• Indexes: 10-100x faster queries
• Cache: Eliminate DB calls for repeat data
• Connection pool: Reduce latency by 50ms+
• CDN: Reduce load time from 2s to 200ms
```

---

## 🔄 Deployment Architecture

### Development
```
┌─────────────────────┐
│   Your Computer     │
│                     │
│  Terminal 1:        │
│  Django (port 5000) │
│  SQLite             │
│                     │
│  Terminal 2:        │
│  Vite (port 5173)   │
│                     │
│  Browser:           │
│  localhost:5173 ───►│
└─────────────────────┘
```

### Production (Recommended)
```
┌────────────────┐
│  End Users     │
└────────┬───────┘
         │
         ▼
┌────────────────┐
│  Vercel/       │ ← Frontend (React build)
│  Netlify       │   • Auto SSL
│                │   • Global CDN
│                │   • Auto deploy from Git
└────────┬───────┘
         │ API calls
         │ https://api.yourdomain.com
         ▼
┌────────────────┐
│  Railway/      │ ← Backend (Django)
│  Heroku/       │   • Auto SSL
│  DigitalOcean  │   • Auto scaling
│                │   • Deploy from Git
└────────┬───────┘
         │
         ▼
┌────────────────┐
│  Supabase      │ ← PostgreSQL
│                │   • Auto backups
│                │   • Monitoring
│                │   • Connection pooling
└────────────────┘

Optional:
┌────────────────┐
│  Upstash       │ ← Redis cache
└────────────────┘

┌────────────────┐
│  SendGrid      │ ← Email service
└────────────────┘
```

---

## 📊 Database Schema Diagram

### Current Schema
```
┌──────────────────────────┐
│       auth_user          │
│ ─────────────────────────│
│ • id (PK)               │
│ • username (email)      │◄─────────┐
│ • email                 │          │
│ • password (hashed)     │          │
│ • first_name            │          │
│ • is_active             │          │
│ • date_joined           │          │
└──────────────────────────┘          │
                                      │
                          ┌───────────┴─────────────┐
                          │                         │
                          │                         │
       ┌──────────────────▼──────┐   ┌────────────▼────────────┐
       │  analysis_results       │   │   visualizations        │
       │ ───────────────────────│   │ ───────────────────────│
       │ • id (PK)              │   │ • id (PK)              │
       │ • user_id (FK)         │   │ • user_id (FK)         │
       │ • title                │   │ • title                │
       │ • data_points (JSON)   │   │ • chart_type           │
       │ • regression_type      │   │ • data (JSON)          │
       │ • equation             │   │ • created_at           │
       │ • r_squared            │   └─────────────────────────┘
       │ • created_at           │
       └─────────────────────────┘
```

### Enhanced Schema (Recommended)
```
┌──────────────────────────┐
│       auth_user          │
│ ─────────────────────────│
│ • id (PK)               │◄──────────────┐
│ • username              │               │
│ • email (indexed)       │               │
│ • password              │               │
│ • first_name            │               │
│ • is_active             │               │
└──────────────────────────┘               │
                                           │
              ┌────────────────────────────┼───────────────┐
              │                            │               │
              │                            │               │
┌─────────────▼──────────┐  ┌──────────────▼─────┐  ┌────▼────────────┐
│   analysis_results     │  │   visualizations   │  │ refresh_tokens  │
│ ──────────────────────│  │ ──────────────────│  │ ───────────────│
│ • id (PK)             │  │ • id (PK)         │  │ • id (PK)      │
│ • user_id (FK,index)  │  │ • user_id (FK,idx)│  │ • user_id (FK) │
│ • title (indexed)     │  │ • title (indexed) │  │ • token (unique)│
│ • data_points (JSON)  │  │ • chart_type      │  │ • expires_at   │
│ • regression_type     │  │ • data (JSON)     │  │ • is_revoked   │
│   (indexed)           │  │ • created_at      │  │ • created_at   │
│ • equation            │  │   (indexed)       │  └─────────────────┘
│ • r_squared           │  └────────────────────┘
│ • rmse ✨ NEW         │
│ • mae ✨ NEW          │  ┌─────────────────────┐
│ • std_dev ✨ NEW      │  │  login_attempts     │
│ • variance ✨ NEW     │  │ ────────────────────│
│ • is_deleted ✨ NEW   │  │ • id (PK)          │
│ • deleted_at ✨ NEW   │  │ • email (indexed)  │
│ • created_at (index)  │  │ • ip_address       │
│                       │  │ • attempted_at     │
│ Indexes:              │  │ • successful       │
│ • (user_id,created_at)│  └─────────────────────┘
│ • (regression_type)   │
└───────────────────────┘  ┌──────────────────────────────┐
                           │ email_verification_tokens    │
                           │ ─────────────────────────────│
                           │ • id (PK)                   │
                           │ • user_id (FK, OneToOne)    │
                           │ • token (unique)            │
                           │ • expires_at                │
                           │ • verified                  │
                           └──────────────────────────────┘

                           ┌──────────────────────────────┐
                           │  password_reset_tokens       │
                           │ ─────────────────────────────│
                           │ • id (PK)                   │
                           │ • user_id (FK)              │
                           │ • token (unique)            │
                           │ • expires_at                │
                           │ • used                      │
                           └──────────────────────────────┘
```

---

## 🎯 Implementation Priority Visualization

```
┌─────────────────────────────────────────────────────────────┐
│                  IMPLEMENTATION PHASES                       │
└─────────────────────────────────────────────────────────────┘

Phase 1: CRITICAL SECURITY (Week 1) ★★★★★
┌────────────────────────────────────────────────┐
│ 🔴 Database indexes                            │ 30 min
│ 🔴 Password validation                         │ 15 min
│ 🔴 Rate limiting                               │ 20 min
│ 🔴 Account lockout                             │ 45 min
│ 🔴 Add statistical fields                      │ 30 min
└────────────────────────────────────────────────┘
Total: 2-3 hours

Phase 2: USER EXPERIENCE (Week 2) ★★★★☆
┌────────────────────────────────────────────────┐
│ 🟡 Refresh tokens                              │ 2 hours
│ 🟡 Email verification                          │ 2 hours
│ 🟡 Password reset                              │ 2 hours
│ 🟡 Pagination                                  │ 1 hour
│ 🟡 Soft delete                                 │ 1 hour
└────────────────────────────────────────────────┘
Total: 8 hours

Phase 3: PERFORMANCE (Week 3) ★★★☆☆
┌────────────────────────────────────────────────┐
│ 🟢 Redis caching                               │ 3 hours
│ 🟢 Query optimization                          │ 2 hours
│ 🟢 Connection pooling                          │ 1 hour
│ 🟢 Full-text search                            │ 2 hours
└────────────────────────────────────────────────┘
Total: 8 hours

Phase 4: ADVANCED (Future) ★★☆☆☆
┌────────────────────────────────────────────────┐
│ ⚪ OAuth/social login                          │ 4 hours
│ ⚪ Multi-factor auth                           │ 3 hours
│ ⚪ RBAC                                         │ 4 hours
│ ⚪ Audit logging                               │ 3 hours
└────────────────────────────────────────────────┘
Total: 14 hours

Impact vs Effort Matrix:
                    High Impact
                        │
        Refresh Tokens  │  Database Indexes
        Email Verify    │  Rate Limiting
        Password Reset  │  Password Validation
                        │  Account Lockout
        ────────────────┼────────────────
                        │
        OAuth/Social    │  Redis Cache
        MFA             │  Query Optimization
        RBAC            │
                        │
                    Low Impact
                 Low Effort ──► High Effort
```

---

## ✅ Quick Wins Summary

```
🎯 30-Minute Quick Wins (Do These Today!)

┌─────────────────────────────────────────────┐
│ 1. Add Database Indexes                     │
│    Impact: 🔥🔥🔥🔥🔥 (10-100x faster)      │
│    File: backend_django/api/models.py       │
│    Command: makemigrations → migrate        │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ 2. Password Validation                      │
│    Impact: 🔥🔥🔥🔥 (security boost)         │
│    File: backend_django/settings.py         │
│    No migration needed                      │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ 3. Rate Limiting                            │
│    Impact: 🔥🔥🔥🔥 (prevent attacks)        │
│    Install: pip install django-ratelimit    │
│    File: backend_django/api/views.py        │
└─────────────────────────────────────────────┘

Total Time: 30 minutes
Total Impact: HUGE security & performance boost
```

---

**Last Updated**: January 2026  
**Maintainer**: Dataviz Development Team  
**Status**: Production-ready architecture design
