@echo off
echo Installing updated Python dependencies...
cd backend_django
pip install -r requirements.txt
echo.
echo Installation complete!
echo.
echo New regression models available:
echo - Linear Regression
echo - Polynomial Regression (degrees 2-6)
echo - Logarithmic Regression
echo - Exponential Regression
echo - Power Regression
echo - Ridge Regression
echo - Lasso Regression
echo - Elastic Net Regression
echo - Support Vector Regression
echo - Decision Tree Regression
echo - Random Forest Regression
echo - Quantile Regression
echo.
pause
