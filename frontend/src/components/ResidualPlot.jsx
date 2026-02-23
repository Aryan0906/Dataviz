import React from 'react';
import Plot from 'react-plotly.js';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info, TrendingUp, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const ResidualPlot = ({ actual = [], predicted = [], residuals = [], residualStats = {} }) => {
  const { mean = 0, std = 0, min = 0, max = 0 } = residualStats;

  // Calculate interpretation
  const getInterpretation = () => {
    const meanAbs = Math.abs(mean);
    const range = max - min;
    
    if (meanAbs < 0.1 * std && range < 4 * std) {
      return {
        status: 'good',
        message: 'Excellent fit! Residuals are randomly scattered around zero with no clear pattern.',
        color: 'green',
      };
    } else if (meanAbs < 0.3 * std) {
      return {
        status: 'acceptable',
        message: 'Acceptable fit. Some patterns may exist in residuals, but overall distribution is reasonable.',
        color: 'yellow',
      };
    } else {
      return {
        status: 'poor',
        message: 'Patterns detected in residuals. Consider using a different model or transforming your data.',
        color: 'red',
      };
    }
  };

  const interpretation = getInterpretation();

  // Prepare data for Plotly
  const scatterTrace = {
    x: predicted,
    y: residuals,
    mode: 'markers',
    type: 'scatter',
    name: 'Residuals',
    marker: {
      size: 8,
      color: residuals.map(r => Math.abs(r)),
      colorscale: 'Viridis',
      colorbar: {
        title: 'Absolute Error',
        thickness: 15,
        len: 0.5,
      },
      line: {
        color: '#ffffff',
        width: 0.5,
      },
    },
    text: residuals.map((r, i) => 
      `Predicted: ${predicted[i].toFixed(3)}<br>Actual: ${actual[i].toFixed(3)}<br>Residual: ${r.toFixed(3)}`
    ),
    hovertemplate: '%{text}<extra></extra>',
  };

  const zeroLineTrace = {
    x: [Math.min(...predicted), Math.max(...predicted)],
    y: [0, 0],
    mode: 'lines',
    type: 'scatter',
    name: 'Zero Line',
    line: {
      color: '#ef4444',
      width: 2,
      dash: 'dash',
    },
    hoverinfo: 'skip',
  };

  const layout = {
    title: {
      text: 'Residual Plot: Predicted vs Error',
      font: { size: 18, color: '#fafafa' },
    },
    xaxis: {
      title: 'Predicted Values',
      gridcolor: '#52525b',
      color: '#d4d4d8',
      zeroline: false,
    },
    yaxis: {
      title: 'Residuals (Error)',
      gridcolor: '#52525b',
      color: '#d4d4d8',
      zeroline: false,
    },
    plot_bgcolor: '#1a1a1e',
    paper_bgcolor: '#1a1a1e',
    font: { color: '#fafafa' },
    hovermode: 'closest',
    showlegend: true,
    legend: {
      x: 1.05,
      y: 1,
      bgcolor: '#27272b',
      bordercolor: '#52525b',
      borderwidth: 1,
    },
    margin: { l: 60, r: 120, t: 60, b: 60 },
  };

  const config = {
    displayModeBar: true,
    displaylogo: false,
    toImageButtonOptions: {
      format: 'png',
      filename: 'residual_plot',
      height: 800,
      width: 1200,
    },
    modeBarButtonsToRemove: ['lasso2d', 'select2d'],
  };

  return (
    <div className="space-y-4">
      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-purple-500" />
            Residual Analysis
          </CardTitle>
          <CardDescription>
            Visualizing prediction errors to validate model fit
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Residual Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-800/50 rounded-lg p-3">
              <div className="text-xs text-slate-400">Mean Residual</div>
              <div className="text-lg font-bold text-white">
                {mean.toFixed(4)}
              </div>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-3">
              <div className="text-xs text-slate-400">Std Dev</div>
              <div className="text-lg font-bold text-white">
                {std.toFixed(4)}
              </div>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-3">
              <div className="text-xs text-slate-400">Min Error</div>
              <div className="text-lg font-bold text-red-400">
                {min.toFixed(4)}
              </div>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-3">
              <div className="text-xs text-slate-400">Max Error</div>
              <div className="text-lg font-bold text-green-400">
                {max.toFixed(4)}
              </div>
            </div>
          </div>

          {/* Plotly Chart */}
          <div className="rounded-lg border border-slate-800 overflow-hidden">
            <Plot
              data={[scatterTrace, zeroLineTrace]}
              layout={layout}
              config={config}
              style={{ width: '100%', height: '500px' }}
              useResizeHandler
            />
          </div>

          {/* Interpretation */}
          <Alert
            className={`
              ${interpretation.color === 'green' ? 'bg-green-500/10 border-green-500/20' : ''}
              ${interpretation.color === 'yellow' ? 'bg-yellow-500/10 border-yellow-500/20' : ''}
              ${interpretation.color === 'red' ? 'bg-red-500/10 border-red-500/20' : ''}
            `}
          >
            <div className="flex items-start gap-3">
              {interpretation.color === 'green' && <Info className="h-5 w-5 text-green-500 mt-0.5" />}
              {interpretation.color === 'yellow' && <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />}
              {interpretation.color === 'red' && <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />}
              
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="font-semibold text-sm">Model Fit Interpretation</h4>
                  <Badge
                    className={`
                      ${interpretation.color === 'green' ? 'bg-green-500/10 text-green-400' : ''}
                      ${interpretation.color === 'yellow' ? 'bg-yellow-500/10 text-yellow-400' : ''}
                      ${interpretation.color === 'red' ? 'bg-red-500/10 text-red-400' : ''}
                    `}
                  >
                    {interpretation.status.toUpperCase()}
                  </Badge>
                </div>
                <AlertDescription className="text-slate-300">
                  {interpretation.message}
                </AlertDescription>
              </div>
            </div>
          </Alert>

          {/* How to Interpret */}
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-blue-400 mb-2 flex items-center gap-2">
              <Info className="h-4 w-4" />
              How to Read This Plot
            </h4>
            <ul className="text-sm text-slate-300 space-y-1 list-disc list-inside">
              <li>
                <strong>Ideal Pattern:</strong> Points randomly scattered around the zero line (red dashed)
              </li>
              <li>
                <strong>Good Fit:</strong> No clear patterns, equal spread above and below zero
              </li>
              <li>
                <strong>Poor Fit:</strong> Curved patterns, funnel shapes, or clustering indicate model issues
              </li>
              <li>
                <strong>Mean near zero:</strong> Model is unbiased (not consistently over/under predicting)
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResidualPlot;
