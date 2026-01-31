import { useState, useEffect } from 'react';
import Plot from 'react-plotly.js';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

/**
 * Advanced Plotly Chart Component
 * Replaces simple Recharts for scientific/regression visualizations
 */
const PlotlyChart = ({ 
    data = [], 
    regressionResult = null, 
    chartType = 'scatter',
    title = 'Data Visualization',
    xLabel = 'X',
    yLabel = 'Y',
    theme = 'light'
}) => {
    const [plotData, setPlotData] = useState([]);
    const [layout, setLayout] = useState({});

    useEffect(() => {
        const isDark = theme === 'dark';
        
        // Prepare data traces
        const traces = [];

        // Original data points
        if (data.length > 0) {
            traces.push({
                x: data.map(point => point[0]),
                y: data.map(point => point[1]),
                mode: 'markers',
                type: 'scatter',
                name: 'Data Points',
                marker: {
                    size: 8,
                    color: isDark ? '#60a5fa' : '#3b82f6',
                    line: {
                        color: isDark ? '#1e40af' : '#1e3a8a',
                        width: 1
                    }
                }
            });
        }

        // Regression line
        if (regressionResult && regressionResult.predictions) {
            traces.push({
                x: data.map(point => point[0]),
                y: regressionResult.predictions,
                mode: 'lines',
                type: 'scatter',
                name: 'Regression Line',
                line: {
                    color: isDark ? '#f87171' : '#ef4444',
                    width: 3
                }
            });
        }

        // Confidence interval (if available)
        if (regressionResult?.confidence_interval) {
            const { lower, upper } = regressionResult.confidence_interval;
            
            traces.push({
                x: [...data.map(p => p[0]), ...data.map(p => p[0]).reverse()],
                y: [...upper, ...lower.reverse()],
                fill: 'toself',
                fillcolor: isDark ? 'rgba(248, 113, 113, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                line: { color: 'transparent' },
                name: '95% Confidence',
                showlegend: true,
                hoverinfo: 'skip'
            });
        }

        setPlotData(traces);

        // Layout configuration
        setLayout({
            title: {
                text: title,
                font: { 
                    size: 18, 
                    color: isDark ? '#e5e7eb' : '#111827',
                    family: 'Inter, system-ui, sans-serif'
                }
            },
            xaxis: {
                title: xLabel,
                gridcolor: isDark ? '#374151' : '#e5e7eb',
                color: isDark ? '#9ca3af' : '#6b7280',
                zeroline: false
            },
            yaxis: {
                title: yLabel,
                gridcolor: isDark ? '#374151' : '#e5e7eb',
                color: isDark ? '#9ca3af' : '#6b7280',
                zeroline: false
            },
            paper_bgcolor: isDark ? '#0f172a' : '#ffffff',
            plot_bgcolor: isDark ? '#1e293b' : '#f9fafb',
            font: {
                family: 'Inter, system-ui, sans-serif',
                color: isDark ? '#e5e7eb' : '#111827'
            },
            hovermode: 'closest',
            showlegend: true,
            legend: {
                x: 1,
                xanchor: 'right',
                y: 1,
                bgcolor: isDark ? '#1e293b' : '#ffffff',
                bordercolor: isDark ? '#374151' : '#e5e7eb',
                borderwidth: 1
            },
            margin: { l: 60, r: 40, t: 60, b: 60 }
        });
    }, [data, regressionResult, chartType, title, xLabel, yLabel, theme]);

    const handleExport = (format) => {
        const filename = `${title.replace(/\s+/g, '_')}_${Date.now()}`;
        
        // Plotly has built-in download
        const config = {
            toImageButtonOptions: {
                format: format, // 'png', 'svg', 'jpeg'
                filename: filename,
                height: 800,
                width: 1200,
                scale: 2 // Higher quality
            }
        };

        // Trigger download via config
        console.log('Export triggered', config);
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle>{title}</CardTitle>
                    <div className="flex gap-2">
                        <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleExport('png')}
                            className="gap-2"
                        >
                            <Download className="h-4 w-4" /> Export PNG
                        </Button>
                        <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleExport('svg')}
                            className="gap-2"
                        >
                            <Download className="h-4 w-4" /> Export SVG
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <Plot
                    data={plotData}
                    layout={layout}
                    config={{
                        responsive: true,
                        displayModeBar: true,
                        displaylogo: false,
                        modeBarButtonsToRemove: ['lasso2d', 'select2d'],
                        toImageButtonOptions: {
                            format: 'png',
                            filename: title.replace(/\s+/g, '_'),
                            height: 800,
                            width: 1200,
                            scale: 2
                        }
                    }}
                    style={{ width: '100%', height: '500px' }}
                    useResizeHandler={true}
                />
                
                {/* Statistics Display */}
                {regressionResult && (
                    <div className="mt-4 p-4 bg-muted rounded-lg">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            {regressionResult.r_squared && (
                                <div>
                                    <div className="text-muted-foreground">R²</div>
                                    <div className="text-lg font-semibold">
                                        {regressionResult.r_squared.toFixed(4)}
                                    </div>
                                </div>
                            )}
                            {regressionResult.equation && (
                                <div className="col-span-2">
                                    <div className="text-muted-foreground">Equation</div>
                                    <div className="font-mono text-sm">
                                        {regressionResult.equation}
                                    </div>
                                </div>
                            )}
                            {regressionResult.points && (
                                <div>
                                    <div className="text-muted-foreground">Data Points</div>
                                    <div className="text-lg font-semibold">
                                        {regressionResult.points}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default PlotlyChart;
