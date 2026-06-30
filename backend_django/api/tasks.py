"""
Celery Tasks - Background jobs for long-running operations
"""
from celery import shared_task
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
import time


@shared_task(bind=True)
def run_regression_analysis(self, data: list, regression_type: str = 'linear'):
    """
    Background task for regression analysis
    
    Args:
        self: Celery task instance (for progress updates)
        data: List of [x, y] points
        regression_type: 'linear', 'polynomial', 'random_forest', etc.
    
    Returns:
        Dict with regression results
    """
    # Update progress
    self.update_state(state='PROGRESS', meta={'current': 10, 'total': 100, 'status': 'Loading data...'})
    
    df = pd.DataFrame(data, columns=['x', 'y'])
    X = df[['x']]
    y = df['y']
    
    self.update_state(state='PROGRESS', meta={'current': 30, 'total': 100, 'status': 'Training model...'})
    
    if regression_type == 'random_forest':
        # This can take a while with large datasets
        model = RandomForestRegressor(n_estimators=100, random_state=42)
        model.fit(X, y)
        
        self.update_state(state='PROGRESS', meta={'current': 70, 'total': 100, 'status': 'Calculating predictions...'})
        
        predictions = model.predict(X)
        r_squared = model.score(X, y)
        
        result = {
            'type': 'random_forest',
            'r_squared': float(r_squared),
            'predictions': predictions.tolist(),
            'feature_importance': model.feature_importances_.tolist(),
        }
    else:
        # Use existing simple regression
        from api.utils.regression_models import perform_regression
        result = perform_regression(data, regression_type)
    
    self.update_state(state='PROGRESS', meta={'current': 100, 'total': 100, 'status': 'Complete!'})
    
    return result


@shared_task
def analyze_large_csv(csv_path: str):
    """
    Analyze large CSV files in background
    
    Returns:
        Summary statistics and insights
    """
    df = pd.read_csv(csv_path)
    
    summary = {
        'rows': len(df),
        'columns': len(df.columns),
        'dtypes': df.dtypes.astype(str).to_dict(),
        'missing_values': df.isnull().sum().to_dict(),
        'numeric_summary': df.describe().to_dict(),
    }
    
    return summary


@shared_task
def generate_ai_insights(csv_path: str):
    """
    Generate AI insights for large datasets
    Uses LangChain in background
    """
    from api.utils.langchain_helpers import get_data_insights
    
    df = pd.read_csv(csv_path)
    insights = get_data_insights(df)
    
    return {
        'insights': insights,
        'timestamp': time.time(),
    }


@shared_task(bind=True)
def export_chart_with_processing(self, data: dict, format: str = 'png'):
    """
    Export chart with heavy processing (e.g., high-resolution rendering)
    """
    self.update_state(state='PROGRESS', meta={'current': 25, 'total': 100, 'status': 'Preparing data...'})
    
    # Simulate heavy processing
    time.sleep(2)
    
    self.update_state(state='PROGRESS', meta={'current': 75, 'total': 100, 'status': 'Rendering chart...'})
    
    # Export logic here
    time.sleep(1)
    
    return {'download_url': f'/exports/{format}/chart.{format}'}


# =============================================================================
# Example Usage in Django Views
# =============================================================================
"""
from api.tasks import run_regression_analysis

def regression_view(request):
    data = request.POST.get('data')
    
    # Start background task
    task = run_regression_analysis.delay(data, regression_type='random_forest')
    
    # Return task ID immediately
    return JsonResponse({
        'task_id': task.id,
        'status': 'processing'
    })

def check_task_status(request, task_id):
    from celery.result import AsyncResult
    
    task = AsyncResult(task_id)
    
    if task.state == 'PENDING':
        response = {'state': task.state, 'status': 'Pending...'}
    elif task.state == 'PROGRESS':
        response = {
            'state': task.state,
            'current': task.info.get('current', 0),
            'total': task.info.get('total', 100),
            'status': task.info.get('status', '')
        }
    elif task.state == 'SUCCESS':
        response = {
            'state': task.state,
            'result': task.result
        }
    else:
        response = {'state': task.state, 'status': str(task.info)}
    
    return JsonResponse(response)
"""

@shared_task(bind=True)
def run_comprehensive_analysis(self, data_points: list, model_type: str = None):
    import numpy as np
    from api.utils.regression_models import find_best_regression
    from api.utils.classification_models import find_best_classification
    
    self.update_state(state='PROGRESS', meta={'current': 10, 'total': 100, 'status': 'Loading data...'})
    
    self.update_state(state='PROGRESS', meta={'current': 30, 'total': 100, 'status': 'Training comprehensive models...'})
    
    y = np.array([p['y'] for p in data_points])
    unique_y = np.unique(y)
    
    if len(unique_y) <= 10 and np.all(y == y.astype(int)):
        result = find_best_classification(data_points)
        if not result:
            result = find_best_regression(data_points, model_type)
    else:
        result = find_best_regression(data_points, model_type)
    
    if not result:
        return {'error': 'Could not fit any model'}
        
    self.update_state(state='PROGRESS', meta={'current': 70, 'total': 100, 'status': 'Calculating predictions...'})
    
    # For multivariate, it's better to plot predicted vs actual, but for simplicity, 
    # we return predictions that the frontend can map.
    predictions = []
    y_actual = np.array([float(p["y"]) for p in data_points])
    
    x_raw = [p["x"] for p in data_points]
    if len(x_raw) > 0 and isinstance(x_raw[0], (list, tuple)):
        # Multivariate: x_val is a list of features
        X = np.array(x_raw)
        for i, x_val in enumerate(X):
            try:
                y_pred = result['predict'](x_val.tolist())
                if y_pred is not None and np.isfinite(y_pred):
                    predictions.append([float(y_actual[i]), float(y_pred)]) # [Actual, Predicted]
            except Exception:
                pass
    else:
        # Univariate: x_val is a single feature
        X = np.array([float(x) for x in x_raw])
        for x_val in X:
            try:
                y_pred = result['predict'](float(x_val))
                if y_pred is not None and np.isfinite(y_pred):
                    predictions.append([float(x_val), float(y_pred)]) # [X, Predicted]
            except Exception:
                pass
            
    response_data = {
        "model_name": result['model_name'],
        "model_type": result['model_type'],
        "equation": result['equation'],
        "r2": result['r2'],
        "adjusted_r2": result['adjusted_r2'],
        "rmse": result['rmse'],
        "mae": result['mae'],
        "coefficients": result.get('coefficients', []),
        "feature_names": result.get('feature_names', []),
        "predictions": predictions,
        "all_models_tested": result['all_models']
    }
    
    self.update_state(state='PROGRESS', meta={'current': 100, 'total': 100, 'status': 'Complete!'})
    return response_data
