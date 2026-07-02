import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell, Legend, Treemap, LineChart, Line, AreaChart, Area, ScatterChart, Scatter, ZAxis, PolarGrid, PolarAngleAxis, PolarRadiusAxis, RadarChart, Radar } from "recharts";
import { useMemo, forwardRef, useRef, useCallback } from "react";
import { DataPlot } from "./DataPlot";
import { useTheme } from "@/components/theme-provider";

const COLORS = [
    '#8884d8', '#82ca9d', '#ffc658', '#ff7f50', '#a4de6c',
    '#d0ed57', '#8dd1e1', '#83a6ed', '#8e44ad', '#f39c12'
];

export const UniversalChart = forwardRef(
    ({ type, data = [], regression = null, categories = [], onBarClick = null, onPointClick = null, xAxisKey, dataKeys, selectedPointIndex }, ref) => {
        const chartContainerRef = useRef(null);
        const { theme } = useTheme();

        // Unify raw, new, and old data formats into a single, clean parsed array
        const chartData = useMemo(() => {
            if (Array.isArray(data) && data.length > 0 && !data.labels) {
                const xKey = xAxisKey || 'label';
                const yKey = (dataKeys && dataKeys[0]) || 'Count';
                const firstElem = data[0];
                const actualXKey = xKey in firstElem ? xKey : Object.keys(firstElem)[0];
                const actualYKey = yKey in firstElem ? yKey : (Object.keys(firstElem)[1] || actualXKey);
                
                return data.map((item, idx) => ({
                    name: String(item[actualXKey] !== undefined ? item[actualXKey] : ''),
                    value: Number(item[actualYKey] !== undefined ? item[actualYKey] : 0),
                    color: item.color || COLORS[idx % COLORS.length]
                }));
            }

            if (data?.labels && data?.datasets) {
                // New format: { labels: [...], datasets: [{ data: [...] }] }
                return data.labels.map((label, idx) => ({
                    name: label,
                    value: data.datasets[0]?.data[idx] || 0,
                    color: data.datasets[0]?.backgroundColor?.[idx] || '#8884d8'
                }));
            }

            // Old format: categories array
            return categories.map((c, idx) => ({
                name: c.label,
                value: c.value,
                color: c.color || COLORS[idx % COLORS.length]
            }));
        }, [data, categories, xAxisKey, dataKeys]);

        if (type === 'regression') {
            return <DataPlot ref={ref} data={data} regression={regression} selectedPointIndex={selectedPointIndex} onPointClick={onPointClick} />;
        }

        const handleBarClick = (entry) => {
            const key = entry?.name || entry?.label;
            if (onBarClick && key) {
                onBarClick(key);
            }
        };

        if (type === 'bar') {
            return (
                <div ref={ref}>
                    <div ref={chartContainerRef}>
                        <ResponsiveContainer width="100%" height={320}>
                            <BarChart
                                data={chartData}
                                margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                                onClick={(data) => data?.activePayload?.[0] && handleBarClick(data.activePayload[0].payload)}
                            >
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--chart-grid))" />
                                <XAxis
                                    dataKey="name"
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
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            );
        }

        if (type === 'line') {
            return (
                <div ref={ref}>
                    <div ref={chartContainerRef}>
                        <ResponsiveContainer width="100%" height={320}>
                            <LineChart
                                data={chartData}
                                margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--chart-grid))" />
                                <XAxis
                                    dataKey="name"
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
                                <Legend />
                                <Line
                                    type="monotone"
                                    dataKey="value"
                                    stroke="hsl(var(--chart-primary))"
                                    activeDot={{ r: 8 }}
                                    cursor="pointer"
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            );
        }

        if (type === 'area') {
            return (
                <div ref={ref}>
                    <div ref={chartContainerRef}>
                        <ResponsiveContainer width="100%" height={320}>
                            <AreaChart
                                data={chartData}
                                margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--chart-grid))" />
                                <XAxis
                                    dataKey="name"
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
                                <Legend />
                                <Area
                                    type="monotone"
                                    dataKey="value"
                                    stroke="hsl(var(--chart-primary))"
                                    fill="hsl(var(--chart-primary))"
                                    fillOpacity={0.3}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            );
        }

        if (type === 'pie') {
            return (
                <div ref={ref}>
                    <div ref={chartContainerRef}>
                        <ResponsiveContainer width="100%" height={320}>
                            <PieChart>
                                <Pie
                                    data={chartData}
                                    dataKey="value"
                                    nameKey="name"
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={100}
                                    label={(entry) => `${entry.name}: ${entry.value}`}
                                    onClick={(entry) => onBarClick && onBarClick(entry.name)}
                                    cursor="pointer"
                                >
                                    {chartData.map((entry, index) => (
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
            const CustomTreemapContent = ({ x, y, width, height, name, value, color }) => {
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
                                    {value}
                                </text>
                            </>
                        )}
                    </g>
                );
            };

            return (
                <div ref={ref}>
                    <div ref={chartContainerRef}>
                        <ResponsiveContainer width="100%" height={320}>
                            <Treemap
                                data={chartData}
                                dataKey="value"
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

        // 2. Count Plot (Horizontal bar chart layout)
        if (type === 'count') {
            return (
                <div ref={ref}>
                    <div ref={chartContainerRef}>
                        <ResponsiveContainer width="100%" height={Math.max(320, chartData.length * 45)}>
                            <BarChart
                                layout="vertical"
                                data={chartData}
                                margin={{ top: 20, right: 30, left: 80, bottom: 20 }}
                                onClick={(data) => data?.activePayload?.[0] && handleBarClick(data.activePayload[0].payload)}
                            >
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--chart-grid))" />
                                <XAxis type="number" tick={{ fontSize: 12 }} />
                                <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={75} />
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
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            );
        }

        return null;
    }
);

UniversalChart.displayName = 'UniversalChart';
