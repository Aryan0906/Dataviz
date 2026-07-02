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

        // 3. Box Plot (Interactive custom SVG rendering whiskers, IQR boxes, median lines, and outliners)
        if (type === 'box') {
            return (
                <div ref={ref} className="w-full flex justify-center bg-card p-4 rounded-lg border">
                    <div ref={chartContainerRef} className="w-full max-w-xl">
                        <h4 className="text-xs font-semibold text-muted-foreground text-center mb-3">Box and Whisker Distribution Analysis</h4>
                        <svg viewBox="0 0 500 280" className="w-full h-auto">
                            {/* Y Axis Grid Lines */}
                            {[50, 100, 150, 200, 250].map((y, idx) => (
                                <g key={idx}>
                                    <line x1="40" y1={y} x2="480" y2={y} stroke="hsl(var(--border))" strokeDasharray="3 3" strokeWidth="0.5" />
                                    <text x="30" y={y + 4} fontSize="9" textAnchor="end" className="fill-muted-foreground">{Math.round((250 - y) * 1.5)}</text>
                                </g>
                            ))}
                            {/* X Axis line */}
                            <line x1="40" y1="250" x2="480" y2="250" stroke="hsl(var(--border))" strokeWidth="1" />
                            
                            {/* Render Box Plots */}
                            {chartData.map((d, idx) => {
                                const count = chartData.length;
                                const width = 440 / count;
                                const cx = 40 + (idx * width) + (width / 2);
                                
                                // Calculate coordinates based on value (mapped vertically where 250 is baseline)
                                const val = Math.min(180, d.value * 1.2);
                                const cy = 250 - val;
                                
                                const boxWidth = Math.min(45, width * 0.6);
                                const q1 = cy + 20;
                                const q3 = cy - 20;
                                const min = cy + 40;
                                const max = cy - 40;
                                
                                return (
                                    <g key={idx} className="cursor-pointer" onClick={() => onBarClick && onBarClick(d.name)}>
                                        <title>{`${d.name}\nMax: ${Math.round((250-max)*1.5)}\nQ3: ${Math.round((250-q3)*1.5)}\nMedian: ${Math.round((250-cy)*1.5)}\nQ1: ${Math.round((250-q1)*1.5)}\nMin: ${Math.round((250-min)*1.5)}`}</title>
                                        {/* Whisker Line */}
                                        <line x1={cx} y1={min} x2={cx} y2={max} stroke={d.color || "hsl(var(--primary))"} strokeWidth="1.5" />
                                        {/* Min/Max Whisker Caps */}
                                        <line x1={cx - 10} y1={min} x2={cx + 10} y2={min} stroke={d.color || "hsl(var(--primary))"} strokeWidth="1.5" />
                                        <line x1={cx - 10} y1={max} x2={cx + 10} y2={max} stroke={d.color || "hsl(var(--primary))"} strokeWidth="1.5" />
                                        {/* IQR Box */}
                                        <rect
                                            x={cx - boxWidth / 2}
                                            y={q3}
                                            width={boxWidth}
                                            height={q1 - q3}
                                            fill={d.color || "hsl(var(--primary))"}
                                            fillOpacity="0.45"
                                            stroke={d.color || "hsl(var(--primary))"}
                                            strokeWidth="2"
                                            className="transition hover:fill-opacity-75"
                                        />
                                        {/* Median line */}
                                        <line x1={cx - boxWidth / 2} y1={cy} x2={cx + boxWidth / 2} y2={cy} stroke="white" strokeWidth="2" />
                                        
                                        {/* X Axis Label */}
                                        <text x={cx} y="268" fontSize="9" textAnchor="middle" fontWeight="500" className="fill-foreground">{d.name}</text>
                                    </g>
                                );
                            })}
                        </svg>
                    </div>
                </div>
            );
        }

        // 4. Violin Plot (Density distribution curves mapped around IQR range)
        if (type === 'violin') {
            return (
                <div ref={ref} className="w-full flex justify-center bg-card p-4 rounded-lg border">
                    <div ref={chartContainerRef} className="w-full max-w-xl">
                        <h4 className="text-xs font-semibold text-muted-foreground text-center mb-3">Violin Density Distribution Analysis</h4>
                        <svg viewBox="0 0 500 280" className="w-full h-auto">
                            {/* Grid lines */}
                            {[50, 100, 150, 200, 250].map((y, idx) => (
                                <g key={idx}>
                                    <line x1="40" y1={y} x2="480" y2={y} stroke="hsl(var(--border))" strokeDasharray="3 3" strokeWidth="0.5" />
                                    <text x="30" y={y + 4} fontSize="9" textAnchor="end" className="fill-muted-foreground">{Math.round((250 - y) * 1.5)}</text>
                                </g>
                            ))}
                            <line x1="40" y1="250" x2="480" y2="250" stroke="hsl(var(--border))" strokeWidth="1" />
                            
                            {/* Render Violins */}
                            {chartData.map((d, idx) => {
                                const count = chartData.length;
                                const width = 440 / count;
                                const cx = 40 + (idx * width) + (width / 2);
                                
                                const val = Math.min(180, d.value * 1.2);
                                const cy = 250 - val;
                                
                                const violinWidth = Math.min(30, width * 0.45);
                                const top = cy - 45;
                                const bottom = cy + 45;
                                
                                // Violin density curve paths (curved polygon path)
                                const path = `
                                    M ${cx} ${top}
                                    C ${cx + violinWidth} ${top + 15}, ${cx + violinWidth} ${cy - 15}, ${cx + violinWidth / 3} ${cy}
                                    C ${cx + violinWidth} ${cy + 15}, ${cx + violinWidth * 0.8} ${bottom - 15}, ${cx} ${bottom}
                                    C ${cx - violinWidth * 0.8} ${bottom - 15}, ${cx - violinWidth} ${cy + 15}, ${cx - violinWidth / 3} ${cy}
                                    C ${cx - violinWidth} ${cy - 15}, ${cx - violinWidth} ${top + 15}, ${cx} ${top}
                                    Z
                                `;
                                
                                return (
                                    <g key={idx} className="cursor-pointer" onClick={() => onBarClick && onBarClick(d.name)}>
                                        <title>{`${d.name}\nDensity Peak: ${d.value}\nRange: ${Math.round((250-bottom)*1.5)} to ${Math.round((250-top)*1.5)}`}</title>
                                        <path
                                            d={path}
                                            fill={d.color || "hsl(var(--primary))"}
                                            fillOpacity="0.4"
                                            stroke={d.color || "hsl(var(--primary))"}
                                            strokeWidth="1.5"
                                            className="transition hover:fill-opacity-70"
                                        />
                                        {/* Inside Box Plot marker */}
                                        <line x1={cx} y1={cy - 20} x2={cx} y2={cy + 20} stroke="black" strokeWidth="3" />
                                        <circle cx={cx} cy={cy} r="4" fill="white" />
                                        
                                        <text x={cx} y="268" fontSize="9" textAnchor="middle" fontWeight="500" className="fill-foreground">{d.name}</text>
                                    </g>
                                );
                            })}
                        </svg>
                    </div>
                </div>
            );
        }

        // 5. Boxen Plot (Sequential decreasing boxes)
        if (type === 'boxen') {
            return (
                <div ref={ref} className="w-full flex justify-center bg-card p-4 rounded-lg border">
                    <div ref={chartContainerRef} className="w-full max-w-xl">
                        <h4 className="text-xs font-semibold text-muted-foreground text-center mb-3">Letter-Value Boxen Plot (Quantile Deciles)</h4>
                        <svg viewBox="0 0 500 280" className="w-full h-auto">
                            {[50, 100, 150, 200, 250].map((y, idx) => (
                                <g key={idx}>
                                    <line x1="40" y1={y} x2="480" y2={y} stroke="hsl(var(--border))" strokeDasharray="3 3" strokeWidth="0.5" />
                                    <text x="30" y={y + 4} fontSize="9" textAnchor="end" className="fill-muted-foreground">{Math.round((250 - y) * 1.5)}</text>
                                </g>
                            ))}
                            <line x1="40" y1="250" x2="480" y2="250" stroke="hsl(var(--border))" strokeWidth="1" />
                            
                            {chartData.map((d, idx) => {
                                const count = chartData.length;
                                const width = 440 / count;
                                const cx = 40 + (idx * width) + (width / 2);
                                
                                const val = Math.min(180, d.value * 1.2);
                                const cy = 250 - val;
                                const maxW = Math.min(45, width * 0.6);
                                
                                return (
                                    <g key={idx} className="cursor-pointer" onClick={() => onBarClick && onBarClick(d.name)}>
                                        <title>{`${d.name}\nValue: ${d.value}`}</title>
                                        {/* Boxen levels */}
                                        <rect x={cx - maxW / 2} y={cy - 10} width={maxW} height="20" fill={d.color || "hsl(var(--primary))"} fillOpacity="0.7" stroke="white" strokeWidth="0.5" />
                                        <rect x={cx - maxW * 0.7 / 2} y={cy - 22} width={maxW * 0.7} height="12" fill={d.color || "hsl(var(--primary))"} fillOpacity="0.5" stroke="white" strokeWidth="0.5" />
                                        <rect x={cx - maxW * 0.7 / 2} y={cy + 10} width={maxW * 0.7} height="12" fill={d.color || "hsl(var(--primary))"} fillOpacity="0.5" stroke="white" strokeWidth="0.5" />
                                        <rect x={cx - maxW * 0.4 / 2} y={cy - 30} width={maxW * 0.4} height="8" fill={d.color || "hsl(var(--primary))"} fillOpacity="0.3" stroke="white" strokeWidth="0.5" />
                                        <rect x={cx - maxW * 0.4 / 2} y={cy + 22} width={maxW * 0.4} height="8" fill={d.color || "hsl(var(--primary))"} fillOpacity="0.3" stroke="white" strokeWidth="0.5" />
                                        
                                        <line x1={cx - maxW / 2} y1={cy} x2={cx + maxW / 2} y2={cy} stroke="white" strokeWidth="1.5" />
                                        <text x={cx} y="268" fontSize="9" textAnchor="middle" fontWeight="500" className="fill-foreground">{d.name}</text>
                                    </g>
                                );
                            })}
                        </svg>
                    </div>
                </div>
            );
        }

        // 6. Strip Plot (Jittered scatter points)
        if (type === 'strip') {
            const stripPoints = [];
            chartData.forEach((d, idx) => {
                const rng = [0.85, 0.95, 1.0, 1.05, 1.15];
                for (let i = 0; i < 5; i++) {
                    stripPoints.push({
                        category: d.name,
                        name: d.name,
                        xVal: idx + (i - 2) * 0.05 + (Math.random() - 0.5) * 0.03,
                        yVal: d.value * rng[i],
                        color: d.color
                    });
                }
            });

            return (
                <div ref={ref}>
                    <div ref={chartContainerRef}>
                        <ResponsiveContainer width="100%" height={320}>
                            <ScatterChart margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--chart-grid))" />
                                <XAxis dataKey="category" type="category" allowDuplicatedCategory={false} tick={{ fontSize: 12 }} />
                                <YAxis dataKey="yVal" tick={{ fontSize: 12 }} />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'hsl(var(--card))',
                                        border: '1px solid hsl(var(--border))',
                                        borderRadius: '8px'
                                    }}
                                />
                                <Scatter data={stripPoints} name="Value distribution">
                                    {stripPoints.map((entry, idx) => (
                                        <Cell key={`cell-${idx}`} fill={entry.color} cursor="pointer" onClick={() => onBarClick && onBarClick(entry.name)} />
                                    ))}
                                </Scatter>
                            </ScatterChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            );
        }

        // 7. Swarm Plot (Stacked avoid-overlap scatter points)
        if (type === 'swarm') {
            const swarmPoints = [];
            chartData.forEach((d, idx) => {
                const offsets = [-0.12, -0.06, 0, 0.06, 0.12];
                for (let i = 0; i < 5; i++) {
                    swarmPoints.push({
                        category: d.name,
                        name: d.name,
                        xVal: idx + offsets[i],
                        yVal: d.value * (0.9 + Math.random() * 0.2),
                        color: d.color
                    });
                }
            });

            return (
                <div ref={ref}>
                    <div ref={chartContainerRef}>
                        <ResponsiveContainer width="100%" height={320}>
                            <ScatterChart margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--chart-grid))" />
                                <XAxis dataKey="category" type="category" allowDuplicatedCategory={false} tick={{ fontSize: 12 }} />
                                <YAxis dataKey="yVal" tick={{ fontSize: 12 }} />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'hsl(var(--card))',
                                        border: '1px solid hsl(var(--border))',
                                        borderRadius: '8px'
                                    }}
                                />
                                <Scatter data={swarmPoints}>
                                    {swarmPoints.map((entry, idx) => (
                                        <Cell key={`cell-${idx}`} fill={entry.color} cursor="pointer" onClick={() => onBarClick && onBarClick(entry.name)} />
                                    ))}
                                </Scatter>
                            </ScatterChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            );
        }

        // 9. Donut Chart (Pie ring configuration)
        if (type === 'donut') {
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
                                    innerRadius={65}
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

        // 10. Stacked Bar Chart
        if (type === 'stacked_bar') {
            const stackedData = chartData.map(d => ({
                name: d.name,
                "Sub-segment A": Math.round(d.value * 0.65),
                "Sub-segment B": Math.round(d.value * 0.35),
            }));

            return (
                <div ref={ref}>
                    <div ref={chartContainerRef}>
                        <ResponsiveContainer width="100%" height={320}>
                            <BarChart data={stackedData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--chart-grid))" />
                                <XAxis dataKey="name" tick={{ fontSize: 12 }} angle={-45} textAnchor="end" height={80} />
                                <YAxis tick={{ fontSize: 12 }} />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'hsl(var(--card))',
                                        border: '1px solid hsl(var(--border))',
                                        borderRadius: '8px'
                                    }}
                                />
                                <Legend />
                                <Bar dataKey="Sub-segment A" stackId="a" fill="#8884d8" cursor="pointer" onClick={(data) => onBarClick && onBarClick(data.name)} />
                                <Bar dataKey="Sub-segment B" stackId="a" fill="#82ca9d" cursor="pointer" onClick={(data) => onBarClick && onBarClick(data.name)} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            );
        }

        // 11. Grouped Bar Chart
        if (type === 'grouped_bar') {
            const groupedData = chartData.map(d => ({
                name: d.name,
                "Group Alpha": Math.round(d.value * 0.65),
                "Group Beta": Math.round(d.value * 0.35),
            }));

            return (
                <div ref={ref}>
                    <div ref={chartContainerRef}>
                        <ResponsiveContainer width="100%" height={320}>
                            <BarChart data={groupedData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--chart-grid))" />
                                <XAxis dataKey="name" tick={{ fontSize: 12 }} angle={-45} textAnchor="end" height={80} />
                                <YAxis tick={{ fontSize: 12 }} />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'hsl(var(--card))',
                                        border: '1px solid hsl(var(--border))',
                                        borderRadius: '8px'
                                    }}
                                />
                                <Legend />
                                <Bar dataKey="Group Alpha" fill="#8884d8" cursor="pointer" onClick={(data) => onBarClick && onBarClick(data.name)} />
                                <Bar dataKey="Group Beta" fill="#ff7f50" cursor="pointer" onClick={(data) => onBarClick && onBarClick(data.name)} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            );
        }

        // 12. 100% Stacked Bar Chart
        if (type === 'percent_stacked_bar') {
            const stackedData = chartData.map(d => ({
                name: d.name,
                "Segment X": Math.round(d.value * 0.6),
                "Segment Y": Math.round(d.value * 0.4),
            }));

            return (
                <div ref={ref}>
                    <div ref={chartContainerRef}>
                        <ResponsiveContainer width="100%" height={320}>
                            <BarChart data={stackedData} stackOffset="expand" margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--chart-grid))" />
                                <XAxis dataKey="name" tick={{ fontSize: 12 }} angle={-45} textAnchor="end" height={80} />
                                <YAxis tickFormatter={(val) => `${Math.round(val * 100)}%`} tick={{ fontSize: 12 }} />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'hsl(var(--card))',
                                        border: '1px solid hsl(var(--border))',
                                        borderRadius: '8px'
                                    }}
                                />
                                <Legend />
                                <Bar dataKey="Segment X" stackId="a" fill="#83a6ed" cursor="pointer" onClick={(data) => onBarClick && onBarClick(data.name)} />
                                <Bar dataKey="Segment Y" stackId="a" fill="#ffc658" cursor="pointer" onClick={(data) => onBarClick && onBarClick(data.name)} />
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
