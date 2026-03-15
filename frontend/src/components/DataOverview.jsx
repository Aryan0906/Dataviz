import React, { useState, useEffect } from 'react';
import Plot from 'react-plotly.js';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Table2,
  Columns3,
  AlertTriangle,
  Copy,
  TrendingUp,
  Activity,
  Zap,
  Info
} from 'lucide-react';
import { toast } from 'sonner';
import { dataAPI } from '@/lib/api';

const DataOverview = ({ filePath, onVariableSelect }) => {
  const [healthData, setHealthData] = useState(null);
  const [correlationData, setCorrelationData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDataOverview = async () => {
      setLoading(true);
      try {
        // Fetch health check using centralized API
        const healthData = await dataAPI.checkDataHealth(filePath);
        setHealthData(healthData);

        // Fetch correlation matrix using centralized API
        const corrData = await dataAPI.getCorrelationMatrix(filePath);
        setCorrelationData(corrData);
      } catch (error) {
        console.error('Failed to fetch data overview:', error);
        toast.error('Failed to load data overview');
      } finally {
        setLoading(false);
      }
    };

    if (filePath) {
      fetchDataOverview();
    }
  }, [filePath]);

  const handleHeatmapClick = (point) => {
      if (point && point.points && point.points[0]) {
        const { x, y } = point.points[0];
        if (x !== y && onVariableSelect) {
          onVariableSelect(x, y);
          toast.success(`Selected: ${x} vs ${y}`, {
            description: 'Navigate to Regression Lab to train model'
          });
        }
      }
    };

    if (loading) {
      return (
        <div className="space-y-6 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
          <Skeleton className="h-[600px]" />
        </div>
      );
    }

    if (!healthData || !correlationData) {
      return (
        <div className="p-6">
          <Alert className="bg-red-500/10 border-red-500/20">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <AlertDescription className="text-red-400">
              Failed to load data overview. Please check your data file.
            </AlertDescription>
          </Alert>
        </div>
      );
    }

    // Prepare heatmap data
    const heatmapData = [{
      z: correlationData.matrix.map(item => item.value),
      x: correlationData.matrix.map(item => item.x),
      y: correlationData.matrix.map(item => item.y),
      type: 'heatmap',
      colorscale: [
        [0, '#1e3a8a'],      // Deep blue (-1)
        [0.25, '#3b82f6'],   // Blue
        [0.5, '#f8fafc'],    // White (0)
        [0.75, '#f97316'],   // Orange
        [1, '#991b1b']       // Dark red (+1)
      ],
      zmid: 0,
      colorbar: {
        title: { text: 'Correlation', font: { color: '#e2e8f0' } },
        thickness: 20,
        len: 0.7,
        tickfont: { color: '#d4d4d8' },
      },
      hovertemplate: '%{x} vs %{y}<br>Correlation: %{z:.3f}<extra></extra>',
    }];

    const heatmapLayout = {
      title: {
        text: 'Correlation Heatmap - Click to Select Variables',
        font: { size: 18, color: '#fafafa' },
      },
      xaxis: {
        title: '',
        tickangle: -45,
        color: '#d4d4d8',
        gridcolor: '#52525b',
      },
      yaxis: {
        title: '',
        color: '#d4d4d8',
        gridcolor: '#52525b',
      },
      plot_bgcolor: '#1a1a1e',
      paper_bgcolor: '#1a1a1e',
      font: { color: '#fafafa' },
      margin: { l: 120, r: 60, t: 80, b: 120 },
    };

    const heatmapConfig = {
      displayModeBar: true,
      displaylogo: false,
      toImageButtonOptions: {
        format: 'png',
        filename: 'correlation_heatmap',
        height: 1000,
        width: 1000,
      },
    };

    return (
      <div className="space-y-6 p-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Rows */}
          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Table2 className="h-4 w-4" />
                Total Rows
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">
                {healthData.total_rows.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Data points available
              </p>
            </CardContent>
          </Card>

          {/* Total Columns */}
          <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Columns3 className="h-4 w-4" />
                Total Columns
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">
                {healthData.total_columns}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {correlationData.total_variables} numeric variables
              </p>
            </CardContent>
          </Card>

          {/* Missing Values */}
          <Card className={`bg-gradient-to-br ${healthData.missing_rows > 0
            ? 'from-orange-500/10 to-orange-600/5 border-orange-500/20'
            : 'from-green-500/10 to-green-600/5 border-green-500/20'
            }`}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Missing Values
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${healthData.missing_rows > 0 ? 'text-orange-400' : 'text-green-400'
                }`}>
                {healthData.missing_rows}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {healthData.missing_rows > 0 ? 'Rows with nulls' : 'Clean data'}
              </p>
            </CardContent>
          </Card>

          {/* Duplicates */}
          <Card className={`bg-gradient-to-br ${healthData.duplicates > 0
            ? 'from-red-500/10 to-red-600/5 border-red-500/20'
            : 'from-green-500/10 to-green-600/5 border-green-500/20'
            }`}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Copy className="h-4 w-4" />
                Duplicates
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${healthData.duplicates > 0 ? 'text-red-400' : 'text-green-400'
                }`}>
                {healthData.duplicates}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {healthData.duplicates > 0 ? 'Duplicate rows found' : 'No duplicates'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Strong Correlations Alert */}
        {correlationData.strong_correlations.length > 0 && (
          <Alert className="bg-blue-500/10 border-blue-500/20">
            <Zap className="h-5 w-5 text-blue-400" />
            <AlertDescription>
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-blue-400 font-semibold mb-2">
                    🔥 {correlationData.strong_correlations.length} Strong Correlations Detected
                  </h4>
                  <div className="space-y-1">
                    {correlationData.strong_correlations.slice(0, 3).map((corr, idx) => (
                      <div key={idx} className="text-sm text-slate-300">
                        <Badge variant="outline" className="mr-2 border-blue-500/30">
                          {corr.strength}
                        </Badge>
                        <span className="font-mono">{corr.var1}</span>
                        <TrendingUp className="inline h-3 w-3 mx-1" />
                        <span className="font-mono">{corr.var2}</span>
                        <span className="text-muted-foreground ml-2">
                          ({corr.correlation > 0 ? '+' : ''}{corr.correlation.toFixed(3)})
                        </span>
                      </div>
                    ))}
                  </div>
                  {correlationData.strong_correlations.length > 3 && (
                    <p className="text-xs text-muted-foreground mt-2">
                      +{correlationData.strong_correlations.length - 3} more correlations
                    </p>
                  )}
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Correlation Heatmap */}
        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-500" />
              Interactive Correlation Matrix
            </CardTitle>
            <CardDescription>
              Click on any square to automatically select those variables for regression analysis
            </CardDescription>
          </CardHeader>
          <CardContent>
            {correlationData.error ? (
              <Alert className="bg-red-500/10 border-red-500/20">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                <AlertDescription className="text-red-400">
                  {correlationData.error}
                </AlertDescription>
              </Alert>
            ) : (
              <>
                <div className="rounded-lg border border-slate-800 overflow-hidden">
                  <Plot
                    data={heatmapData}
                    layout={heatmapLayout}
                    config={heatmapConfig}
                    style={{ width: '100%', height: '600px' }}
                    onClick={handleHeatmapClick}
                    useResizeHandler
                  />
                </div>

                <div className="mt-4 bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-blue-400 mb-2 flex items-center gap-2">
                    <Info className="h-4 w-4" />
                    How to Use
                  </h4>
                  <ul className="text-sm text-slate-300 space-y-1 list-disc list-inside">
                    <li>
                      <strong>Color scale:</strong> Blue = negative correlation, Red = positive correlation
                    </li>
                    <li>
                      <strong>Click any cell:</strong> Automatically selects those variables for regression
                    </li>
                    <li>
                      <strong>Look for strong colors:</strong> Values near +1 or -1 indicate strong relationships
                    </li>
                    <li>
                      <strong>Diagonal:</strong> Always 1.0 (variable correlated with itself)
                    </li>
                  </ul>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  export default DataOverview;
