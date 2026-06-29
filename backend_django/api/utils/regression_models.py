"""
Comprehensive regression model utilities for automatic model selection.
Supports various regression types and automatically selects the best model.
"""

import numpy as np
from typing import List, Dict, Tuple, Optional
import warnings
warnings.filterwarnings('ignore')

# Try to import sklearn libraries
try:
    from sklearn.linear_model import (
        LinearRegression, Ridge, Lasso, ElasticNet, 
        QuantileRegressor
    )
    from sklearn.preprocessing import PolynomialFeatures, StandardScaler
    from sklearn.tree import DecisionTreeRegressor
    from sklearn.ensemble import RandomForestRegressor
    from sklearn.svm import SVR
    from sklearn.metrics import r2_score, mean_squared_error, mean_absolute_error
    from sklearn.model_selection import cross_val_score
    SKLEARN_AVAILABLE = True
except ImportError:
    SKLEARN_AVAILABLE = False
    print("Warning: scikit-learn not available. Install with: pip install scikit-learn scipy")


def compute_r2(y_true, y_pred):
    """Calculate R-squared score."""
    ss_res = np.sum((y_true - y_pred) ** 2)
    ss_tot = np.sum((y_true - np.mean(y_true)) ** 2)
    return 1 - (ss_res / ss_tot) if ss_tot != 0 else 0


def compute_adjusted_r2(r2, n, p):
    """Calculate adjusted R-squared."""
    if n <= p + 1:
        return -999.0
    return 1 - (1 - r2) * (n - 1) / (n - p - 1)


def compute_metrics(y_true, y_pred, n_params):
    """Calculate comprehensive metrics for a model."""
    n = len(y_true)
    r2 = compute_r2(y_true, y_pred)
    adjusted_r2 = compute_adjusted_r2(r2, n, n_params)
    
    mse = np.mean((y_true - y_pred) ** 2)
    rmse = np.sqrt(mse)
    mae = np.mean(np.abs(y_true - y_pred))
    
    return {
        'r2': r2,
        'adjusted_r2': adjusted_r2,
        'rmse': rmse,
        'mae': mae,
        'mse': mse
    }


class RegressionModelSelector:
    """
    Automatically selects the best regression model from a comprehensive set.
    """
    
    def __init__(self, data_points: List[Dict]):
        """
        Initialize with data points.
        
        Args:
            data_points: List of dicts with 'x' and 'y' keys
        """
        self.data_points = data_points
        self.X = np.array([p['x'] for p in data_points]).reshape(-1, 1)
        self.y = np.array([p['y'] for p in data_points])
        self.n = len(self.y)
        self.models_tested = []
        self.best_model = None
        
    def _fit_and_predict_fold(self, model_type: str, params: Dict, X_train, y_train, X_val):
        """Fit model on training fold and predict on validation fold."""
        n_train = len(y_train)
        try:
            if model_type == 'linear':
                x_mean = np.mean(X_train)
                y_mean = np.mean(y_train)
                numerator = np.sum((X_train.flatten() - x_mean) * (y_train - y_mean))
                denominator = np.sum((X_train.flatten() - x_mean) ** 2)
                if denominator == 0:
                    return None
                slope = numerator / denominator
                intercept = y_mean - slope * x_mean
                return slope * X_val.flatten() + intercept
                
            elif model_type.startswith('polynomial-'):
                degree = int(model_type.split('-')[1])
                if n_train <= degree + 1:
                    return None
                coeffs = np.polyfit(X_train.flatten(), y_train, degree)
                poly = np.poly1d(coeffs)
                return poly(X_val.flatten())
                
            elif model_type == 'logarithmic':
                if np.any(X_train <= 0) or np.any(X_val <= 0):
                    return None
                X_train_log = np.log(X_train)
                x_mean = np.mean(X_train_log)
                y_mean = np.mean(y_train)
                numerator = np.sum((X_train_log.flatten() - x_mean) * (y_train - y_mean))
                denominator = np.sum((X_train_log.flatten() - x_mean) ** 2)
                if denominator == 0:
                    return None
                a = numerator / denominator
                b = y_mean - a * x_mean
                return a * np.log(X_val.flatten()) + b
                
            elif model_type == 'exponential':
                if np.any(y_train <= 0):
                    return None
                y_train_log = np.log(y_train)
                x_mean = np.mean(X_train)
                y_log_mean = np.mean(y_train_log)
                numerator = np.sum((X_train.flatten() - x_mean) * (y_train_log - y_log_mean))
                denominator = np.sum((X_train.flatten() - x_mean) ** 2)
                if denominator == 0:
                    return None
                b = numerator / denominator
                ln_a = y_log_mean - b * x_mean
                a = np.exp(ln_a)
                return a * np.exp(b * X_val.flatten())
                
            elif model_type == 'power':
                if np.any(X_train <= 0) or np.any(y_train <= 0) or np.any(X_val <= 0):
                    return None
                X_train_log = np.log(X_train)
                y_train_log = np.log(y_train)
                x_mean = np.mean(X_train_log)
                y_mean = np.mean(y_train_log)
                numerator = np.sum((X_train_log.flatten() - x_mean) * (y_train_log - y_mean))
                denominator = np.sum((X_train_log.flatten() - x_mean) ** 2)
                if denominator == 0:
                    return None
                b = numerator / denominator
                ln_a = y_mean - b * x_mean
                a = np.exp(ln_a)
                return a * np.power(X_val.flatten(), b)
                
            # Sklearn models
            elif SKLEARN_AVAILABLE:
                if model_type == 'ridge':
                    from sklearn.linear_model import Ridge
                    model = Ridge(alpha=params.get('alpha', 1.0))
                    model.fit(X_train, y_train)
                    return model.predict(X_val)
                    
                elif model_type == 'lasso':
                    from sklearn.linear_model import Lasso
                    model = Lasso(alpha=params.get('alpha', 1.0), max_iter=5000)
                    model.fit(X_train, y_train)
                    return model.predict(X_val)
                    
                elif model_type == 'elasticnet':
                    from sklearn.linear_model import ElasticNet
                    model = ElasticNet(alpha=0.1, l1_ratio=0.5, max_iter=5000)
                    model.fit(X_train, y_train)
                    return model.predict(X_val)
                    
                elif model_type == 'svr':
                    from sklearn.preprocessing import StandardScaler
                    from sklearn.svm import SVR
                    scaler = StandardScaler()
                    X_train_scaled = scaler.fit_transform(X_train)
                    X_val_scaled = scaler.transform(X_val)
                    model = SVR(kernel=params.get('kernel', 'rbf'), C=1.0, epsilon=0.1)
                    model.fit(X_train_scaled, y_train)
                    return model.predict(X_val_scaled)
                    
                elif model_type == 'decision_tree':
                    from sklearn.tree import DecisionTreeRegressor
                    model = DecisionTreeRegressor(max_depth=5, random_state=42)
                    model.fit(X_train, y_train)
                    return model.predict(X_val)
                    
                elif model_type == 'random_forest':
                    from sklearn.ensemble import RandomForestRegressor
                    model = RandomForestRegressor(n_estimators=50, max_depth=5, random_state=42)
                    model.fit(X_train, y_train)
                    return model.predict(X_val)
                    
                elif model_type == 'quantile':
                    from sklearn.linear_model import QuantileRegressor
                    model = QuantileRegressor(quantile=0.5, alpha=0, solver='highs')
                    model.fit(X_train, y_train)
                    return model.predict(X_val)
            
            return None
        except Exception as e:
            return None

    def _get_cv_predictions(self, model_type: str, params: Dict) -> Optional[np.ndarray]:
        """
        Compute out-of-fold predictions for a given model type and its parameters.
        """
        if self.n < 4:
            # Not enough data for cross-validation
            return None
        
        k = min(5, self.n)
        indices = np.arange(self.n)
        # Deterministic shuffle using a fixed generator seed
        rng = np.random.default_rng(42)
        shuffled_indices = rng.permutation(indices)
        
        folds = np.array_split(shuffled_indices, k)
        y_pred_cv = np.zeros(self.n)
        
        for i in range(k):
            val_idx = folds[i]
            train_idx = np.hstack([folds[j] for j in range(k) if j != i])
            
            X_train, y_train = self.X[train_idx], self.y[train_idx]
            X_val = self.X[val_idx]
            
            pred_val = self._fit_and_predict_fold(model_type, params, X_train, y_train, X_val)
            if pred_val is None:
                return None
            y_pred_cv[val_idx] = pred_val
            
        return y_pred_cv

    def _safe_predict(self, model, X):
        """Safely predict values, handling errors."""
        try:
            pred = model.predict(X)
            # Check for invalid predictions
            if np.any(np.isnan(pred)) or np.any(np.isinf(pred)):
                return None
            return pred
        except Exception as e:
            return None
    
    def _test_simple_linear(self):
        """Test simple linear regression: y = mx + b"""
        try:
            # Manual calculation for simple linear regression
            x_mean = np.mean(self.X)
            y_mean = np.mean(self.y)
            
            numerator = np.sum((self.X.flatten() - x_mean) * (self.y - y_mean))
            denominator = np.sum((self.X.flatten() - x_mean) ** 2)
            
            if denominator == 0:
                return None
                
            slope = numerator / denominator
            intercept = y_mean - slope * x_mean
            
            y_pred = slope * self.X.flatten() + intercept
            metrics = compute_metrics(self.y, y_pred, 2)  # 2 parameters: slope, intercept
            
            return {
                'name': 'Linear Regression',
                'type': 'linear',
                'equation': f'y = {slope:.4f}x + {intercept:.4f}',
                'predict': lambda x: slope * x + intercept,
                'metrics': metrics,
                'params': {'slope': slope, 'intercept': intercept}
            }
        except Exception as e:
            return None
    
    def _test_polynomial(self, degree: int):
        """Test polynomial regression of given degree."""
        try:
            # Fit polynomial
            coeffs = np.polyfit(self.X.flatten(), self.y, degree)
            poly = np.poly1d(coeffs)
            
            y_pred = poly(self.X.flatten())
            metrics = compute_metrics(self.y, y_pred, degree + 1)
            
            # Generate equation string
            terms = []
            for i, coef in enumerate(coeffs):
                power = degree - i
                if power == 0:
                    terms.append(f'{coef:.4f}')
                elif power == 1:
                    terms.append(f'{coef:.4f}x')
                else:
                    terms.append(f'{coef:.4f}x^{power}')
            equation = ' + '.join(terms).replace('+ -', '- ')
            
            return {
                'name': f'Polynomial Regression (Degree {degree})',
                'type': f'polynomial-{degree}',
                'equation': equation,
                'predict': lambda x: poly(x),
                'metrics': metrics,
                'params': {'coefficients': coeffs.tolist()}
            }
        except Exception as e:
            return None
    
    def _test_logarithmic(self):
        """Test logarithmic regression: y = a * ln(x) + b"""
        try:
            # Check for positive X values
            if np.any(self.X <= 0):
                return None
            
            X_log = np.log(self.X)
            
            # Fit linear model on log-transformed X
            x_mean = np.mean(X_log)
            y_mean = np.mean(self.y)
            
            numerator = np.sum((X_log.flatten() - x_mean) * (self.y - y_mean))
            denominator = np.sum((X_log.flatten() - x_mean) ** 2)
            
            if denominator == 0:
                return None
            
            a = numerator / denominator
            b = y_mean - a * x_mean
            
            y_pred = a * X_log.flatten() + b
            metrics = compute_metrics(self.y, y_pred, 2)
            
            return {
                'name': 'Logarithmic Regression',
                'type': 'logarithmic',
                'equation': f'y = {a:.4f} * ln(x) + {b:.4f}',
                'predict': lambda x: a * np.log(x) + b if x > 0 else None,
                'metrics': metrics,
                'params': {'a': a, 'b': b}
            }
        except Exception as e:
            return None
    
    def _test_exponential(self):
        """Test exponential regression: y = a * e^(bx)"""
        try:
            # Check for positive Y values
            if np.any(self.y <= 0):
                return None
            
            y_log = np.log(self.y)
            
            # Fit linear model on log-transformed Y
            x_mean = np.mean(self.X)
            y_log_mean = np.mean(y_log)
            
            numerator = np.sum((self.X.flatten() - x_mean) * (y_log - y_log_mean))
            denominator = np.sum((self.X.flatten() - x_mean) ** 2)
            
            if denominator == 0:
                return None
            
            b = numerator / denominator
            ln_a = y_log_mean - b * x_mean
            a = np.exp(ln_a)
            
            y_pred = a * np.exp(b * self.X.flatten())
            metrics = compute_metrics(self.y, y_pred, 2)
            
            return {
                'name': 'Exponential Regression',
                'type': 'exponential',
                'equation': f'y = {a:.4f} * e^({b:.4f}x)',
                'predict': lambda x: a * np.exp(b * x),
                'metrics': metrics,
                'params': {'a': a, 'b': b}
            }
        except Exception as e:
            return None
    
    def _test_power(self):
        """Test power regression: y = ax^b"""
        try:
            # Check for positive X and Y values
            if np.any(self.X <= 0) or np.any(self.y <= 0):
                return None
            
            X_log = np.log(self.X)
            y_log = np.log(self.y)
            
            # Fit linear model on log-transformed data
            x_mean = np.mean(X_log)
            y_mean = np.mean(y_log)
            
            numerator = np.sum((X_log.flatten() - x_mean) * (y_log - y_mean))
            denominator = np.sum((X_log.flatten() - x_mean) ** 2)
            
            if denominator == 0:
                return None
            
            b = numerator / denominator
            ln_a = y_mean - b * x_mean
            a = np.exp(ln_a)
            
            y_pred = a * np.power(self.X.flatten(), b)
            metrics = compute_metrics(self.y, y_pred, 2)
            
            return {
                'name': 'Power Regression',
                'type': 'power',
                'equation': f'y = {a:.4f} * x^{b:.4f}',
                'predict': lambda x: a * np.power(x, b) if x > 0 else None,
                'metrics': metrics,
                'params': {'a': a, 'b': b}
            }
        except Exception as e:
            return None
    
    def _test_sklearn_models(self):
        """Test advanced sklearn-based models."""
        if not SKLEARN_AVAILABLE or self.n < 10:  # Need at least 10 points for advanced models
            return []
        
        results = []
        
        # Standardize features for some models
        scaler = StandardScaler()
        X_scaled = scaler.fit_transform(self.X)
        
        # Ridge Regression
        try:
            for alpha in [0.1, 1.0, 10.0]:
                model = Ridge(alpha=alpha)
                model.fit(self.X, self.y)
                y_pred = self._safe_predict(model, self.X)
                if y_pred is not None:
                    metrics = compute_metrics(self.y, y_pred, 2)
                    results.append({
                        'name': f'Ridge Regression (α={alpha})',
                        'type': 'ridge',
                        'equation': f'y = {model.coef_[0]:.4f}x + {model.intercept_:.4f} (Ridge)',
                        'predict': lambda x, m=model: m.predict([[x]])[0],
                        'metrics': metrics,
                        'params': {'alpha': alpha}
                    })
        except:
            pass
        
        # Lasso Regression
        try:
            for alpha in [0.01, 0.1, 1.0]:
                model = Lasso(alpha=alpha, max_iter=5000)
                model.fit(self.X, self.y)
                y_pred = self._safe_predict(model, self.X)
                if y_pred is not None:
                    metrics = compute_metrics(self.y, y_pred, 2)
                    results.append({
                        'name': f'Lasso Regression (α={alpha})',
                        'type': 'lasso',
                        'equation': f'y = {model.coef_[0]:.4f}x + {model.intercept_:.4f} (Lasso)',
                        'predict': lambda x, m=model: m.predict([[x]])[0],
                        'metrics': metrics,
                        'params': {'alpha': alpha}
                    })
        except:
            pass
        
        # Elastic Net
        try:
            model = ElasticNet(alpha=0.1, l1_ratio=0.5, max_iter=5000)
            model.fit(self.X, self.y)
            y_pred = self._safe_predict(model, self.X)
            if y_pred is not None:
                metrics = compute_metrics(self.y, y_pred, 2)
                results.append({
                    'name': 'Elastic Net Regression',
                    'type': 'elasticnet',
                    'equation': f'y = {model.coef_[0]:.4f}x + {model.intercept_:.4f} (ElasticNet)',
                    'predict': lambda x, m=model: m.predict([[x]])[0],
                    'metrics': metrics,
                    'params': {}
                })
        except:
            pass
        
        # Support Vector Regression
        try:
            for kernel in ['rbf', 'linear']:
                model = SVR(kernel=kernel, C=1.0, epsilon=0.1)
                model.fit(X_scaled, self.y)
                y_pred = self._safe_predict(model, X_scaled)
                if y_pred is not None:
                    metrics = compute_metrics(self.y, y_pred, 3)
                    results.append({
                        'name': f'Support Vector Regression ({kernel})',
                        'type': 'svr',
                        'equation': f'SVR with {kernel} kernel',
                        'predict': lambda x, m=model, s=scaler: m.predict(s.transform([[x]]))[0],
                        'metrics': metrics,
                        'params': {'kernel': kernel}
                    })
        except:
            pass
        
        # Decision Tree Regression
        try:
            model = DecisionTreeRegressor(max_depth=5, random_state=42)
            model.fit(self.X, self.y)
            y_pred = self._safe_predict(model, self.X)
            if y_pred is not None:
                metrics = compute_metrics(self.y, y_pred, 5)
                results.append({
                    'name': 'Decision Tree Regression',
                    'type': 'decision_tree',
                    'equation': 'Decision Tree Model',
                    'predict': lambda x, m=model: m.predict([[x]])[0],
                    'metrics': metrics,
                    'params': {}
                })
        except:
            pass
        
        # Random Forest Regression
        try:
            model = RandomForestRegressor(n_estimators=50, max_depth=5, random_state=42)
            model.fit(self.X, self.y)
            y_pred = self._safe_predict(model, self.X)
            if y_pred is not None:
                metrics = compute_metrics(self.y, y_pred, 10)
                results.append({
                    'name': 'Random Forest Regression',
                    'type': 'random_forest',
                    'equation': 'Random Forest Model',
                    'predict': lambda x, m=model: m.predict([[x]])[0],
                    'metrics': metrics,
                    'params': {}
                })
        except:
            pass
        
        # Quantile Regression (Median)
        try:
            model = QuantileRegressor(quantile=0.5, alpha=0, solver='highs')
            model.fit(self.X, self.y)
            y_pred = self._safe_predict(model, self.X)
            if y_pred is not None:
                metrics = compute_metrics(self.y, y_pred, 2)
                results.append({
                    'name': 'Quantile Regression (Median)',
                    'type': 'quantile',
                    'equation': f'y = {model.coef_[0]:.4f}x + {model.intercept_:.4f} (Quantile)',
                    'predict': lambda x, m=model: m.predict([[x]])[0],
                    'metrics': metrics,
                    'params': {'quantile': 0.5}
                })
        except:
            pass
        
        return results
    
    def find_best_model(self):
        """
        Test all regression models and return the best one.
        
        Returns:
            dict: Best model information including equation, metrics, and predict function
        """
        if self.n < 2:
            return None
        
        # Test basic models
        models = []
        
        # Simple linear
        linear = self._test_simple_linear()
        if linear:
            models.append(linear)
        
        # Polynomial (degrees 2-6)
        for degree in range(2, 7):
            if self.n > degree + 1:  # Need more points than parameters
                poly = self._test_polynomial(degree)
                if poly:
                    models.append(poly)
        
        # Logarithmic
        log = self._test_logarithmic()
        if log:
            models.append(log)
        
        # Exponential
        exp = self._test_exponential()
        if exp:
            models.append(exp)
        
        # Power
        power = self._test_power()
        if power:
            models.append(power)
        
        # Advanced sklearn models (if available and enough data)
        sklearn_models = self._test_sklearn_models()
        models.extend(sklearn_models)
        
        # Store all tested models
        self.models_tested = models
        
        if not models:
            return None
            
        # Compute cross-validation metrics for each model
        for m in models:
            if self.n < 4:
                # Fallback if CV is not possible (e.g. self.n is too small)
                m['cv_adjusted_r2'] = m['metrics']['adjusted_r2']
                m['cv_r2'] = m['metrics']['r2']
            else:
                y_pred_cv = self._get_cv_predictions(m['type'], m.get('params', {}))
                if y_pred_cv is not None:
                    cv_r2 = compute_r2(self.y, y_pred_cv)
                    # Find number of parameters based on model type
                    n_params = 2  # default
                    if m['type'].startswith('polynomial-'):
                        degree = int(m['type'].split('-')[1])
                        n_params = degree + 1
                    elif m['type'] == 'svr':
                        n_params = 3
                    elif m['type'] == 'decision_tree':
                        n_params = 5
                    elif m['type'] == 'random_forest':
                        n_params = 10
                    
                    cv_adj_r2 = compute_adjusted_r2(cv_r2, self.n, n_params)
                    
                    # Apply complexity penalty for tree models on small N
                    if m['type'] in ['decision_tree', 'random_forest']:
                        if self.n < 30:
                            penalty = 0.2 * (1.0 - self.n / 30.0)
                            cv_adj_r2 -= penalty
                    
                    m['cv_adjusted_r2'] = cv_adj_r2
                    m['cv_r2'] = cv_r2
                else:
                    # Heavily penalize models that fail CV due to overfitting/insufficient data
                    m['cv_adjusted_r2'] = -999.0
                    m['cv_r2'] = -999.0
        
        # Select best model based on cv_adjusted_r2
        best = max(models, key=lambda m: m.get('cv_adjusted_r2', m['metrics']['adjusted_r2']))
        self.best_model = best
        
        return best
    
    def get_all_models_summary(self):
        """Get summary of all tested models sorted by CV adjusted R²."""
        if not self.models_tested:
            return []
        
        sorted_models = sorted(
            self.models_tested, 
            key=lambda m: m.get('cv_adjusted_r2', m['metrics']['adjusted_r2']), 
            reverse=True
        )
        
        return [{
            'name': m['name'],
            'type': m['type'],
            'r2': m['metrics']['r2'],
            'adjusted_r2': m['metrics']['adjusted_r2'],
            'cv_r2': m.get('cv_r2', m['metrics']['r2']),
            'cv_adjusted_r2': m.get('cv_adjusted_r2', m['metrics']['adjusted_r2']),
            'rmse': m['metrics']['rmse'],
            'mae': m['metrics']['mae']
        } for m in sorted_models]


def find_best_regression(data_points: List[Dict], requested_type: Optional[str] = None) -> Optional[Dict]:
    """
    Main function to find the best regression model or a specific requested model for given data.
    
    Args:
        data_points: List of dictionaries with 'x' and 'y' keys
        requested_type: Optional string specifying the type of regression model to retrieve
        
    Returns:
        Dictionary with model information, or None if no valid model found
    """
    selector = RegressionModelSelector(data_points)
    best_model = selector.find_best_model()
    
    selected_model = None
    if requested_type:
        for model in selector.models_tested:
            if model['type'] == requested_type:
                selected_model = model
                break
                
    if not selected_model:
        selected_model = best_model
        
    if not selected_model:
        return None
    
    # Calculate residuals for the selected model
    X = np.array([p['x'] for p in data_points])
    y_actual = np.array([p['y'] for p in data_points])
    
    # Get predictions from the model
    if 'model' in selected_model and selected_model['model'] is not None:
        # For sklearn models
        try:
            X_input = X.reshape(-1, 1)
            if selected_model.get('scaler'):
                X_input = selected_model['scaler'].transform(X_input)
            if selected_model.get('poly_features'):
                X_input = selected_model['poly_features'].transform(X_input)
            y_predicted = selected_model['model'].predict(X_input)
        except:
            y_predicted = np.array([selected_model['predict'](x) for x in X])
    else:
        # For custom models with predict function
        y_predicted = np.array([selected_model['predict'](x) for x in X])
    
    # Calculate residuals
    residuals = y_actual - y_predicted
    
    # Return formatted result
    return {
        'model_name': selected_model['name'],
        'model_type': selected_model['type'],
        'equation': selected_model['equation'],
        'r2': float(selected_model['metrics']['r2']),
        'adjusted_r2': float(selected_model['metrics']['adjusted_r2']),
        'cv_r2': float(selected_model.get('cv_r2', selected_model['metrics']['r2'])),
        'cv_adjusted_r2': float(selected_model.get('cv_adjusted_r2', selected_model['metrics']['adjusted_r2'])),
        'rmse': float(selected_model['metrics']['rmse']),
        'mae': float(selected_model['metrics']['mae']),
        'predict': selected_model['predict'],  # Function for predictions
        'all_models': selector.get_all_models_summary(),
        # Residual analysis data
        'actual': y_actual.tolist(),
        'predicted': y_predicted.tolist(),
        'residuals': residuals.tolist(),
        'residual_stats': {
            'mean': float(np.mean(residuals)),
            'std': float(np.std(residuals)),
            'min': float(np.min(residuals)),
            'max': float(np.max(residuals))
        }
    }
