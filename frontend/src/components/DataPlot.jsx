import { useMemo, forwardRef, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp, Download } from "lucide-react";
import { exportChartAsSVG, generateFilename } from "@/lib/chartExport";
import { useTheme } from "@/components/theme-provider";

export const DataPlot = forwardRef(({ data, regression }, ref) => {
    const chartContainerRef = useRef(null);
    const { theme } = useTheme();

    const regressionPredictor = useMemo(() => {
        if (typeof regression?.predict === 'function') {
            return regression.predict;
        }

        const predictions = Array.isArray(regression?.predictions) ? regression.predictions : [];
        if (predictions.length === 0) {
            return null;
        }

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
    }, [regression]);

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
            description: `Regression chart with ${data.length} data points${regression ? `, R²=${regression.r2.toFixed(4)}` : ''}`,
        });
    }, [theme, data, regression]);

    const plotData = useMemo(() => {
        if (data.length === 0) return [];

        const sortedData = [...data].sort((a, b) => a.x - b.x);
        const minX = Math.min(...sortedData.map(d => d.x));
        const maxX = Math.max(...sortedData.map(d => d.x));
        const rangeX = maxX - minX || 1;
        const plotMinX = minX - rangeX * 0.1;
        const plotMaxX = maxX + rangeX * 0.1;

        const regressionPoints = [];
        if (regressionPredictor) {
            const step = (plotMaxX - plotMinX) / 200;
            for (let x = plotMinX; x <= plotMaxX; x += step) {
                try {
                    const y = regressionPredictor(x);
                    if (isFinite(y)) {
                        regressionPoints.push({ x, regressionY: y });
                    }
                } catch (_error) {
                    // Ignore non-finite prediction values
                }
            }
        }

        // Use Map for O(1) lookups instead of O(n) find operations
        const combined = [];

        const dataMap = new Map();
        sortedData.forEach(point => {
            dataMap.set(point.x, point);
        });

        // Add all data points with their regression values
        sortedData.forEach(point => {
            combined.push({
                x: point.x,
                y: point.y,
                regressionY: regressionPredictor ? regressionPredictor(point.x) : undefined
            });
        });

        // Add regression-only points (not in original data)
        regressionPoints.forEach(point => {
            if (!dataMap.has(point.x)) {
                combined.push({
                    x: point.x,
                    y: undefined,
                    regressionY: point.regressionY
                });
            }
        });

        return combined.sort((a, b) => a.x - b.x);
    }, [data, regressionPredictor]);

    const formatTooltip = (value, name) => {
        if (typeof value === 'number') {
            return [value.toFixed(4), name === 'y' ? 'Actual' : 'Fitted'];
        }
        return [String(value), name];
    };

    return (
        <Card className="shadow-card" ref={ref}>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-primary" />
                        Chart
                    </CardTitle>
                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleExportSVG}
                            className="gap-1.5 text-xs"
                            title="Export chart as SVG/XML"
                        >
                            <Download className="h-3.5 w-3.5" />
                            Export SVG
                        </Button>
                        <div className="flex flex-col gap-2 items-end">
                            <div className="flex gap-2">
                                <Badge variant="outline">{data.length} points</Badge>
                                {regression && (
                                    <Badge variant="secondary">
                                        R² = {regression.r2.toFixed(3)}
                                    </Badge>
                                )}
                            </div>
                            {regression?.equation && (
                                <div className="text-xs text-muted-foreground max-w-md text-right">
                                    {regression.equation}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="h-80" ref={chartContainerRef}>
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={plotData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--chart-grid))" />
                            <XAxis
                                dataKey="x"
                                type="number"
                                scale="linear"
                                domain={['dataMin', 'dataMax']}
                                tick={{ fontSize: 12 }}
                            />
                            <YAxis
                                type="number"
                                domain={['dataMin', 'dataMax']}
                                tick={{ fontSize: 12 }}
                            />
                            <Tooltip
                                formatter={formatTooltip}
                                contentStyle={{
                                    backgroundColor: 'hsl(var(--card))',
                                    border: '1px solid hsl(var(--border))',
                                    borderRadius: '8px'
                                }}
                            />

                            <Line
                                type="monotone"
                                dataKey="y"
                                stroke="transparent"
                                strokeWidth={0}
                                dot={{ fill: 'hsl(var(--chart-primary))', r: 5 }}
                                activeDot={{ r: 6 }}
                                name="Data Points"
                                connectNulls={false}
                            />

                            {regressionPredictor && (
                                <Line
                                    type="monotone"
                                    dataKey="regressionY"
                                    stroke="hsl(var(--chart-secondary))"
                                    strokeWidth={3}
                                    dot={false}
                                    name="Fit"
                                    connectNulls={true}
                                />
                            )}
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
});

DataPlot.displayName = 'DataPlot';
