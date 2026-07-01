import { useMemo, forwardRef, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LineChart, Line, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, ReferenceLine, ReferenceDot } from "recharts";
import { TrendingUp, Download, BarChart3 } from "lucide-react";
import { exportChartAsSVG, generateFilename } from "@/lib/chartExport";
import { useTheme } from "@/components/theme-provider";

export const DataPlot = forwardRef(({ data, regression, selectedPointIndex }, ref) => {
    const chartContainerRef = useRef(null);
    const { theme } = useTheme();

    const isMultivariate = useMemo(() => {
        return data.length > 0 && Array.isArray(data[0].x);
    }, [data]);

    const handleExportSVG = useCallback(() => {
        const el = chartContainerRef.current;
        if (!el) return;
        const currentTheme = theme === 'system'
            ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
            : (theme || 'light');
        const filename = generateFilename('dataviz-regression-chart');
        exportChartAsSVG(el, filename, currentTheme, {
            title: regression?.equation ? `Regression: ${regression.equation}` : 'Regression Chart',
            chartType: 'regression',
            description: `Regression chart with ${data.length} data points${regression ? `, R2=${regression.r2.toFixed(4)}` : ''}`,
        });
    }, [theme, data, regression]);

    const regressionPredictor = useMemo(() => {
        if (typeof regression?.predict== 'function') return regression.predict;
        if (isMultivariate) return null;
        
        const predictions = Array.isArray(regression?.predictions) ? regression.predictions : [];
        if (predictions.length === 0) return null;

        const sortedPredictions = [...predictions].sort((a, b) => a[0] - b[0]);

        return (x) => {
            const exact = sortedPredictions.find((point) => Math.abs(point[0] - x) < 0.0001);
            if (exact) return exact[1];

            for (let index = 0; index < sortedPredictions.length - 1; index += 1) {
                const current = sortedPredictions[index];
                const next = sortedPredictions[index + 1];

                if (x >= current[0] && x <= next[0]) {
                    const ratio = (x - current[0]) / (next[0] - current[0]);
                    return current[1] + ratio * (next[1] - current[1]);
                }
            }

            if (x < sortedPredictions[0][0]) return sortedPredictions[0][1];
            return sortedPredictions[sortedPredictions.length - 1][1];
        };
    }, [regression, isMultivariate]);

    const { combinedData, identityLine, coefficientData } = useMemo(() => {
        if (data.length === 0) return { combinedData: [], identityLine: [], coefficientData: [] };

        if (isMultivariate) {
            let predictions = [];
            if (regression && regression.predictions) {
                predictions = regression.predictions.map(p => ({
                    actual: p[0],
                    predicted: p[1]
                }));
            }
            
            let minVal = 0;
            let maxVal = 0;
            if (predictions.length > 0) {
                const allVals = predictions.flatMap(p => [p.actual, p.predicted]);
                minVal = Math.min(...allVals);
                maxVal = Math.max(...allVals);
            }
            
            const identLine = [
                { actual: minVal, predicted: minVal },
                { actual: maxVal, predicted: maxVal }
            ];
            
            const coefs = [];
            if (regression && regression.coefficients && regression.feature_names) {
                regression.coefficients.forEach((coef, idx) => {
                    coefs.push({
                        feature: regression.feature_names[idx],
                        coefficient: coef
                    });
                });
            }

            return { combinedData: predictions, identityLine: identLine, coefficientData: coefs };
        }

        const sortedData = [...data].sort((a, b) => a.x - b.x);
        const minX = Math.min(...sortedData.map(d => d.x));
        const maxX = Math.max(...sortedData.map(d => d.x));
        const rangeX = maxX - minX || 1;
        const plotMinX = minX - rangeX * 0.1;
        const plotMaxX = maxX + rangeX * 0.1;

        const combined = [];
        sortedData.forEach(point => {
            combined.push({
                x: point.x,
                y: point.y,
                regressionY: regressionPredictor ? regressionPredictor(point.x) : undefined
            });
        });

        if (regressionPredictor) {
            const step = (plotMaxX - plotMinX) / 200;
            for (let x = plotMinX; x <= plotMaxX; x += step) {
                if (!combined.find(p => Math.abs(p.x - x) < 0.001)) {
                    try {
                        const y = regressionPredictor(x);
                        if (isFinite(y)) {
                            combined.push({ x, regressionY: y });
                        }
                    } catch (e) {}
                }
            }
        }
        
        combined.sort((a, b) => a.x - b.x);
        return { combinedData: combined, identityLine: [], coefficientData: [] };
    }, [data, regression, regressionPredictor, isMultivariate]);

    // Selected point logic
    const selectedPoint = useMemo(() => {
        if (selectedPointIndex !== undefined && selectedPointIndex !== null) {
            if (isMultivariate) {
                return combinedData[selectedPointIndex] || null;
            }
            return data[selectedPointIndex] || null;
        }
        return null;
    }, [data, combinedData, selectedPointIndex, isMultivariate]);

    // Highlight the latest prediction point
    const latestPrediction = useMemo(() => {
        if (data.length < 2 || isMultivariate || !regressionPredictor) return null;
        
        // Find point with highest X value
        const sortedData = [...data].sort((a, b) => a.x - b.x);
        const latest = sortedData[sortedData.length - 1];
        
        // Check if the latest point matches prediction fit within 1% tolerance
        const predictedY = regressionPredictor(latest.x);
        if (isFinite(predictedY)) {
            const tolerance = Math.max(0.001, Math.abs(predictedY * 0.01));
            if (Math.abs(latest.y - predictedY) < tolerance) {
                return latest;
            }
        }
        
        return null;
    }, [data, isMultivariate, regressionPredictor]);

    if (data.length === 0) return null;

    if (isMultivariate) {
        return (
            <div className="w-full flex flex-col gap-6 relative" ref={ref}>
                <div className="flex justify-end mb-1">
                    <Button variant="outline" size="sm" onClick={handleExportSVG} className="gap-1.5 text-xs">
                        <Download className="h-3.5 w-3.5" />
                        Export SVG
                    </Button>
                </div>
                
                {selectedPoint && (
                    <div className="absolute top-16 left-6 z-10 bg-background/95 backdrop-blur-md border rounded-xl p-3.5 shadow-lg max-w-[240px] text-xs">
                        <div className="font-semibold text-primary mb-1.5 flex items-center gap-1.5">
                            <span className="h-2 w-2 rounded-full bg-[#D4AF37] animate-pulse"></span>
                            Selected Point (HUD)
                        </div>
                        <div className="space-y-1 text-muted-foreground font-mono">
                            <div>Actual: <span className="text-foreground font-semibold">{selectedPoint.actual.toFixed(4)}</span></div>
                            <div>Predicted: <span className="text-foreground font-semibold">{selectedPoint.predicted.toFixed(4)}</span></div>
                            <div>Residual: <span className="text-foreground font-semibold">{(selectedPoint.actual - selectedPoint.predicted).toFixed(4)}</span></div>
                        </div>
                    </div>
                )}
                
                <div ref={chartContainerRef} className="flex flex-col gap-8">
                    <div className="bg-white dark:bg-slate-950 p-4 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm">
                        <h4 className="text-sm font-semibold mb-4 text-center">Predicted vs Actual Values</h4>
                        <ResponsiveContainer width="100%" height={350}>
                            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                                <XAxis type="number" dataKey="actual" name="Actual Value" domain={['auto', 'auto']} />
                                <YAxis type="number" dataKey="predicted" name="Predicted Value" domain={['auto', 'auto']} />
                                <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                                <Scatter name="Predictions" data={combinedData} fill="#3b82f6" shape="circle" />
                                <Line dataKey="predicted" data={identityLine} type="monotone" stroke="#ef4444" strokeWidth={2} dot={false} activeDot={false} isAnimationActive={false} />
                                {selectedPoint && (
                                    <>
                                        <ReferenceLine x={selectedPoint.actual} stroke="#D4AF37" strokeDasharray="3 3" />
                                        <ReferenceLine y={selectedPoint.predicted} stroke="#D4AF37" strokeDasharray="3 3" />
                                        <ReferenceDot
                                            x={selectedPoint.actual}
                                            y={selectedPoint.predicted}
                                            r={6}
                                            fill="#D4AF37"
                                            stroke="#fff"
                                            strokeWidth={2}
                                        />
                                    </>
                                )}
                            </ScatterChart>
                        </ResponsiveContainer>
                    </div>

                    {coefficientData.length > 0 && (
                        <div className="bg-white dark:bg-slate-950 p-4 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm">
                            <h4 className="text-sm font-semibold mb-4 text-center">Feature Importance / Coefficients</h4>
                            <ResponsiveContainer width="100%" height={250}>
                                <BarChart data={coefficientData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                                    <XAxis dataKey="feature" />
                                    <YAxis />
                                    <Tooltip />
                                    <Bar dataKey="coefficient" fill="#10b981" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="w-full relative group" ref={ref}>
            <div className="flex justify-end mb-1">
                <Button variant="outline" size="sm" onClick={handleExportSVG} className="gap-1.5 text-xs">
                    <Download className="h-3.5 w-3.5" />
                    Export SVG
                </Button>
            </div>
            
            {selectedPoint && (
                <div className="absolute top-16 left-6 z-10 bg-background/95 backdrop-blur-md border rounded-xl p-3.5 shadow-lg max-w-[240px] text-xs">
                    <div className="font-semibold text-primary mb-1.5 flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-[#D4AF37] animate-pulse"></span>
                        Selected Point (HUD)
                    </div>
                    <div className="space-y-1 text-muted-foreground font-mono">
                        {isMultivariate ? (
                            <>
                                <div>Actual Y: <span className="text-foreground font-semibold">{selectedPoint.actual !== undefined ? selectedPoint.actual.toFixed(4) : 'N/A'}</span></div>
                                <div>Predicted Y: <span className="text-foreground font-semibold">{selectedPoint.predicted !== undefined ? selectedPoint.predicted.toFixed(4) : 'N/A'}</span></div>
                            </>
                        ) : (
                            <>
                                <div>X: <span className="text-foreground font-semibold">{selectedPoint.x !== undefined ? selectedPoint.x.toFixed(4) : 'N/A'}</span></div>
                                <div>Y: <span className="text-foreground font-semibold">{selectedPoint.y !== undefined ? selectedPoint.y.toFixed(4) : 'N/A'}</span></div>
                                {regressionPredictor && (
                                    <>
                                        <div>Predicted: <span className="text-foreground font-semibold">
                                            {typeof regressionPredictor(selectedPoint.x) === 'number' 
                                                ? regressionPredictor(selectedPoint.x).toFixed(4) 
                                                : 'N/A'}
                                        </span></div>
                                        <div>Residual: <span className="text-foreground font-semibold">
                                            {typeof regressionPredictor(selectedPoint.x) === 'number' 
                                                ? (selectedPoint.y - regressionPredictor(selectedPoint.x)).toFixed(4) 
                                                : 'N/A'}
                                        </span></div>
                                    </>
                                )}
                            </>
                        )}
                    </div>
                </div>
            )}

            <div ref={chartContainerRef} className="bg-white dark:bg-slate-950 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm transition-shadow hover:shadow-md">
                <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={combinedData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                        <XAxis 
                            dataKey="x" 
                            type="number" 
                            domain={['auto', 'auto']} 
                            tickFormatter={(value) => parseFloat(value).toFixed(2)}
                            stroke="#94a3b8"
                        />
                        <YAxis 
                            domain={['auto', 'auto']} 
                            tickFormatter={(value) => parseFloat(value).toFixed(2)}
                            stroke="#94a3b8"
                        />
                        <Tooltip 
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            labelFormatter={(value) => `X: ${parseFloat(value).toFixed(4)}`}
                            formatter={(value, name) => [
                                parseFloat(value).toFixed(4), 
                                name === 'regressionY' ? 'Prediction' : 'Actual'
                            ]}
                        />
                        <Line
                            type="monotone"
                            dataKey="regressionY"
                            stroke="#3b82f6"
                            strokeWidth={3}
                            dot={false}
                            activeDot={false}
                            name="regressionY"
                            isAnimationActive={false}
                        />
                        <Line
                            type="scatter"
                            dataKey="y"
                            stroke="#ef4444"
                            strokeWidth={0}
                            dot={{ stroke: '#ef4444', strokeWidth: 2, r: 4, fill: '#fff' }}
                            activeDot={{ r: 6, fill: '#ef4444' }}
                            name="y"
                            isAnimationActive={false}
                        />
                        {latestPrediction && (
                            <ReferenceLine 
                                x={latestPrediction.x} 
                                stroke="#10b981" 
                                strokeDasharray="5 5"
                                label={{ value: "Prediction", position: "top", fill: "#10b981", fontSize: 10 }}
                            />
                        )}
                        {selectedPoint && (
                            <>
                                <ReferenceLine x={selectedPoint.x} stroke="#D4AF37" strokeDasharray="3 3" />
                                <ReferenceLine y={selectedPoint.y} stroke="#D4AF37" strokeDasharray="3 3" />
                                <ReferenceDot
                                    x={selectedPoint.x}
                                    y={selectedPoint.y}
                                    r={6}
                                    fill="#D4AF37"
                                    stroke="#fff"
                                    strokeWidth={2}
                                />
                            </>
                        )}
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
});

DataPlot.displayName = "DataPlot";