"""
Code Generation Utilities for Model Export
Generates Python code snippets that users can copy and use in their own projects.
"""
from typing import List, Dict, Any


def generate_regression_code(
    model_type: str,
    features: List[str],
    target: str,
    hyperparameters: Dict[str, Any] = None,
    test_size: float = 0.2,
    random_state: int = 42
) -> str:
    """
    Generate Python code snippet for regression models.
    
    Args:
        model_type: Type of model ('linear', 'ridge', 'lasso', 'random_forest', 'svr', 'polynomial')
        features: List of feature column names
        target: Target column name
        hyperparameters: Model-specific parameters
        test_size: Train-test split ratio
        random_state: Random seed for reproducibility
        
    Returns:
        Formatted Python code as string
    """
    hyperparameters = hyperparameters or {}
    
    # Format feature list for code
    features_str = repr(features)
    
    # Model-specific imports and initialization
    model_configs = {
        'linear': {
            'import': 'from sklearn.linear_model import LinearRegression',
            'init': 'LinearRegression()',
            'description': 'Simple Linear Regression'
        },
        'ridge': {
            'import': 'from sklearn.linear_model import Ridge',
            'init': f'Ridge(alpha={hyperparameters.get("alpha", 1.0)})',
            'description': 'Ridge Regression (L2 Regularization)'
        },
        'lasso': {
            'import': 'from sklearn.linear_model import Lasso',
            'init': f'Lasso(alpha={hyperparameters.get("alpha", 1.0)})',
            'description': 'Lasso Regression (L1 Regularization)'
        },
        'random_forest': {
            'import': 'from sklearn.ensemble import RandomForestRegressor',
            'init': f'RandomForestRegressor(n_estimators={hyperparameters.get("n_estimators", 100)}, random_state={random_state})',
            'description': 'Random Forest Regressor'
        },
        'svr': {
            'import': 'from sklearn.svm import SVR',
            'init': f'SVR(kernel="{hyperparameters.get("kernel", "rbf")}", C={hyperparameters.get("C", 1.0)})',
            'description': 'Support Vector Regression'
        },
        'polynomial': {
            'import': 'from sklearn.linear_model import LinearRegression\nfrom sklearn.preprocessing import PolynomialFeatures',
            'init': f'LinearRegression()',
            'description': f'Polynomial Regression (degree={hyperparameters.get("degree", 2)})',
            'polynomial': True,
            'degree': hyperparameters.get('degree', 2)
        }
    }
    
    config = model_configs.get(model_type, model_configs['linear'])
    
    # Generate base code
    code = f'''"""
{config['description']}
Generated from DataViz Analytics Platform
"""

import pandas as pd
import numpy as np
{config['import']}
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, r2_score, mean_absolute_error

# ============================================================
# 1. Load Data
# ============================================================
df = pd.read_csv('your_data.csv')

# Features and Target
X = df{features_str}
y = df['{target}']

print(f"Dataset shape: {{X.shape}}")
print(f"Features: {', '.join(features)}")
print(f"Target: {target}")

# ============================================================
# 2. Train-Test Split
# ============================================================
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size={test_size}, random_state={random_state}
)

print(f"Training set: {{X_train.shape[0]}} samples")
print(f"Test set: {{X_test.shape[0]}} samples")
'''

    # Add polynomial feature transformation if needed
    if config.get('polynomial'):
        code += f'''
# ============================================================
# 3. Polynomial Feature Transformation
# ============================================================
poly = PolynomialFeatures(degree={config['degree']})
X_train_poly = poly.fit_transform(X_train)
X_test_poly = poly.transform(X_test)

print(f"Polynomial features: {{X_train_poly.shape[1]}} (degree={config['degree']})")
'''
    
    # Model training
    if config.get('polynomial'):
        code += f'''
# ============================================================
# 4. Train Model
# ============================================================
model = {config['init']}
model.fit(X_train_poly, y_train)

# Make predictions
y_pred_train = model.predict(X_train_poly)
y_pred_test = model.predict(X_test_poly)
'''
    else:
        code += f'''
# ============================================================
# 3. Train Model
# ============================================================
model = {config['init']}
model.fit(X_train, y_train)

# Make predictions
y_pred_train = model.predict(X_train)
y_pred_test = model.predict(X_test)
'''
    
    # Evaluation metrics
    code += '''
# ============================================================
# Evaluation Metrics
# ============================================================
train_r2 = r2_score(y_train, y_pred_train)
test_r2 = r2_score(y_test, y_pred_test)
test_rmse = np.sqrt(mean_squared_error(y_test, y_pred_test))
test_mae = mean_absolute_error(y_test, y_pred_test)

print("\\n" + "="*50)
print("MODEL PERFORMANCE")
print("="*50)
print(f"Training R² Score: {train_r2:.4f}")
print(f"Test R² Score: {test_r2:.4f}")
print(f"Test RMSE: {test_rmse:.4f}")
print(f"Test MAE: {test_mae:.4f}")

# ============================================================
# Residual Analysis
# ============================================================
residuals = y_test - y_pred_test
print(f"\\nMean Residual: {residuals.mean():.4f}")
print(f"Residual Std Dev: {residuals.std():.4f}")

# ============================================================
# Save Model (Optional)
# ============================================================
# import joblib
# joblib.dump(model, 'trained_model.pkl')
# print("\\nModel saved to 'trained_model.pkl'")

# ============================================================
# Make Predictions on New Data
# ============================================================
# new_data = pd.DataFrame({
'''
    
    # Add example prediction data
    for feature in features:
        code += f"#     '{feature}': [value],\n"
    
    code += '''# })
# predictions = model.predict(new_data)
# print(f"\\nPredictions: {predictions}")
'''
    
    return code


def generate_classification_code(
    model_type: str,
    features: List[str],
    target: str,
    hyperparameters: Dict[str, Any] = None
) -> str:
    """Generate code for classification models (future feature)."""
    return "# Classification code generation coming soon!"


def generate_eda_code(columns: List[str]) -> str:
    """
    Generate exploratory data analysis code.
    
    Args:
        columns: List of column names
        
    Returns:
        EDA code snippet
    """
    return f'''"""
Exploratory Data Analysis (EDA)
Generated from DataViz Analytics Platform
"""

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns

# ============================================================
# Load Data
# ============================================================
df = pd.read_csv('your_data.csv')

# ============================================================
# Basic Information
# ============================================================
print("Dataset Shape:", df.shape)
print("\\nColumn Names:")
print(df.columns.tolist())

print("\\nData Types:")
print(df.dtypes)

print("\\nMissing Values:")
print(df.isnull().sum())

print("\\nBasic Statistics:")
print(df.describe())

# ============================================================
# Correlation Analysis
# ============================================================
numeric_cols = df.select_dtypes(include=[np.number]).columns
correlation_matrix = df[numeric_cols].corr()

plt.figure(figsize=(10, 8))
sns.heatmap(correlation_matrix, annot=True, cmap='coolwarm', center=0)
plt.title('Correlation Heatmap')
plt.tight_layout()
plt.savefig('correlation_heatmap.png')
print("\\nCorrelation heatmap saved to 'correlation_heatmap.png'")

# ============================================================
# Distribution Plots
# ============================================================
fig, axes = plt.subplots(len(numeric_cols)//3 + 1, 3, figsize=(15, 10))
axes = axes.flatten()

for idx, col in enumerate(numeric_cols):
    axes[idx].hist(df[col].dropna(), bins=30, edgecolor='black')
    axes[idx].set_title(f'Distribution of {{col}}')
    axes[idx].set_xlabel(col)
    axes[idx].set_ylabel('Frequency')

plt.tight_layout()
plt.savefig('distributions.png')
print("Distribution plots saved to 'distributions.png'")
'''


def generate_data_cleaning_code(
    cleaning_method: str = 'drop',
    missing_columns: List[str] = None
) -> str:
    """
    Generate data cleaning code snippet.
    
    Args:
        cleaning_method: Method to handle missing values
        missing_columns: Columns with missing values
        
    Returns:
        Data cleaning code
    """
    missing_columns = missing_columns or []
    
    code = '''"""
Data Cleaning Pipeline
Generated from DataViz Analytics Platform
"""

import pandas as pd
import numpy as np

# ============================================================
# Load Data
# ============================================================
df = pd.read_csv('your_data.csv')

print(f"Original shape: {df.shape}")
print(f"Missing values:\\n{df.isnull().sum()}")

# ============================================================
# Handle Missing Values
# ============================================================
'''
    
    if cleaning_method == 'drop':
        code += '''# Drop rows with missing values
df_cleaned = df.dropna()
'''
    elif cleaning_method == 'mean':
        code += '''# Fill missing values with column mean (numeric columns only)
numeric_cols = df.select_dtypes(include=[np.number]).columns
df_cleaned = df.copy()
df_cleaned[numeric_cols] = df_cleaned[numeric_cols].fillna(df[numeric_cols].mean())
'''
    elif cleaning_method == 'median':
        code += '''# Fill missing values with column median (numeric columns only)
numeric_cols = df.select_dtypes(include=[np.number]).columns
df_cleaned = df.copy()
df_cleaned[numeric_cols] = df_cleaned[numeric_cols].fillna(df[numeric_cols].median())
'''
    else:
        code += f"# Method: {cleaning_method}\n"
    
    code += '''
# ============================================================
# Remove Duplicates
# ============================================================
df_cleaned = df_cleaned.drop_duplicates()

print(f"\\nCleaned shape: {df_cleaned.shape}")
print(f"Rows removed: {len(df) - len(df_cleaned)}")
print(f"Remaining missing values: {df_cleaned.isnull().sum().sum()}")

# ============================================================
# Save Cleaned Data
# ============================================================
df_cleaned.to_csv('cleaned_data.csv', index=False)
print("\\nCleaned data saved to 'cleaned_data.csv'")
'''
    
    return code



def generate_regression_notebook(
    model_type: str,
    features: List[str],
    target: str,
    hyperparameters: Dict[str, Any] = None,
    test_size: float = 0.2,
    random_state: int = 42
) -> str:
    """Generate a Jupyter Notebook (.ipynb) JSON string for regression analysis."""
    import json
    
    hyperparameters = hyperparameters or {}
    features_str = repr(features)
    
    model_configs = {
        'linear': {'import': 'from sklearn.linear_model import LinearRegression', 'init': 'LinearRegression()', 'desc': 'Simple Linear Regression'},
        'ridge': {'import': 'from sklearn.linear_model import Ridge', 'init': f'Ridge(alpha={hyperparameters.get("alpha", 1.0)})', 'desc': 'Ridge Regression'},
        'lasso': {'import': 'from sklearn.linear_model import Lasso', 'init': f'Lasso(alpha={hyperparameters.get("alpha", 1.0)})', 'desc': 'Lasso Regression'},
        'random_forest': {'import': 'from sklearn.ensemble import RandomForestRegressor', 'init': f'RandomForestRegressor(n_estimators={hyperparameters.get("n_estimators", 100)}, random_state={random_state})', 'desc': 'Random Forest Regressor'},
        'svr': {'import': 'from sklearn.svm import SVR', 'init': f'SVR(kernel="{hyperparameters.get("kernel", "rbf")}", C={hyperparameters.get("C", 1.0)})', 'desc': 'Support Vector Regression'},
        'polynomial': {'import': 'from sklearn.linear_model import LinearRegression\nfrom sklearn.preprocessing import PolynomialFeatures', 'init': 'LinearRegression()', 'desc': 'Polynomial Regression', 'polynomial': True, 'degree': hyperparameters.get('degree', 2)}
    }
    config = model_configs.get(model_type, model_configs['linear'])
    
    cells = []
    
    # Header markdown
    cells.append({
        "cell_type": "markdown", "metadata": {},
        "source": [f"# {config['desc']}\n", "Generated from DataViz Analytics Platform"]
    })
    
    # Imports
    cells.append({
        "cell_type": "code", "execution_count": None, "metadata": {}, "outputs": [],
        "source": [
            "import pandas as pd\n",
            "import numpy as np\n",
            config['import'] + "\n",
            "from sklearn.model_selection import train_test_split\n",
            "from sklearn.metrics import mean_squared_error, r2_score, mean_absolute_error"
        ]
    })
    
    # Load Data markdown
    cells.append({"cell_type": "markdown", "metadata": {}, "source": ["## 1. Load Data"]})
    
    # Load Data code
    cells.append({
        "cell_type": "code", "execution_count": None, "metadata": {}, "outputs": [],
        "source": [
            "df = pd.read_csv('your_data.csv')\n",
            f"X = df{features_str}\n",
            f"y = df['{target}']\n",
            "print(f'Dataset shape: {{X.shape}}')"
        ]
    })
    
    # Train test split
    cells.append({"cell_type": "markdown", "metadata": {}, "source": ["## 2. Train-Test Split"]})
    cells.append({
        "cell_type": "code", "execution_count": None, "metadata": {}, "outputs": [],
        "source": [
            f"X_train, X_test, y_train, y_test = train_test_split(X, y, test_size={test_size}, random_state={random_state})\n",
            "print(f'Training set: {{X_train.shape[0]}} samples')\n",
            "print(f'Test set: {{X_test.shape[0]}} samples')"
        ]
    })
    
    if config.get('polynomial'):
        cells.append({"cell_type": "markdown", "metadata": {}, "source": ["## 3. Polynomial Feature Transformation"]})
        cells.append({
            "cell_type": "code", "execution_count": None, "metadata": {}, "outputs": [],
            "source": [
                f"poly = PolynomialFeatures(degree={config['degree']})\n",
                "X_train_poly = poly.fit_transform(X_train)\n",
                "X_test_poly = poly.transform(X_test)"
            ]
        })
        train_var = "X_train_poly"
        test_var = "X_test_poly"
    else:
        train_var = "X_train"
        test_var = "X_test"
        
    cells.append({"cell_type": "markdown", "metadata": {}, "source": ["## 4. Train Model"]})
    cells.append({
        "cell_type": "code", "execution_count": None, "metadata": {}, "outputs": [],
        "source": [
            f"model = {config['init']}\n",
            f"model.fit({train_var}, y_train)\n",
            f"y_pred_train = model.predict({train_var})\n",
            f"y_pred_test = model.predict({test_var})"
        ]
    })
    
    cells.append({"cell_type": "markdown", "metadata": {}, "source": ["## 5. Evaluation"]})
    cells.append({
        "cell_type": "code", "execution_count": None, "metadata": {}, "outputs": [],
        "source": [
            "train_r2 = r2_score(y_train, y_pred_train)\n",
            "test_r2 = r2_score(y_test, y_pred_test)\n",
            "print(f'Training R² Score: {{train_r2:.4f}}')\n",
            "print(f'Test R² Score: {{test_r2:.4f}}')"
        ]
    })
    
    notebook = {
        "cells": cells,
        "metadata": {},
        "nbformat": 4,
        "nbformat_minor": 5
    }
    return json.dumps(notebook, indent=2)
