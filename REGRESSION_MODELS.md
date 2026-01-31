# Comprehensive Regression Models

## Overview
The system now automatically tests **12 different regression models** and selects the best one based on Adjusted R² score. The user doesn't need to choose - the system does all calculations in the backend and returns the optimal model.

## Available Models

### 1. **Linear Regression**
- **Formula**: y = mx + b
- **Use Case**: Simple straight-line relationships
- **Best For**: Data showing consistent linear trends

### 2. **Polynomial Regression** (Degrees 2-6)
- **Formula**: y = a₀ + a₁x + a₂x² + ... + aₙxⁿ
- **Use Case**: Curved relationships, non-linear patterns
- **Degrees Tested**: 2 (Quadratic), 3 (Cubic), 4 (Quartic), 5 (Quintic), 6
- **Best For**: Population growth, crop yield curves, parabolic trends

### 3. **Logarithmic Regression**
- **Formula**: y = a * ln(x) + b
- **Use Case**: Data that grows/decays quickly then levels off
- **Requirements**: All X values must be positive
- **Best For**: Learning curves, diminishing returns, saturation effects

### 4. **Exponential Regression**
- **Formula**: y = a * e^(bx)
- **Use Case**: Explosive growth over time
- **Requirements**: All Y values must be positive
- **Best For**: Viral growth, compound interest, bacterial growth

### 5. **Power Regression**
- **Formula**: y = ax^b
- **Use Case**: Scaling relationships
- **Requirements**: Both X and Y values must be positive
- **Best For**: Physics relationships, allometric scaling

### 6. **Ridge Regression**
- **Type**: Regularized Linear Model
- **Formula**: Linear with L2 penalty
- **Use Case**: Prevents overfitting with many features
- **Tested**: Multiple alpha values (0.1, 1.0, 10.0)
- **Best For**: Data with multicollinearity, many predictors

### 7. **Lasso Regression**
- **Type**: Regularized Linear Model  
- **Formula**: Linear with L1 penalty
- **Use Case**: Feature selection, sparse models
- **Tested**: Multiple alpha values (0.01, 0.1, 1.0)
- **Best For**: High-dimensional data, automatic feature selection

### 8. **Elastic Net Regression**
- **Type**: Hybrid Regularized Model
- **Formula**: Combines Ridge and Lasso
- **Use Case**: Best of both worlds - handles multicollinearity and feature selection
- **Best For**: Complex datasets with many correlated predictors

### 9. **Support Vector Regression (SVR)**
- **Type**: Machine Learning Model
- **Kernels Tested**: RBF (radial basis function), Linear
- **Use Case**: Finds optimal "tube" around data allowing small errors
- **Best For**: Non-linear patterns, robust to outliers
- **Min Data**: Requires at least 10 points

### 10. **Decision Tree Regression**
- **Type**: Tree-Based Model
- **Use Case**: Breaks data into "if-then" splits
- **Parameters**: Max depth = 5
- **Best For**: Non-linear relationships, interpretable rules
- **Min Data**: Requires at least 10 points

### 11. **Random Forest Regression**
- **Type**: Ensemble Model (Multiple Decision Trees)
- **Use Case**: Combines multiple trees for better accuracy
- **Parameters**: 50 trees, max depth = 5
- **Best For**: Complex patterns, reduced overfitting vs single tree
- **Min Data**: Requires at least 10 points

### 12. **Quantile Regression**
- **Type**: Robust Statistical Model
- **Formula**: Linear model fitted to median (50th percentile)
- **Use Case**: Predicts specific quantiles instead of mean
- **Best For**: Data with outliers, heteroscedastic data
- **Min Data**: Requires at least 10 points

## How It Works

### Frontend Behavior
1. User adds data points (manually, CSV, or paste)
2. User clicks "Analyze Data"
3. System automatically:
   - Sends data to backend
   - Tests all applicable models
   - Returns the best model
4. User sees results immediately with the best-fit model

### Backend Process
1. Receives data points from frontend
2. Tests all 12 models (where applicable):
   - Basic models: Always tested
   - Advanced models: Only if ≥10 data points
3. Calculates metrics for each model:
   - R² (coefficient of determination)
   - Adjusted R² (penalizes complexity)
   - RMSE (root mean squared error)
   - MAE (mean absolute error)
4. Ranks models by Adjusted R²
5. Returns best model with:
   - Model name and type
   - Equation
   - All metrics
   - Predictions
   - Top 5 model comparison

## Model Selection Criteria

The system uses **Adjusted R²** as the primary selection criterion because it:
- Accounts for model complexity (penalizes unnecessary parameters)
- Prevents overfitting
- Balances goodness-of-fit with simplicity
- More reliable than raw R² for model comparison

## Requirements

### Python Dependencies
```bash
pip install scikit-learn scipy
```

Or run the installation script:
```bash
install-dependencies.bat  # Windows
```

### Minimum Data Requirements
- **Basic models** (Linear, Polynomial, Log, Exp, Power): 2 points
- **Advanced models** (Ridge, Lasso, SVR, Trees, Forests): 10 points
- **Recommended**: 15-20+ points for reliable results

## Output Format

### Successful Analysis
```json
{
  "model_name": "Polynomial Regression (Degree 3)",
  "model_type": "polynomial-3",
  "equation": "y = 0.0012x^3 - 0.1234x^2 + 1.5678x + 2.3456",
  "r2": 0.9876,
  "adjusted_r2": 0.9845,
  "rmse": 0.1234,
  "mae": 0.0987,
  "predictions": [[x1, y1], [x2, y2], ...],
  "all_models_tested": [
    {
      "name": "Polynomial Regression (Degree 3)",
      "r2": 0.9876,
      "adjusted_r2": 0.9845
    },
    ...top 5 models
  ]
}
```

## Error Handling

The system gracefully handles:
- **Invalid data**: Skips models that can't fit (e.g., log of negative numbers)
- **Insufficient data**: Only tests models appropriate for data size
- **Numerical instability**: Catches and skips failed model fits
- **Missing dependencies**: Falls back to basic models if sklearn unavailable

## User Experience

### What Users See
1. Same familiar interface - no changes
2. Click "Analyze Data" button
3. Toast notification shows: "Analysis complete! Best model: [Model Name]"
4. Chart displays with the best-fit regression line
5. Model name appears in Analysis Summary header
6. All statistics (R², Adjusted R², RMSE, MAE) displayed

### What Users DON'T See
- Model selection complexity
- Testing process
- Failed model attempts
- Backend calculations

**Everything happens automatically behind the scenes!**

## Performance

- **Basic models**: < 100ms
- **Advanced models**: < 500ms (with 10-50 points)
- **Total analysis time**: Typically < 1 second
- Caching: Models are computed on-demand, not stored

## Future Enhancements

Potential additions:
- Neural network regression
- Gradient boosting models (XGBoost, LightGBM)
- Custom user-defined models
- Multi-variable regression (multiple X inputs)
- Time series models (ARIMA, LSTM)
- Bayesian regression
