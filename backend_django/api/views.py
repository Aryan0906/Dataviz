import os, json, jwt
import numpy as np
from datetime import datetime, timedelta
from django.http import JsonResponse, HttpResponseNotAllowed
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from django.contrib.auth.hashers import make_password
from django.shortcuts import get_object_or_404
from django.conf import settings
from .models import AnalysisResult

JWT_SECRET = os.getenv("JWT_SECRET", "secret")
SUPABASE_JWT_SECRET = settings.SUPABASE_JWT_SECRET
JWT_EXP_HOURS = 24


def health(request):
    return JsonResponse({"status": "ok", "message": "Backend is running"})


def _issue_token(user):
    payload = {
        "userId": user.id,
        "email": user.email,
        "exp": datetime.utcnow() + timedelta(hours=JWT_EXP_HOURS),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")


@csrf_exempt
def signup(request):
    if request.method != "POST":
        return HttpResponseNotAllowed(["POST"])
    body = json.loads(request.body.decode() or "{}")
    name, email, password = body.get("name"), body.get("email"), body.get("password")
    if not all([name, email, password]):
        return JsonResponse({"error": "Name, email, and password are required"}, status=400)
    if User.objects.filter(email=email).exists():
        return JsonResponse({"error": "Email already exists"}, status=409)
    user = User.objects.create(username=email, first_name=name, email=email, password=make_password(password))
    token = _issue_token(user)
    return JsonResponse({
        "message": "User created successfully",
        "token": token,
        "user": {"id": user.id, "name": user.first_name, "email": user.email},
    }, status=201)


@csrf_exempt
def login(request):
    if request.method != "POST":
        return HttpResponseNotAllowed(["POST"])
    body = json.loads(request.body.decode() or "{}")
    email, password = body.get("email"), body.get("password")
    if not all([email, password]):
        return JsonResponse({"error": "Email and password are required"}, status=400)
    try:
        user_obj = User.objects.get(email=email)
        user = authenticate(username=user_obj.username, password=password)
        if not user:
            raise Exception("Invalid")
    except Exception:
        return JsonResponse({"error": "Invalid email or password"}, status=401)
    token = _issue_token(user)
    return JsonResponse({
        "message": "Login successful",
        "token": token,
        "user": {"id": user.id, "name": user.first_name, "email": user.email},
    })


def verify(request):
    auth = request.headers.get("Authorization", "")
    token = auth.split(" ")[1] if auth.startswith("Bearer ") else None
    if not token:
        return JsonResponse({"error": "Token required"}, status=401)
    try:
        decoded = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        return JsonResponse({"valid": True, "userId": decoded["userId"], "email": decoded["email"]})
    except Exception:
        return JsonResponse({"error": "Invalid or expired token"}, status=403)


def _require_auth(request):
    """Verify Supabase JWT token and extract user_id (UUID)"""
    auth = request.headers.get("Authorization", "")
    token = auth.split(" ")[1] if auth.startswith("Bearer ") else None
    if not token:
        return (None, JsonResponse({"error": "Access token required"}, status=401))
    try:
        # Verify using Supabase JWT Secret
        if SUPABASE_JWT_SECRET:
            # Use Supabase authentication
            decoded = jwt.decode(
                token, 
                SUPABASE_JWT_SECRET, 
                algorithms=['HS256'],
                audience="authenticated"  # Supabase audience validation
            )
            user_id = decoded['sub']  # Supabase UUID from 'sub' claim
        else:
            # Fallback to custom JWT for backward compatibility
            decoded = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
            user_id = str(decoded["userId"])
        return (user_id, None)
    except jwt.ExpiredSignatureError:
        return (None, JsonResponse({"error": "Token expired"}, status=401))
    except jwt.InvalidTokenError:
        return (None, JsonResponse({"error": "Invalid token"}, status=401))
    except Exception as e:
        return (None, JsonResponse({"error": "Invalid or expired token"}, status=403))


@csrf_exempt
def save_analysis(request):
    if request.method != "POST":
        return HttpResponseNotAllowed(["POST"])
    user_id, err = _require_auth(request)
    if err:
        return err
    body = json.loads(request.body.decode() or "{}")
    title = body.get("title")
    data_points = body.get("dataPoints")
    regression_type = body.get("regressionType")
    equation = body.get("equation")
    r_squared = body.get("rSquared")
    if not title or not data_points:
        return JsonResponse({"error": "Title and data points are required"}, status=400)
    ar = AnalysisResult.objects.create(
        user_id=user_id,
        title=title,
        data_points=data_points,
        regression_type=regression_type,
        equation=equation,
        r_squared=r_squared,
    )
    return JsonResponse({"message": "Analysis saved successfully", "id": ar.id}, status=201)


def list_analyses(request):
    user_id, err = _require_auth(request)
    if err:
        return err
    qs = AnalysisResult.objects.filter(user_id=user_id).order_by("-created_at")
    return JsonResponse({
        "analyses": [
            {
                "id": a.id,
                "title": a.title,
                "regression_type": a.regression_type,
                "equation": a.equation,
                "r_squared": a.r_squared,
                "created_at": a.created_at.isoformat(),
            }
            for a in qs
        ]
    })


def get_analysis(request, pk: int):
    user_id, err = _require_auth(request)
    if err:
        return err
    if request.method == "DELETE":
        a = get_object_or_404(AnalysisResult, pk=pk, user_id=user_id)
        a.delete()
        return JsonResponse({"message": "Analysis deleted successfully"})
    a = get_object_or_404(AnalysisResult, pk=pk, user_id=user_id)
    return JsonResponse({
        "id": a.id,
        "user_id": a.user_id,
        "title": a.title,
        "data_points": a.data_points,
        "regression_type": a.regression_type,
        "equation": a.equation,
        "r_squared": a.r_squared,
        "created_at": a.created_at.isoformat(),
    })


@csrf_exempt
def analyze(request):
    if request.method != "POST":
        return HttpResponseNotAllowed(["POST"])
    body = json.loads(request.body.decode() or "{}")
    data_points = body.get("dataPoints") or []
    if len(data_points) < 2:
        return JsonResponse({"error": "At least 2 data points are required"}, status=400)
    X = np.array([float(p["x"]) for p in data_points])
    Y = np.array([float(p["y"]) for p in data_points])
    xmean, ymean = X.mean(), Y.mean()
    m = ((X - xmean) * (Y - ymean)).sum() / ((X - xmean) ** 2).sum()
    b = ymean - m * xmean
    y_pred = m * X + b
    ss_res = ((Y - y_pred) ** 2).sum()
    ss_tot = ((Y - ymean) ** 2).sum()
    r2 = float(1 - ss_res / ss_tot) if ss_tot > 0 else 0.0
    return JsonResponse({
        "type": "linear",
        "equation": f"y = {m:.6f}x + {b:.6f}",
        "r2": r2,
        "predictions": [[float(x), float(y)] for x, y in zip(X.tolist(), y_pred.tolist())],
    })
