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
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy, Check, Download, Code2 } from 'lucide-react';
import { toast } from 'sonner';

/**
 * ChartCodeExportModal - Export visualization code for different chart types
 * Supports: bar, pie, treemap, scatter, regression
 */
const ChartCodeExportModal = ({ 
  isOpen, 
  onClose, 
  chartType = 'bar',  // 'bar', 'pie', 'treemap', 'scatter', 'regression'
  chartData = null,   // Chart data object
  regressionData = null, // For regression charts
  chartTitle = 'Chart'
}) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('matplotlib');
  const [loading, setLoading] = useState(false);

  // Safety check - don't render if critical data is missing
  if (!isOpen) return null;

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

  const generateScatterCode = (library, data) => {
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

    return `"""
Regression Analysis - ${chartTitle}
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
plt.savefig('regression_plot.png', dpi=300, bbox_inches='tight')
plt.show()

print("Chart saved as 'regression_plot.png'")
`;
  };

  const getChartTypeName = () => {
    const names = {
      bar: 'Bar Chart',
      pie: 'Pie Chart',
      treemap: 'Treemap',
      scatter: 'Scatter Plot',
      regression: 'Regression Analysis'
    };
    return names[chartType] || 'Chart';
  };

  const getLibraryTabs = () => {
    if (chartType === 'treemap') {
      return ['plotly', 'matplotlib'];
    }
    if (chartType === 'regression') {
      return ['matplotlib'];
    }
    return ['matplotlib', 'seaborn', 'plotly'];
  };

  const currentCode = generateCode(activeTab);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden backdrop-blur-xl bg-slate-950/95 border border-slate-800">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <Code2 className="h-6 w-6 text-purple-500" />
              Export Chart as Code
            </DialogTitle>
            <Badge className="bg-purple-500/10 text-purple-400 border-purple-500/20">
              Python 3.11+
            </Badge>
          </div>
          <DialogDescription className="text-slate-400">
            Copy-pasteable Python code for {getChartTypeName()}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full bg-slate-900/50" style={{ gridTemplateColumns: `repeat(${getLibraryTabs().length}, 1fr)` }}>
            {getLibraryTabs().includes('matplotlib') && (
              <TabsTrigger value="matplotlib">Matplotlib</TabsTrigger>
            )}
            {getLibraryTabs().includes('seaborn') && (
              <TabsTrigger value="seaborn">Seaborn</TabsTrigger>
            )}
            {getLibraryTabs().includes('plotly') && (
              <TabsTrigger value="plotly">Plotly</TabsTrigger>
            )}
          </TabsList>

          {getLibraryTabs().map(lib => (
            <TabsContent key={lib} value={lib} className="space-y-4">
              <div className="relative">
                <div className="absolute top-2 right-2 flex gap-2 z-10">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => downloadCode(currentCode, `${chartType}_chart.py`)}
                    className="bg-slate-900/80 border-slate-700 hover:bg-slate-800"
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Download
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(currentCode)}
                    className="bg-slate-900/80 border-slate-700 hover:bg-slate-800"
                  >
                    {copied ? (
                      <>
                        <Check className="h-4 w-4 mr-1" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-1" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>
                
                <div className="max-h-[55vh] overflow-y-auto rounded-lg border border-slate-800">
                  <SyntaxHighlighter
                    language="python"
                    style={vscDarkPlus}
                    customStyle={{
                      margin: 0,
                      padding: '1.5rem',
                      background: '#0f172a',
                      fontSize: '0.875rem',
                    }}
                    showLineNumbers
                  >
                    {currentCode}
                  </SyntaxHighlighter>
                </div>
              </div>

              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-blue-400 mb-2">💡 How to Use</h4>
                <ol className="text-sm text-slate-300 space-y-1 list-decimal list-inside">
                  <li>Save this code as <code className="bg-slate-800 px-1 rounded">{chartType}_chart.py</code></li>
                  <li>Install required packages: <code className="bg-slate-800 px-1 rounded">pip install {lib === 'matplotlib' ? 'matplotlib' : lib === 'seaborn' ? 'seaborn matplotlib' : 'plotly kaleido'}</code></li>
                  <li>Run: <code className="bg-slate-800 px-1 rounded">python {chartType}_chart.py</code></li>
                  <li>The chart will be displayed and saved as an image file</li>
                </ol>
              </div>
            </TabsContent>
          ))}
        </Tabs>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            className="border-slate-700 hover:bg-slate-800"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ChartCodeExportModal;
