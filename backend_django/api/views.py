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
from django_ratelimit.decorators import ratelimit
from .models import AnalysisResult, DraftAnalysis, Visualization, PageSession, UserHistory
from .utils.ai_helpers import (
    generate_metadata_summary,
    suggest_cleaning_actions,
    generate_chart_config,
    AITimeoutError,
    AIValidationError
)
from .utils.langchain_helpers import recommend_chart_type, generate_data_story
from .utils.regression_models import find_best_regression

JWT_SECRET = os.getenv("JWT_SECRET")
if not JWT_SECRET:
    raise RuntimeError("JWT_SECRET environment variable is required and not set.")
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
    user_id, err = _require_auth(request)
    if err:
        return err
    return JsonResponse({"valid": True, "userId": user_id})


def _require_auth(request):
    """Verify Supabase JWT token and extract user_id (UUID)"""
    auth = request.headers.get("Authorization", "")
    token = auth.split(" ")[1] if auth.startswith("Bearer ") else None
    
    if not token:
        print("DEBUG: No token provided in Authorization header")
        return (None, JsonResponse({"error": "Access token required"}, status=401))
    
    # Guest mode pass-through
    if token == 'guest-token':
        return ('guest-user', None)
    
    try:
        # Try Supabase JWT first
        if SUPABASE_JWT_SECRET:
            try:
                decoded = jwt.decode(
                    token, 
                    SUPABASE_JWT_SECRET, 
                    algorithms=['HS256'],
                    audience="authenticated"
                )
                user_id = decoded.get('sub')
                if user_id:
                    return (user_id, None)
            except Exception as e:
                if settings.DEBUG and SUPABASE_JWT_SECRET.startswith("insecure-"):
                    print("DEBUG: Dev mode bypass - decoding token without verification signature")
                    decoded = jwt.decode(token, options={"verify_signature": False})
                    user_id = decoded.get('sub') or str(decoded.get('userId') or decoded.get('id', ''))
                    if user_id:
                        return (user_id, None)
                # Fall through to custom JWT

        # Fallback to custom JWT (local Django auth)
        try:
            decoded = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
            user_id = str(decoded.get("userId") or decoded.get("id") or decoded.get("sub", ""))
            if user_id:
                return (user_id, None)
        except Exception:
            pass

        return (None, JsonResponse({"error": "Invalid token"}, status=401))
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
    workspace_id = body.get("workspace_id")
    is_public = body.get("is_public", False)
    
    if not title or not data_points:
        return JsonResponse({"error": "Title and data points are required"}, status=400)
        
    ar = AnalysisResult(
        user_id=user_id,
        title=title,
        data_points=data_points,
        regression_type=regression_type,
        equation=equation,
        r_squared=r_squared,
        is_public=is_public,
    )
    if workspace_id:
        ar.workspace_id = workspace_id
    ar.save()
    
    return JsonResponse({"message": "Analysis saved successfully", "id": ar.id}, status=201)


def list_analyses(request):
    user_id, err = _require_auth(request)
    if err:
        return err
        
    workspace_id = request.GET.get('workspace_id')
    if workspace_id:
        qs = AnalysisResult.objects.filter(workspace_id=workspace_id).order_by("-created_at")
    else:
        qs = AnalysisResult.objects.filter(user_id=user_id, workspace__isnull=True).order_by("-created_at")
        
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


def list_public_analyses(request):
    """Fetch all analyses marked as public, regardless of user"""
    if request.method != "GET":
        return HttpResponseNotAllowed(["GET"])
        
    qs = AnalysisResult.objects.filter(is_public=True).order_by("-created_at")
    return JsonResponse({
        "analyses": [
            {
                "id": a.id,
                "title": a.title,
                "regression_type": a.regression_type,
                "equation": a.equation,
                "r_squared": a.r_squared,
                "created_at": a.created_at.isoformat(),
                "author_id": a.user_id,
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
    """
    Async comprehensive regression analysis using Celery.
    Automatically selects the best model and returns a task ID.
    """
    print("=== Analyze endpoint called ===")
    
    if request.method != "POST":
        return HttpResponseNotAllowed(["POST"])
    
    try:
        body = json.loads(request.body.decode() or "{}")
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON in request body"}, status=400)
    
    data_points = body.get("dataPoints") or []
    
    if len(data_points) < 2:
        return JsonResponse({"error": "At least 2 data points are required"}, status=400)
    
    try:
        from .tasks import run_comprehensive_analysis
        model_type = body.get("modelType")
        
        # Start background task
        task = run_comprehensive_analysis.delay(data_points, model_type)
        
        # Return task ID immediately
        return JsonResponse({
            'task_id': task.id,
            'status': 'processing'
        }, status=202)
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return JsonResponse({"error": f"Analysis failed to start: {str(e)}"}, status=500)


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
            
        # Generate AI Data Story (3-4 sentences narrative)
        try:
            ai_summary = generate_data_story(metadata)
        except Exception as e:
            ai_summary = "Unable to generate data story at this time."
        
        # Get chart type recommendation from AI
        try:
            chart_rec = recommend_chart_type(df)
        except Exception as e:
            chart_rec = {'recommendation': 'Unable to determine chart type', 'chart_type': 'bar'}
        
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
            'cleaning_analysis': cleaning_analysis,
            'chart_recommendation': chart_rec,
            'ai_summary': ai_summary
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
@ratelimit(key='ip', rate='20/d', block=True)
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
    workspace_id = body.get('workspace_id')
    
    if not vis_id:
        return JsonResponse({'error': 'visualization_id is required'}, status=400)
    
    try:
        vis = Visualization.objects.get(id=vis_id, user_id=user_id)
        
        # Create persistent analysis record
        analysis = AnalysisResult(
            user_id=user_id,
            title=title or vis.title,
            data_points=vis.data,  # Store the chart data
            regression_type=vis.chart_type,  # Use regression_type field for chart type
            equation=vis.ai_summary,  # Store AI summary in equation field
            r_squared=None  # Not applicable for AI charts usually
        )
        if workspace_id:
            analysis.workspace_id = workspace_id
        analysis.save()
        
        return JsonResponse({
            'message': 'Analysis saved to history successfully',
            'id': analysis.id
        })
        
    except Visualization.DoesNotExist:
        return JsonResponse({'error': 'Visualization not found'}, status=404)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@csrf_exempt
@ratelimit(key='ip', rate='20/d', block=True)
def categorical_query(request):
    """
    NLP query endpoint for CategoricalChatNLP.
    Tries smart_column_matcher first, and if it fails to resolve a chart,
    falls back to LangChain nl_query_to_chart_config.
    """
    if request.method != "POST":
        return HttpResponseNotAllowed(["POST"])

    # user_id, err = _require_auth(request)
    # if err:
    #     return err

    try:
        body = json.loads(request.body.decode() or "{}")
        query = body.get("query")
        raw_data = body.get("data", [])
        columns = body.get("columns", [])
        data_schema = body.get("data_schema", {})
        
        if not query or not raw_data:
            return JsonResponse({"error": "Query and data are required"}, status=400)
        
        column_names = [col.get("name") for col in columns]
        
        # 1. Try fuzzy match + entity extraction
        from .utils.nlp_helpers import smart_column_matcher
        parsed = smart_column_matcher(query, column_names)
        matched_columns = parsed.get("matched_columns", [])
        
        target_column_name = None
        if matched_columns:
            target_column_name = matched_columns[0]
            
        if target_column_name:
            df = pd.DataFrame(raw_data)
            if target_column_name in df.columns:
                counts = df[target_column_name].value_counts().to_dict()
                labels = [str(k) for k in counts.keys()]
                values = [int(v) for v in counts.values()]
                
                chart_config = {
                    "chartType": "bar",
                    "title": f"Count of {target_column_name}",
                    "xAxisKey": target_column_name,
                    "dataKeys": ["Count"]
                }
                
                chart_data = [{"label": l, "Count": v} for l, v in zip(labels, values)]
                return JsonResponse({
                    "chart_config": chart_config,
                    "chart_data": chart_data
                })
        
        # 2. Fallback to LangChain LLM
        if not data_schema:
            df = pd.DataFrame(raw_data)
            data_schema = generate_metadata_summary(df)
            
        from .utils.nlp_query_helpers import nl_query_to_chart_config
        chart_config = nl_query_to_chart_config(query, data_schema)
        
        x_key = chart_config.get('xAxisKey')
        data_keys = chart_config.get('dataKeys', [])
        
        df = pd.DataFrame(raw_data)
        required_cols = [x_key] + data_keys
        missing_cols = [col for col in required_cols if col not in df.columns]
        
        if missing_cols:
            return JsonResponse({
                'error': f'LLM suggested columns not found: {missing_cols}',
                'code': 'ERR_INVALID_COLUMNS'
            }, status=400)
            
        chart_data = df[required_cols].to_dict(orient='records')
        
        return JsonResponse({
            'chart_config': chart_config,
            'chart_data': chart_data
        })
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return JsonResponse({"error": str(e)}, status=500)


@csrf_exempt
@ratelimit(key='ip', rate='20/d', block=True)
def nlp_query(request):
    """
    Intelligent NLP querying view that fuzzy matches column names
    and returns aggregated chart data and textual insights.
    """
    if request.method != "POST":
        return HttpResponseNotAllowed(["POST"])
    
    try:
        body = json.loads(request.body.decode() or "{}")
        query = body.get("query")
        raw_data = body.get("data", [])
        columns = body.get("columns", [])
        
        if not query or not raw_data:
            return JsonResponse({"error": "Query and data are required"}, status=400)
        
        # Extract column names from columns list
        column_names = [col.get("name") for col in columns]
        
        # Import smart_column_matcher
        from .utils.nlp_helpers import smart_column_matcher
        
        parsed = smart_column_matcher(query, column_names)
        matched_columns = parsed.get("matched_columns", [])
        
        # Fallback to the first categorical column if no columns are matched
        target_column_name = None
        if matched_columns:
            target_column_name = matched_columns[0]
        else:
            for col in columns:
                if col.get("type") == "categorical":
                    target_column_name = col.get("name")
                    break
        
        if not target_column_name:
            # Fallback to any first column
            if column_names:
                target_column_name = column_names[0]
        
        if not target_column_name:
            return JsonResponse({"error": "No valid column found for analysis"}, status=400)
        
        # Aggregate data using pandas
        df = pd.DataFrame(raw_data)
        if target_column_name not in df.columns:
            return JsonResponse({"error": f"Column '{target_column_name}' not found in data"}, status=400)
        
        counts = df[target_column_name].value_counts().to_dict()
        labels = [str(k) for k in counts.keys()]
        values = [int(v) for v in counts.values()]
        
        if not labels:
            return JsonResponse({"error": "No data found for the target column"}, status=400)
        
        # Calculate insights
        max_val = max(values)
        min_val = min(values)
        max_label = labels[values.index(max_val)]
        min_label = labels[values.index(min_val)]
        ratio = (max_val / min_val) if min_val > 0 else max_val
        
        summary = f"{max_label} leads with {max_val} items, which is {ratio:.1f}x higher than {min_label}."
        
        # Calculate missing data
        total_non_null = sum(values)
        missing_data = len(raw_data) - total_non_null
        
        # Helper to generate distinct RGB colors
        colors = [
            'rgba(59, 130, 246, 0.8)',   # blue
            'rgba(16, 185, 129, 0.8)',   # green
            'rgba(251, 146, 60, 0.8)',   # orange
            'rgba(239, 68, 68, 0.8)',    # red
            'rgba(168, 85, 247, 0.8)',   # purple
            'rgba(236, 72, 153, 0.8)',   # pink
            'rgba(14, 165, 233, 0.8)',   # sky
            'rgba(251, 191, 36, 0.8)',   # amber
        ]
        
        bg_colors = [colors[i % len(colors)] for i in range(len(labels))]
        
        return JsonResponse({
            "chart": {
                "title": f"Count by {target_column_name}",
                "type": "bar",
                "labels": labels,
                "datasets": [{
                    "label": "Count",
                    "data": values,
                    "backgroundColor": bg_colors
                }]
            },
            "insights": {
                "summary": summary,
                "cardinality": len(labels),
                "topPerformer": {"label": max_label, "value": max_val},
                "bottomPerformer": {"label": min_label, "value": min_val},
                "missingData": int(missing_data),
                "totalCount": len(raw_data)
            },
            "table_data": raw_data
        })
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)


# ============================================================================
# Page Session Management - Auto-save and restore page state
# ============================================================================

@csrf_exempt
def save_page_session(request):
    """Save or update current page session state"""
    if request.method != "POST":
        return HttpResponseNotAllowed(["POST"])
    
    # Allow both authenticated and anonymous users
    body = json.loads(request.body.decode() or "{}")
    user_id = body.get('user_id', 'anonymous')
    session_id = body.get('session_id')
    page_type = body.get('page_type')
    state_data = body.get('state_data')
    
    if not all([session_id, page_type, state_data]):
        return JsonResponse({
            'error': 'session_id, page_type, and state_data are required'
        }, status=400)
    
    try:
        session, created = PageSession.objects.update_or_create(
            session_id=session_id,
            defaults={
                'user_id': user_id,
                'page_type': page_type,
                'state_data': state_data,
            }
        )
        
        return JsonResponse({
            'message': 'Session saved successfully',
            'session_id': session.session_id,
            'created': created
        })
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@csrf_exempt
def get_page_session(request):
    """Retrieve saved page session by session_id"""
    if request.method != "GET":
        return HttpResponseNotAllowed(["GET"])
    
    session_id = request.GET.get('session_id')
    
    if not session_id:
        return JsonResponse({'error': 'session_id is required'}, status=400)
    
    try:
        session = PageSession.objects.get(session_id=session_id)
        return JsonResponse({
            'session_id': session.session_id,
            'page_type': session.page_type,
            'state_data': session.state_data,
            'last_accessed': session.last_accessed.isoformat(),
        })
    except PageSession.DoesNotExist:
        # Instead of 404 which triggers browser console errors, return 200 with empty state
        return JsonResponse({'error': 'Session not found', 'not_found': True}, status=200)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@csrf_exempt
def get_user_sessions(request):
    """Get all sessions for a user (authenticated or anonymous)"""
    if request.method != "GET":
        return HttpResponseNotAllowed(["GET"])
    
    user_id = request.GET.get('user_id', 'anonymous')
    page_type = request.GET.get('page_type')  # Optional filter
    
    try:
        sessions = PageSession.objects.filter(user_id=user_id)
        if page_type:
            sessions = sessions.filter(page_type=page_type)
        
        sessions = sessions[:20]  # Limit to last 20 sessions
        
        data = [{
            'session_id': s.session_id,
            'page_type': s.page_type,
            'state_data': s.state_data,
            'last_accessed': s.last_accessed.isoformat(),
            'created_at': s.created_at.isoformat(),
        } for s in sessions]
        
        return JsonResponse({'sessions': data})
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@csrf_exempt
def delete_page_session(request):
    """Delete a specific page session"""
    if request.method != "DELETE" and request.method != "POST":
        return HttpResponseNotAllowed(["DELETE", "POST"])
    
    body = json.loads(request.body.decode() or "{}")
    session_id = body.get('session_id')
    
    if not session_id:
        return JsonResponse({'error': 'session_id is required'}, status=400)
    
    try:
        session = PageSession.objects.get(session_id=session_id)
        session.delete()
        return JsonResponse({'message': 'Session deleted successfully'})
    except PageSession.DoesNotExist:
        return JsonResponse({'error': 'Session not found'}, status=404)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


# ============================================================================
# User History Management - Track all user actions
# ============================================================================

@csrf_exempt
def save_to_history(request):
    """Save an action to user history"""
    if request.method != "POST":
        return HttpResponseNotAllowed(["POST"])
    
    body = json.loads(request.body.decode() or "{}")
    user_id = body.get('user_id', 'anonymous')
    page_type = body.get('page_type')
    action_type = body.get('action_type', 'create')
    title = body.get('title')
    snapshot_data = body.get('snapshot_data')
    metadata = body.get('metadata', {})
    
    if not all([page_type, snapshot_data]):
        return JsonResponse({
            'error': 'page_type and snapshot_data are required'
        }, status=400)
    
    try:
        history = UserHistory.objects.create(
            user_id=user_id,
            page_type=page_type,
            action_type=action_type,
            title=title,
            snapshot_data=snapshot_data,
            metadata=metadata
        )
        
        return JsonResponse({
            'message': 'History saved successfully',
            'history_id': history.id
        })
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@csrf_exempt
def get_user_history(request):
    """Get user history with optional filters"""
    if request.method != "GET":
        return HttpResponseNotAllowed(["GET"])
    
    user_id = request.GET.get('user_id', 'anonymous')
    page_type = request.GET.get('page_type')  # Optional filter
    action_type = request.GET.get('action_type')  # Optional filter
    limit = int(request.GET.get('limit', 50))
    
    try:
        history = UserHistory.objects.filter(user_id=user_id)
        
        if page_type:
            history = history.filter(page_type=page_type)
        if action_type:
            history = history.filter(action_type=action_type)
        
        history = history[:limit]
        
        data = [{
            'id': h.id,
            'page_type': h.page_type,
            'action_type': h.action_type,
            'title': h.title,
            'snapshot_data': h.snapshot_data,
            'metadata': h.metadata,
            'created_at': h.created_at.isoformat(),
        } for h in history]
        
        return JsonResponse({'history': data})
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@csrf_exempt
def restore_from_history(request):
    """Restore a specific history entry"""
    if request.method != "GET":
        return HttpResponseNotAllowed(["GET"])
    
    history_id = request.GET.get('history_id')
    
    if not history_id:
        return JsonResponse({'error': 'history_id is required'}, status=400)
    
    try:
        history = UserHistory.objects.get(id=history_id)
        return JsonResponse({
            'id': history.id,
            'page_type': history.page_type,
            'action_type': history.action_type,
            'title': history.title,
            'snapshot_data': history.snapshot_data,
            'metadata': history.metadata,
            'created_at': history.created_at.isoformat(),
        })
    except UserHistory.DoesNotExist:
        return JsonResponse({'error': 'History entry not found'}, status=404)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


# ============================================================
# SMART DATA CLEANING ENDPOINTS
# ============================================================

@csrf_exempt
def check_data_health(request):
    """
    Performs health check on uploaded CSV to detect issues.
    Returns: health report with missing values, duplicates, type warnings
    """
    if request.method != "POST":
        return HttpResponseNotAllowed(["POST"])
    
    try:
        body = json.loads(request.body.decode() or "{}")
        file_path = body.get('file_path')
        
        if not file_path:
            return JsonResponse({'error': 'file_path is required'}, status=400)
        
        # Resolve file path
        full_path = os.path.join(settings.MEDIA_ROOT, file_path)
        
        if not os.path.exists(full_path):
            return JsonResponse({'error': 'File not found'}, status=404)
        
        # Load CSV
        df = pd.read_csv(full_path)
        
        # Import data cleaning utility
        from .utils.data_cleaning import check_data_health as perform_health_check
        
        # Run health check
        health_report = perform_health_check(df)
        
        return JsonResponse(health_report)
        
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@csrf_exempt
def clean_data(request):
    """
    Applies cleaning operations to CSV file.
    Methods: 'drop', 'mean', 'median', 'mode', 'forward_fill', 'zero', 'drop_duplicates'
    """
    if request.method != "POST":
        return HttpResponseNotAllowed(["POST"])
    
    try:
        body = json.loads(request.body.decode() or "{}")
        file_path = body.get('file_path')
        method = body.get('method', 'drop')
        columns = body.get('columns')  # Optional: specific columns to clean
        save_as_new = body.get('save_as_new', False)
        
        if not file_path:
            return JsonResponse({'error': 'file_path is required'}, status=400)
        
        # Resolve file path
        full_path = os.path.join(settings.MEDIA_ROOT, file_path)
        
        if not os.path.exists(full_path):
            return JsonResponse({'error': 'File not found'}, status=404)
        
        # Load CSV
        df_original = pd.read_csv(full_path)
        
        # Import cleaning utilities
        from .utils.data_cleaning import clean_data as perform_cleaning, get_cleaning_summary
        
        # Clean data
        df_cleaned = perform_cleaning(df_original, method=method, columns=columns)
        
        # Get summary
        summary = get_cleaning_summary(df_original, df_cleaned)
        
        # Save cleaned data
        if save_as_new:
            # Create new file with _cleaned suffix
            base_name = os.path.splitext(file_path)[0]
            new_file_path = f"{base_name}_cleaned.csv"
            new_full_path = os.path.join(settings.MEDIA_ROOT, new_file_path)
        else:
            # Overwrite original
            new_file_path = file_path
            new_full_path = full_path
        
        # Save
        df_cleaned.to_csv(new_full_path, index=False)
        
        return JsonResponse({
            'success': True,
            'file_path': new_file_path,
            'summary': summary,
            'method': method
        })
        
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@csrf_exempt
def get_correlation_matrix(request):
    """
    Calculate correlation matrix for numeric columns in CSV.
    Returns: correlation data, strong correlations, column names
    """
    if request.method != "POST":
        return HttpResponseNotAllowed(["POST"])
    
    try:
        body = json.loads(request.body.decode() or "{}")
        file_path = body.get('file_path')
        
        if not file_path:
            return JsonResponse({'error': 'file_path is required'}, status=400)
        
        # Resolve file path
        full_path = os.path.join(settings.MEDIA_ROOT, file_path)
        
        if not os.path.exists(full_path):
            return JsonResponse({'error': 'File not found'}, status=404)
        
        # Load CSV
        df = pd.read_csv(full_path)
        
        # Import correlation utility
        from .utils.data_cleaning import calculate_correlation_matrix
        
        # Calculate correlation
        correlation_data = calculate_correlation_matrix(df)
        
        return JsonResponse(correlation_data)
        
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@csrf_exempt
def generate_code_snippet(request):
    """
    Generate Python code snippet for model replication.
    Types: 'regression', 'eda', 'cleaning'
    """
    if request.method != "POST":
        return HttpResponseNotAllowed(["POST"])
    
    try:
        body = json.loads(request.body.decode() or "{}")
        code_type = body.get('type', 'regression')
        
        from .utils.code_generator import (
            generate_regression_code,
            generate_regression_notebook,
            generate_eda_code,
            generate_data_cleaning_code
        )
        
        if code_type == 'regression':
            model_type = body.get('model_type', 'linear')
            features = body.get('features', [])
            target = body.get('target', 'target')
            hyperparameters = body.get('hyperparameters', {})
            format_type = body.get('format', 'python')
            
            if format_type == 'jupyter':
                code = generate_regression_notebook(
                    model_type=model_type,
                    features=features,
                    target=target,
                    hyperparameters=hyperparameters
                )
            else:
                code = generate_regression_code(
                    model_type=model_type,
                    features=features,
                    target=target,
                    hyperparameters=hyperparameters
                )
        elif code_type == 'eda':
            columns = body.get('columns', [])
            code = generate_eda_code(columns)
            
        elif code_type == 'cleaning':
            method = body.get('method', 'drop')
            missing_columns = body.get('missing_columns', [])
            code = generate_data_cleaning_code(method, missing_columns)
            
        else:
            return JsonResponse({'error': 'Invalid code type'}, status=400)
        
        return JsonResponse({
            'code': code,
            'type': code_type,
            'language': 'python' if body.get('format') != 'jupyter' else 'json'
        })
        
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


# ============ EXPORT NOTEBOOK ENDPOINT ============

@csrf_exempt
def export_notebook(request):
    """Export a visualization as a Jupyter notebook.
    Expected JSON body: {"visualization_id": int, "mode": "chartOnly"|"full"}
    Returns JSON with key "notebook_content" containing the notebook JSON string.
    """
    if request.method != "POST":
        return HttpResponseNotAllowed(["POST"])
    try:
        body = json.loads(request.body.decode() or "{}")
        viz_id = body.get("visualization_id")
        mode = body.get("mode", "full")
        if not viz_id:
            return JsonResponse({"error": "visualization_id is required"}, status=400)
        # In a real implementation we would validate ownership
        from .utils.notebook_generator import generate_notebook
        notebook_json = generate_notebook(viz_id, mode)
        return JsonResponse({"notebook_content": notebook_json})
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)


@csrf_exempt
def check_task_status(request, task_id):
    from celery.result import AsyncResult
    
    if request.method != 'GET':
        return HttpResponseNotAllowed(['GET'])
        
    task = AsyncResult(task_id)
    
    if task.state == 'PENDING':
        response = {'state': task.state, 'status': 'Pending...'}
    elif task.state == 'PROGRESS':
        response = {
            'state': task.state,
            'current': task.info.get('current', 0) if task.info else 0,
            'total': task.info.get('total', 100) if task.info else 100,
            'status': task.info.get('status', '') if task.info else ''
        }
    elif task.state == 'SUCCESS':
        response = {
            'state': task.state,
            'result': task.result
        }
    else:
        response = {'state': task.state, 'status': str(task.info)}
    
    return JsonResponse(response)

@csrf_exempt
def test_hypothesis(request):
    if request.method != 'POST':
        return HttpResponseNotAllowed(['POST'])
        
    try:
        from .utils.stats_tests import run_hypothesis_test
        import pandas as pd
        import json
        
        data = json.loads(request.body)
        file_path = data.get('file_path')
        group_col = data.get('group_col')
        value_col = data.get('value_col')
        
        if not all([file_path, group_col, value_col]):
            return JsonResponse({'error': 'Missing required fields'}, status=400)
            
        if not file_path.endswith('.csv'):
            return JsonResponse({'error': 'Only CSV files are supported'}, status=400)
            
        try:
            df = pd.read_csv(file_path)
        except Exception as e:
            return JsonResponse({'error': f'Failed to read CSV: {str(e)}'}, status=400)
            
        results = run_hypothesis_test(df, group_col, value_col)
        
        if 'error' in results:
            return JsonResponse(results, status=400)
            
        return JsonResponse(results)
        
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


# ── Dual Database Sync Views ──────────────────────────────────────────────

@csrf_exempt
def sync_status(request):
    """Return the current database connection status and pending sync count."""
    from dataviz_backend.db_router import is_supabase_online, force_db
    from .sync_models import DeletedSyncRecord
    from django.apps import apps

    online = is_supabase_online()
    pending_count = 0

    try:
        with force_db('sqlite'):
            for model in apps.get_models():
                if hasattr(model, 'pending_sync'):
                    pending_count += model.objects.filter(pending_sync=True).count()
            pending_count += DeletedSyncRecord.objects.count()
    except Exception:
        pass

    return JsonResponse({
        'online': online,
        'database': 'supabase' if online else 'sqlite',
        'pending_sync': pending_count
    })


@csrf_exempt
def trigger_sync(request):
    """Manually trigger an offline → Supabase sync."""
    if request.method != 'POST':
        return HttpResponseNotAllowed(['POST'])

    from .db_manager import sync_offline_data
    from dataviz_backend.db_router import is_supabase_online

    if not is_supabase_online():
        return JsonResponse({'error': 'Supabase is not reachable'}, status=503)

    synced_saves, synced_deletes = sync_offline_data()
    return JsonResponse({
        'synced_saves': synced_saves,
        'synced_deletes': synced_deletes,
        'message': f'Synced {synced_saves} saves and {synced_deletes} deletes'
    })

