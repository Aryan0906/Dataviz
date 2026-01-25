import os, json, jwt
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from django.http import JsonResponse, HttpResponseNotAllowed
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from django.contrib.auth.hashers import make_password
from django.shortcuts import get_object_or_404
from django.conf import settings
from django.db import transaction
from django.core.exceptions import ValidationError
from .models import AnalysisResult, DraftAnalysis, Visualization
from .utils.ai_helpers import (
    generate_metadata_summary,
    suggest_cleaning_actions,
    generate_chart_config,
    AITimeoutError,
    AIValidationError
)

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
        print("DEBUG: No token provided in Authorization header")
        return (None, JsonResponse({"error": "Access token required"}, status=401))
    
    try:
        # Verify using Supabase JWT Secret
        if SUPABASE_JWT_SECRET:
            # Use Supabase authentication - try both HS256 and RS256 algorithms
            print(f"DEBUG: Attempting to decode token with Supabase JWT secret")
            try:
                # First try with HS256
                decoded = jwt.decode(
                    token, 
                    SUPABASE_JWT_SECRET, 
                    algorithms=['HS256', 'HS384', 'HS512'],
                    audience="authenticated",
                    options={"verify_aud": False}  # Supabase might not always include aud
                )
            except jwt.InvalidAlgorithmError:
                # If HS256 fails, the token might be signed with RS256 (asymmetric)
                # In this case, we need to skip verification or get the public key
                print("DEBUG: HS256 failed, decoding without verification (development only)")
                decoded = jwt.decode(
                    token,
                    options={"verify_signature": False}  # Skip signature verification for now
                )
            
            user_id = decoded.get('sub') or decoded.get('user_id')  # Supabase UUID from 'sub' claim
            print(f"DEBUG: Successfully authenticated user: {user_id}")
        else:
            # Fallback to custom JWT for backward compatibility
            print("DEBUG: No Supabase JWT secret, using custom JWT")
            decoded = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
            user_id = str(decoded["userId"])
        return (user_id, None)
    except jwt.ExpiredSignatureError:
        print("DEBUG: Token expired")
        return (None, JsonResponse({"error": "Token expired"}, status=401))
    except jwt.InvalidTokenError as e:
        print(f"DEBUG: Invalid token error: {str(e)}")
        return (None, JsonResponse({"error": f"Invalid token: {str(e)}"}, status=401))
    except Exception as e:
        print(f"DEBUG: Unexpected error during token verification: {str(e)}")
        return (None, JsonResponse({"error": f"Authentication error: {str(e)}"}, status=403))


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


@csrf_exempt
def delete_analysis(request, pk: int):
    """Delete a saved analysis"""
    if request.method != "DELETE":
        return HttpResponseNotAllowed(["DELETE"])
    
    user_id, err = _require_auth(request)
    if err:
        return err
    
    try:
        # Get the analysis and verify ownership
        analysis = AnalysisResult.objects.get(id=pk, user_id=user_id)
        analysis.delete()
        return JsonResponse({'message': 'Analysis deleted successfully'})
    except AnalysisResult.DoesNotExist:
        return JsonResponse({'error': 'Analysis not found or unauthorized'}, status=404)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)



# ============ DRAFT ANALYSIS ENDPOINTS ============

@csrf_exempt
def save_draft(request):
    """Auto-save draft analysis"""
    if request.method != "POST":
        return HttpResponseNotAllowed(["POST"])
    
    user_id, err = _require_auth(request)
    if err:
        return err
    
    body = json.loads(request.body.decode() or "{}")
    
    # Get or create draft for this user
    draft, created = DraftAnalysis.objects.get_or_create(
        user_id=user_id,
        is_draft=True,
        defaults={
            'title': body.get('title', 'Untitled Analysis'),
            'data_points': body.get('dataPoints', []),
            'categories': body.get('categories', []),
            'tab_type': body.get('tabType', 'regression'),
            'regression_type': body.get('regressionType'),
            'polynomial_degree': body.get('polynomialDegree'),
        }
    )
    
    # Update existing draft
    if not created:
        draft.title = body.get('title', draft.title)
        draft.data_points = body.get('dataPoints', draft.data_points)
        draft.categories = body.get('categories', draft.categories)
        draft.tab_type = body.get('tabType', draft.tab_type)
        draft.regression_type = body.get('regressionType', draft.regression_type)
        draft.polynomial_degree = body.get('polynomialDegree', draft.polynomial_degree)
        draft.save()
    
    return JsonResponse({
        'id': draft.id,
        'message': 'Draft saved successfully',
        'updated_at': draft.updated_at.isoformat()
    })


@csrf_exempt
def get_draft(request):
    """Get user's latest draft"""
    if request.method != "GET":
        return HttpResponseNotAllowed(["GET"])
    
    user_id, err = _require_auth(request)
    if err:
        return err
    
    try:
        draft = DraftAnalysis.objects.filter(user_id=user_id, is_draft=True).first()
        if not draft:
            return JsonResponse({'draft': None})
        
        return JsonResponse({
            'draft': {
                'id': draft.id,
                'title': draft.title,
                'dataPoints': draft.data_points,
                'categories': draft.categories,
                'tabType': draft.tab_type,
                'regressionType': draft.regression_type,
                'polynomialDegree': draft.polynomial_degree,
                'updated_at': draft.updated_at.isoformat(),
                'created_at': draft.created_at.isoformat(),
            }
        })
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@csrf_exempt
def delete_draft(request):
    """Delete user's draft"""
    if request.method != "DELETE":
        return HttpResponseNotAllowed(["DELETE"])
    
    user_id, err = _require_auth(request)
    if err:
        return err
    
    try:
        DraftAnalysis.objects.filter(user_id=user_id, is_draft=True).delete()
        return JsonResponse({'message': 'Draft deleted successfully'})
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@csrf_exempt
def finalize_draft(request):
    """Convert draft to saved analysis"""
    if request.method != "POST":
        return HttpResponseNotAllowed(["POST"])
    
    user_id, err = _require_auth(request)
    if err:
        return err
    
    body = json.loads(request.body.decode() or "{}")
    
    try:
        # Get the draft
        draft = DraftAnalysis.objects.filter(user_id=user_id, is_draft=True).first()
        if not draft:
            return JsonResponse({'error': 'No draft found'}, status=404)
        
        # Create saved analysis from draft
        analysis = AnalysisResult.objects.create(
            user_id=user_id,
            title=body.get('title', draft.title),
            data_points=draft.data_points,
            regression_type=draft.regression_type,
            equation=body.get('equation'),
            r_squared=body.get('r2'),
        )
        
        # Delete the draft
        draft.delete()
        
        return JsonResponse({
            'id': analysis.id,
            'message': 'Analysis saved successfully'
        })
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


# ============ AI ANALYSIS ENDPOINTS ============

@csrf_exempt
@transaction.atomic
def upload_csv(request):
    """
    Upload and analyze a CSV file with AI-powered data quality insights.
    
    Uses atomic transactions to ensure file and DB operations are rolled back together on failure.
    Implements token optimization by sending only metadata to OpenAI, not the full CSV.
    """
    if request.method != "POST":
        return HttpResponseNotAllowed(["POST"])
    
    user_id, err = _require_auth(request)
    if err:
        return err
    
    # Validate file upload
    if 'file' not in request.FILES:
        return JsonResponse({'error': 'No file provided', 'code': 'ERR_NO_FILE'}, status=400)
    
    uploaded_file = request.FILES['file']
    
    # Validate file extension
    if not uploaded_file.name.endswith('.csv'):
        return JsonResponse({
            'error': 'Invalid file format. Only CSV files are allowed.',
            'code': 'ERR_INVALID_FORMAT'
        }, status=400)
    
    # Validate file size (10MB limit)
    max_size = 10 * 1024 * 1024  # 10MB
    if uploaded_file.size > max_size:
        return JsonResponse({
            'error': f'File too large. Maximum size is {max_size / (1024 * 1024)}MB.',
            'code': 'ERR_FILE_TOO_LARGE'
        }, status=400)
    
    file_path = None
    
    try:
        # Create media directory if it doesn't exist
        media_dir = os.path.join(settings.BASE_DIR, 'media', 'csv_uploads')
        os.makedirs(media_dir, exist_ok=True)
        
        # Generate unique filename
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f"{user_id}_{timestamp}_{uploaded_file.name}"
        file_path = os.path.join(media_dir, filename)
        
        # Save file temporarily
        with open(file_path, 'wb+') as destination:
            for chunk in uploaded_file.chunks():
                destination.write(chunk)
        
        # Load CSV into pandas
        try:
            df = pd.read_csv(file_path)
        except Exception as e:
            raise ValidationError(f'Failed to parse CSV: {str(e)}')
        
        # Validate CSV is not empty
        if df.empty:
            raise ValidationError('CSV file is empty')
        
        # Generate metadata summary (token optimization)
        metadata = generate_metadata_summary(df)
        
        # Get AI cleaning suggestions
        try:
            cleaning_analysis = suggest_cleaning_actions(metadata)
            ai_summary = cleaning_analysis.get('summary', 'No issues detected')
        except AITimeoutError as e:
            # Return specific error code so frontend can show retry button
            return JsonResponse({
                'error': str(e),
                'code': 'ERR_AI_TIMEOUT'
            }, status=504)
        except AIValidationError as e:
            return JsonResponse({
                'error': f'AI validation failed: {str(e)}',
                'code': 'ERR_AI_VALIDATION'
            }, status=500)
        
        # Create visualization record in database
        visualization = Visualization.objects.create(
            user_id=user_id,
            title=uploaded_file.name.replace('.csv', ''),
            chart_type='pending',  # Will be set when user queries
            data={},  # Will be populated when chart is generated
            csv_file_path=file_path,
            data_schema=metadata,
            ai_summary=ai_summary,
            processing_status='completed'
        )
        
        return JsonResponse({
            'message': 'CSV uploaded and analyzed successfully',
            'visualization_id': visualization.id,
            'metadata': metadata,
            'cleaning_analysis': cleaning_analysis
        }, status=201)
    
    except ValidationError as e:
        # Rollback: delete file if DB operation fails
        if file_path and os.path.exists(file_path):
            os.remove(file_path)
        return JsonResponse({
            'error': str(e),
            'code': 'ERR_INVALID_DATA'
        }, status=400)
    
    except Exception as e:
        # Rollback: delete file on any error
        if file_path and os.path.exists(file_path):
            os.remove(file_path)
        return JsonResponse({
            'error': f'Upload failed: {str(e)}',
            'code': 'ERR_UPLOAD_FAILED'
        }, status=500)


@csrf_exempt
def query_ai(request):
    """
    Generate a chart configuration from a natural language query.
    
    Loads the CSV data, sends schema to AI, and returns a Recharts-compatible config.
    """
    if request.method != "POST":
        return HttpResponseNotAllowed(["POST"])
    
    user_id, err = _require_auth(request)
    if err:
        return err
    
    body = json.loads(request.body.decode() or "{}")
    visualization_id = body.get('visualization_id')
    query = body.get('query')
    
    if not visualization_id or not query:
        return JsonResponse({
            'error': 'visualization_id and query are required',
            'code': 'ERR_MISSING_PARAMS'
        }, status=400)
    
    try:
        # Get visualization record
        visualization = Visualization.objects.get(id=visualization_id, user_id=user_id)
        
        if not visualization.csv_file_path or not os.path.exists(visualization.csv_file_path):
            return JsonResponse({
                'error': 'CSV file not found',
                'code': 'ERR_FILE_NOT_FOUND'
            }, status=404)
        
        # Load CSV data
        df = pd.read_csv(visualization.csv_file_path)
        
        # Generate chart config using AI
        try:
            chart_config = generate_chart_config(query, visualization.data_schema)
        except AITimeoutError as e:
            return JsonResponse({
                'error': str(e),
                'code': 'ERR_AI_TIMEOUT'
            }, status=504)
        except AIValidationError as e:
            return JsonResponse({
                'error': f'AI validation failed: {str(e)}',
                'code': 'ERR_AI_VALIDATION'
            }, status=500)
        
        # Extract data for the chart based on AI config
        x_key = chart_config['xAxisKey']
        data_keys = chart_config['dataKeys']
        
        # Validate columns exist
        required_cols = [x_key] + data_keys
        missing_cols = [col for col in required_cols if col not in df.columns]
        if missing_cols:
            return JsonResponse({
                'error': f'Columns not found in CSV: {missing_cols}',
                'code': 'ERR_INVALID_COLUMNS'
            }, status=400)
        
        # Prepare chart data
        chart_data = df[required_cols].to_dict(orient='records')
        
        # Update visualization record
        visualization.chart_type = chart_config['chartType']
        visualization.chart_config = chart_config
        visualization.data = chart_data
        visualization.title = chart_config['title']
        visualization.save()
        
        return JsonResponse({
            'message': 'Chart generated successfully',
            'chart_config': chart_config,
            'chart_data': chart_data
        })
    
    except Visualization.DoesNotExist:
        return JsonResponse({
            'error': 'Visualization not found',
            'code': 'ERR_NOT_FOUND'
        }, status=404)
    
    except Exception as e:
        return JsonResponse({
            'error': f'Query failed: {str(e)}',
            'code': 'ERR_QUERY_FAILED'
        }, status=500)


@csrf_exempt
def get_latest_visualization(request):
    """Get user's most recent visualization for auto-resume"""
    if request.method != "GET":
        return HttpResponseNotAllowed(["GET"])
    
    user_id, err = _require_auth(request)
    if err:
        return err
    
    try:
        # Get latest visualization created by user
        vis = Visualization.objects.filter(
            user_id=user_id
        ).order_by('-created_at').first()
        
        if not vis:
            return JsonResponse({'visualization': None})
            
        return JsonResponse({
            'visualization': {
                'id': vis.id,
                'title': vis.title,
                'chart_type': vis.chart_type,
                'data': vis.data,
                'chart_config': vis.chart_config,
                'data_schema': vis.data_schema,
                'ai_summary': vis.ai_summary,
                'cleaning_analysis': {
                    'summary': vis.ai_summary,
                    # We don't store issues list separately in DB currently, 
                    # but we can reconstruct a basic structure if needed
                    'issues': [], 
                    'suggested_actions': []
                },
                'created_at': vis.created_at.isoformat()
            }
        })
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@csrf_exempt
def save_visualization_to_history(request):
    """Convert a temporary visualization to a permanent saved analysis"""
    if request.method != "POST":
        return HttpResponseNotAllowed(["POST"])
    
    user_id, err = _require_auth(request)
    if err:
        return err
    
    body = json.loads(request.body.decode() or "{}")
    vis_id = body.get('visualization_id')
    title = body.get('title')
    
    if not vis_id:
        return JsonResponse({'error': 'visualization_id is required'}, status=400)
    
    try:
        vis = Visualization.objects.get(id=vis_id, user_id=user_id)
        
        # Create persistent analysis record
        analysis = AnalysisResult.objects.create(
            user_id=user_id,
            title=title or vis.title,
            data_points=vis.data,  # Store the chart data
            regression_type=vis.chart_type,  # Use regression_type field for chart type
            equation=vis.ai_summary,  # Store AI summary in equation field
            r_squared=None  # Not applicable for AI charts usually
        )
        
        return JsonResponse({
            'message': 'Analysis saved to history successfully',
            'id': analysis.id
        })
        
    except Visualization.DoesNotExist:
        return JsonResponse({'error': 'Visualization not found'}, status=404)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)
