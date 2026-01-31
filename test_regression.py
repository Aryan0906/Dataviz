import sys
sys.path.insert(0, 'e:/Coding/WAD/Dataviz/backend_django')

from api.utils.regression_models import find_best_regression

# Test data
data_points = [
    {"x": 1, "y": 2},
    {"x": 2, "y": 4},
    {"x": 3, "y": 6}
]

print("Testing regression models...")
result = find_best_regression(data_points)

if result:
    print(f"✓ Success!")
    print(f"  Model: {result['model_name']}")
    print(f"  Type: {result['model_type']}")
    print(f"  Equation: {result['equation']}")
    print(f"  R²: {result['r2']:.4f}")
    print(f"  Adjusted R²: {result['adjusted_r2']:.4f}")
else:
    print("✗ Failed to find best regression")
