import { useMemo, useState, useRef } from "react";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import HCHeatmap from "highcharts/modules/heatmap";
import HCExporting from "highcharts/modules/exporting";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
    ResponsiveContainer,
    ScatterChart,
    Scatter,
    Legend,
} from "recharts";
import {
    Sparkles,
    MessageSquare,
    Bot,
    User,
    Wand2,
    BarChart3,
    PieChart as PieIcon,
    ScatterChart as ScatterIcon,
    Flame,
    RefreshCcw,
    Edit3,
    Plus,
    Upload,
    FileUp,
    Download,
    FileImage,
    FileText,
    Moon,
    Sun,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import Papa from "papaparse";
import { exportChartAsPNG, exportChartAsPDF } from "@/lib/chartExport";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

HCHeatmap(Highcharts);
HCExporting(Highcharts);

const INITIAL_DATA = [
    { label: "Apples", value: 32 },
    { label: "Bananas", value: 18 },
    { label: "Cherries", value: 24 },
    { label: "Dates", value: 12 },
    { label: "Elderberries", value: 8 },
];

const chartOptions = [
    { value: "bar", label: "Bar", icon: <BarChart3 className="h-4 w-4" /> },
    { value: "pie", label: "Pie", icon: <PieIcon className="h-4 w-4" /> },
    { value: "histogram", label: "Histogram", icon: <Flame className="h-4 w-4" /> },
    { value: "scatter", label: "Scatter", icon: <ScatterIcon className="h-4 w-4" /> },
    { value: "heatmap", label: "Heatmap", icon: <Wand2 className="h-4 w-4" /> },
];

const PIE_COLORS = ["#8b5cf6", "#06b6d4", "#10b981", "#f59e0b", "#ef4444", "#ec4899"];

const formatNumber = (val) => Number.isFinite(val) ? val.toFixed(2) : "-";

const computeStats = (data) => {
    if (!data.length) {
        return {
            count: 0,
            sum: 0,
            mean: 0,
            median: 0,
            mode: "-",
            min: 0,
            max: 0,
            range: 0,
            stdev: 0,
        };
    }
    const values = data.map((d) => d.value).sort((a, b) => a - b);
    const count = values.length;
    const sum = values.reduce((a, b) => a + b, 0);
    const mean = sum / count;
    const median = count % 2 === 0
        ? (values[count / 2 - 1] + values[count / 2]) / 2
        : values[Math.floor(count / 2)];
    const freq = new Map();
    values.forEach((v) => freq.set(v, (freq.get(v) || 0) + 1));
    let modeVal = values[0];
    let modeFreq = 0;
    freq.forEach((f, v) => {
        if (f > modeFreq) {
            modeFreq = f;
            modeVal = v;
        }
    });
    const min = values[0];
    const max = values[values.length - 1];
    const range = max - min;
    const variance = values.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / count;
    const stdev = Math.sqrt(variance);
    return { count, sum, mean, median, mode: modeVal.toString(), min, max, range, stdev };
};

const normalizeLabel = (label) => label.trim().toLowerCase();

const buildHistogram = (data) => {
    if (!data.length) return [];
    const values = data.map((d) => d.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const binCount = Math.min(8, Math.max(3, Math.round(Math.sqrt(values.length))));
    const span = max - min || 1;
    const binSize = span / binCount;
    const bins = Array.from({ length: binCount }, (_, idx) => {
        const start = min + idx * binSize;
        const end = idx === binCount - 1 ? max : start + binSize;
        return { label: `${start.toFixed(1)} - ${end.toFixed(1)}`, count: 0, range: [start, end] };
    });
    values.forEach((v) => {
        let index = Math.floor((v - min) / binSize);
        if (index >= binCount) index = binCount - 1;
        bins[index].count += 1;
    });
    return bins;
};

const findClosestLabelForRange = (data, range) => {
    const [start, end] = range;
    const within = data.filter((d) => d.value >= start && d.value <= end);
    return within[0]?.label;
};

const extractParagraphPairs = (text) => {
    const pairs = [];
    const patterns = [
        /([A-Za-z][A-Za-z0-9\s'_-]{1,40})\s*(?:=|:|were|was|are|is|at|of|with|had|has)\s*(-?\d+(?:\.\d+)?)/gi,
        /([A-Za-z][A-Za-z0-9\s'_-]{1,40})\s+(-?\d+(?:\.\d+)?)(?=[.,;]|$)/gi,
    ];

    patterns.forEach((pattern) => {
        let m;
        while ((m = pattern.exec(text)) !== null) {
            const label = m[1].trim();
            const value = parseFloat(m[2]);
            if (!Number.isNaN(value)) {
                pairs.push({ label, value });
            }
        }
    });

    const seen = new Set();
    return pairs.filter(({ label }) => {
        const key = normalizeLabel(label);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
};

const interpretCommand = (raw, current, currentChart) => {
    const input = raw.trim();
    const lower = input.toLowerCase();
    let nextData = [...current];
    let nextChart = currentChart;
    const notes = [];
    let dataChanged = false;

    const upsertPoint = (label, value) => {
        if (Number.isNaN(value)) return;
        const idx = nextData.findIndex((d) => normalizeLabel(d.label) === normalizeLabel(label));
        if (idx >= 0) {
            nextData[idx] = { label: nextData[idx].label, value };
        } else {
            nextData.push({ label, value });
        }
        dataChanged = true;
    };

    const chartMatch = lower.match(/(bar|pie|histogram|scatter|heatmap)/);
    if (chartMatch) {
        nextChart = chartMatch[1];
        notes.push(`Switched chart to ${nextChart}.`);
    }

    if (/(clear plot|clear chart|clear data|reset|start over)/.test(lower)) {
        nextData = [];
        notes.push("Cleared all categories.");
    }

    const addPattern = /add\s+([^,;]+?)\s+(-?\d+(?:\.\d+)?)/gi;
    let match;
    while ((match = addPattern.exec(input)) !== null) {
        const label = match[1].trim();
        const value = parseFloat(match[2]);
        upsertPoint(label, value);
        notes.push(`Added ${label} (${value}).`);
    }

    const loosePairs = [...input.matchAll(/([A-Za-z][A-Za-z0-9\s_-]+)\s+(-?\d+(?:\.\d+)?)/g)];
    if (loosePairs.length > 1 && notes.length === 0) {
        loosePairs.forEach((m) => {
            const label = m[1].trim();
            const value = parseFloat(m[2]);
            upsertPoint(label, value);
        });
        notes.push("Parsed multiple values from the paragraph.");
    }

    if (!dataChanged) {
        const paragraphPairs = extractParagraphPairs(input);
        if (paragraphPairs.length > 0) {
            paragraphPairs.forEach(({ label, value }) => upsertPoint(label, value));
            notes.push("Parsed values from paragraph-style text.");
        }
    }

    const updatePattern = /(set|update|change)\s+([A-Za-z0-9\s_-]+)\s+(?:to|=)\s+(-?\d+(?:\.\d+)?)/gi;
    while ((match = updatePattern.exec(input)) !== null) {
        const label = match[2];
        const value = parseFloat(match[3]);
        const idx = nextData.findIndex((d) => normalizeLabel(d.label) === normalizeLabel(label));
        if (idx >= 0 && !Number.isNaN(value)) {
            nextData[idx] = { label: nextData[idx].label, value };
            dataChanged = true;
            notes.push(`Changed ${label} to ${value}.`);
        }
    }

    const removePattern = /(remove|delete|drop)\s+([A-Za-z0-9\s_-]+)/gi;
    while ((match = removePattern.exec(input)) !== null) {
        const label = match[2];
        const before = nextData.length;
        nextData = nextData.filter((d) => normalizeLabel(d.label) !== normalizeLabel(label));
        if (nextData.length !== before) {
            dataChanged = true;
            notes.push(`Removed ${label}.`);
        }
    }

    if (/(stats|mean|average|median|mode|analysis)/.test(lower)) {
        const stats = computeStats(nextData);
        notes.push(
            `Stats → mean ${formatNumber(stats.mean)}, median ${formatNumber(stats.median)}, mode ${stats.mode}, min ${formatNumber(stats.min)}, max ${formatNumber(stats.max)}.`
        );
    }

    if (!notes.length) {
        notes.push("Updated the plot. You can also say: 'add Mango 14', 'set chart to heatmap', or 'clear data'.");
    }

    return { nextData, nextChart, reply: notes.join(" ") };
};

export const CategoricalChatPanel = () => {
    const [chartType, setChartType] = useState("bar");
    const [data, setData] = useState(INITIAL_DATA);
    const [input, setInput] = useState("");
    const [messages, setMessages] = useState([
        { role: "assistant", text: "Welcome! Add data using Quick Add, import CSV, or chat commands. Example: 'add Mango 22 and switch to heatmap.'" },
    ]);
    const [pendingEdit, setPendingEdit] = useState(null);
    const [processing, setProcessing] = useState(false);

    // Manual entry state
    const [newLabel, setNewLabel] = useState("");
    const [newValue, setNewValue] = useState("");
    const fileInputRef = useRef(null);
    const chartContainerRef = useRef(null);

    // Export theme dialog state
    const [showExportDialog, setShowExportDialog] = useState(false);
    const [exportFormat, setExportFormat] = useState("png");
    const [exportTheme, setExportTheme] = useState("light");

    const stats = useMemo(() => computeStats(data), [data]);
    const histogram = useMemo(() => buildHistogram(data), [data]);

    const removeItem = (label) => {
        setData((prev) => prev.filter((d) => normalizeLabel(d.label) !== normalizeLabel(label)));
        toast.success(`Removed ${label}`);
    };

    const clearAll = () => {
        setData([]);
        toast.success("Cleared the plot");
    };

    const startEdit = (label) => {
        const item = data.find((d) => normalizeLabel(d.label) === normalizeLabel(label));
        if (!item) return;
        setPendingEdit({ label: item.label, value: item.value.toString() });
        toast.info(`Editing ${item.label}`);
    };

    const saveEdit = () => {
        if (!pendingEdit) return;
        const numeric = parseFloat(pendingEdit.value);
        if (Number.isNaN(numeric)) {
            toast.error("Enter a valid number");
            return;
        }
        setData((prev) => prev.map((d) => normalizeLabel(d.label) === normalizeLabel(pendingEdit.label) ? { ...d, value: numeric } : d));
        setPendingEdit(null);
        toast.success("Value updated");
    };

    const handleChartClick = (label, range) => {
        if (label) {
            startEdit(label);
            return;
        }
        if (range) {
            const closest = findClosestLabelForRange(data, range);
            if (closest) startEdit(closest);
        }
    };

    const handleCSVUpload = (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        Papa.parse(file, {
            complete: (results) => {
                const parsed = [];
                const rows = results.data;

                // Skip header if present
                const startIdx = rows[0]?.[0]?.toLowerCase().includes('label') || rows[0]?.[0]?.toLowerCase().includes('category') ? 1 : 0;

                for (let i = startIdx; i < rows.length; i++) {
                    const row = rows[i];
                    if (row.length >= 2 && row[0] && row[1]) {
                        const label = row[0].trim();
                        const value = parseFloat(row[1]);
                        if (label && !Number.isNaN(value)) {
                            parsed.push({ label, value });
                        }
                    }
                }

                if (parsed.length > 0) {
                    setData(parsed);
                    toast.success(`Loaded ${parsed.length} categories from CSV`);
                    setMessages((prev) => [
                        ...prev,
                        { role: "assistant", text: `Successfully imported ${parsed.length} categories from your CSV file.` },
                    ]);
                } else {
                    toast.error("No valid data found in CSV");
                }
            },
            error: (error) => {
                toast.error(`CSV parse error: ${error.message}`);
            },
        });

        // Reset file input
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleManualAdd = () => {
        const trimmedLabel = newLabel.trim();
        const numeric = parseFloat(newValue);

        if (!trimmedLabel) {
            toast.error("Please enter a label");
            return;
        }
        if (Number.isNaN(numeric)) {
            toast.error("Please enter a valid number");
            return;
        }

        const exists = data.find((d) => normalizeLabel(d.label) === normalizeLabel(trimmedLabel));
        if (exists) {
            toast.error(`"${trimmedLabel}" already exists. Use edit instead.`);
            return;
        }

        setData((prev) => [...prev, { label: trimmedLabel, value: numeric }]);
        toast.success(`Added ${trimmedLabel}: ${numeric}`);
        setNewLabel("");
        setNewValue("");
    };

    const handleExportChart = async () => {
        if (!chartContainerRef.current) {
            toast.error("Chart not found");
            return;
        }

        setShowExportDialog(true);
    };

    const confirmExport = async () => {
        if (!chartContainerRef.current) {
            toast.error("Chart not found");
            return;
        }

        const timestamp = new Date().toISOString().slice(0, 10);
        const filename = `categorical-${chartType}-${exportTheme}-${timestamp}`;

        try {
            if (exportFormat === "png") {
                await exportChartAsPNG(chartContainerRef.current, filename, exportTheme);
            } else {
                await exportChartAsPDF(chartContainerRef.current, filename, exportTheme);
            }
        } catch (error) {
            console.error("Export failed:", error);
        }

        setShowExportDialog(false);
    };

    const sendMessage = () => {
        const trimmed = input.trim();
        if (!trimmed) return;
        setProcessing(true);

        // Check for CSV-related queries
        const lower = trimmed.toLowerCase();
        if (/(upload|import|csv|file|load data)/.test(lower)) {
            setMessages((prev) => [
                ...prev,
                { role: "user", text: trimmed },
                {
                    role: "assistant",
                    text: "To import data, use the 'Import CSV' button above the chat. Your CSV should have two columns: label and value. You can also use the Quick Add form to manually enter data points."
                },
            ]);
            setInput("");
            setProcessing(false);
            return;
        }

        const result = interpretCommand(trimmed, data, chartType);
        setData(result.nextData);
        setChartType(result.nextChart);
        setMessages((prev) => [...prev, { role: "user", text: trimmed }, { role: "assistant", text: result.reply }]);
        setInput("");
        setProcessing(false);
    };

    const chartArea = () => {
        if (!data.length) {
            return (
                <div className="flex items-center justify-center h-72 text-muted-foreground text-sm">
                    Add some categories to see a chart.
                </div>
            );
        }

        const rechartsData = data.map((d, idx) => ({ ...d, index: idx + 1 }));

        switch (chartType) {
            case "bar":
                return (
                    <ResponsiveContainer width="100%" height={360}>
                        <BarChart data={rechartsData} margin={{ top: 20, right: 24, left: 8, bottom: 16 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="label" interval={0} angle={-15} textAnchor="end" height={60} />
                            <YAxis />
                            <Tooltip
                                cursor={false}
                                contentStyle={{
                                    backgroundColor: "hsl(var(--popover))",
                                    border: "1px solid hsl(var(--border))",
                                    borderRadius: "8px",
                                    padding: "8px 12px",
                                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                                }}
                                labelStyle={{ color: "hsl(var(--popover-foreground))", fontWeight: 600, fontSize: "13px" }}
                                itemStyle={{ color: "hsl(var(--muted-foreground))", fontSize: "12px" }}
                            />
                            <Bar dataKey="value" fill="hsl(var(--chart-primary))" onClick={(d) => handleChartClick(d?.label)} />
                        </BarChart>
                    </ResponsiveContainer>
                );
            case "pie":
                return (
                    <ResponsiveContainer width="100%" height={360}>
                        <PieChart>
                            <Pie data={rechartsData} dataKey="value" nameKey="label" cx="50%" cy="50%" outerRadius={130} label>
                                {rechartsData.map((entry, idx) => (
                                    <Cell
                                        key={entry.label}
                                        fill={PIE_COLORS[idx % PIE_COLORS.length]}
                                        onClick={() => handleChartClick(entry.label)}
                                    />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: "hsl(var(--popover))",
                                    border: "1px solid hsl(var(--border))",
                                    borderRadius: "8px",
                                    padding: "8px 12px",
                                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                                }}
                                labelStyle={{ color: "hsl(var(--popover-foreground))", fontWeight: 600, fontSize: "13px" }}
                                itemStyle={{ color: "hsl(var(--muted-foreground))", fontSize: "12px" }}
                            />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                );
            case "histogram":
                return (
                    <ResponsiveContainer width="100%" height={360}>
                        <BarChart data={histogram} margin={{ top: 20, right: 24, left: 8, bottom: 16 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="label" interval={0} angle={-15} textAnchor="end" height={60} />
                            <YAxis />
                            <Tooltip
                                cursor={false}
                                contentStyle={{
                                    backgroundColor: "hsl(var(--popover))",
                                    border: "1px solid hsl(var(--border))",
                                    borderRadius: "8px",
                                    padding: "8px 12px",
                                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                                }}
                                labelStyle={{ color: "hsl(var(--popover-foreground))", fontWeight: 600, fontSize: "13px" }}
                                itemStyle={{ color: "hsl(var(--muted-foreground))", fontSize: "12px" }}
                            />
                            <Bar dataKey="count" fill="hsl(var(--chart-secondary))" onClick={(d) => handleChartClick(undefined, d?.range)} />
                        </BarChart>
                    </ResponsiveContainer>
                );
            case "scatter":
                return (
                    <ResponsiveContainer width="100%" height={360}>
                        <ScatterChart margin={{ top: 20, right: 24, left: 8, bottom: 16 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="index" name="Index" />
                            <YAxis dataKey="value" name="Value" />
                            <Tooltip
                                cursor={{ strokeDasharray: "3 3" }}
                                contentStyle={{
                                    backgroundColor: "hsl(var(--popover))",
                                    border: "1px solid hsl(var(--border))",
                                    borderRadius: "8px",
                                    padding: "8px 12px",
                                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                                }}
                                labelStyle={{ color: "hsl(var(--popover-foreground))", fontWeight: 600, fontSize: "13px" }}
                                itemStyle={{ color: "hsl(var(--muted-foreground))", fontSize: "12px" }}
                            />
                            <Legend />
                            <Scatter name="Categories" data={rechartsData} fill="hsl(var(--chart-primary))" onClick={(d) => handleChartClick(d?.label)} />
                        </ScatterChart>
                    </ResponsiveContainer>
                );
            case "heatmap": {
                const values = data.map((d) => d.value);
                const hasData = values.length > 0;
                const min = hasData ? Math.min(...values) : 0;
                const max = hasData ? Math.max(...values) : 1;
                const stops = hasData
                    ? [
                        [0, "#60a5fa"],
                        [0.5, "#a855f7"],
                        [1, "#ec4899"],
                    ]
                    : [
                        [0, "#e2e8f0"],
                        [1, "#cbd5e1"],
                    ];

                const heatmapOptions = {
                    chart: {
                        type: "heatmap",
                        height: 380,
                        backgroundColor: "transparent",
                        spacing: [10, 10, 16, 10],
                    },
                    title: { text: undefined },
                    credits: { enabled: false },
                    exporting: {
                        enabled: true,
                        buttons: {
                            contextButton: {
                                menuItems: [
                                    "viewFullscreen",
                                    "separator",
                                    "printChart",
                                    "separator",
                                    "downloadPNG",
                                    "downloadJPEG",
                                    "downloadPDF",
                                    "downloadSVG"
                                ],
                                theme: {
                                    fill: "hsl(var(--background))",
                                    stroke: "hsl(var(--border))",
                                },
                                symbolStroke: "hsl(var(--foreground))",
                                symbolFill: "hsl(var(--foreground))",
                                x: -10,
                                y: 0,
                                align: "right"
                            }
                        }
                    },
                    xAxis: {
                        categories: data.map((d) => d.label),
                        lineWidth: 0,
                        tickLength: 0,
                        labels: {
                            style: { color: "hsl(var(--muted-foreground))", fontSize: "12px" },
                            rotation: -25,
                        },
                    },
                    yAxis: {
                        categories: ["Value"],
                        title: { text: undefined },
                        gridLineWidth: 0,
                        labels: { enabled: false },
                    },
                    legend: {
                        align: "right",
                        layout: "vertical",
                        verticalAlign: "middle",
                        symbolHeight: 180,
                        itemStyle: { color: "hsl(var(--muted-foreground))" },
                    },
                    colorAxis: {
                        min: hasData ? (min === max ? min - 1 : min) : 0,
                        max: hasData ? max : 1,
                        stops,
                    },
                    tooltip: {
                        useHTML: true,
                        formatter: function () {
                            const point = this.point;
                            return `<div><strong>${point.name}</strong><br/>Value: ${formatNumber(point.value)}</div>`;
                        },
                    },
                    plotOptions: {
                        series: {
                            borderColor: "rgba(15,23,42,0.25)",
                            borderWidth: 1,
                            animation: false,
                            dataLabels: {
                                enabled: true,
                                style: { color: "#fff", textOutline: "none", fontWeight: "600" },
                                formatter: function () {
                                    const point = this.point;
                                    return formatNumber(point.value);
                                },
                            },
                            point: {
                                events: {
                                    click: function () {
                                        handleChartClick(this.name);
                                    },
                                },
                            },
                        },
                    },
                    series: [
                        {
                            type: "heatmap",
                            name: "Categories",
                            data: data.map((d, idx) => ({ x: idx, y: 0, value: d.value, name: d.label })),
                        },
                    ],
                };

                return (
                    <div className="h-full">
                        <HighchartsReact highcharts={Highcharts} options={heatmapOptions} />
                    </div>
                );
            }
            default:
                return null;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Sparkles className="h-4 w-4 text-primary" />
                        NLP + Categorical Plotting
                    </div>
                    <h1 className="text-2xl font-bold">Chat-driven categorical analysis</h1>
                    <p className="text-muted-foreground text-sm">
                        Describe what you want to see; the assistant will update categories, switch chart types, and surface stats.
                    </p>
                </div>
                <div className="flex items-center gap-2 bg-muted/60 rounded-lg px-3 py-2 text-sm">
                    <MessageSquare className="h-4 w-4" />
                    Natural language controls
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-4">
                <Card className="order-2 lg:order-1">
                    <CardHeader>
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                            <CardTitle className="flex items-center gap-2 text-base">
                                <BarChart3 className="h-5 w-5" />
                                Visualizer
                            </CardTitle>
                            <div className="flex items-center gap-2">
                                <label className="text-sm text-muted-foreground">Chart</label>
                                <select
                                    value={chartType}
                                    onChange={(e) => setChartType(e.target.value)}
                                    className="border rounded-md px-3 py-2 bg-background text-sm"
                                >
                                    {chartOptions.map((opt) => (
                                        <option key={opt.value} value={opt.value}>
                                            {opt.label}
                                        </option>
                                    ))}
                                </select>
                                {data.length > 0 && (
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="gap-2"
                                        onClick={() => handleExportChart()}
                                    >
                                        <Download className="h-4 w-4" />
                                        <span className="hidden sm:inline">Export</span>
                                    </Button>
                                )}
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div ref={chartContainerRef} className="rounded-lg border bg-muted/30 p-3 min-h-[360px]">{chartArea()}</div>
                        {pendingEdit && (
                            <Card className="border-primary/40 bg-primary/5">
                                <CardContent className="pt-4 space-y-3">
                                    <div className="flex items-center gap-2 font-semibold">
                                        <Edit3 className="h-4 w-4" />
                                        Edit {pendingEdit.label}
                                    </div>
                                    <div className="flex gap-3 flex-wrap">
                                        <Input
                                            value={pendingEdit.value}
                                            onChange={(e) => setPendingEdit({ ...pendingEdit, value: e.target.value })}
                                            className="max-w-[200px]"
                                            type="number"
                                            step="0.01"
                                        />
                                        <Button onClick={saveEdit}>Save</Button>
                                        <Button variant="ghost" onClick={() => setPendingEdit(null)}>
                                            Cancel
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </CardContent>
                </Card>

                <Card className="order-1 lg:order-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Bot className="h-5 w-5" />
                            Chat Controls
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {/* Manual Entry Form */}
                        <Card className="border-primary/30 bg-primary/5">
                            <CardContent className="pt-4 space-y-3">
                                <div className="flex items-center gap-2 font-semibold text-sm">
                                    <Plus className="h-4 w-4" />
                                    Quick Add
                                </div>
                                <div className="grid grid-cols-[1fr_1fr_auto] gap-2">
                                    <Input
                                        placeholder="Label"
                                        value={newLabel}
                                        onChange={(e) => setNewLabel(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") handleManualAdd();
                                        }}
                                    />
                                    <Input
                                        placeholder="Value"
                                        type="number"
                                        step="0.01"
                                        value={newValue}
                                        onChange={(e) => setNewValue(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") handleManualAdd();
                                        }}
                                    />
                                    <Button onClick={handleManualAdd} size="sm">
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        {/* CSV Upload */}
                        <div className="flex gap-2">
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".csv"
                                onChange={handleCSVUpload}
                                className="hidden"
                            />
                            <Button
                                variant="outline"
                                className="flex-1 gap-2"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <Upload className="h-4 w-4" />
                                Import CSV
                            </Button>
                            <Button
                                variant="outline"
                                className="flex-1 gap-2"
                                onClick={() => {
                                    const csvContent = `label,value\n${data.map((d) => `${d.label},${d.value}`).join("\n")}`;
                                    const blob = new Blob([csvContent], { type: "text/csv" });
                                    const url = URL.createObjectURL(blob);
                                    const a = document.createElement("a");
                                    a.href = url;
                                    a.download = "categorical_data.csv";
                                    a.click();
                                    URL.revokeObjectURL(url);
                                    toast.success("Exported CSV");
                                }}
                            >
                                <FileUp className="h-4 w-4" />
                                Export CSV
                            </Button>
                        </div>

                        <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
                            {messages.map((msg, idx) => (
                                <div key={idx} className={cn("rounded-lg p-3 text-sm border", msg.role === "assistant" ? "bg-muted/50" : "bg-primary/5 border-primary/30")}>
                                    <div className="flex items-center gap-2 mb-1 text-xs text-muted-foreground">
                                        {msg.role === "assistant" ? <Bot className="h-3 w-3" /> : <User className="h-3 w-3" />}
                                        <span className="uppercase tracking-wide">{msg.role}</span>
                                    </div>
                                    <div>{msg.text}</div>
                                </div>
                            ))}
                        </div>
                        <div className="space-y-2">
                            <Textarea
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                                        e.preventDefault();
                                        sendMessage();
                                    }
                                }}
                                placeholder="e.g. add Mango 14 and switch to pie (Ctrl+Enter to send)"
                                className="min-h-[90px]"
                            />
                            <Button onClick={sendMessage} className="w-full gap-2" disabled={processing}>
                                {processing ? (
                                    <RefreshCcw className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Wand2 className="h-4 w-4" />
                                )}
                                Send
                            </Button>
                            <div className="text-xs text-muted-foreground">
                                Try: "increase Apples to 40", "remove Dates", "set chart to heatmap", or "stats".
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Stats</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                            <div className="text-muted-foreground">Count</div>
                            <div className="font-semibold">{stats.count}</div>
                        </div>
                        <div>
                            <div className="text-muted-foreground">Sum</div>
                            <div className="font-semibold">{formatNumber(stats.sum)}</div>
                        </div>
                        <div>
                            <div className="text-muted-foreground">Mean</div>
                            <div className="font-semibold">{formatNumber(stats.mean)}</div>
                        </div>
                        <div>
                            <div className="text-muted-foreground">Median</div>
                            <div className="font-semibold">{formatNumber(stats.median)}</div>
                        </div>
                        <div>
                            <div className="text-muted-foreground">Mode</div>
                            <div className="font-semibold">{stats.mode}</div>
                        </div>
                        <div>
                            <div className="text-muted-foreground">Std Dev</div>
                            <div className="font-semibold">{formatNumber(stats.stdev)}</div>
                        </div>
                        <div>
                            <div className="text-muted-foreground">Min</div>
                            <div className="font-semibold">{formatNumber(stats.min)}</div>
                        </div>
                        <div>
                            <div className="text-muted-foreground">Max</div>
                            <div className="font-semibold">{formatNumber(stats.max)}</div>
                        </div>
                        <div>
                            <div className="text-muted-foreground">Range</div>
                            <div className="font-semibold">{formatNumber(stats.range)}</div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="md:col-span-2">
                    <CardHeader className="flex items-center justify-between">
                        <CardTitle className="text-base">Data</CardTitle>
                        {data.length > 0 && (
                            <Button size="sm" variant="outline" onClick={clearAll}>
                                Clear Plot
                            </Button>
                        )}
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {data.length === 0 && (
                            <Alert>
                                <AlertDescription>No categories yet. Use chat or click add.</AlertDescription>
                            </Alert>
                        )}
                        {data.length > 0 && (
                            <div className="space-y-2">
                                {data.map((item) => (
                                    <div key={item.label} className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm">
                                        <div className="flex items-center gap-2">
                                            <Badge variant="secondary">{item.label}</Badge>
                                            <span className="text-muted-foreground">{item.value}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button size="sm" variant="outline" onClick={() => startEdit(item.label)}>
                                                Edit
                                            </Button>
                                            <Button size="sm" variant="ghost" onClick={() => removeItem(item.label)}>
                                                Delete
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <AlertDialog open={showExportDialog} onOpenChange={setShowExportDialog}>
                <AlertDialogContent className="max-w-md">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Export Chart</AlertDialogTitle>
                        <AlertDialogDescription>
                            Choose file format and theme for your exported chart
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="space-y-4">
                        {/* File Format Selection */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium">File Format</label>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => setExportFormat("png")}
                                    className={cn(
                                        "flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition",
                                        exportFormat === "png"
                                            ? "border-primary bg-primary/10"
                                            : "border-border hover:border-primary/50"
                                    )}
                                >
                                    <FileImage className="h-5 w-5" />
                                    <span className="text-sm font-medium">PNG</span>
                                </button>
                                <button
                                    onClick={() => setExportFormat("pdf")}
                                    className={cn(
                                        "flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition",
                                        exportFormat === "pdf"
                                            ? "border-primary bg-primary/10"
                                            : "border-border hover:border-primary/50"
                                    )}
                                >
                                    <FileText className="h-5 w-5" />
                                    <span className="text-sm font-medium">PDF</span>
                                </button>
                            </div>
                        </div>

                        {/* Theme Selection */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Theme</label>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => setExportTheme("light")}
                                    className={cn(
                                        "flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition",
                                        exportTheme === "light"
                                            ? "border-primary bg-primary/10"
                                            : "border-border hover:border-primary/50"
                                    )}
                                >
                                    <Sun className="h-5 w-5" />
                                    <span className="text-sm font-medium">Light</span>
                                    <span className="text-xs text-muted-foreground">White bg</span>
                                </button>
                                <button
                                    onClick={() => setExportTheme("dark")}
                                    className={cn(
                                        "flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition",
                                        exportTheme === "dark"
                                            ? "border-primary bg-primary/10"
                                            : "border-border hover:border-primary/50"
                                    )}
                                >
                                    <Moon className="h-5 w-5" />
                                    <span className="text-sm font-medium">Dark</span>
                                    <span className="text-xs text-muted-foreground">Dark bg</span>
                                </button>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-2 justify-end">
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmExport}>
                            Export as {exportFormat.toUpperCase()}
                        </AlertDialogAction>
                    </div>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

const CategoricalChat = () => (
    <AppLayout>
        <CategoricalChatPanel />
    </AppLayout>
);

export default CategoricalChat;
