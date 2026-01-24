# Dataviz - Implementation Guide for Database & Authentication Improvements

This guide provides step-by-step instructions for implementing the recommendations from `DATABASE_AND_AUTH_ANALYSIS.md`.

---

## 🚀 Phase 1: Critical Security Improvements (High Priority)

### 1.1 Add Database Indexes

**File**: `backend_django/api/models.py`

**Changes**:
```python
from django.db import models
from django.contrib.auth.models import User

class AnalysisResult(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, db_index=True)
    title = models.CharField(max_length=255, db_index=True)
    data_points = models.JSONField()
    regression_type = models.CharField(max_length=50, blank=True, null=True, db_index=True)
    equation = models.TextField(blank=True, null=True)
    r_squared = models.FloatField(blank=True, null=True)
    
    # New statistical fields
    rmse = models.FloatField(blank=True, null=True, help_text="Root Mean Square Error")
    mae = models.FloatField(blank=True, null=True, help_text="Mean Absolute Error")
    std_dev = models.FloatField(blank=True, null=True, help_text="Standard Deviation")
    variance = models.FloatField(blank=True, null=True, help_text="Variance")
    
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        db_table = "analysis_results"
        indexes = [
            models.Index(fields=['user', '-created_at'], name='user_created_idx'),
            models.Index(fields=['regression_type'], name='regression_type_idx'),
        ]
        ordering = ['-created_at']


class Visualization(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, db_index=True)
    title = models.CharField(max_length=200, db_index=True)
    chart_type = models.CharField(max_length=50, db_index=True)
    data = models.JSONField()
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        db_table = "visualizations"
        indexes = [
            models.Index(fields=['user', '-created_at'], name='viz_user_created_idx'),
        ]
        ordering = ['-created_at']
```

**Migration**:
```bash
cd backend_django
python manage.py makemigrations
python manage.py migrate
```

---

### 1.2 Password Strength Validation

**File**: `backend_django/dataviz_backend/settings.py`

**Add**:
```python
AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
        'OPTIONS': {
            'min_length': 8,
        }
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]
```

**Create Custom Validator**: `backend_django/api/validators.py`
```python
from django.core.exceptions import ValidationError
import re

class StrongPasswordValidator:
    """
    Validates that the password contains:
    - At least one uppercase letter
    - At least one lowercase letter
    - At least one digit
    - At least one special character
    """
    
    def validate(self, password, user=None):
        if not re.search(r'[A-Z]', password):
            raise ValidationError(
                "Password must contain at least one uppercase letter.",
                code='password_no_upper',
            )
        if not re.search(r'[a-z]', password):
            raise ValidationError(
                "Password must contain at least one lowercase letter.",
                code='password_no_lower',
            )
        if not re.search(r'[0-9]', password):
            raise ValidationError(
                "Password must contain at least one digit.",
                code='password_no_digit',
            )
        if not re.search(r'[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\\/]', password):
            raise ValidationError(
                "Password must contain at least one special character.",
                code='password_no_special',
            )

    def get_help_text(self):
        return (
            "Your password must contain at least one uppercase letter, "
            "one lowercase letter, one digit, and one special character."
        )
```

**Update settings.py**:
```python
AUTH_PASSWORD_VALIDATORS = [
    # ... existing validators ...
    {
        'NAME': 'api.validators.StrongPasswordValidator',
    },
]
```

**Update signup view**: `backend_django/api/views.py`
```python
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError

def signup(request):
    # ... existing code ...
    password = data.get("password")
    
    # Validate password strength
    try:
        validate_password(password)
    except DjangoValidationError as e:
        return JsonResponse({"error": "; ".join(e.messages)}, status=400)
    
    # ... continue with user creation ...
```

---

### 1.3 Rate Limiting

**Install dependency**:
```bash
pip install django-ratelimit
```

**Update requirements.txt**:
```
django-ratelimit>=4.1.0
```

**File**: `backend_django/api/views.py`

**Add imports**:
```python
from django_ratelimit.decorators import ratelimit
from django_ratelimit.exceptions import Ratelimited
from django.views.decorators.http import require_http_methods
```

**Update views**:
```python
@ratelimit(key='ip', rate='5/m', method='POST')
def login(request):
    if getattr(request, 'limited', False):
        return JsonResponse(
            {"error": "Too many login attempts. Please try again in a minute."},
            status=429
        )
    # ... existing login logic ...

@ratelimit(key='ip', rate='3/h', method='POST')
def signup(request):
    if getattr(request, 'limited', False):
        return JsonResponse(
            {"error": "Too many signup attempts. Please try again later."},
            status=429
        )
    # ... existing signup logic ...
```

---

### 1.4 Account Lockout After Failed Attempts

**Create model**: `backend_django/api/models.py`
```python
class LoginAttempt(models.Model):
    email = models.EmailField(db_index=True)
    ip_address = models.GenericIPAddressField()
    attempted_at = models.DateTimeField(auto_now_add=True)
    successful = models.BooleanField(default=False)

    class Meta:
        db_table = "login_attempts"
        indexes = [
            models.Index(fields=['email', '-attempted_at'], name='email_attempted_idx'),
        ]
```

**Create helper function**: `backend_django/api/utils.py`
```python
from django.utils import timezone
from datetime import timedelta
from .models import LoginAttempt

def check_account_lockout(email, ip_address):
    """
    Check if account is locked due to too many failed attempts.
    Returns (is_locked: bool, attempts_remaining: int)
    """
    lockout_duration = timedelta(minutes=15)
    max_attempts = 5
    
    # Count recent failed attempts
    recent_failed = LoginAttempt.objects.filter(
        email=email,
        attempted_at__gte=timezone.now() - lockout_duration,
        successful=False
    ).count()
    
    if recent_failed >= max_attempts:
        return True, 0
    
    return False, max_attempts - recent_failed

def log_login_attempt(email, ip_address, successful):
    """Log a login attempt"""
    LoginAttempt.objects.create(
        email=email,
        ip_address=ip_address,
        successful=successful
    )

def get_client_ip(request):
    """Get client IP address from request"""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip
```

**Update login view**:
```python
from .utils import check_account_lockout, log_login_attempt, get_client_ip

def login(request):
    data = json.loads(request.body)
    email = data.get("email")
    password = data.get("password")
    ip_address = get_client_ip(request)
    
    # Check if account is locked
    is_locked, attempts_remaining = check_account_lockout(email, ip_address)
    if is_locked:
        return JsonResponse({
            "error": "Account temporarily locked due to too many failed attempts. Please try again in 15 minutes."
        }, status=403)
    
    # Authenticate user
    user = authenticate(username=email, password=password)
    
    if user is not None:
        # Log successful attempt
        log_login_attempt(email, ip_address, successful=True)
        
        # ... generate token and return ...
    else:
        # Log failed attempt
        log_login_attempt(email, ip_address, successful=False)
        
        # Check remaining attempts
        is_locked, attempts_remaining = check_account_lockout(email, ip_address)
        
        if attempts_remaining > 0:
            return JsonResponse({
                "error": f"Invalid credentials. {attempts_remaining} attempts remaining before lockout."
            }, status=401)
        else:
            return JsonResponse({
                "error": "Too many failed attempts. Account locked for 15 minutes."
            }, status=403)
```

**Run migration**:
```bash
python manage.py makemigrations
python manage.py migrate
```

---

## 🔄 Phase 2: Refresh Token Implementation

### 2.1 Create Refresh Token Model

**File**: `backend_django/api/models.py`
```python
import secrets

class RefreshToken(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='refresh_tokens')
    token = models.CharField(max_length=255, unique=True, default=secrets.token_urlsafe)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    is_revoked = models.BooleanField(default=False)
    device_info = models.CharField(max_length=255, blank=True, null=True)  # Optional: track device

    class Meta:
        db_table = "refresh_tokens"
        indexes = [
            models.Index(fields=['token'], name='refresh_token_idx'),
            models.Index(fields=['user', '-created_at'], name='user_refresh_idx'),
        ]

    def is_valid(self):
        """Check if token is valid (not expired and not revoked)"""
        from django.utils import timezone
        return not self.is_revoked and self.expires_at > timezone.now()
```

**Migration**:
```bash
python manage.py makemigrations
python manage.py migrate
```

### 2.2 Update Authentication Functions

**File**: `backend_django/api/utils.py` (create if doesn't exist)
```python
import jwt
import os
from datetime import datetime, timedelta
from django.utils import timezone
from .models import RefreshToken

JWT_SECRET = os.getenv("JWT_SECRET", "your-secret-key")
JWT_ALGORITHM = "HS256"

def generate_access_token(user, expiry_minutes=15):
    """Generate short-lived access token"""
    payload = {
        "user_id": user.id,
        "email": user.email,
        "exp": datetime.utcnow() + timedelta(minutes=expiry_minutes),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def generate_refresh_token(user, expiry_days=30, device_info=None):
    """Generate long-lived refresh token"""
    expires_at = timezone.now() + timedelta(days=expiry_days)
    
    refresh_token = RefreshToken.objects.create(
        user=user,
        expires_at=expires_at,
        device_info=device_info
    )
    
    return refresh_token.token

def verify_refresh_token(token_string):
    """Verify and return refresh token object"""
    try:
        token = RefreshToken.objects.get(token=token_string)
        if token.is_valid():
            return token
        return None
    except RefreshToken.DoesNotExist:
        return None
```

### 2.3 Update Login/Signup Views

**File**: `backend_django/api/views.py`
```python
from .utils import generate_access_token, generate_refresh_token

def login(request):
    # ... existing authentication logic ...
    
    if user is not None:
        # Generate tokens
        access_token = generate_access_token(user)
        refresh_token = generate_refresh_token(user)
        
        return JsonResponse({
            "access_token": access_token,
            "refresh_token": refresh_token,
            "user": {
                "id": user.id,
                "email": user.email,
                "display_name": user.first_name,
            }
        })

def signup(request):
    # ... existing user creation logic ...
    
    # Generate tokens
    access_token = generate_access_token(user)
    refresh_token = generate_refresh_token(user)
    
    return JsonResponse({
        "access_token": access_token,
        "refresh_token": refresh_token,
        "user": {
            "id": user.id,
            "email": user.email,
            "display_name": user.first_name,
        }
    })
```

### 2.4 Create Refresh Token Endpoint

**File**: `backend_django/api/views.py`
```python
from .utils import verify_refresh_token, generate_access_token

def refresh(request):
    """
    Endpoint to refresh access token using refresh token
    POST /api/auth/refresh
    Body: {"refresh_token": "..."}
    """
    try:
        data = json.loads(request.body)
        refresh_token_string = data.get("refresh_token")
        
        if not refresh_token_string:
            return JsonResponse({"error": "Refresh token required"}, status=400)
        
        # Verify refresh token
        refresh_token = verify_refresh_token(refresh_token_string)
        
        if not refresh_token:
            return JsonResponse({"error": "Invalid or expired refresh token"}, status=401)
        
        # Generate new access token
        access_token = generate_access_token(refresh_token.user)
        
        return JsonResponse({
            "access_token": access_token,
            "user": {
                "id": refresh_token.user.id,
                "email": refresh_token.user.email,
                "display_name": refresh_token.user.first_name,
            }
        })
        
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON"}, status=400)

def logout(request):
    """
    Endpoint to revoke refresh token
    POST /api/auth/logout
    Body: {"refresh_token": "..."}
    """
    try:
        data = json.loads(request.body)
        refresh_token_string = data.get("refresh_token")
        
        if refresh_token_string:
            try:
                token = RefreshToken.objects.get(token=refresh_token_string)
                token.is_revoked = True
                token.save()
            except RefreshToken.DoesNotExist:
                pass
        
        return JsonResponse({"message": "Logged out successfully"})
        
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON"}, status=400)
```

**Add URL routes**: `backend_django/dataviz_backend/urls.py`
```python
urlpatterns = [
    # ... existing routes ...
    path("api/auth/refresh", refresh, name="refresh"),
    path("api/auth/logout", logout, name="logout"),
]
```

### 2.5 Update Frontend

**File**: `frontend/src/context/AuthContext.tsx`
```typescript
interface AuthContextType {
  // ... existing fields ...
  refreshToken: string | null;
  refreshAccessToken: () => Promise<boolean>;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(
    localStorage.getItem('auth_token')
  );
  const [refreshToken, setRefreshToken] = useState<string | null>(
    localStorage.getItem('refresh_token')
  );
  
  // Auto-refresh token when it expires
  useEffect(() => {
    if (!token || !refreshToken) return;
    
    // Set up token refresh 1 minute before expiry (14 minutes for 15-minute token)
    const refreshInterval = setInterval(async () => {
      await refreshAccessToken();
    }, 14 * 60 * 1000); // 14 minutes
    
    return () => clearInterval(refreshInterval);
  }, [token, refreshToken]);
  
  const refreshAccessToken = async (): Promise<boolean> => {
    if (!refreshToken) return false;
    
    try {
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setToken(data.access_token);
        localStorage.setItem('auth_token', data.access_token);
        return true;
      }
      
      // Refresh token expired, force re-login
      logout();
      return false;
    } catch (error) {
      console.error('Token refresh failed:', error);
      return false;
    }
  };
  
  const login = async (email: string, password: string) => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    
    if (response.ok) {
      const data = await response.json();
      setToken(data.access_token);
      setRefreshToken(data.refresh_token);
      setUser(data.user);
      localStorage.setItem('auth_token', data.access_token);
      localStorage.setItem('refresh_token', data.refresh_token);
      localStorage.setItem('auth_user', JSON.stringify(data.user));
    } else {
      throw new Error('Login failed');
    }
  };
  
  const logout = async () => {
    if (refreshToken) {
      try {
        await fetch(`${API_BASE_URL}/auth/logout`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh_token: refreshToken }),
        });
      } catch (error) {
        console.error('Logout failed:', error);
      }
    }
    
    setToken(null);
    setRefreshToken(null);
    setUser(null);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('auth_user');
  };
  
  return (
    <AuthContext.Provider value={{ 
      token, 
      refreshToken,
      user, 
      login, 
      signup, 
      logout, 
      loading,
      refreshAccessToken
    }}>
      {children}
    </AuthContext.Provider>
  );
};
```

**Update API client**: `frontend/src/lib/api.ts`
```typescript
// Add automatic token refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        try {
          const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh_token: refreshToken }),
          });
          
          if (response.ok) {
            const data = await response.json();
            localStorage.setItem('auth_token', data.access_token);
            
            // Retry original request
            originalRequest.headers.Authorization = `Bearer ${data.access_token}`;
            return api(originalRequest);
          }
        } catch (refreshError) {
          // Refresh failed, redirect to login
          window.location.href = '/login';
        }
      }
      
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);
```

---

## 📧 Phase 3: Email Verification (Optional)

### 3.1 Configure Email Backend

**File**: `backend_django/dataviz_backend/settings.py`
```python
# Email configuration
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = os.getenv('EMAIL_HOST', 'smtp.gmail.com')
EMAIL_PORT = int(os.getenv('EMAIL_PORT', 587))
EMAIL_USE_TLS = True
EMAIL_HOST_USER = os.getenv('EMAIL_HOST_USER')
EMAIL_HOST_PASSWORD = os.getenv('EMAIL_HOST_PASSWORD')
DEFAULT_FROM_EMAIL = os.getenv('DEFAULT_FROM_EMAIL', 'noreply@dataviz.com')

# For development, use console backend
if DEBUG:
    EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'
```

### 3.2 Create Email Verification Model

**File**: `backend_django/api/models.py`
```python
import secrets

class EmailVerificationToken(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    token = models.CharField(max_length=100, unique=True, default=lambda: secrets.token_urlsafe(32))
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    verified = models.BooleanField(default=False)

    class Meta:
        db_table = "email_verification_tokens"
```

### 3.3 Send Verification Email on Signup

**File**: `backend_django/api/views.py`
```python
from django.core.mail import send_mail
from django.utils import timezone
from datetime import timedelta
from .models import EmailVerificationToken

def signup(request):
    # ... create user ...
    
    # Create verification token
    expires_at = timezone.now() + timedelta(hours=24)
    verification = EmailVerificationToken.objects.create(
        user=user,
        expires_at=expires_at
    )
    
    # Send verification email
    frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:5173')
    verification_url = f"{frontend_url}/verify-email?token={verification.token}"
    
    send_mail(
        subject='Verify your Dataviz account',
        message=f'Please verify your email by clicking: {verification_url}',
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[user.email],
        fail_silently=False,
    )
    
    # ... return response ...
```

### 3.4 Create Verification Endpoint

**File**: `backend_django/api/views.py`
```python
def verify_email(request):
    """
    GET /api/auth/verify-email?token=...
    """
    token = request.GET.get('token')
    
    if not token:
        return JsonResponse({"error": "Token required"}, status=400)
    
    try:
        verification = EmailVerificationToken.objects.get(token=token)
        
        # Check if expired
        if verification.expires_at < timezone.now():
            return JsonResponse({"error": "Verification link expired"}, status=400)
        
        # Check if already verified
        if verification.verified:
            return JsonResponse({"message": "Email already verified"})
        
        # Mark as verified
        verification.verified = True
        verification.save()
        
        # Activate user
        user = verification.user
        user.is_active = True
        user.save()
        
        return JsonResponse({"message": "Email verified successfully"})
        
    except EmailVerificationToken.DoesNotExist:
        return JsonResponse({"error": "Invalid verification token"}, status=400)
```

**Add URL**: `backend_django/dataviz_backend/urls.py`
```python
path("api/auth/verify-email", verify_email, name="verify_email"),
```

---

## 🔐 Phase 4: Password Reset

### 4.1 Create Password Reset Model

**File**: `backend_django/api/models.py`
```python
class PasswordResetToken(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    token = models.CharField(max_length=100, unique=True, default=lambda: secrets.token_urlsafe(32))
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    used = models.BooleanField(default=False)

    class Meta:
        db_table = "password_reset_tokens"
```

### 4.2 Create Forgot Password Endpoint

**File**: `backend_django/api/views.py`
```python
def forgot_password(request):
    """
    POST /api/auth/forgot-password
    Body: {"email": "user@example.com"}
    """
    try:
        data = json.loads(request.body)
        email = data.get('email')
        
        # Always return success to prevent email enumeration
        try:
            user = User.objects.get(email=email)
            
            # Create reset token
            expires_at = timezone.now() + timedelta(hours=1)
            reset_token = PasswordResetToken.objects.create(
                user=user,
                expires_at=expires_at
            )
            
            # Send reset email
            frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:5173')
            reset_url = f"{frontend_url}/reset-password?token={reset_token.token}"
            
            send_mail(
                subject='Reset your Dataviz password',
                message=f'Reset your password by clicking: {reset_url}',
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                fail_silently=False,
            )
        except User.DoesNotExist:
            pass  # Don't reveal whether email exists
        
        return JsonResponse({
            "message": "If the email exists, a reset link has been sent."
        })
        
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON"}, status=400)

def reset_password(request):
    """
    POST /api/auth/reset-password
    Body: {"token": "...", "new_password": "..."}
    """
    try:
        data = json.loads(request.body)
        token = data.get('token')
        new_password = data.get('new_password')
        
        if not token or not new_password:
            return JsonResponse({"error": "Token and new password required"}, status=400)
        
        # Validate password strength
        try:
            validate_password(new_password)
        except DjangoValidationError as e:
            return JsonResponse({"error": "; ".join(e.messages)}, status=400)
        
        # Verify token
        try:
            reset_token = PasswordResetToken.objects.get(token=token)
            
            if reset_token.used:
                return JsonResponse({"error": "Token already used"}, status=400)
            
            if reset_token.expires_at < timezone.now():
                return JsonResponse({"error": "Token expired"}, status=400)
            
            # Reset password
            user = reset_token.user
            user.set_password(new_password)
            user.save()
            
            # Mark token as used
            reset_token.used = True
            reset_token.save()
            
            return JsonResponse({"message": "Password reset successfully"})
            
        except PasswordResetToken.DoesNotExist:
            return JsonResponse({"error": "Invalid token"}, status=400)
        
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON"}, status=400)
```

**Add URLs**: `backend_django/dataviz_backend/urls.py`
```python
path("api/auth/forgot-password", forgot_password, name="forgot_password"),
path("api/auth/reset-password", reset_password, name="reset_password"),
```

---

## 📊 Testing Your Implementation

### Test Database Indexes
```bash
cd backend_django
python manage.py dbshell

# PostgreSQL
\d+ analysis_results;  # Check indexes
EXPLAIN ANALYZE SELECT * FROM analysis_results WHERE user_id = 1 ORDER BY created_at DESC;

# SQLite
.schema analysis_results
EXPLAIN QUERY PLAN SELECT * FROM analysis_results WHERE user_id = 1 ORDER BY created_at DESC;
```

### Test Rate Limiting
```bash
# Try 6 login attempts in 1 minute
for i in {1..6}; do
  curl -X POST http://localhost:5000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"wrong"}'
  echo "Attempt $i"
done
```

### Test Password Validation
```python
# Django shell
python manage.py shell

from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError

try:
    validate_password("weak")  # Should fail
except ValidationError as e:
    print(e.messages)

validate_password("Strong123!")  # Should pass
```

---

## 📝 Environment Variables

**Update `backend_django/.env.example`**:
```env
# Django
DJANGO_SECRET_KEY=your-django-secret-key-here
DEBUG=False

# Database
DATABASE_URL=postgresql://user:pass@host:port/db?sslmode=require

# JWT
JWT_SECRET=your-jwt-secret-key-here

# Frontend
FRONTEND_URL=http://localhost:5173

# Email (for email verification and password reset)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
DEFAULT_FROM_EMAIL=noreply@dataviz.com

# Redis (optional - for caching)
REDIS_URL=redis://127.0.0.1:6379/1
```

---

## ✅ Deployment Checklist

- [ ] Run all migrations
- [ ] Set DEBUG=False in production
- [ ] Set strong SECRET_KEY and JWT_SECRET
- [ ] Configure DATABASE_URL for production
- [ ] Set up email service (Gmail, SendGrid, Mailgun)
- [ ] Enable HTTPS
- [ ] Configure CORS for production domain
- [ ] Set up database backups
- [ ] Monitor rate limiting logs
- [ ] Test password reset flow
- [ ] Test email verification flow
- [ ] Set up error monitoring (Sentry)

---

## 🛠️ Troubleshooting

### Rate limiting not working
- Check django-ratelimit is installed: `pip list | grep ratelimit`
- Verify middleware order in settings.py
- Check if DEBUG=True (rate limiting may be disabled)

### Email not sending
- Check EMAIL_BACKEND in settings.py
- For Gmail: Use App Password, not regular password
- For development: Use console backend to see emails in terminal
- Check firewall allows outbound SMTP connections

### Token refresh fails
- Verify JWT_SECRET is consistent
- Check token expiration times
- Ensure RefreshToken model is migrated
- Check frontend is sending correct refresh_token

---

## 📚 Additional Resources

- [Django Password Validation](https://docs.djangoproject.com/en/5.0/topics/auth/passwords/)
- [django-ratelimit Documentation](https://django-ratelimit.readthedocs.io/)
- [Django Email Documentation](https://docs.djangoproject.com/en/5.0/topics/email/)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)

---

**Next Steps**: Choose which phase to implement based on your priorities. Phase 1 (Security) is recommended as the first step.
