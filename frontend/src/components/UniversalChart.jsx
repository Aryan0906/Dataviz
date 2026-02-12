import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell, Legend, Treemap } from "recharts";
import { useMemo, forwardRef, useRef, useCallback } from "react";
import { DataPlot } from "./DataPlot";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { exportChartAsSVG, generateFilename } from "@/lib/chartExport";
import { useTheme } from "@/components/theme-provider";

export const UniversalChart = forwardRef(
    ({ type, data = [], regression = null, categories = [], onBarClick = null }, ref) => {
        const chartContainerRef = useRef(null);
        const { theme } = useTheme();

        const handleExportSVG = useCallback(() => {
            const el = chartContainerRef.current;
            if (!el) return;
            const currentTheme = theme === 'system'
                ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
                : (theme || 'light');
            const filename = generateFilename(`dataviz-${type}-chart`);
            exportChartAsSVG(el, filename, currentTheme, {
                title: `${type.charAt(0).toUpperCase() + type.slice(1)} Chart`,
                chartType: type,
                description: `${type} chart exported from DataViz`,
            });
        }, [theme, type]);

        if (type === 'regression') {
            return <DataPlot ref={ref} data={data} regression={regression} />;
        }

        // Support both old format (categories array) and new format (data object with labels/datasets)
        const barData = useMemo(() => {
            if (data?.labels && data?.datasets) {
                // New format: { labels: [...], datasets: [{ data: [...] }] }
                return data.labels.map((label, idx) => ({
                    label: label,
                    value: data.datasets[0]?.data[idx] || 0,
                    color: data.datasets[0]?.backgroundColor?.[idx] || '#8884d8'
                }));
            }
            // Old format: categories array
            return categories;
        }, [data, categories]);

        const pieData = useMemo(() => {
            if (data?.labels && data?.datasets) {
                return data.labels.map((label, idx) => ({
                    name: label,
                    value: data.datasets[0]?.data[idx] || 0,
                    color: data.datasets[0]?.backgroundColor?.[idx] || '#8884d8'
                }));
            }
            return categories.map(c => ({ name: c.label, value: c.value }));
        }, [data, categories]);

        const treemapData = useMemo(() => {
            if (data?.labels && data?.datasets) {
                return data.labels.map((label, idx) => ({
                    name: label,
                    size: data.datasets[0]?.data[idx] || 0,
                    color: data.datasets[0]?.backgroundColor?.[idx] || '#8884d8'
                }));
            }
            return categories.map(c => ({ name: c.label, size: c.value }));
        }, [data, categories]);

        const COLORS = [
            '#8884d8', '#82ca9d', '#ffc658', '#ff7f50', '#a4de6c',
            '#d0ed57', '#8dd1e1', '#83a6ed', '#8e44ad', '#f39c12'
        ];

        const handleBarClick = (entry) => {
            if (onBarClick && entry?.label) {
                onBarClick(entry.label);
            }
        };

        // SVG Export button overlay component
        const SvgExportButton = () => (
            <div className="flex justify-end mb-1">
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
            </div>
        );

        if (type === 'bar') {
            return (
                <div ref={ref}>
                    <SvgExportButton />
                    <div ref={chartContainerRef}>
                        <ResponsiveContainer width="100%" height={320}>
                            <BarChart
                                data={barData}
                                margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                                onClick={(data) => data?.activePayload?.[0] && handleBarClick(data.activePayload[0].payload)}
                            >
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--chart-grid))" />
                                <XAxis
                                    dataKey="label"
                                    tick={{ fontSize: 12 }}
                                    angle={-45}
                                    textAnchor="end"
                                    height={80}
                                />
                                <YAxis tick={{ fontSize: 12 }} />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'hsl(var(--card))',
                                        border: '1px solid hsl(var(--border))',
                                        borderRadius: '8px'
                                    }}
                                />
                                <Bar
                                    dataKey="value"
                                    fill="hsl(var(--chart-primary))"
                                    cursor="pointer"
                                >
                                    {barData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            );
        }

        if (type === 'pie') {
            return (
                <div ref={ref}>
                    <SvgExportButton />
                    <div ref={chartContainerRef}>
                        <ResponsiveContainer width="100%" height={320}>
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    dataKey="value"
                                    nameKey="name"
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={100}
                                    label={(entry) => `${entry.name}: ${entry.value}`}
                                    onClick={(entry) => onBarClick && onBarClick(entry.name)}
                                    cursor="pointer"
                                >
                                    {pieData.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={entry.color || COLORS[index % COLORS.length]}
                                        />
                                    ))}
                                </Pie>
                                <Legend />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'hsl(var(--card))',
                                        border: '1px solid hsl(var(--border))',
                                        borderRadius: '8px'
                                    }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            );
        }

        if (type === 'treemap') {
            // Treemap rendering with custom content
            const CustomTreemapContent = ({ x, y, width, height, name, size, color }) => {
                return (
                    <g>
                        <rect
                            x={x}
                            y={y}
                            width={width}
                            height={height}
                            style={{
                                fill: color || '#8884d8',
                                stroke: 'hsl(var(--border))',
                                strokeWidth: 2,
                            }}
                            onClick={() => onBarClick && onBarClick(name)}
                            cursor="pointer"
                        />
                        {width > 50 && height > 30 && (
                            <>
                                <text
                                    x={x + width / 2}
                                    y={y + height / 2 - 10}
                                    textAnchor="middle"
                                    fill="white"
                                    fontSize={12}
                                    fontWeight="bold"
                                >
                                    {name}
                                </text>
                                <text
                                    x={x + width / 2}
                                    y={y + height / 2 + 10}
                                    textAnchor="middle"
                                    fill="white"
                                    fontSize={14}
                                    fontWeight="bold"
                                >
                                    {size}
                                </text>
                            </>
                        )}
                    </g>
                );
            };

            return (
                <div ref={ref}>
                    <SvgExportButton />
                    <div ref={chartContainerRef}>
                        <ResponsiveContainer width="100%" height={320}>
                            <Treemap
                                data={treemapData}
                                dataKey="size"
                                aspectRatio={4 / 3}
                                stroke="hsl(var(--border))"
                                fill="hsl(var(--chart-primary))"
                                content={<CustomTreemapContent />}
                            >
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'hsl(var(--card))',
                                        border: '1px solid hsl(var(--border))',
                                        borderRadius: '8px'
                                    }}
                                />
                            </Treemap>
                        </ResponsiveContainer>
                    </div>
                </div>
            );
        }

        return null;
    }
);

UniversalChart.displayName = 'UniversalChart';
