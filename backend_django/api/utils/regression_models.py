import numpy as np
from typing import List, Dict, Tuple, Optional
import warnings
warnings.filterwarnings('ignore')

try:
    from sklearn.linear_model import LinearRegression, Ridge, Lasso, ElasticNet, QuantileRegressor
    from sklearn.preprocessing import PolynomialFeatures, StandardScaler
    from sklearn.tree import DecisionTreeRegressor
    from sklearn.ensemble import RandomForestRegressor
    from sklearn.svm import SVR
    from sklearn.metrics import r2_score, mean_squared_error, mean_absolute_error
    from sklearn.model_selection import cross_val_score
    SKLEARN_AVAILABLE = True
except ImportError:
    SKLEARN_AVAILABLE = False
    print('Warning: scikit-learn not available. Install with: pip install scikit-learn scipy')


def compute_r2(y_true, y_pred):
    ss_res = np.sum((y_true - y_pred) ** 2)
    ss_tot = np.sum((y_true - np.mean(y_true)) ** 2)
    return 1 - (ss_res / ss_tot) if ss_tot != 0 else 0


def compute_adjusted_r2(r2, n, p):
    if n <= p + 1:
        return -999.0
    return 1 - (1 - r2) * (n - 1) / (n - p - 1)


def compute_metrics(y_true, y_pred, n_params):
    n = len(y_true)
    r2 = compute_r2(y_true, y_pred)
    adjusted_r2 = compute_adjusted_r2(r2, n, n_params)
    mse = np.mean((y_true - y_pred) ** 2)
    rmse = np.sqrt(mse)
    mae = np.mean(np.abs(y_true - y_pred))
    return {'r2': r2, 'adjusted_r2': adjusted_r2, 'rmse': rmse, 'mae': mae, 'mse': mse}


class RegressionModelSelector:
    def __init__(self, data_points: List[Dict]):
        self.data_points = data_points
        x_raw = [p['x'] for p in data_points]
        if len(x_raw) > 0 and isinstance(x_raw[0], (list, tuple)):
            self.X = np.array(x_raw)
            self.n_features = self.X.shape[1]
        else:
            self.X = np.array(x_raw).reshape(-1, 1)
            self.n_features = 1
        self.y = np.array([p['y'] for p in data_points])
        self.n = len(self.y)
        self.models_tested = []
        self.best_model = None
        
    def _safe_predict(self, model, X):
        try:
            pred = model.predict(X)
            if np.any(np.isnan(pred)) or np.any(np.isinf(pred)):
                return None
            return pred
        except Exception:
            return None

    def _get_feature_names(self):
        return [f'x{i+1}' for i in range(self.n_features)]

    def _format_equation(self, model, name):
        if self.n_features == 1:
            try:
                return f'y = {model.coef_[0]:.4f}x + {model.intercept_:.4f} ({name})'
            except:
                return f'{name} Model'
        else:
            return f'Multivariate {name} ({self.n_features} features)'

    def _test_sklearn_linear(self):
        if not SKLEARN_AVAILABLE:
            return None
        model = LinearRegression()
        model.fit(self.X, self.y)
        y_pred = self._safe_predict(model, self.X)
        if y_pred is not None:
            metrics = compute_metrics(self.y, y_pred, self.n_features + 1)
            coefs = model.coef_.tolist() if hasattr(model, 'coef_') else []
            return {
                'name': 'Linear Regression' if self.n_features == 1 else 'Multivariate Linear Regression',
                'type': 'linear',
                'equation': self._format_equation(model, 'Linear'),
                'predict': lambda x, m=model: m.predict([x] if isinstance(x, (list, tuple)) else [[x]])[0],
                'metrics': metrics,
                'coefficients': coefs,
                'feature_names': self._get_feature_names(),
                'intercept': float(model.intercept_) if hasattr(model, 'intercept_') else 0.0
            }
        return None

    def _test_sklearn_ridge(self):
        if not SKLEARN_AVAILABLE:
            return []
        results = []
        for alpha in [0.1, 1.0, 10.0]:
            model = Ridge(alpha=alpha)
            model.fit(self.X, self.y)
            y_pred = self._safe_predict(model, self.X)
            if y_pred is not None:
                metrics = compute_metrics(self.y, y_pred, self.n_features + 1)
                coefs = model.coef_.tolist() if hasattr(model, 'coef_') else []
                results.append({
                    'name': f'Ridge Regression (α={alpha})',
                    'type': 'ridge',
                    'equation': self._format_equation(model, 'Ridge'),
                    'predict': lambda x, m=model: m.predict([x] if isinstance(x, (list, tuple)) else [[x]])[0],
                    'metrics': metrics,
                    'coefficients': coefs,
                    'feature_names': self._get_feature_names(),
                    'intercept': float(model.intercept_) if hasattr(model, 'intercept_') else 0.0
                })
        return results

    def _test_sklearn_rf(self):
        if not SKLEARN_AVAILABLE or self.n < 10:
            return None
        model = RandomForestRegressor(n_estimators=50, max_depth=5, random_state=42)
        model.fit(self.X, self.y)
        y_pred = self._safe_predict(model, self.X)
        if y_pred is not None:
            metrics = compute_metrics(self.y, y_pred, self.n_features + 1)
            coefs = model.feature_importances_.tolist() if hasattr(model, 'feature_importances_') else []
            return {
                'name': 'Random Forest Regressor',
                'type': 'random_forest',
                'equation': f'Random Forest ({self.n_features} features)',
                'predict': lambda x, m=model: m.predict([x] if isinstance(x, (list, tuple)) else [[x]])[0],
                'metrics': metrics,
                'coefficients': coefs,
                'feature_names': self._get_feature_names(),
                'intercept': 0.0
            }
        return None

    def find_best_model(self, force_model_type: str = None) -> Optional[Dict]:
        if self.n < 2:
            return None
            
        results = []
        
        lin = self._test_sklearn_linear()
        if lin: results.append(lin)
        
        results.extend(self._test_sklearn_ridge())
        
        rf = self._test_sklearn_rf()
        if rf: results.append(rf)
        
        if not results:
            return None
            
        # Filter if requested
        if force_model_type:
            filtered = [r for r in results if force_model_type.lower() in r['type'].lower()]
            if filtered:
                results = filtered
                
        # Sort by R2
        results.sort(key=lambda x: x['metrics']['r2'], reverse=True)
        best_model = results[0]
        
        # Prepare response
        return {
            'model_name': best_model['name'],
            'model_type': best_model['type'],
            'equation': best_model['equation'],
            'r2': best_model['metrics']['r2'],
            'adjusted_r2': best_model['metrics']['adjusted_r2'],
            'rmse': best_model['metrics']['rmse'],
            'mae': best_model['metrics']['mae'],
            'predict': best_model['predict'],
            'coefficients': best_model.get('coefficients', []),
            'feature_names': best_model.get('feature_names', []),
            'all_models': [
                {
                    'name': r['name'],
                    'r2': r['metrics']['r2'],
                    'rmse': r['metrics']['rmse'],
                    'mae': r['metrics']['mae']
                } for r in results
            ]
        }

def find_best_regression(data_points: List[Dict], force_model_type: str = None) -> Optional[Dict]:
    selector = RegressionModelSelector(data_points)
    return selector.find_best_model(force_model_type)

