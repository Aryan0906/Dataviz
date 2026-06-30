
import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from .models import SharedLink, AnalysisResult
from .views import _require_auth

@csrf_exempt
def create_shared_link(request, analysis_id):
    if request.method != 'POST':
        return JsonResponse({'error': 'Method not allowed'}, status=405)
        
    user_id, err = _require_auth(request)
    if err: return err
    
    try:
        analysis = AnalysisResult.objects.get(id=analysis_id, user_id=user_id)
        
        # Check if active link exists
        existing = SharedLink.objects.filter(analysis=analysis, revoked=False).first()
        if existing and existing.is_valid():
            return JsonResponse({'token': str(existing.token)})
            
        link = SharedLink.objects.create(analysis=analysis)
        return JsonResponse({'token': str(link.token)})
        
    except AnalysisResult.DoesNotExist:
        return JsonResponse({'error': 'Analysis not found'}, status=404)

@csrf_exempt
def get_shared_analysis(request, token):
    if request.method != 'GET':
        return JsonResponse({'error': 'Method not allowed'}, status=405)
        
    try:
        link = SharedLink.objects.select_related('analysis').get(token=token)
        
        if not link.is_valid():
            return JsonResponse({'error': 'This link has expired or been revoked'}, status=403)
            
        analysis = link.analysis
        
        return JsonResponse({
            'title': analysis.title,
            'data_points': analysis.data_points,
            'regression_type': analysis.regression_type,
            'equation': analysis.equation,
            'r_squared': analysis.r_squared,
            'created_at': analysis.created_at
        })
        
    except (SharedLink.DoesNotExist, ValueError):
        return JsonResponse({'error': 'Invalid share link'}, status=404)
