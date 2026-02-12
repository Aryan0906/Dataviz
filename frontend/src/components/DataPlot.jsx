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

        const regressionPoints = [];
        if (regression) {
            // Reduced from 100 to 50 points for better performance
            const step = (maxX - minX) / 50;
            for (let x = minX; x <= maxX; x += step) {
                try {
                    // Assuming regression object has predict method
                    const y = regression.predict(x);
                    if (isFinite(y)) {
                        regressionPoints.push({ x, regressionY: y });
                    }
                } catch (error) {
                    // Skip invalid points
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
                regressionY: regression ? regression.predict(point.x) : undefined
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
    }, [data, regression]);

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
                                stroke="hsl(var(--chart-primary))"
                                strokeWidth={2}
                                dot={{ fill: 'hsl(var(--chart-primary))', r: 4 }}
                                name="Data"
                                connectNulls={false}
                            />

                            {regression && (
                                <Line
                                    type="monotone"
                                    dataKey="regressionY"
                                    stroke="hsl(var(--chart-secondary))"
                                    strokeWidth={2}
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
