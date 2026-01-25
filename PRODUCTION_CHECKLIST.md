# Production Deployment Checklist

## Backend (Django)

### Security
- [ ] Set `DEBUG=False` in production environment
- [ ] Generate and set a strong `DJANGO_SECRET_KEY`
- [ ] Configure `ALLOWED_HOSTS` with your production domain(s)
- [ ] Set up HTTPS/SSL certificates
- [ ] Configure `CSRF_TRUSTED_ORIGINS` with production URLs
- [ ] Set `FRONTEND_URL` to production frontend URL
- [ ] Ensure `SUPABASE_JWT_SECRET` is set correctly

### Database
- [ ] Set up production database (PostgreSQL recommended)
- [ ] Run migrations: `python manage.py migrate`
- [ ] Create superuser: `python manage.py createsuperuser`
- [ ] Configure database backups

### Static & Media Files
- [ ] Collect static files: `python manage.py collectstatic`
- [ ] Configure media file storage (S3, CDN, etc.)
- [ ] Set up proper permissions for media uploads

### Dependencies
- [ ] Install production requirements: `pip install -r requirements.txt`
- [ ] Pin all dependency versions
- [ ] Use gunicorn or uwsgi for production server

## Frontend (React + Vite)

### Build
- [ ] Run production build: `npm run build`
- [ ] Test production build locally: `npm run preview`
- [ ] Verify all API endpoints are configured correctly

### Environment Variables
- [ ] Set `VITE_API_URL` to production backend URL
- [ ] Configure Supabase keys for production

### Performance
- [ ] Enable asset compression
- [ ] Configure CDN for static assets
- [ ] Set up caching headers
- [ ] Optimize images and assets

## Docker Deployment

### Production Build
```bash
# Build production images
docker-compose -f docker-compose.yml build

# Run in production mode
docker-compose up -d
```

### Environment Setup
- [ ] Create `.env` file from `.env.example`
- [ ] Set all production environment variables
- [ ] Configure volume mounts for persistent data

## Monitoring & Logging

- [ ] Set up application monitoring (e.g., Sentry)
- [ ] Configure logging (rotate logs, proper log levels)
- [ ] Set up health check endpoints
- [ ] Monitor database performance

## Testing Before Production

```bash
# Backend tests
cd backend_django
python manage.py test

# Frontend linting
cd frontend
npm run lint

# Build verification
npm run build
```

## Git Operations

### Before Committing
1. Run linting: `npm run lint` (frontend)
2. Check for TypeScript errors
3. Test all features locally
4. Review changed files
5. Update documentation if needed

### Safe Commit Process
```bash
# Check status
git status

# Review changes
git diff

# Add files
git add .

# Commit with descriptive message
git commit -m "feat: integrate Highcharts for categorical heatmap visualization"

# Push to remote
git push origin main
```

## Common Issues

### TypeScript Errors
- All TypeScript errors have been fixed
- Unused imports removed
- Invalid Highcharts properties corrected

### CORS Issues
- Ensure `FRONTEND_URL` matches actual frontend URL
- Add production domain to `ALLOWED_HOSTS`
- Configure `CORS_ALLOWED_ORIGINS` correctly

### Database Connection
- Check `DATABASE_URL` format
- Ensure database server is running
- Verify firewall rules for database port
