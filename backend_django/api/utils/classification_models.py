import numpy as np
from typing import List, Dict

try:
    from sklearn.linear_model import LogisticRegression
    from sklearn.tree import DecisionTreeClassifier
    from sklearn.ensemble import RandomForestClassifier
    from sklearn.svm import SVC
    from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score
    SKLEARN_AVAILABLE = True
except ImportError:
    SKLEARN_AVAILABLE = False


def compute_classification_metrics(y_true, y_pred):
    return {
        'accuracy': float(accuracy_score(y_true, y_pred)),
        'precision': float(precision_score(y_true, y_pred, average='weighted', zero_division=0)),
        'recall': float(recall_score(y_true, y_pred, average='weighted', zero_division=0)),
        'f1': float(f1_score(y_true, y_pred, average='weighted', zero_division=0))
    }

class ClassificationModelSelector:
    def __init__(self, data_points: List[Dict]):
        self.data_points = data_points
        self.X = np.array([p['x'] for p in data_points]).reshape(-1, 1)
        self.y = np.array([p['y'] for p in data_points])
        self.n = len(self.y)

    def _safe_predict(self, model, X):
        try:
            return model.predict(X)
        except Exception:
            return None

    def find_best_model(self):
        if self.n < 2 or not SKLEARN_AVAILABLE:
            return None

        # Check if target is discrete
        unique_y = np.unique(self.y)
        if len(unique_y) > 10 and not np.all(self.y == self.y.astype(int)):
            # Too many unique values, probably continuous
            return None

        results = []
        
        # Logistic Regression
        try:
            model = LogisticRegression(max_iter=1000)
            model.fit(self.X, self.y)
            y_pred = self._safe_predict(model, self.X)
            if y_pred is not None:
                metrics = compute_classification_metrics(self.y, y_pred)
                results.append({
                    'name': 'Logistic Regression',
                    'type': 'logistic_regression',
                    'equation': 'Logistic Function',
                    'predict': lambda x, m=model: float(m.predict([[x]])[0]),
                    'metrics': metrics,
                    'score': metrics['accuracy']
                })
        except Exception:
            pass

        # Decision Tree
        try:
            model = DecisionTreeClassifier(max_depth=5, random_state=42)
            model.fit(self.X, self.y)
            y_pred = self._safe_predict(model, self.X)
            if y_pred is not None:
                metrics = compute_classification_metrics(self.y, y_pred)
                results.append({
                    'name': 'Decision Tree Classifier',
                    'type': 'decision_tree_classifier',
                    'equation': 'Decision Tree rules',
                    'predict': lambda x, m=model: float(m.predict([[x]])[0]),
                    'metrics': metrics,
                    'score': metrics['accuracy']
                })
        except Exception:
            pass

        # Random Forest
        try:
            model = RandomForestClassifier(n_estimators=50, max_depth=5, random_state=42)
            model.fit(self.X, self.y)
            y_pred = self._safe_predict(model, self.X)
            if y_pred is not None:
                metrics = compute_classification_metrics(self.y, y_pred)
                results.append({
                    'name': 'Random Forest Classifier',
                    'type': 'random_forest_classifier',
                    'equation': 'Random Forest rules',
                    'predict': lambda x, m=model: float(m.predict([[x]])[0]),
                    'metrics': metrics,
                    'score': metrics['accuracy']
                })
        except Exception:
            pass

        if not results:
            return None

        results.sort(key=lambda x: x['score'], reverse=True)
        best_model = results[0]
        
        return {
            'model_name': best_model['name'],
            'model_type': best_model['type'],
            'equation': best_model['equation'],
            'r2': best_model['metrics']['accuracy'], # Map accuracy to R2 for frontend compatibility
            'adjusted_r2': best_model['metrics']['f1'], # Map f1 to adj r2
            'rmse': 0, # Not applicable
            'mae': 0, # Not applicable
            'predict': best_model['predict'],
            'all_models': [
                {
                    'name': r['name'],
                    'r2': r['metrics']['accuracy'],
                    'rmse': 0,
                    'mae': 0
                } for r in results
            ]
        }

def find_best_classification(data_points: List[Dict]):
    selector = ClassificationModelSelector(data_points)
    return selector.find_best_model()

