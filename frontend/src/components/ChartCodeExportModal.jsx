import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Copy, Check, Download, Code2 } from 'lucide-react';
import { toast } from 'sonner';
import { useTheme } from '@/components/theme-provider';

/**
 * ChartCodeExportModal - Export visualization code for different chart types
 * Supports: bar, pie, treemap, scatter, regression, histogram, heatmap, curve
 */
const ChartCodeExportModal = ({
  isOpen,
  onClose,
  chartType = 'bar',  // 'bar', 'pie', 'treemap', 'scatter', 'regression', 'histogram', 'heatmap', 'curve'
  chartData = null,   // Chart data object - can be Highcharts data or categorical data
  regressionData = null, // For regression charts
  chartTitle = 'Chart',
  categoricalData = null, // For categorical charts (direct data array)
  curveData = null, // For mathematical curve plots
}) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('matplotlib');
  const { _theme } = useTheme();

  // Safety check - don't render if critical data is missing
  if (!isOpen) return null;

  console.log('ChartCodeExportModal render:', {
    chartType,
    hasRegressionData: !!regressionData,
    hasCategoricalData: !!categoricalData,
    hasChartData: !!chartData,
    hasCurveData: !!curveData,
    curveData: curveData,
    expressionsCount: curveData?.expressions?.length || 0
  });

  const copyToClipboard = (code) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      toast.success('Code copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {
      toast.error('Failed to copy code');
    });
  };

  const downloadCode = (code, filename) => {
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`Downloaded ${filename}`);
  };

  // Generate code based on chart type and library
  const generateCode = (library) => {
    if (chartType === 'regression' && regressionData) {
      return generateRegressionCode(library, regressionData);
    }

    if (chartType === 'curve' && curveData) {
      return generateCurveCode(library, curveData);
    }

    // Handle categorical data format (from CategoricalChat)
    if (categoricalData) {
      switch (chartType) {
        case 'bar':
          return generateCategoricalBarCode(library, categoricalData);
        case 'pie':
          return generateCategoricalPieCode(library, categoricalData);
        case 'histogram':
          return generateHistogramCode(library, categoricalData);
        case 'scatter':
          return generateCategoricalScatterCode(library, categoricalData);
        case 'heatmap':
          return generateHeatmapCode(library, categoricalData);
        default:
          return '# Chart type not supported';
      }
    }

    if (chartData) {
      switch (chartType) {
        case 'bar':
          return generateBarChartCode(library, chartData);
        case 'pie':
          return generatePieChartCode(library, chartData);
        case 'treemap':
          return generateTreemapCode(library, chartData);
        case 'scatter':
          return generateScatterCode(library, chartData);
        default:
          return '# Chart type not supported';
      }
    }

    return '# No data available';
  };

  const generateBarChartCode = (library, data) => {
    const labels = data.labels || [];
    const values = data.datasets?.[0]?.data || [];
    const colors = data.datasets?.[0]?.backgroundColor || [];

    if (library === 'matplotlib') {
      return `"""
Bar Chart - ${chartTitle}
Generated from DataViz Analytics Platform
"""

import matplotlib.pyplot as plt
import numpy as np

# Data
labels = ${JSON.stringify(labels)}
values = ${JSON.stringify(values)}
colors = ${JSON.stringify(colors)}

# Create figure
fig, ax = plt.subplots(figsize=(12, 6))

# Create bar chart
bars = ax.bar(labels, values, color=colors)

# Customize
ax.set_xlabel('Category', fontsize=12, fontweight='bold')
ax.set_ylabel('Value', fontsize=12, fontweight='bold')
ax.set_title('${chartTitle}', fontsize=14, fontweight='bold')
ax.grid(axis='y', alpha=0.3)

# Rotate labels if needed
plt.xticks(rotation=45, ha='right')

# Add value labels on bars
for bar in bars:
    height = bar.get_height()
    ax.text(bar.get_x() + bar.get_width()/2., height,
            f'{height:.0f}',
            ha='center', va='bottom', fontsize=10)

plt.tight_layout()
plt.savefig('bar_chart.png', dpi=300, bbox_inches='tight')
plt.show()

print("Chart saved as 'bar_chart.png'")
`;
    } else if (library === 'seaborn') {
      return `"""
Bar Chart - ${chartTitle}
Generated from DataViz Analytics Platform
"""

import seaborn as sns
import matplotlib.pyplot as plt
import pandas as pd

# Data
data = {
    'Category': ${JSON.stringify(labels)},
    'Value': ${JSON.stringify(values)}
}
df = pd.DataFrame(data)

# Set style
sns.set_theme(style="whitegrid")

# Create figure
fig, ax = plt.subplots(figsize=(12, 6))

# Create bar chart
sns.barplot(data=df, x='Category', y='Value', palette=${JSON.stringify(colors)}, ax=ax)

# Customize
ax.set_xlabel('Category', fontsize=12, fontweight='bold')
ax.set_ylabel('Value', fontsize=12, fontweight='bold')
ax.set_title('${chartTitle}', fontsize=14, fontweight='bold')

# Rotate labels
plt.xticks(rotation=45, ha='right')

plt.tight_layout()
plt.savefig('bar_chart.png', dpi=300, bbox_inches='tight')
plt.show()

print("Chart saved as 'bar_chart.png'")
`;
    } else if (library === 'plotly') {
      return `"""
Bar Chart - ${chartTitle}
Generated from DataViz Analytics Platform
"""

import plotly.graph_objects as go

# Data
labels = ${JSON.stringify(labels)}
values = ${JSON.stringify(values)}
colors = ${JSON.stringify(colors)}

# Create bar chart
fig = go.Figure(data=[
    go.Bar(
        x=labels,
        y=values,
        marker=dict(color=colors),
        text=values,
        textposition='outside',
    )
])

# Customize layout
fig.update_layout(
    title='${chartTitle}',
    xaxis_title='Category',
    yaxis_title='Value',
    template='plotly_white',
    width=1200,
    height=600,
    font=dict(size=12)
)

# Show and save
fig.show()
fig.write_html('bar_chart.html')
fig.write_image('bar_chart.png', width=1200, height=600)

print("Chart saved as 'bar_chart.png' and 'bar_chart.html'")
`;
    }
  };

  const generatePieChartCode = (library, data) => {
    const labels = data.labels || [];
    const values = data.datasets?.[0]?.data || [];
    const colors = data.datasets?.[0]?.backgroundColor || [];

    if (library === 'matplotlib') {
      return `"""
Pie Chart - ${chartTitle}
Generated from DataViz Analytics Platform
"""

import matplotlib.pyplot as plt

# Data
labels = ${JSON.stringify(labels)}
values = ${JSON.stringify(values)}
colors = ${JSON.stringify(colors)}

# Create figure
fig, ax = plt.subplots(figsize=(10, 8))

# Create pie chart
wedges, texts, autotexts = ax.pie(
    values,
    labels=labels,
    colors=colors,
    autopct='%1.1f%%',
    startangle=90,
    textprops={'fontsize': 11}
)

# Enhance text
for autotext in autotexts:
    autotext.set_color('white')
    autotext.set_fontweight('bold')

ax.set_title('${chartTitle}', fontsize=14, fontweight='bold', pad=20)

plt.tight_layout()
plt.savefig('pie_chart.png', dpi=300, bbox_inches='tight')
plt.show()

print("Chart saved as 'pie_chart.png'")
`;
    } else if (library === 'plotly') {
      return `"""
Pie Chart - ${chartTitle}
Generated from DataViz Analytics Platform
"""

import plotly.graph_objects as go

# Data
labels = ${JSON.stringify(labels)}
values = ${JSON.stringify(values)}
colors = ${JSON.stringify(colors)}

# Create pie chart
fig = go.Figure(data=[
    go.Pie(
        labels=labels,
        values=values,
        marker=dict(colors=colors),
        textposition='inside',
        textinfo='label+percent',
        hovertemplate='<b>%{label}</b><br>Value: %{value}<br>Percent: %{percent}'
    )
])

# Customize layout
fig.update_layout(
    title='${chartTitle}',
    template='plotly_white',
    width=800,
    height=800,
    font=dict(size=12)
)

# Show and save
fig.show()
fig.write_html('pie_chart.html')
fig.write_image('pie_chart.png', width=800, height=800)

print("Chart saved as 'pie_chart.png' and 'pie_chart.html'")
`;
    }
    return generateBarChartCode('seaborn', data); // Fallback
  };

  const generateTreemapCode = (library, data) => {
    const labels = data.labels || [];
    const values = data.datasets?.[0]?.data || [];
    const colors = data.datasets?.[0]?.backgroundColor || [];

    if (library === 'plotly') {
      return `"""
Treemap - ${chartTitle}
Generated from DataViz Analytics Platform
"""

import plotly.graph_objects as go

# Data
labels = ${JSON.stringify(labels)}
values = ${JSON.stringify(values)}
colors = ${JSON.stringify(colors)}

# Create treemap
fig = go.Figure(go.Treemap(
    labels=labels,
    parents=[''] * len(labels),  # All items at root level
    values=values,
    marker=dict(colors=colors),
    textposition='middle center',
    textfont=dict(size=14)
))

# Customize layout
fig.update_layout(
    title='${chartTitle}',
    width=1000,
    height=600,
    font=dict(size=12)
)

# Show and save
fig.show()
fig.write_html('treemap.html')
fig.write_image('treemap.png', width=1000, height=600)

print("Treemap saved as 'treemap.png' and 'treemap.html'")
`;
    } else if (library === 'matplotlib') {
      return `"""
Treemap - ${chartTitle}
Generated from DataViz Analytics Platform
Note: Install squarify: pip install squarify
"""

import matplotlib.pyplot as plt
import squarify

# Data
labels = ${JSON.stringify(labels)}
values = ${JSON.stringify(values)}
colors = ${JSON.stringify(colors)}

# Create figure
fig, ax = plt.subplots(figsize=(12, 8))

# Create treemap
squarify.plot(
    sizes=values,
    label=labels,
    color=colors,
    alpha=0.8,
    text_kwargs={'fontsize': 11, 'weight': 'bold'},
    ax=ax
)

ax.set_title('${chartTitle}', fontsize=14, fontweight='bold')
ax.axis('off')

plt.tight_layout()
plt.savefig('treemap.png', dpi=300, bbox_inches='tight')
plt.show()

print("Treemap saved as 'treemap.png'")
`;
    }
    return generateTreemapCode('plotly', data); // Default to plotly
  };

  const generateScatterCode = (_library, _data) => {
    return `"""
Scatter Plot - ${chartTitle}
Generated from DataViz Analytics Platform
"""

import matplotlib.pyplot as plt
import numpy as np

# Sample data - replace with your actual data
x = np.random.randn(100)
y = np.random.randn(100)

# Create figure
fig, ax = plt.subplots(figsize=(10, 6))

# Create scatter plot
ax.scatter(x, y, alpha=0.6, s=50)

# Customize
ax.set_xlabel('X Axis', fontsize=12, fontweight='bold')
ax.set_ylabel('Y Axis', fontsize=12, fontweight='bold')
ax.set_title('${chartTitle}', fontsize=14, fontweight='bold')
ax.grid(True, alpha=0.3)

plt.tight_layout()
plt.savefig('scatter_plot.png', dpi=300, bbox_inches='tight')
plt.show()

print("Chart saved as 'scatter_plot.png'")
`;
  };

  const generateRegressionCode = (library, regData) => {
    const dataPoints = regData?.dataPoints || [];
    const equation = regData?.equation || '';
    const modelType = regData?.modelType || 'linear';

    if (dataPoints.length === 0) {
      return `"""
Regression Analysis - ${chartTitle}
No data available
"""

# Please add data points first
print("No data available for regression analysis")
`;
    }

    // Determine if it's polynomial regression
    const isPolynomial = modelType.includes('polynomial');
    const polynomialDegree = isPolynomial ? parseInt(modelType.split('-')[1] || '2') : 2;

    // Check for other regression types
    const isExponential = modelType === 'exponential';
    const isLogarithmic = modelType === 'logarithmic';
    const isPower = modelType === 'power';

    if (library === 'matplotlib') {
      if (isPolynomial) {
        return `"""
Polynomial Regression Analysis - ${chartTitle}
Model Type: ${modelType}
Degree: ${polynomialDegree}
Equation: ${equation}
Generated from DataViz Analytics Platform
"""

import numpy as np
import matplotlib.pyplot as plt
from sklearn.preprocessing import PolynomialFeatures
from sklearn.linear_model import LinearRegression
from sklearn.metrics import r2_score, mean_squared_error, mean_absolute_error

# Data points
data = ${JSON.stringify(dataPoints)}
X = np.array([point['x'] for point in data]).reshape(-1, 1)
y = np.array([point['y'] for point in data])

# Create polynomial features
poly = PolynomialFeatures(degree=${polynomialDegree})
X_poly = poly.fit_transform(X)

# Create and train model
model = LinearRegression()
model.fit(X_poly, y)

# Make predictions
y_pred = model.predict(X_poly)

# Calculate metrics
r2 = r2_score(y, y_pred)
rmse = np.sqrt(mean_squared_error(y, y_pred))
mae = mean_absolute_error(y, y_pred)

print(f"R² Score: {r2:.4f}")
print(f"RMSE: {rmse:.4f}")
print(f"MAE: {mae:.4f}")
print(f"Equation: ${equation}")

# Create visualization
fig, ax = plt.subplots(figsize=(12, 6))

# Plot data points
ax.scatter(X, y, alpha=0.6, s=50, label='Data Points', color='#3b82f6')

# Plot polynomial regression curve
X_line = np.linspace(X.min(), X.max(), 300).reshape(-1, 1)
X_line_poly = poly.transform(X_line)
y_line = model.predict(X_line_poly)
ax.plot(X_line, y_line, 'r-', linewidth=2, label=f'Polynomial (degree ${polynomialDegree})')

# Customize
ax.set_xlabel('X', fontsize=12, fontweight='bold')
ax.set_ylabel('Y', fontsize=12, fontweight='bold')
ax.set_title('${chartTitle}\\nR² = ' + f'{r2:.4f}', fontsize=14, fontweight='bold')
ax.legend()
ax.grid(True, alpha=0.3)

plt.tight_layout()
plt.savefig('polynomial_regression_plot.png', dpi=300, bbox_inches='tight')
plt.show()

print("Chart saved as 'polynomial_regression_plot.png'")
`;
      } else if (isExponential) {
        return `"""
Exponential Regression Analysis - ${chartTitle}
Model Type: ${modelType}
Equation: ${equation}
Generated from DataViz Analytics Platform
"""

import numpy as np
import matplotlib.pyplot as plt
from scipy.optimize import curve_fit
from sklearn.metrics import r2_score, mean_squared_error, mean_absolute_error

# Data points
data = ${JSON.stringify(dataPoints)}
X = np.array([point['x'] for point in data])
y = np.array([point['y'] for point in data])

# Exponential function: y = a * exp(b * x)
def exponential_func(x, a, b):
    return a * np.exp(b * x)

# Fit exponential model
try:
    params, _ = curve_fit(exponential_func, X, y, maxfev=10000)
    a, b = params
    y_pred = exponential_func(X, a, b)
    
    # Calculate metrics
    r2 = r2_score(y, y_pred)
    rmse = np.sqrt(mean_squared_error(y, y_pred))
    mae = mean_absolute_error(y, y_pred)
    
    print(f"R² Score: {r2:.4f}")
    print(f"RMSE: {rmse:.4f}")
    print(f"MAE: {mae:.4f}")
    print(f"Equation: y = {a:.4f} * exp({b:.4f} * x)")
    
    # Create visualization
    fig, ax = plt.subplots(figsize=(12, 6))
    
    # Plot data points
    ax.scatter(X, y, alpha=0.6, s=50, label='Data Points', color='#3b82f6')
    
    # Plot exponential curve
    X_line = np.linspace(X.min(), X.max(), 300)
    y_line = exponential_func(X_line, a, b)
    ax.plot(X_line, y_line, 'r-', linewidth=2, label='Exponential Fit')
    
    # Customize
    ax.set_xlabel('X', fontsize=12, fontweight='bold')
    ax.set_ylabel('Y', fontsize=12, fontweight='bold')
    ax.set_title('${chartTitle}\\nR² = ' + f'{r2:.4f}', fontsize=14, fontweight='bold')
    ax.legend()
    ax.grid(True, alpha=0.3)
    
    plt.tight_layout()
    plt.savefig('exponential_regression_plot.png', dpi=300, bbox_inches='tight')
    plt.show()
    
    print("Chart saved as 'exponential_regression_plot.png'")
except Exception as e:
    print(f"Error fitting exponential model: {e}")
`;
      } else if (isLogarithmic) {
        return `"""
Logarithmic Regression Analysis - ${chartTitle}
Model Type: ${modelType}
Equation: ${equation}
Generated from DataViz Analytics Platform
"""

import numpy as np
import matplotlib.pyplot as plt
from sklearn.linear_model import LinearRegression
from sklearn.metrics import r2_score, mean_squared_error, mean_absolute_error

# Data points
data = ${JSON.stringify(dataPoints)}
X = np.array([point['x'] for point in data])
y = np.array([point['y'] for point in data])

# Filter out non-positive X values for logarithm
valid_indices = X > 0
X_valid = X[valid_indices]
y_valid = y[valid_indices]

if len(X_valid) == 0:
    print("Error: All X values must be positive for logarithmic regression")
else:
    # Transform X using natural logarithm
    X_log = np.log(X_valid).reshape(-1, 1)
    
    # Fit linear model on log-transformed data
    model = LinearRegression()
    model.fit(X_log, y_valid)
    
    # Make predictions
    y_pred = model.predict(X_log)
    
    # Calculate metrics
    r2 = r2_score(y_valid, y_pred)
    rmse = np.sqrt(mean_squared_error(y_valid, y_pred))
    mae = mean_absolute_error(y_valid, y_pred)
    
    print(f"R² Score: {r2:.4f}")
    print(f"RMSE: {rmse:.4f}")
    print(f"MAE: {mae:.4f}")
    print(f"Equation: y = {model.coef_[0]:.4f} * ln(x) + {model.intercept_:.4f}")
    
    # Create visualization
    fig, ax = plt.subplots(figsize=(12, 6))
    
    # Plot data points
    ax.scatter(X_valid, y_valid, alpha=0.6, s=50, label='Data Points', color='#3b82f6')
    
    # Plot logarithmic curve
    X_line = np.linspace(X_valid.min(), X_valid.max(), 300)
    X_line_log = np.log(X_line).reshape(-1, 1)
    y_line = model.predict(X_line_log)
    ax.plot(X_line, y_line, 'r-', linewidth=2, label='Logarithmic Fit')
    
    # Customize
    ax.set_xlabel('X', fontsize=12, fontweight='bold')
    ax.set_ylabel('Y', fontsize=12, fontweight='bold')
    ax.set_title('${chartTitle}\\nR² = ' + f'{r2:.4f}', fontsize=14, fontweight='bold')
    ax.legend()
    ax.grid(True, alpha=0.3)
    
    plt.tight_layout()
    plt.savefig('logarithmic_regression_plot.png', dpi=300, bbox_inches='tight')
    plt.show()
    
    print("Chart saved as 'logarithmic_regression_plot.png'")
`;
      } else if (isPower) {
        return `"""
Power Regression Analysis - ${chartTitle}
Model Type: ${modelType}
Equation: ${equation}
Generated from DataViz Analytics Platform
"""

import numpy as np
import matplotlib.pyplot as plt
from scipy.optimize import curve_fit
from sklearn.metrics import r2_score, mean_squared_error, mean_absolute_error

# Data points
data = ${JSON.stringify(dataPoints)}
X = np.array([point['x'] for point in data])
y = np.array([point['y'] for point in data])

# Power function: y = a * x^b
def power_func(x, a, b):
    return a * np.power(x, b)

# Fit power model
try:
    # Filter positive values
    valid_indices = (X > 0) & (y > 0)
    X_valid = X[valid_indices]
    y_valid = y[valid_indices]
    
    params, _ = curve_fit(power_func, X_valid, y_valid, maxfev=10000)
    a, b = params
    y_pred = power_func(X_valid, a, b)
    
    # Calculate metrics
    r2 = r2_score(y_valid, y_pred)
    rmse = np.sqrt(mean_squared_error(y_valid, y_pred))
    mae = mean_absolute_error(y_valid, y_pred)
    
    print(f"R² Score: {r2:.4f}")
    print(f"RMSE: {rmse:.4f}")
    print(f"MAE: {mae:.4f}")
    print(f"Equation: y = {a:.4f} * x^{b:.4f}")
    
    # Create visualization
    fig, ax = plt.subplots(figsize=(12, 6))
    
    # Plot data points
    ax.scatter(X_valid, y_valid, alpha=0.6, s=50, label='Data Points', color='#3b82f6')
    
    # Plot power curve
    X_line = np.linspace(X_valid.min(), X_valid.max(), 300)
    y_line = power_func(X_line, a, b)
    ax.plot(X_line, y_line, 'r-', linewidth=2, label='Power Fit')
    
    # Customize
    ax.set_xlabel('X', fontsize=12, fontweight='bold')
    ax.set_ylabel('Y', fontsize=12, fontweight='bold')
    ax.set_title('${chartTitle}\\nR² = ' + f'{r2:.4f}', fontsize=14, fontweight='bold')
    ax.legend()
    ax.grid(True, alpha=0.3)
    
    plt.tight_layout()
    plt.savefig('power_regression_plot.png', dpi=300, bbox_inches='tight')
    plt.show()
    
    print("Chart saved as 'power_regression_plot.png'")
except Exception as e:
    print(f"Error fitting power model: {e}")
`;
      } else {
        // Linear regression (default)
        return `"""
Linear Regression Analysis - ${chartTitle}
Model Type: ${modelType}
Equation: ${equation}
Generated from DataViz Analytics Platform
"""

import numpy as np
import matplotlib.pyplot as plt
from sklearn.linear_model import LinearRegression
from sklearn.metrics import r2_score, mean_squared_error, mean_absolute_error

# Data points
data = ${JSON.stringify(dataPoints)}
X = np.array([point['x'] for point in data]).reshape(-1, 1)
y = np.array([point['y'] for point in data])

# Create and train model
model = LinearRegression()
model.fit(X, y)

# Make predictions
y_pred = model.predict(X)

# Calculate metrics
r2 = r2_score(y, y_pred)
rmse = np.sqrt(mean_squared_error(y, y_pred))
mae = mean_absolute_error(y, y_pred)

print(f"R² Score: {r2:.4f}")
print(f"RMSE: {rmse:.4f}")
print(f"MAE: {mae:.4f}")
print(f"Equation: y = {model.coef_[0]:.4f}x + {model.intercept_:.4f}")

# Create visualization
fig, ax = plt.subplots(figsize=(12, 6))

# Plot data points
ax.scatter(X, y, alpha=0.6, s=50, label='Data Points', color='#3b82f6')

# Plot regression line
X_line = np.linspace(X.min(), X.max(), 100).reshape(-1, 1)
y_line = model.predict(X_line)
ax.plot(X_line, y_line, 'r-', linewidth=2, label='Regression Line')

# Customize
ax.set_xlabel('X', fontsize=12, fontweight='bold')
ax.set_ylabel('Y', fontsize=12, fontweight='bold')
ax.set_title('${chartTitle}\\nR² = ' + f'{r2:.4f}', fontsize=14, fontweight='bold')
ax.legend()
ax.grid(True, alpha=0.3)

plt.tight_layout()
plt.savefig('linear_regression_plot.png', dpi=300, bbox_inches='tight')
plt.show()

print("Chart saved as 'linear_regression_plot.png'")
`;
      }
    } else if (library === 'seaborn') {
      if (isPolynomial) {
        return `"""
Polynomial Regression Analysis - ${chartTitle}
Model Type: ${modelType}
Degree: ${polynomialDegree}
Equation: ${equation}
Generated from DataViz Analytics Platform
"""

import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
import pandas as pd
from sklearn.preprocessing import PolynomialFeatures
from sklearn.linear_model import LinearRegression
from sklearn.metrics import r2_score, mean_squared_error, mean_absolute_error

# Data points
data = ${JSON.stringify(dataPoints)}
X = np.array([point['x'] for point in data]).reshape(-1, 1)
y = np.array([point['y'] for point in data])

# Create polynomial features
poly = PolynomialFeatures(degree=${polynomialDegree})
X_poly = poly.fit_transform(X)

# Create and train model
model = LinearRegression()
model.fit(X_poly, y)

# Make predictions
y_pred = model.predict(X_poly)

# Calculate metrics
r2 = r2_score(y, y_pred)
rmse = np.sqrt(mean_squared_error(y, y_pred))
mae = mean_absolute_error(y, y_pred)

print(f"R² Score: {r2:.4f}")
print(f"RMSE: {rmse:.4f}")
print(f"MAE: {mae:.4f}")
print(f"Equation: ${equation}")

# Set style
sns.set_theme(style="whitegrid")

# Create visualization
fig, ax = plt.subplots(figsize=(12, 6))

# Create dataframe for seaborn
df = pd.DataFrame({'X': X.flatten(), 'Y': y})

# Plot data points
sns.scatterplot(data=df, x='X', y='Y', s=80, alpha=0.6, color='#3b82f6', ax=ax)

# Plot polynomial regression curve
X_line = np.linspace(X.min(), X.max(), 300).reshape(-1, 1)
X_line_poly = poly.transform(X_line)
y_line = model.predict(X_line_poly)
ax.plot(X_line, y_line, 'r-', linewidth=2.5, label=f'Polynomial (degree ${polynomialDegree})')

# Customize
ax.set_xlabel('X', fontsize=12, fontweight='bold')
ax.set_ylabel('Y', fontsize=12, fontweight='bold')
ax.set_title('${chartTitle}\\nR² = ' + f'{r2:.4f}', fontsize=14, fontweight='bold', pad=20)
ax.legend()

plt.tight_layout()
plt.savefig('polynomial_regression_seaborn.png', dpi=300, bbox_inches='tight')
plt.show()

print("Chart saved as 'polynomial_regression_seaborn.png'")
`;
      } else if (isExponential) {
        return `"""
Exponential Regression Analysis - ${chartTitle}
Model Type: ${modelType}
Equation: ${equation}
Generated from DataViz Analytics Platform
"""

import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
import pandas as pd
from scipy.optimize import curve_fit
from sklearn.metrics import r2_score, mean_squared_error, mean_absolute_error

# Data points
data = ${JSON.stringify(dataPoints)}
X = np.array([point['x'] for point in data])
y = np.array([point['y'] for point in data])

# Exponential function: y = a * exp(b * x)
def exponential_func(x, a, b):
    return a * np.exp(b * x)

# Fit exponential model
try:
    params, _ = curve_fit(exponential_func, X, y, maxfev=10000)
    a, b = params
    y_pred = exponential_func(X, a, b)
    
    # Calculate metrics
    r2 = r2_score(y, y_pred)
    rmse = np.sqrt(mean_squared_error(y, y_pred))
    mae = mean_absolute_error(y, y_pred)
    
    print(f"R² Score: {r2:.4f}")
    print(f"RMSE: {rmse:.4f}")
    print(f"MAE: {mae:.4f}")
    print(f"Equation: y = {a:.4f} * exp({b:.4f} * x)")
    
    # Set style
    sns.set_theme(style="whitegrid")
    
    # Create visualization
    fig, ax = plt.subplots(figsize=(12, 6))
    
    # Create dataframe for seaborn
    df = pd.DataFrame({'X': X, 'Y': y})
    
    # Plot data points
    sns.scatterplot(data=df, x='X', y='Y', s=80, alpha=0.6, color='#3b82f6', ax=ax)
    
    # Plot exponential curve
    X_line = np.linspace(X.min(), X.max(), 300)
    y_line = exponential_func(X_line, a, b)
    ax.plot(X_line, y_line, 'r-', linewidth=2.5, label='Exponential Fit')
    
    # Customize
    ax.set_xlabel('X', fontsize=12, fontweight='bold')
    ax.set_ylabel('Y', fontsize=12, fontweight='bold')
    ax.set_title('${chartTitle}\\nR² = ' + f'{r2:.4f}', fontsize=14, fontweight='bold', pad=20)
    ax.legend()
    
    plt.tight_layout()
    plt.savefig('exponential_regression_seaborn.png', dpi=300, bbox_inches='tight')
    plt.show()
    
    print("Chart saved as 'exponential_regression_seaborn.png'")
except Exception as e:
    print(f"Error fitting exponential model: {e}")
`;
      } else if (isLogarithmic) {
        return `"""
Logarithmic Regression Analysis - ${chartTitle}
Model Type: ${modelType}
Equation: ${equation}
Generated from DataViz Analytics Platform
"""

import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
import pandas as pd
from sklearn.linear_model import LinearRegression
from sklearn.metrics import r2_score, mean_squared_error, mean_absolute_error

# Data points
data = ${JSON.stringify(dataPoints)}
X = np.array([point['x'] for point in data])
y = np.array([point['y'] for point in data])

# Filter out non-positive X values for logarithm
valid_indices = X > 0
X_valid = X[valid_indices]
y_valid = y[valid_indices]

if len(X_valid) == 0:
    print("Error: All X values must be positive for logarithmic regression")
else:
    # Transform X using natural logarithm
    X_log = np.log(X_valid).reshape(-1, 1)
    
    # Fit linear model on log-transformed data
    model = LinearRegression()
    model.fit(X_log, y_valid)
    
    # Make predictions
    y_pred = model.predict(X_log)
    
    # Calculate metrics
    r2 = r2_score(y_valid, y_pred)
    rmse = np.sqrt(mean_squared_error(y_valid, y_pred))
    mae = mean_absolute_error(y_valid, y_pred)
    
    print(f"R² Score: {r2:.4f}")
    print(f"RMSE: {rmse:.4f}")
    print(f"MAE: {mae:.4f}")
    print(f"Equation: y = {model.coef_[0]:.4f} * ln(x) + {model.intercept_:.4f}")
    
    # Set style
    sns.set_theme(style="whitegrid")
    
    # Create visualization
    fig, ax = plt.subplots(figsize=(12, 6))
    
    # Create dataframe for seaborn
    df = pd.DataFrame({'X': X_valid, 'Y': y_valid})
    
    # Plot data points
    sns.scatterplot(data=df, x='X', y='Y', s=80, alpha=0.6, color='#3b82f6', ax=ax)
    
    # Plot logarithmic curve
    X_line = np.linspace(X_valid.min(), X_valid.max(), 300)
    X_line_log = np.log(X_line).reshape(-1, 1)
    y_line = model.predict(X_line_log)
    ax.plot(X_line, y_line, 'r-', linewidth=2.5, label='Logarithmic Fit')
    
    # Customize
    ax.set_xlabel('X', fontsize=12, fontweight='bold')
    ax.set_ylabel('Y', fontsize=12, fontweight='bold')
    ax.set_title('${chartTitle}\\nR² = ' + f'{r2:.4f}', fontsize=14, fontweight='bold', pad=20)
    ax.legend()
    
    plt.tight_layout()
    plt.savefig('logarithmic_regression_seaborn.png', dpi=300, bbox_inches='tight')
    plt.show()
    
    print("Chart saved as 'logarithmic_regression_seaborn.png'")
`;
      } else if (isPower) {
        return `"""
Power Regression Analysis - ${chartTitle}
Model Type: ${modelType}
Equation: ${equation}
Generated from DataViz Analytics Platform
"""

import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
import pandas as pd
from scipy.optimize import curve_fit
from sklearn.metrics import r2_score, mean_squared_error, mean_absolute_error

# Data points
data = ${JSON.stringify(dataPoints)}
X = np.array([point['x'] for point in data])
y = np.array([point['y'] for point in data])

# Power function: y = a * x^b
def power_func(x, a, b):
    return a * np.power(x, b)

# Fit power model
try:
    # Filter positive values
    valid_indices = (X > 0) & (y > 0)
    X_valid = X[valid_indices]
    y_valid = y[valid_indices]
    
    params, _ = curve_fit(power_func, X_valid, y_valid, maxfev=10000)
    a, b = params
    y_pred = power_func(X_valid, a, b)
    
    # Calculate metrics
    r2 = r2_score(y_valid, y_pred)
    rmse = np.sqrt(mean_squared_error(y_valid, y_pred))
    mae = mean_absolute_error(y_valid, y_pred)
    
    print(f"R² Score: {r2:.4f}")
    print(f"RMSE: {rmse:.4f}")
    print(f"MAE: {mae:.4f}")
    print(f"Equation: y = {a:.4f} * x^{b:.4f}")
    
    # Set style
    sns.set_theme(style="whitegrid")
    
    # Create visualization
    fig, ax = plt.subplots(figsize=(12, 6))
    
    # Create dataframe for seaborn
    df = pd.DataFrame({'X': X_valid, 'Y': y_valid})
    
    # Plot data points
    sns.scatterplot(data=df, x='X', y='Y', s=80, alpha=0.6, color='#3b82f6', ax=ax)
    
    # Plot power curve
    X_line = np.linspace(X_valid.min(), X_valid.max(), 300)
    y_line = power_func(X_line, a, b)
    ax.plot(X_line, y_line, 'r-', linewidth=2.5, label='Power Fit')
    
    # Customize
    ax.set_xlabel('X', fontsize=12, fontweight='bold')
    ax.set_ylabel('Y', fontsize=12, fontweight='bold')
    ax.set_title('${chartTitle}\\nR² = ' + f'{r2:.4f}', fontsize=14, fontweight='bold', pad=20)
    ax.legend()
    
    plt.tight_layout()
    plt.savefig('power_regression_seaborn.png', dpi=300, bbox_inches='tight')
    plt.show()
    
    print("Chart saved as 'power_regression_seaborn.png'")
except Exception as e:
    print(f"Error fitting power model: {e}")
`;
      } else {
        // Linear regression (default)
        return `"""
Linear Regression Analysis - ${chartTitle}
Model Type: ${modelType}
Equation: ${equation}
Generated from DataViz Analytics Platform
"""

import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
import pandas as pd
from sklearn.linear_model import LinearRegression
from sklearn.metrics import r2_score, mean_squared_error, mean_absolute_error

# Data points
data = ${JSON.stringify(dataPoints)}
X = np.array([point['x'] for point in data]).reshape(-1, 1)
y = np.array([point['y'] for point in data])

# Create dataframe
df = pd.DataFrame({'X': X.flatten(), 'Y': y})

# Create and train model
model = LinearRegression()
model.fit(X, y)

# Make predictions
y_pred = model.predict(X)

# Calculate metrics
r2 = r2_score(y, y_pred)
rmse = np.sqrt(mean_squared_error(y, y_pred))
mae = mean_absolute_error(y, y_pred)

print(f"R² Score: {r2:.4f}")
print(f"RMSE: {rmse:.4f}")
print(f"MAE: {mae:.4f}")
print(f"Equation: y = {model.coef_[0]:.4f}x + {model.intercept_:.4f}")

# Set style
sns.set_theme(style="whitegrid")

# Create visualization
fig, ax = plt.subplots(figsize=(12, 6))

# Plot with seaborn regplot (includes confidence interval)
sns.regplot(data=df, x='X', y='Y', color='#3b82f6', scatter_kws={'s': 50, 'alpha': 0.6}, 
            line_kws={'color': 'red', 'linewidth': 2}, ax=ax)

# Customize
ax.set_xlabel('X', fontsize=12, fontweight='bold')
ax.set_ylabel('Y', fontsize=12, fontweight='bold')
ax.set_title(f'${chartTitle}\\nR² = {r2:.4f}', fontsize=14, fontweight='bold')

plt.tight_layout()
plt.savefig('linear_regression_seaborn.png', dpi=300, bbox_inches='tight')
plt.show()

print("Chart saved as 'linear_regression_seaborn.png'")
`;
      }
    } else if (library === 'plotly') {
      if (isPolynomial) {
        return `"""
Polynomial Regression Analysis - ${chartTitle}
Model Type: ${modelType}
Degree: ${polynomialDegree}
Equation: ${equation}
Generated from DataViz Analytics Platform
"""

import numpy as np
import plotly.graph_objects as go
from sklearn.preprocessing import PolynomialFeatures
from sklearn.linear_model import LinearRegression
from sklearn.metrics import r2_score, mean_squared_error, mean_absolute_error

# Data points
data = ${JSON.stringify(dataPoints)}
X = np.array([point['x'] for point in data]).reshape(-1, 1)
y = np.array([point['y'] for point in data])

# Create polynomial features
poly = PolynomialFeatures(degree=${polynomialDegree})
X_poly = poly.fit_transform(X)

# Create and train model
model = LinearRegression()
model.fit(X_poly, y)

# Make predictions
y_pred = model.predict(X_poly)

# Calculate metrics
r2 = r2_score(y, y_pred)
rmse = np.sqrt(mean_squared_error(y, y_pred))
mae = mean_absolute_error(y, y_pred)

print(f"R² Score: {r2:.4f}")
print(f"RMSE: {rmse:.4f}")
print(f"MAE: {mae:.4f}")
print(f"Equation: ${equation}")

# Create polynomial regression curve points
X_line = np.linspace(X.min(), X.max(), 300).reshape(-1, 1)
X_line_poly = poly.transform(X_line)
y_line = model.predict(X_line_poly)

# Create figure
fig = go.Figure()

# Add data points
fig.add_trace(go.Scatter(
    x=X.flatten(),
    y=y,
    mode='markers',
    name='Data Points',
    marker=dict(size=8, color='#3b82f6', opacity=0.6)
))

# Add polynomial regression curve
fig.add_trace(go.Scatter(
    x=X_line.flatten(),
    y=y_line,
    mode='lines',
    name=f'Polynomial (degree ${polynomialDegree})',
    line=dict(color='red', width=3)
))

# Update layout
fig.update_layout(
    title=dict(
        text=f'${chartTitle}<br>R² = {r2:.4f}',
        x=0.5,
        xanchor='center',
        font=dict(size=16, family='Arial, sans-serif')
    ),
    xaxis_title='X',
    yaxis_title='Y',
    hovermode='closest',
    showlegend=True,
    template='plotly_white',
    width=1200,
    height=600
)

# Show figure
fig.show()

# Save as HTML
fig.write_html('polynomial_regression_plotly.html')
print("Interactive chart saved as 'polynomial_regression_plotly.html'")

# Save as PNG (requires kaleido: pip install kaleido)
try:
    fig.write_image('polynomial_regression_plotly.png', width=1200, height=600)
    print("Static chart saved as 'polynomial_regression_plotly.png'")
except Exception as e:
    print(f"PNG export requires kaleido: pip install kaleido")
`;
      } else if (isExponential) {
        return `"""
Exponential Regression Analysis - ${chartTitle}
Model Type: ${modelType}
Equation: ${equation}
Generated from DataViz Analytics Platform
"""

import numpy as np
import plotly.graph_objects as go
from scipy.optimize import curve_fit
from sklearn.metrics import r2_score, mean_squared_error, mean_absolute_error

# Data points
data = ${JSON.stringify(dataPoints)}
X = np.array([point['x'] for point in data])
y = np.array([point['y'] for point in data])

# Exponential function: y = a * exp(b * x)
def exponential_func(x, a, b):
    return a * np.exp(b * x)

# Fit exponential model
try:
    params, _ = curve_fit(exponential_func, X, y, maxfev=10000)
    a, b = params
    y_pred = exponential_func(X, a, b)
    
    # Calculate metrics
    r2 = r2_score(y, y_pred)
    rmse = np.sqrt(mean_squared_error(y, y_pred))
    mae = mean_absolute_error(y, y_pred)
    
    print(f"R² Score: {r2:.4f}")
    print(f"RMSE: {rmse:.4f}")
    print(f"MAE: {mae:.4f}")
    print(f"Equation: y = {a:.4f} * exp({b:.4f} * x)")
    
    # Create exponential curve points
    X_line = np.linspace(X.min(), X.max(), 300)
    y_line = exponential_func(X_line, a, b)
    
    # Create figure
    fig = go.Figure()
    
    # Add data points
    fig.add_trace(go.Scatter(
        x=X,
        y=y,
        mode='markers',
        name='Data Points',
        marker=dict(size=8, color='#3b82f6', opacity=0.6)
    ))
    
    # Add exponential curve
    fig.add_trace(go.Scatter(
        x=X_line,
        y=y_line,
        mode='lines',
        name='Exponential Fit',
        line=dict(color='red', width=3)
    ))
    
    # Update layout
    fig.update_layout(
        title=dict(
            text=f'${chartTitle}<br>R² = {r2:.4f}',
            x=0.5,
            xanchor='center',
            font=dict(size=16, family='Arial, sans-serif')
        ),
        xaxis_title='X',
        yaxis_title='Y',
        hovermode='closest',
        showlegend=True,
        template='plotly_white',
        width=1200,
        height=600
    )
    
    # Show figure
    fig.show()
    
    # Save as HTML
    fig.write_html('exponential_regression_plotly.html')
    print("Interactive chart saved as 'exponential_regression_plotly.html'")
    
    # Save as PNG (requires kaleido: pip install kaleido)
    try:
        fig.write_image('exponential_regression_plotly.png', width=1200, height=600)
        print("Static chart saved as 'exponential_regression_plotly.png'")
    except Exception as e:
        print(f"PNG export requires kaleido: pip install kaleido")
except Exception as e:
    print(f"Error fitting exponential model: {e}")
`;
      } else if (isLogarithmic) {
        return `"""
Logarithmic Regression Analysis - ${chartTitle}
Model Type: ${modelType}
Equation: ${equation}
Generated from DataViz Analytics Platform
"""

import numpy as np
import plotly.graph_objects as go
from sklearn.linear_model import LinearRegression
from sklearn.metrics import r2_score, mean_squared_error, mean_absolute_error

# Data points
data = ${JSON.stringify(dataPoints)}
X = np.array([point['x'] for point in data])
y = np.array([point['y'] for point in data])

# Filter out non-positive X values for logarithm
valid_indices = X > 0
X_valid = X[valid_indices]
y_valid = y[valid_indices]

if len(X_valid) == 0:
    print("Error: All X values must be positive for logarithmic regression")
else:
    # Transform X using natural logarithm
    X_log = np.log(X_valid).reshape(-1, 1)
    
    # Fit linear model on log-transformed data
    model = LinearRegression()
    model.fit(X_log, y_valid)
    
    # Make predictions
    y_pred = model.predict(X_log)
    
    # Calculate metrics
    r2 = r2_score(y_valid, y_pred)
    rmse = np.sqrt(mean_squared_error(y_valid, y_pred))
    mae = mean_absolute_error(y_valid, y_pred)
    
    print(f"R² Score: {r2:.4f}")
    print(f"RMSE: {rmse:.4f}")
    print(f"MAE: {mae:.4f}")
    print(f"Equation: y = {model.coef_[0]:.4f} * ln(x) + {model.intercept_:.4f}")
    
    # Create logarithmic curve points
    X_line = np.linspace(X_valid.min(), X_valid.max(), 300)
    X_line_log = np.log(X_line).reshape(-1, 1)
    y_line = model.predict(X_line_log)
    
    # Create figure
    fig = go.Figure()
    
    # Add data points
    fig.add_trace(go.Scatter(
        x=X_valid,
        y=y_valid,
        mode='markers',
        name='Data Points',
        marker=dict(size=8, color='#3b82f6', opacity=0.6)
    ))
    
    # Add logarithmic curve
    fig.add_trace(go.Scatter(
        x=X_line,
        y=y_line,
        mode='lines',
        name='Logarithmic Fit',
        line=dict(color='red', width=3)
    ))
    
    # Update layout
    fig.update_layout(
        title=dict(
            text=f'${chartTitle}<br>R² = {r2:.4f}',
            x=0.5,
            xanchor='center',
            font=dict(size=16, family='Arial, sans-serif')
        ),
        xaxis_title='X',
        yaxis_title='Y',
        hovermode='closest',
        showlegend=True,
        template='plotly_white',
        width=1200,
        height=600
    )
    
    # Show figure
    fig.show()
    
    # Save as HTML
    fig.write_html('logarithmic_regression_plotly.html')
    print("Interactive chart saved as 'logarithmic_regression_plotly.html'")
    
    # Save as PNG (requires kaleido: pip install kaleido)
    try:
        fig.write_image('logarithmic_regression_plotly.png', width=1200, height=600)
        print("Static chart saved as 'logarithmic_regression_plotly.png'")
    except Exception as e:
        print(f"PNG export requires kaleido: pip install kaleido")
`;
      } else if (isPower) {
        return `"""
Power Regression Analysis - ${chartTitle}
Model Type: ${modelType}
Equation: ${equation}
Generated from DataViz Analytics Platform
"""

import numpy as np
import plotly.graph_objects as go
from scipy.optimize import curve_fit
from sklearn.metrics import r2_score, mean_squared_error, mean_absolute_error

# Data points
data = ${JSON.stringify(dataPoints)}
X = np.array([point['x'] for point in data])
y = np.array([point['y'] for point in data])

# Power function: y = a * x^b
def power_func(x, a, b):
    return a * np.power(x, b)

# Fit power model
try:
    # Filter positive values
    valid_indices = (X > 0) & (y > 0)
    X_valid = X[valid_indices]
    y_valid = y[valid_indices]
    
    params, _ = curve_fit(power_func, X_valid, y_valid, maxfev=10000)
    a, b = params
    y_pred = power_func(X_valid, a, b)
    
    # Calculate metrics
    r2 = r2_score(y_valid, y_pred)
    rmse = np.sqrt(mean_squared_error(y_valid, y_pred))
    mae = mean_absolute_error(y_valid, y_pred)
    
    print(f"R² Score: {r2:.4f}")
    print(f"RMSE: {rmse:.4f}")
    print(f"MAE: {mae:.4f}")
    print(f"Equation: y = {a:.4f} * x^{b:.4f}")
    
    # Create power curve points
    X_line = np.linspace(X_valid.min(), X_valid.max(), 300)
    y_line = power_func(X_line, a, b)
    
    # Create figure
    fig = go.Figure()
    
    # Add data points
    fig.add_trace(go.Scatter(
        x=X_valid,
        y=y_valid,
        mode='markers',
        name='Data Points',
        marker=dict(size=8, color='#3b82f6', opacity=0.6)
    ))
    
    # Add power curve
    fig.add_trace(go.Scatter(
        x=X_line,
        y=y_line,
        mode='lines',
        name='Power Fit',
        line=dict(color='red', width=3)
    ))
    
    # Update layout
    fig.update_layout(
        title=dict(
            text=f'${chartTitle}<br>R² = {r2:.4f}',
            x=0.5,
            xanchor='center',
            font=dict(size=16, family='Arial, sans-serif')
        ),
        xaxis_title='X',
        yaxis_title='Y',
        hovermode='closest',
        showlegend=True,
        template='plotly_white',
        width=1200,
        height=600
    )
    
    # Show figure
    fig.show()
    
    # Save as HTML
    fig.write_html('power_regression_plotly.html')
    print("Interactive chart saved as 'power_regression_plotly.html'")
    
    # Save as PNG (requires kaleido: pip install kaleido)
    try:
        fig.write_image('power_regression_plotly.png', width=1200, height=600)
        print("Static chart saved as 'power_regression_plotly.png'")
    except Exception as e:
        print(f"PNG export requires kaleido: pip install kaleido")
except Exception as e:
    print(f"Error fitting power model: {e}")
`;
      } else {
        // Linear regression (default)
        return `"""
Linear Regression Analysis - ${chartTitle}
Model Type: ${modelType}
Equation: ${equation}
Generated from DataViz Analytics Platform
"""

import numpy as np
import plotly.graph_objects as go
from sklearn.linear_model import LinearRegression
from sklearn.metrics import r2_score, mean_squared_error, mean_absolute_error

# Data points
data = ${JSON.stringify(dataPoints)}
X = np.array([point['x'] for point in data]).reshape(-1, 1)
y = np.array([point['y'] for point in data])

# Create and train model
model = LinearRegression()
model.fit(X, y)

# Make predictions
y_pred = model.predict(X)

# Calculate metrics
r2 = r2_score(y, y_pred)
rmse = np.sqrt(mean_squared_error(y, y_pred))
mae = mean_absolute_error(y, y_pred)

print(f"R² Score: {r2:.4f}")
print(f"RMSE: {rmse:.4f}")
print(f"MAE: {mae:.4f}")
print(f"Equation: y = {model.coef_[0]:.4f}x + {model.intercept_:.4f}")

# Create regression line points
X_line = np.linspace(X.min(), X.max(), 100).reshape(-1, 1)
y_line = model.predict(X_line)

# Create figure
fig = go.Figure()

# Add data points
fig.add_trace(go.Scatter(
    x=X.flatten(),
    y=y,
    mode='markers',
    name='Data Points',
    marker=dict(size=8, color='#3b82f6', opacity=0.6)
))

# Add regression line
fig.add_trace(go.Scatter(
    x=X_line.flatten(),
    y=y_line.flatten(),
    mode='lines',
    name='Regression Line',
    line=dict(color='red', width=3)
))

# Update layout
fig.update_layout(
    title=dict(
        text=f'${chartTitle}<br>R² = {r2:.4f}',
        x=0.5,
        xanchor='center',
        font=dict(size=16, family='Arial, sans-serif')
    ),
    xaxis_title='X',
    yaxis_title='Y',
    hovermode='closest',
    showlegend=True,
    template='plotly_white',
    width=1200,
    height=600
)

# Show figure
fig.show()

# Save as HTML
fig.write_html('linear_regression_plotly.html')
print("Interactive chart saved as 'linear_regression_plotly.html'")

# Save as PNG (requires kaleido: pip install kaleido)
try:
    fig.write_image('linear_regression_plotly.png', width=1200, height=600)
    print("Static chart saved as 'linear_regression_plotly.png'")
except Exception as e:
    print(f"PNG export requires kaleido: pip install kaleido")
`;
      }
    }
    return generateRegressionCode('matplotlib', regData); // Fallback
  };

  // Curve/Mathematical plot code generator (for Desmos-style plots)
  const generateCurveCode = (library, curveData) => {
    const expressions = curveData?.expressions || [];

    if (expressions.length === 0) {
      return `"""
Mathematical Curve Plot - ${chartTitle}
No expressions available
"""

# Please add mathematical expressions first
print("No expressions available for plotting")
`;
    }

    if (library === 'matplotlib') {
      return `"""
Mathematical Curve Plot - ${chartTitle}
Expressions: ${expressions.join(', ')}
Generated from DataViz Analytics Platform
"""

import numpy as np
import matplotlib.pyplot as plt
from matplotlib import pyplot as plt
import re
from matplotlib.lines import Line2D

# Setup legend handles
legend_elements = []

def plot_expression(ax, expr, color):
    # Convert LaTeX frac{a}{b} to (a)/(b)
    temp = expr
    pattern = r'\\\\frac{([^{}]+)}{([^{}]+)}'
    while re.search(pattern, temp):
        temp = re.sub(pattern, r'(\\1)/(\\2)', temp)
    
    # Strip backslashes and replace braces
    python_expr = temp.replace('\\\\', '')
    python_expr = python_expr.replace('{', '(').replace('}', ')')
    python_expr = python_expr.replace('sin', 'np.sin')
    python_expr = python_expr.replace('cos', 'np.cos')
    python_expr = python_expr.replace('tan', 'np.tan')
    python_expr = python_expr.replace('sqrt', 'np.sqrt')
    python_expr = python_expr.replace('log', 'np.log')
    python_expr = python_expr.replace('abs', 'np.abs')
    python_expr = python_expr.replace('^', '**')
    python_expr = python_expr.replace('e**', 'np.e**')
    
    try:
        if '=' in python_expr:
            parts = python_expr.split('=')
            lhs = parts[0].strip()
            rhs = parts[1].strip()
            
            if lhs == 'y' and 'y' not in rhs:
                x_vals = np.linspace(-10, 10, 1000)
                y_vals = eval(rhs, {'x': x_vals, 'np': np})
                ax.plot(x_vals, y_vals, color=color, linewidth=2)
                legend_elements.append(Line2D([0], [0], color=color, lw=2, label=expr))
            elif lhs == 'x' and 'x' not in rhs:
                y_vals = np.linspace(-10, 10, 1000)
                x_vals = eval(rhs, {'y': y_vals, 'np': np})
                ax.plot(x_vals, y_vals, color=color, linewidth=2)
                legend_elements.append(Line2D([0], [0], color=color, lw=2, label=expr))
            else:
                # Implicit function using contour
                x_grid = np.linspace(-10, 10, 500)
                y_grid = np.linspace(-10, 10, 500)
                X, Y = np.meshgrid(x_grid, y_grid)
                Z = eval(f"({lhs}) - ({rhs})", {'x': X, 'y': Y, 'np': np})
                ax.contour(X, Y, Z, levels=[0], colors=[color], linewidths=2.5)
                legend_elements.append(Line2D([0], [0], color=color, lw=2.5, label=expr))
        else:
            x_vals = np.linspace(-10, 10, 1000)
            y_vals = eval(python_expr, {'x': x_vals, 'np': np})
            ax.plot(x_vals, y_vals, color=color, linewidth=2)
            legend_elements.append(Line2D([0], [0], color=color, lw=2, label=expr))
    except Exception as e:
        print(f"Error plotting expression '{expr}': {e}")

# Create figure
fig, ax = plt.subplots(figsize=(12, 8))

# Plot each expression
expressions = ${JSON.stringify(expressions)}
colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316']

for i, expr in enumerate(expressions):
    plot_expression(ax, expr, colors[i % len(colors)])

# Customize plot
ax.set_xlabel('x', fontsize=12, fontweight='bold')
ax.set_ylabel('y', fontsize=12, fontweight='bold')
ax.set_title('${chartTitle}', fontsize=14, fontweight='bold', pad=20)
ax.axhline(y=0, color='gray', linestyle='--', linewidth=0.5, alpha=0.7)
ax.axvline(x=0, color='gray', linestyle='--', linewidth=0.5, alpha=0.7)
ax.grid(True, alpha=0.3)
if legend_elements:
    ax.legend(handles=legend_elements, fontsize=10)

ax.set_xlim(-10, 10)
ax.set_ylim(-10, 10)

plt.tight_layout()
plt.savefig('mathematical_curve_plot.png', dpi=300, bbox_inches='tight')
plt.show()

print("Chart saved as 'mathematical_curve_plot.png'")
`;
    } else if (library === 'seaborn') {
      return `"""
Mathematical Curve Plot - ${chartTitle}
Expressions: ${expressions.join(', ')}
Generated from DataViz Analytics Platform
"""

import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns

# Set seaborn style
sns.set_theme(style="whitegrid")

# Define x range
x = np.linspace(-10, 10, 1000)

# Create figure
fig, ax = plt.subplots(figsize=(12, 8))

# Plot each expression
expressions = ${JSON.stringify(expressions)}

# Seaborn color palette
colors = sns.color_palette("husl", len(expressions))

for i, expr in enumerate(expressions):
    try:
        # Convert common LaTeX to Python
        python_expr = expr.replace('\\\\', '')
        python_expr = python_expr.replace('sin', 'np.sin')
        python_expr = python_expr.replace('cos', 'np.cos')
        python_expr = python_expr.replace('tan', 'np.tan')
        python_expr = python_expr.replace('sqrt', 'np.sqrt')
        python_expr = python_expr.replace('log', 'np.log')
        python_expr = python_expr.replace('abs', 'np.abs')
        python_expr = python_expr.replace('^', '**')
        python_expr = python_expr.replace('e**', 'np.e**')
        
        # Try to evaluate and plot
        if '=' in python_expr:
            parts = python_expr.split('=')
            if len(parts) == 2 and parts[0].strip() == 'y':
                y_expr = parts[1].strip()
                y = eval(y_expr)
                ax.plot(x, y, label=f'{expr}', 
                       color=colors[i], linewidth=2.5)
            else:
                print(f"Skipping unsupported equation format: {expr}")
        else:
            y = eval(python_expr)
            ax.plot(x, y, label=f'{expr}', 
                   color=colors[i], linewidth=2.5)
    except Exception as e:
        print(f"Error plotting expression '{expr}': {e}")

# Customize plot
ax.set_xlabel('x', fontsize=12, fontweight='bold')
ax.set_ylabel('y', fontsize=12, fontweight='bold')
ax.set_title('${chartTitle}', fontsize=14, fontweight='bold', pad=20)
ax.axhline(y=0, color='gray', linestyle='--', linewidth=0.8, alpha=0.5)
ax.axvline(x=0, color='gray', linestyle='--', linewidth=0.8, alpha=0.5)
ax.legend(fontsize=10, frameon=True, fancybox=True, shadow=True)
ax.set_xlim(-10, 10)
ax.set_ylim(-10, 10)

plt.tight_layout()
plt.savefig('mathematical_curve_seaborn.png', dpi=300, bbox_inches='tight')
plt.show()

print("Chart saved as 'mathematical_curve_seaborn.png'")
`;
    } else if (library === 'plotly') {
      return `"""
Mathematical Curve Plot - ${chartTitle}
Expressions: ${expressions.join(', ')}
Generated from DataViz Analytics Platform
"""

import numpy as np
import plotly.graph_objects as go

# Define x range
x = np.linspace(-10, 10, 1000)

# Create figure
fig = go.Figure()

# Plot each expression
expressions = ${JSON.stringify(expressions)}

# Color palette
colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316']

for i, expr in enumerate(expressions):
    try:
        # Convert common LaTeX to Python
        python_expr = expr.replace('\\\\', '')
        python_expr = python_expr.replace('sin', 'np.sin')
        python_expr = python_expr.replace('cos', 'np.cos')
        python_expr = python_expr.replace('tan', 'np.tan')
        python_expr = python_expr.replace('sqrt', 'np.sqrt')
        python_expr = python_expr.replace('log', 'np.log')
        python_expr = python_expr.replace('abs', 'np.abs')
        python_expr = python_expr.replace('^', '**')
        python_expr = python_expr.replace('e**', 'np.e**')
        
        # Try to evaluate and plot
        if '=' in python_expr:
            parts = python_expr.split('=')
            if len(parts) == 2 and parts[0].strip() == 'y':
                y_expr = parts[1].strip()
                y = eval(y_expr)
                
                fig.add_trace(go.Scatter(
                    x=x,
                    y=y,
                    mode='lines',
                    name=expr,
                    line=dict(color=colors[i % len(colors)], width=3)
                ))
            else:
                print(f"Skipping unsupported equation format: {expr}")
        else:
            y = eval(python_expr)
            fig.add_trace(go.Scatter(
                x=x,
                y=y,
                mode='lines',
                name=expr,
                line=dict(color=colors[i % len(colors)], width=3)
            ))
    except Exception as e:
        print(f"Error plotting expression '{expr}': {e}")

# Add axis lines
fig.add_hline(y=0, line_dash="dash", line_color="gray", opacity=0.5)
fig.add_vline(x=0, line_dash="dash", line_color="gray", opacity=0.5)

# Update layout
fig.update_layout(
    title=dict(
        text='${chartTitle}',
        x=0.5,
        xanchor='center',
        font=dict(size=16, family='Arial, sans-serif')
    ),
    xaxis_title='x',
    yaxis_title='y',
    hovermode='closest',
    showlegend=True,
    template='plotly_white',
    width=1200,
    height=800,
    xaxis=dict(range=[-10, 10], gridcolor='lightgray'),
    yaxis=dict(range=[-10, 10], gridcolor='lightgray'),
    legend=dict(
        yanchor="top",
        y=0.99,
        xanchor="left",
        x=0.01,
        bgcolor="rgba(255, 255, 255, 0.8)",
        bordercolor="gray",
        borderwidth=1
    )
)

# Show figure
fig.show()

# Save as HTML
fig.write_html('mathematical_curve_plotly.html')
print("Interactive chart saved as 'mathematical_curve_plotly.html'")

# Save as PNG (requires kaleido: pip install kaleido)
try:
    fig.write_image('mathematical_curve_plotly.png', width=1200, height=800)
    print("Static chart saved as 'mathematical_curve_plotly.png'")
except Exception as e:
    print(f"PNG export requires kaleido: pip install kaleido")
`;
    }

    return generateCurveCode('matplotlib', curveData); // Fallback
  };

  // Categorical chart code generators (for CategoricalChat component)
  const generateCategoricalBarCode = (library, data) => {
    const labels = data.map(d => d.label);
    const values = data.map(d => d.value);

    if (library === 'matplotlib') {
      return `"""
Bar Chart - ${chartTitle}
Generated from DataViz Analytics Platform
"""

import matplotlib.pyplot as plt
import numpy as np

# Data
labels = ${JSON.stringify(labels)}
values = ${JSON.stringify(values)}

# Create figure
fig, ax = plt.subplots(figsize=(12, 6))

# Create bar chart
bars = ax.bar(labels, values, color='#8b5cf6', alpha=0.8)

# Customize
ax.set_xlabel('Category', fontsize=12, fontweight='bold')
ax.set_ylabel('Value', fontsize=12, fontweight='bold')
ax.set_title('${chartTitle}', fontsize=14, fontweight='bold')
ax.grid(axis='y', alpha=0.3)

# Rotate labels if needed
plt.xticks(rotation=45, ha='right')

# Add value labels on bars
for bar in bars:
    height = bar.get_height()
    ax.text(bar.get_x() + bar.get_width()/2., height,
            f'{height:.2f}',
            ha='center', va='bottom', fontsize=10)

plt.tight_layout()
plt.savefig('bar_chart.png', dpi=300, bbox_inches='tight')
plt.show()

print("Chart saved as 'bar_chart.png'")
`;
    } else if (library === 'seaborn') {
      return `"""
Bar Chart - ${chartTitle}
Generated from DataViz Analytics Platform
"""

import seaborn as sns
import matplotlib.pyplot as plt
import pandas as pd

# Data
data = {
    'Category': ${JSON.stringify(labels)},
    'Value': ${JSON.stringify(values)}
}
df = pd.DataFrame(data)

# Set style
sns.set_theme(style="whitegrid")

# Create figure
fig, ax = plt.subplots(figsize=(12, 6))

# Create bar chart
sns.barplot(data=df, x='Category', y='Value', color='#8b5cf6', ax=ax)

# Customize
ax.set_xlabel('Category', fontsize=12, fontweight='bold')
ax.set_ylabel('Value', fontsize=12, fontweight='bold')
ax.set_title('${chartTitle}', fontsize=14, fontweight='bold')

# Rotate labels
plt.xticks(rotation=45, ha='right')

plt.tight_layout()
plt.savefig('bar_chart.png', dpi=300, bbox_inches='tight')
plt.show()

print("Chart saved as 'bar_chart.png'")
`;
    } else if (library === 'plotly') {
      return `"""
Bar Chart - ${chartTitle}
Generated from DataViz Analytics Platform
"""

import plotly.graph_objects as go

# Data
labels = ${JSON.stringify(labels)}
values = ${JSON.stringify(values)}

# Create bar chart
fig = go.Figure(data=[
    go.Bar(
        x=labels,
        y=values,
        marker=dict(color='#8b5cf6'),
        text=values,
        texttemplate='%{text:.2f}',
        textposition='outside',
    )
])

# Customize layout
fig.update_layout(
    title='${chartTitle}',
    xaxis_title='Category',
    yaxis_title='Value',
    template='plotly_white',
    width=1200,
    height=600,
    font=dict(size=12),
    xaxis=dict(tickangle=-45)
)

# Show and save
fig.show()
fig.write_html('bar_chart.html')
fig.write_image('bar_chart.png', width=1200, height=600)

print("Chart saved as 'bar_chart.png' and 'bar_chart.html'")
`;
    }
  };

  const generateCategoricalPieCode = (library, data) => {
    const labels = data.map(d => d.label);
    const values = data.map(d => d.value);
    const colors = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

    if (library === 'matplotlib') {
      return `"""
Pie Chart - ${chartTitle}
Generated from DataViz Analytics Platform
"""

import matplotlib.pyplot as plt

# Data
labels = ${JSON.stringify(labels)}
values = ${JSON.stringify(values)}
colors = ${JSON.stringify(colors)}

# Create figure
fig, ax = plt.subplots(figsize=(10, 8))

# Create pie chart
wedges, texts, autotexts = ax.pie(
    values,
    labels=labels,
    colors=colors,
    autopct='%1.1f%%',
    startangle=90,
    textprops={'fontsize': 11}
)

# Enhance text
for autotext in autotexts:
    autotext.set_color('white')
    autotext.set_fontweight('bold')

ax.set_title('${chartTitle}', fontsize=14, fontweight='bold', pad=20)

plt.tight_layout()
plt.savefig('pie_chart.png', dpi=300, bbox_inches='tight')
plt.show()

print("Chart saved as 'pie_chart.png'")
`;
    } else if (library === 'plotly') {
      return `"""
Pie Chart - ${chartTitle}
Generated from DataViz Analytics Platform
"""

import plotly.graph_objects as go

# Data
labels = ${JSON.stringify(labels)}
values = ${JSON.stringify(values)}
colors = ${JSON.stringify(colors)}

# Create pie chart
fig = go.Figure(data=[
    go.Pie(
        labels=labels,
        values=values,
        marker=dict(colors=colors),
        textposition='inside',
        textinfo='label+percent',
        hovertemplate='<b>%{label}</b><br>Value: %{value}<br>Percent: %{percent}'
    )
])

# Customize layout
fig.update_layout(
    title='${chartTitle}',
    template='plotly_white',
    width=800,
    height=800,
    font=dict(size=12)
)

# Show and save
fig.show()
fig.write_html('pie_chart.html')
fig.write_image('pie_chart.png', width=800, height=800)

print("Chart saved as 'pie_chart.png' and 'pie_chart.html'")
`;
    }
    return generateCategoricalBarCode('seaborn', data); // Fallback
  };

  const generateHistogramCode = (library, data) => {
    const values = data.map(d => d.value);

    if (library === 'matplotlib') {
      return `"""
Histogram - ${chartTitle}
Generated from DataViz Analytics Platform
"""

import matplotlib.pyplot as plt
import numpy as np

# Data
values = ${JSON.stringify(values)}

# Create figure
fig, ax = plt.subplots(figsize=(12, 6))

# Create histogram with automatic binning
n, bins, patches = ax.hist(values, bins='auto', color='#06b6d4', alpha=0.8, edgecolor='white')

# Customize
ax.set_xlabel('Value Range', fontsize=12, fontweight='bold')
ax.set_ylabel('Frequency', fontsize=12, fontweight='bold')
ax.set_title('${chartTitle}', fontsize=14, fontweight='bold')
ax.grid(axis='y', alpha=0.3)

# Add count labels on bars
for i in range(len(patches)):
    height = patches[i].get_height()
    if height > 0:
        ax.text(patches[i].get_x() + patches[i].get_width()/2., height,
                f'{int(height)}',
                ha='center', va='bottom', fontsize=10)

plt.tight_layout()
plt.savefig('histogram.png', dpi=300, bbox_inches='tight')
plt.show()

print("Chart saved as 'histogram.png'")
print(f"Total count: {len(values)}")
print(f"Min: {min(values):.2f}, Max: {max(values):.2f}")
print(f"Mean: {np.mean(values):.2f}, Median: {np.median(values):.2f}")
`;
    } else if (library === 'seaborn') {
      return `"""
Histogram - ${chartTitle}
Generated from DataViz Analytics Platform
"""

import seaborn as sns
import matplotlib.pyplot as plt
import numpy as np

# Data
values = ${JSON.stringify(values)}

# Set style
sns.set_theme(style="whitegrid")

# Create figure
fig, ax = plt.subplots(figsize=(12, 6))

# Create histogram
sns.histplot(values, bins='auto', color='#06b6d4', kde=True, ax=ax)

# Customize
ax.set_xlabel('Value Range', fontsize=12, fontweight='bold')
ax.set_ylabel('Frequency', fontsize=12, fontweight='bold')
ax.set_title('${chartTitle}', fontsize=14, fontweight='bold')

plt.tight_layout()
plt.savefig('histogram.png', dpi=300, bbox_inches='tight')
plt.show()

print("Chart saved as 'histogram.png'")
print(f"Total count: {len(values)}")
print(f"Min: {min(values):.2f}, Max: {max(values):.2f}")
print(f"Mean: {np.mean(values):.2f}, Median: {np.median(values):.2f}")
`;
    } else if (library === 'plotly') {
      return `"""
Histogram - ${chartTitle}
Generated from DataViz Analytics Platform
"""

import plotly.graph_objects as go
import numpy as np

# Data
values = ${JSON.stringify(values)}

# Create histogram
fig = go.Figure(data=[
    go.Histogram(
        x=values,
        marker=dict(color='#06b6d4'),
        nbinsx=None,  # Automatic binning
        texttemplate='%{y}',
        textposition='outside'
    )
])

# Customize layout
fig.update_layout(
    title='${chartTitle}',
    xaxis_title='Value Range',
    yaxis_title='Frequency',
    template='plotly_white',
    width=1200,
    height=600,
    font=dict(size=12),
    bargap=0.1
)

# Show and save
fig.show()
fig.write_html('histogram.html')
fig.write_image('histogram.png', width=1200, height=600)

print("Chart saved as 'histogram.png' and 'histogram.html'")
print(f"Total count: {len(values)}")
print(f"Min: {min(values):.2f}, Max: {max(values):.2f}")
print(f"Mean: {np.mean(values):.2f}, Median: {np.median(values):.2f}")
`;
    }
  };

  const generateCategoricalScatterCode = (library, data) => {
    const labels = data.map(d => d.label);
    const xValues = data.map((_, idx) => idx + 1);
    const yValues = data.map(d => d.value);

    if (library === 'matplotlib') {
      return `"""
Scatter Plot - ${chartTitle}
Generated from DataViz Analytics Platform
"""

import matplotlib.pyplot as plt
import numpy as np

# Data
labels = ${JSON.stringify(labels)}
x_values = ${JSON.stringify(xValues)}
y_values = ${JSON.stringify(yValues)}

# Create figure
fig, ax = plt.subplots(figsize=(12, 6))

# Create scatter plot
scatter = ax.scatter(x_values, y_values, s=100, alpha=0.6, color='#8b5cf6', edgecolors='white', linewidth=1.5)

# Add labels for each point
for i, label in enumerate(labels):
    ax.annotate(label, (x_values[i], y_values[i]), 
                textcoords="offset points", xytext=(0,10), 
                ha='center', fontsize=9, alpha=0.7)

# Customize
ax.set_xlabel('Index', fontsize=12, fontweight='bold')
ax.set_ylabel('Value', fontsize=12, fontweight='bold')
ax.set_title('${chartTitle}', fontsize=14, fontweight='bold')
ax.grid(True, alpha=0.3)

plt.tight_layout()
plt.savefig('scatter_plot.png', dpi=300, bbox_inches='tight')
plt.show()

print("Chart saved as 'scatter_plot.png'")
`;
    } else if (library === 'seaborn') {
      return `"""
Scatter Plot - ${chartTitle}
Generated from DataViz Analytics Platform
"""

import seaborn as sns
import matplotlib.pyplot as plt
import pandas as pd

# Data
data = {
    'Category': ${JSON.stringify(labels)},
    'Index': ${JSON.stringify(xValues)},
    'Value': ${JSON.stringify(yValues)}
}
df = pd.DataFrame(data)

# Set style
sns.set_theme(style="whitegrid")

# Create figure
fig, ax = plt.subplots(figsize=(12, 6))

# Create scatter plot
sns.scatterplot(data=df, x='Index', y='Value', s=100, color='#8b5cf6', ax=ax)

# Customize
ax.set_xlabel('Index', fontsize=12, fontweight='bold')
ax.set_ylabel('Value', fontsize=12, fontweight='bold')
ax.set_title('${chartTitle}', fontsize=14, fontweight='bold')

plt.tight_layout()
plt.savefig('scatter_plot.png', dpi=300, bbox_inches='tight')
plt.show()

print("Chart saved as 'scatter_plot.png'")
`;
    } else if (library === 'plotly') {
      return `"""
Scatter Plot - ${chartTitle}
Generated from DataViz Analytics Platform
"""

import plotly.graph_objects as go

# Data
labels = ${JSON.stringify(labels)}
x_values = ${JSON.stringify(xValues)}
y_values = ${JSON.stringify(yValues)}

# Create scatter plot
fig = go.Figure(data=[
    go.Scatter(
        x=x_values,
        y=y_values,
        mode='markers+text',
        marker=dict(size=12, color='#8b5cf6', line=dict(width=2, color='white')),
        text=labels,
        textposition='top center',
        textfont=dict(size=10),
        hovertemplate='<b>%{text}</b><br>Index: %{x}<br>Value: %{y}<extra></extra>'
    )
])

# Customize layout
fig.update_layout(
    title='${chartTitle}',
    xaxis_title='Index',
    yaxis_title='Value',
    template='plotly_white',
    width=1200,
    height=600,
    font=dict(size=12)
)

# Show and save
fig.show()
fig.write_html('scatter_plot.html')
fig.write_image('scatter_plot.png', width=1200, height=600)

print("Chart saved as 'scatter_plot.png' and 'scatter_plot.html'")
`;
    }
  };

  const generateHeatmapCode = (library, data) => {
    const labels = data.map(d => d.label);
    const values = data.map(d => d.value);

    if (library === 'matplotlib') {
      return `"""
Heatmap - ${chartTitle}
Generated from DataViz Analytics Platform
"""

import matplotlib.pyplot as plt
import numpy as np

# Data
labels = ${JSON.stringify(labels)}
values = ${JSON.stringify(values)}

# Reshape data for heatmap (1 row)
heatmap_data = np.array(values).reshape(1, -1)

# Create figure
fig, ax = plt.subplots(figsize=(14, 3))

# Create heatmap
im = ax.imshow(heatmap_data, cmap='viridis', aspect='auto')

# Set ticks and labels
ax.set_xticks(np.arange(len(labels)))
ax.set_xticklabels(labels, rotation=45, ha='right')
ax.set_yticks([0])
ax.set_yticklabels(['Value'])

# Add colorbar
cbar = plt.colorbar(im, ax=ax)
cbar.set_label('Value', rotation=270, labelpad=15)

# Add value labels in cells
for i in range(len(labels)):
    text_color = 'white' if values[i] < (max(values) + min(values)) / 2 else 'black'
    text = ax.text(i, 0, f'{values[i]:.1f}',
                   ha="center", va="center", color=text_color, fontsize=10)

ax.set_title('${chartTitle}', fontsize=14, fontweight='bold', pad=10)

plt.tight_layout()
plt.savefig('heatmap.png', dpi=300, bbox_inches='tight')
plt.show()

print("Chart saved as 'heatmap.png'")
`;
    } else if (library === 'seaborn') {
      return `"""
Heatmap - ${chartTitle}
Generated from DataViz Analytics Platform
"""

import seaborn as sns
import matplotlib.pyplot as plt
import pandas as pd
import numpy as np

# Data
labels = ${JSON.stringify(labels)}
values = ${JSON.stringify(values)}

# Create dataframe for heatmap
df = pd.DataFrame([values], columns=labels)

# Set style
sns.set_theme(style="white")

# Create figure
fig, ax = plt.subplots(figsize=(14, 3))

# Create heatmap
sns.heatmap(df, annot=True, fmt='.1f', cmap='viridis', 
            cbar_kws={'label': 'Value'}, ax=ax)

# Customize
ax.set_xlabel('')
ax.set_ylabel('')
ax.set_title('${chartTitle}', fontsize=14, fontweight='bold', pad=10)
plt.xticks(rotation=45, ha='right')

plt.tight_layout()
plt.savefig('heatmap.png', dpi=300, bbox_inches='tight')
plt.show()

print("Chart saved as 'heatmap.png'")
`;
    } else if (library === 'plotly') {
      return `"""
Heatmap - ${chartTitle}
Generated from DataViz Analytics Platform
"""

import plotly.graph_objects as go
import numpy as np

# Data
labels = ${JSON.stringify(labels)}
values = ${JSON.stringify(values)}

# Create heatmap (as a 1-row matrix)
z = [values]

# Create heatmap
fig = go.Figure(data=go.Heatmap(
    z=z,
    x=labels,
    y=['Value'],
    colorscale='Viridis',
    text=[[f'{v:.1f}' for v in values]],
    texttemplate='%{text}',
    textfont={"size": 12},
    hovertemplate='<b>%{x}</b><br>Value: %{z:.2f}<extra></extra>'
))

# Customize layout
fig.update_layout(
    title='${chartTitle}',
    xaxis_title='',
    yaxis_title='',
    template='plotly_white',
    width=1400,
    height=300,
    font=dict(size=12),
    xaxis=dict(tickangle=-45)
)

# Show and save
fig.show()
fig.write_html('heatmap.html')
fig.write_image('heatmap.png', width=1400, height=300)

print("Chart saved as 'heatmap.png' and 'heatmap.html'")
`;
    }
  };

  const getChartTypeName = () => {
    const names = {
      bar: 'Bar Chart',
      pie: 'Pie Chart',
      treemap: 'Treemap',
      scatter: 'Scatter Plot',
      regression: 'Regression Analysis',
      histogram: 'Histogram',
      heatmap: 'Heatmap'
    };
    return names[chartType] || 'Chart';
  };

  const getLibraryTabs = () => {
    if (chartType === 'treemap') {
      return ['plotly', 'matplotlib'];
    }
    // All chart types now support all three libraries
    const tabs = ['matplotlib', 'seaborn', 'plotly'];
    console.log('getLibraryTabs called for', chartType, '-> returning', tabs);
    return tabs;
  };

  const _currentCode = generateCode(activeTab);
  console.log('Current activeTab:', activeTab, 'Available tabs:', getLibraryTabs());

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <Code2 className="h-6 w-6 text-primary" />
              Export Chart as Code
            </DialogTitle>
            <Badge variant="outline" className="border-primary/30 text-primary">
              ✓ Python 3.11+
            </Badge>
          </div>
          <DialogDescription>
            Select a library and copy or download Python code for {getChartTypeName()}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Library Selection Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${getLibraryTabs().length}, 1fr)` }}>
              {getLibraryTabs().includes('matplotlib') && (
                <TabsTrigger value="matplotlib" className="text-base">📊 Matplotlib</TabsTrigger>
              )}
              {getLibraryTabs().includes('seaborn') && (
                <TabsTrigger value="seaborn" className="text-base">📈 Seaborn</TabsTrigger>
              )}
              {getLibraryTabs().includes('plotly') && (
                <TabsTrigger value="plotly" className="text-base">📉 Plotly</TabsTrigger>
              )}
            </TabsList>

            {getLibraryTabs().map(lib => (
              <TabsContent key={lib} value={lib} className="space-y-4">
                {/* Action Buttons */}
                <div className="flex gap-3 justify-center p-6 bg-muted/50 rounded-lg border">
                  <Button
                    size="lg"
                    onClick={() => copyToClipboard(generateCode(lib))}
                    className="gap-2 px-8 py-6 text-lg"
                  >
                    {copied ? (
                      <>
                        <Check className="h-5 w-5" />
                        Copied to Clipboard!
                      </>
                    ) : (
                      <>
                        <Copy className="h-5 w-5" />
                        Copy Code
                      </>
                    )}
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => downloadCode(generateCode(lib), `${chartType}_chart.py`)}
                    className="gap-2 px-8 py-6 text-lg"
                  >
                    <Download className="h-5 w-5" />
                    Download .py File
                  </Button>
                </div>

                {/* Instructions */}
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-primary mb-2">💡 How to Use</h4>
                  <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                    <li>Click "Copy Code" or "Download .py File" above</li>
                    <li>Install required packages: <code className="bg-muted px-1.5 py-0.5 rounded text-xs">pip install {lib === 'matplotlib' ? 'matplotlib numpy scikit-learn' : lib === 'seaborn' ? 'seaborn matplotlib numpy scikit-learn pandas' : 'plotly numpy scikit-learn kaleido'}</code></li>
                    <li>Run: <code className="bg-muted px-1.5 py-0.5 rounded text-xs">python {chartType}_chart.py</code></li>
                    <li>The chart will be displayed and saved as an image file</li>
                  </ol>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ChartCodeExportModal;
