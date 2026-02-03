import { useMemo, useState, useRef, useCallback, useEffect } from "react";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import HCHeatmap from "highcharts/modules/heatmap";
import HCExporting from "highcharts/modules/exporting";
import AppLayout from "@/components/AppLayout";
import { useTheme } from "@/components/theme-provider";
import { usePageSession, useHistoryLogger } from "@/hooks/usePageSession";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
    Upload,
    FileUp,
    Download,
    FileImage,
    FileText,
    Moon,
    Sun,
    Database,
    TrendingUp,
    TrendingDown,
    AlertTriangle,
    Search,
    Send,
    Code2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import Papa from "papaparse";
import { exportChartAsPNG, exportChartAsPDF } from "@/lib/chartExport";
import ExportCodeButton from "@/components/ExportCodeButton";
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
    const { theme } = useTheme();
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
    const chartClickHandlerRef = useRef(null);

    // Export theme dialog state
    const [showExportDialog, setShowExportDialog] = useState(false);
    const [exportFormat, setExportFormat] = useState("png");
    const [exportTheme, setExportTheme] = useState("light");
    
    // New states for NLP features
    const [columns, setColumns] = useState([]);
    const [activeColumns, setActiveColumns] = useState([]);
    const [csvMetadata, setCsvMetadata] = useState(null);
    const [tableSearch, setTableSearch] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [chartTitle, setChartTitle] = useState("Data Visualizer");
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [dragActive, setDragActive] = useState(false);
    const itemsPerPage = 10;

    // Prepare state for persistence
    const sessionState = useMemo(() => ({
        chartType,
        data,
        messages,
        chartTitle,
        columns,
        activeColumns,
        csvMetadata,
        selectedCategory,
    }), [chartType, data, messages, chartTitle, columns, activeColumns, csvMetadata, selectedCategory]);

    // Restore state callback
    const restoreState = useCallback((savedState) => {
        if (savedState.chartType) setChartType(savedState.chartType);
        if (savedState.data) setData(savedState.data);
        if (savedState.messages) setMessages(savedState.messages);
        if (savedState.chartTitle) setChartTitle(savedState.chartTitle);
        if (savedState.columns) setColumns(savedState.columns);
        if (savedState.activeColumns) setActiveColumns(savedState.activeColumns);
        if (savedState.csvMetadata) setCsvMetadata(savedState.csvMetadata);
        if (savedState.selectedCategory) setSelectedCategory(savedState.selectedCategory);
    }, []);

    // Enable auto-save and restoration
    const { saveNow } = usePageSession('categorical', sessionState, restoreState);
    
    // Enable history tracking
    const { logCreate, logUpdate, logExport } = useHistoryLogger('categorical');

    const stats = useMemo(() => computeStats(data), [data]);
    const histogram = useMemo(() => buildHistogram(data), [data]);

    // Get theme colors dynamically
    const getThemeColors = useCallback(() => {
        const root = document.documentElement;
        const isDark = theme === 'dark' || (theme === 'system' && root.classList.contains('dark'));
        
        return {
            foreground: isDark ? 'hsl(210 40% 98%)' : 'hsl(222.2 84% 4.9%)',
            background: isDark ? 'hsl(222.2 84% 4.9%)' : 'hsl(0 0% 100%)',
            popover: isDark ? 'hsl(222.2 84% 4.9%)' : 'hsl(0 0% 100%)',
            border: isDark ? 'hsl(217.2 32.6% 17.5%)' : 'hsl(214.3 31.8% 91.4%)',
            accent: isDark ? 'hsl(217.2 32.6% 17.5%)' : 'hsl(210 40% 96.1%)',
            accentForeground: isDark ? 'hsl(210 40% 98%)' : 'hsl(222.2 47.4% 11.2%)',
        };
    }, [theme]);

    // Enhanced insights
    const insights = useMemo(() => {
        if (data.length === 0) return null;
        
        const sorted = [...data].sort((a, b) => b.value - a.value);
        const topPerformer = sorted[0];
        const bottomPerformer = sorted[sorted.length - 1];
        const total = data.reduce((sum, d) => sum + d.value, 0);
        const cardinality = new Set(data.map(d => d.label)).size;
        const missingData = 0; // Can be calculated from CSV parsing
        
        // Generate narrative summary
        const topPercent = total > 0 ? ((topPerformer.value / total) * 100).toFixed(1) : 0;
        const avgValue = total / data.length;
        const multiplier = (topPerformer.value / avgValue).toFixed(1);
        const narrative = `${topPerformer.label} is the dominant category with a value of ${topPerformer.value}, accounting for ${topPercent}% of the total. This is ${multiplier}x higher than the average (${avgValue.toFixed(1)}).`;
        
        return {
            topPerformer,
            bottomPerformer,
            total,
            cardinality,
            missingData,
            narrative,
            topPerformerPercent: topPercent,
            bottomPerformerPercent: total > 0 ? ((bottomPerformer.value / total) * 100).toFixed(1) : 0,
        };
    }, [data]);

    // Filtered and paginated data for table
    const filteredData = useMemo(() => {
        let filtered = data;
        
        // Filter by selected category (drill-down)
        if (selectedCategory) {
            filtered = filtered.filter((d) => normalizeLabel(d.label) === normalizeLabel(selectedCategory));
        }
        
        // Filter by search
        if (tableSearch) {
            const search = tableSearch.toLowerCase();
            filtered = filtered.filter((d) => d.label.toLowerCase().includes(search));
        }
        
        return filtered;
    }, [data, tableSearch, selectedCategory]);

    const paginatedData = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredData.slice(start, start + itemsPerPage);
    }, [filteredData, currentPage, itemsPerPage]);

    const totalPages = Math.ceil(filteredData.length / itemsPerPage);

    const removeItem = (label) => {
        setData((prev) => prev.filter((d) => normalizeLabel(d.label) !== normalizeLabel(label)));
        toast.success(`Removed ${label}`);
    };

    const clearAll = () => {
        setData([]);
        toast.success("Cleared the plot");
    };

    const startEdit = useCallback((label) => {
        const item = data.find((d) => normalizeLabel(d.label) === normalizeLabel(label));
        if (!item) return;
        setPendingEdit({ label: item.label, value: item.value.toString() });
        toast.info(`Editing ${item.label}`);
    }, [data]);

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

    const handleChartClick = useCallback((label, range) => {
        if (label) {
            const item = data.find((d) => normalizeLabel(d.label) === normalizeLabel(label));
            if (item) {
                // Drill-down: Filter data table to show only this category
                setSelectedCategory(label);
                setTableSearch(""); // Clear search when drilling down
                setCurrentPage(1);
                toast.info(`Filtered to: ${label}. Click "Clear Filter" to reset.`);
            }
            return;
        }
        if (range) {
            const closest = findClosestLabelForRange(data, range);
            if (closest) {
                const item = data.find((d) => normalizeLabel(d.label) === normalizeLabel(closest));
                if (item) {
                    setSelectedCategory(closest);
                    setTableSearch("");
                    setCurrentPage(1);
                    toast.info(`Filtered to: ${closest}. Click "Clear Filter" to reset.`);
                }
            }
        }
    }, [data]);

    // Store the latest click handler in ref
    chartClickHandlerRef.current = handleChartClick;

    const handleCSVUpload = (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        Papa.parse(file, {
            header: true,
            dynamicTyping: true,
            skipEmptyLines: true,
            complete: (results) => {
                const rows = results.data;
                if (!rows || rows.length === 0) {
                    toast.error("No data found in CSV");
                    return;
                }

                // Extract and detect column types
                const headers = results.meta.fields || [];
                const detectedColumns = headers.map((name) => {
                    const sampleValues = rows.slice(0, 50).map((row) => row[name]).filter((v) => v != null);
                    const numericCount = sampleValues.filter((v) => typeof v === "number" || !isNaN(Number(v))).length;
                    const isCategorical = numericCount / sampleValues.length < 0.7;

                    return {
                        name,
                        type: isCategorical ? "categorical" : "numerical",
                        cardinality: new Set(sampleValues).size,
                        sampleValues: sampleValues.slice(0, 5),
                    };
                });

                setColumns(detectedColumns);
                
                // Try to auto-detect label and value columns
                const categoryCol = detectedColumns.find((c) => c.type === "categorical");
                const numericCol = detectedColumns.find((c) => c.type === "numerical");

                if (categoryCol && numericCol) {
                    setActiveColumns([categoryCol.name, numericCol.name]);
                    
                    const parsed = rows
                        .map((row) => ({
                            label: String(row[categoryCol.name] || "").trim(),
                            value: parseFloat(row[numericCol.name]),
                        }))
                        .filter((d) => d.label && !Number.isNaN(d.value));

                    if (parsed.length > 0) {
                        setData(parsed);
                        setCsvMetadata({
                            filename: file.name,
                            rowCount: parsed.length,
                            columns: detectedColumns,
                        });
                        toast.success(`Loaded ${parsed.length} categories from CSV`);
                        setMessages((prev) => [
                            ...prev,
                            {
                                role: "assistant",
                                text: `Successfully imported ${parsed.length} categories from "${file.name}". Using "${categoryCol.name}" as labels and "${numericCol.name}" as values.`,
                            },
                        ]);
                        
                        // Log CSV upload to history
                        logCreate(`CSV Import: ${file.name}`, parsed, {
                            filename: file.name,
                            rowCount: parsed.length,
                            columns: detectedColumns.map(c => ({ name: c.name, type: c.type })),
                        });
                    } else {
                        toast.error("No valid data found in selected columns");
                    }
                } else {
                    // Fallback to manual parsing
                    const parsed = [];
                    const startIdx = rows[0]?.[0]?.toLowerCase().includes('label') || rows[0]?.[0]?.toLowerCase().includes('category') ? 1 : 0;

                    for (let i = startIdx; i < rows.length; i++) {
                        const row = rows[i];
                        const firstVal = Object.values(row)[0];
                        const secondVal = Object.values(row)[1];
                        
                        if (firstVal && secondVal) {
                            const label = String(firstVal).trim();
                            const value = parseFloat(secondVal);
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
            
            // Log export to history
            logExport(chartTitle, { chartType, data, timestamp }, {
                format: exportFormat,
                theme: exportTheme,
                filename,
            });
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
                <div 
                    className={cn(
                        "flex flex-col items-center justify-center h-72 border-2 border-dashed rounded-lg transition-colors",
                        dragActive ? "border-primary bg-primary/10" : "border-muted-foreground/30"
                    )}
                    onDragEnter={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setDragActive(true);
                    }}
                    onDragLeave={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setDragActive(false);
                    }}
                    onDragOver={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                    }}
                    onDrop={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setDragActive(false);
                        const files = e.dataTransfer.files;
                        if (files && files[0]) {
                            handleCSVUpload({ target: { files } });
                        }
                    }}
                >
                    <Upload className="h-12 w-12 mb-4 text-muted-foreground" />
                    <p className="text-lg font-semibold mb-2">Drag & Drop CSV Here</p>
                    <p className="text-sm text-muted-foreground mb-4">or click the Import CSV button</p>
                    <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                        <FileUp className="h-4 w-4 mr-2" />
                        Browse Files
                    </Button>
                </div>
            );
        }

        const themeColors = getThemeColors();
        
        const baseChartConfig = {
            chart: {
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
                            fill: themeColors.background,
                            stroke: themeColors.border,
                            states: {
                                hover: {
                                    fill: themeColors.accent,
                                },
                                select: {
                                    stroke: themeColors.border,
                                    fill: themeColors.accent,
                                },
                            },
                        },
                        symbolStroke: themeColors.foreground,
                        x: -10,
                        y: 0,
                        align: "right"
                    }
                },
                menuItemStyle: {
                    color: themeColors.foreground,
                    background: "transparent",
                    fontSize: "13px",
                    padding: "8px 12px",
                },
                menuItemHoverStyle: {
                    background: themeColors.accent,
                    color: themeColors.accentForeground,
                },
                menuStyle: {
                    border: `1px solid ${themeColors.border}`,
                    background: themeColors.popover,
                    padding: "4px 0",
                    borderRadius: "6px",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
                },
            },
            tooltip: {
                backgroundColor: themeColors.popover,
                borderColor: themeColors.border,
                borderRadius: 8,
                style: {
                    color: themeColors.foreground,
                },
            },
        };

        switch (chartType) {
            case "bar": {
                const barOptions = {
                    ...baseChartConfig,
                    chart: {
                        ...baseChartConfig.chart,
                        type: "column",
                        height: 480,
                    },
                    xAxis: {
                        categories: data.map((d) => d.label),
                        labels: {
                            style: { color: themeColors.foreground, fontSize: "12px" },
                            rotation: -15,
                        },
                        lineColor: themeColors.border,
                    },
                    yAxis: {
                        title: { text: "Value", style: { color: themeColors.foreground } },
                        labels: {
                            style: { color: themeColors.foreground },
                        },
                        gridLineColor: themeColors.border,
                    },
                    legend: { enabled: false },
                    plotOptions: {
                        column: {
                            colorByPoint: false,
                            color: "#8b5cf6",
                            borderWidth: 0,
                            dataLabels: {
                                enabled: false,
                            },
                            point: {
                                events: {
                                    click: function () {
                                        chartClickHandlerRef.current?.(this.category);
                                    },
                                },
                            },
                        },
                    },
                    series: [
                        {
                            name: "Value",
                            data: data.map((d) => d.value),
                        },
                    ],
                };
                return (
                    <div className="h-full">
                        <HighchartsReact highcharts={Highcharts} options={barOptions} />
                    </div>
                );
            }
            case "pie": {
                const pieOptions = {
                    ...baseChartConfig,
                    chart: {
                        ...baseChartConfig.chart,
                        type: "pie",
                        height: 480,
                    },
                    plotOptions: {
                        pie: {
                            allowPointSelect: true,
                            cursor: "pointer",
                            colors: PIE_COLORS,
                            dataLabels: {
                                enabled: true,
                                format: "{point.name}: {point.percentage:.1f}%",
                                style: {
                                    color: themeColors.foreground,
                                    fontSize: "12px",
                                },
                            },
                            showInLegend: true,
                            point: {
                                events: {
                                    click: function () {
                                        chartClickHandlerRef.current?.(this.name);
                                    },
                                },
                            },
                        },
                    },
                    legend: {
                        itemStyle: { color: themeColors.foreground },
                    },
                    series: [
                        {
                            name: "Value",
                            data: data.map((d) => ({ name: d.label, y: d.value })),
                        },
                    ],
                };
                return (
                    <div className="h-full">
                        <HighchartsReact highcharts={Highcharts} options={pieOptions} />
                    </div>
                );
            }
            case "histogram": {
                const histogramOptions = {
                    ...baseChartConfig,
                    chart: {
                        ...baseChartConfig.chart,
                        type: "column",
                        height: 480,
                    },
                    xAxis: {
                        categories: histogram.map((h) => h.label),
                        labels: {
                            style: { color: themeColors.foreground, fontSize: "12px" },
                            rotation: -15,
                        },
                        lineColor: themeColors.border,
                    },
                    yAxis: {
                        title: { text: "Frequency", style: { color: themeColors.foreground } },
                        labels: {
                            style: { color: themeColors.foreground },
                        },
                        gridLineColor: themeColors.border,
                        allowDecimals: false,
                    },
                    legend: { enabled: false },
                    plotOptions: {
                        column: {
                            color: "#06b6d4",
                            borderWidth: 0,
                            point: {
                                events: {
                                    click: function () {
                                        const range = histogram[this.index]?.range;
                                        chartClickHandlerRef.current?.(undefined, range);
                                    },
                                },
                            },
                        },
                    },
                    series: [
                        {
                            name: "Count",
                            data: histogram.map((h) => h.count),
                        },
                    ],
                };
                return (
                    <div className="h-full">
                        <HighchartsReact highcharts={Highcharts} options={histogramOptions} />
                    </div>
                );
            }
            case "scatter": {
                const scatterOptions = {
                    ...baseChartConfig,
                    chart: {
                        ...baseChartConfig.chart,
                        type: "scatter",
                        height: 480,
                    },
                    xAxis: {
                        title: { text: "Index", style: { color: themeColors.foreground } },
                        labels: {
                            style: { color: themeColors.foreground },
                        },
                        gridLineColor: themeColors.border,
                    },
                    yAxis: {
                        title: { text: "Value", style: { color: themeColors.foreground } },
                        labels: {
                            style: { color: themeColors.foreground },
                        },
                        gridLineColor: themeColors.border,
                    },
                    legend: {
                        enabled: true,
                        itemStyle: { color: themeColors.foreground },
                    },
                    plotOptions: {
                        scatter: {
                            marker: {
                                radius: 6,
                                symbol: "circle",
                            },
                            color: "#8b5cf6",
                            point: {
                                events: {
                                    click: function () {
                                        const label = data[this.index]?.label;
                                        chartClickHandlerRef.current?.(label);
                                    },
                                },
                            },
                        },
                    },
                    tooltip: {
                        ...baseChartConfig.tooltip,
                        pointFormat: "<b>{point.name}</b><br/>Index: {point.x}<br/>Value: {point.y}",
                    },
                    series: [
                        {
                            name: "Categories",
                            data: data.map((d, idx) => ({ x: idx + 1, y: d.value, name: d.label })),
                        },
                    ],
                };
                return (
                    <div className="h-full">
                        <HighchartsReact highcharts={Highcharts} options={scatterOptions} />
                    </div>
                );
            }
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
                        height: 480,
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
                                    fill: themeColors.background,
                                    stroke: themeColors.border,
                                    states: {
                                        hover: {
                                            fill: themeColors.accent,
                                        },
                                        select: {
                                            stroke: themeColors.border,
                                            fill: themeColors.accent,
                                        },
                                    },
                                },
                                symbolStroke: themeColors.foreground,
                                x: -10,
                                y: 0,
                                align: "right"
                            }
                        },
                        menuItemStyle: {
                            color: themeColors.foreground,
                            background: "transparent",
                            fontSize: "13px",
                            padding: "8px 12px",
                        },
                        menuItemHoverStyle: {
                            background: themeColors.accent,
                            color: themeColors.accentForeground,
                        },
                        menuStyle: {
                            border: `1px solid ${themeColors.border}`,
                            background: themeColors.popover,
                            padding: "4px 0",
                            borderRadius: "6px",
                            boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
                        },
                    },
                    xAxis: {
                        categories: data.map((d) => d.label),
                        lineWidth: 0,
                        tickLength: 0,
                        labels: {
                            style: { color: themeColors.foreground, fontSize: "12px" },
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
                        itemStyle: { color: themeColors.foreground },
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
                                        chartClickHandlerRef.current?.(this.name);
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
                                {chartTitle}
                            </CardTitle>
                            <div className="flex items-center gap-2 flex-wrap">
                                {/* Session Status */}
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    className="gap-2 h-8 text-xs"
                                    onClick={async () => {
                                        await saveNow();
                                        toast.success("Session saved manually!");
                                    }}
                                    title="Manually save current session"
                                >
                                    <RefreshCcw className="h-3.5 w-3.5" />
                                    <span className="hidden sm:inline">Save</span>
                                </Button>
                                
                                {/* All Chart Types Dropdown */}
                                <select
                                    value={chartType}
                                    onChange={(e) => setChartType(e.target.value)}
                                    className="border rounded-md px-2 py-1 bg-background text-xs"
                                >
                                    {chartOptions.map((opt) => (
                                        <option key={opt.value} value={opt.value}>
                                            {opt.label}
                                        </option>
                                    ))}
                                </select>
                                
                                {data.length > 0 && (
                                    <>
                                        <ExportCodeButton
                                            chartType={chartType}
                                            categoricalData={data}
                                            chartTitle={chartTitle}
                                            buttonSize="sm"
                                            buttonClassName="h-8"
                                        />
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="gap-2 h-8"
                                            onClick={() => handleExportChart()}
                                        >
                                            <Download className="h-3.5 w-3.5" />
                                            <span className="hidden sm:inline text-xs">Export</span>
                                        </Button>
                                    </>
                                )}
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <div ref={chartContainerRef} className="rounded-lg border bg-muted/30 p-1 min-h-[480px]">{chartArea()}</div>
                        {pendingEdit && (
                            <div className="relative z-[100] rounded-lg border-2 border-primary bg-background p-4 shadow-2xl">
                                <div className="flex items-center gap-2 font-semibold mb-3">
                                    <Edit3 className="h-4 w-4 text-primary" />
                                    Edit {pendingEdit.label}
                                </div>
                                <div className="flex gap-3 items-center flex-wrap">
                                    <Input
                                        value={pendingEdit.value}
                                        onChange={(e) => setPendingEdit({ ...pendingEdit, value: e.target.value })}
                                        className="max-w-[200px] bg-background"
                                        type="number"
                                        step="0.01"
                                        autoFocus
                                    />
                                    <Button onClick={saveEdit} size="sm">Save</Button>
                                    <Button variant="outline" size="sm" onClick={() => setPendingEdit(null)}>
                                        Cancel
                                    </Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card className="order-1 lg:order-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Sparkles className="h-5 w-5 text-primary" />
                            Intelligence Hub
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {/* NLP Chat Input - Moved to Top */}
                        <div className="space-y-2">
                            <div className="relative">
                                <Textarea
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                                            e.preventDefault();
                                            sendMessage();
                                        }
                                    }}
                                    placeholder="Ask a question: 'Which category has the highest value?' or 'Show top 5'"
                                    className="min-h-[80px] pr-10"
                                />
                                <Button 
                                    onClick={sendMessage} 
                                    size="sm"
                                    disabled={processing}
                                    className="absolute bottom-2 right-2 h-7 w-7 p-0"
                                >
                                    {processing ? (
                                        <RefreshCcw className="h-3.5 w-3.5 animate-spin" />
                                    ) : (
                                        <Send className="h-3.5 w-3.5" />
                                    )}
                                </Button>
                            </div>
                            
                            {/* Suggestion Chips */}
                            {data.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-7 text-xs"
                                        onClick={() => {
                                            const sorted = [...data].sort((a, b) => b.value - a.value).slice(0, 5);
                                            const msg = `Top 5 categories: ${sorted.map(d => `${d.label} (${d.value})`).join(', ')}`;
                                            setMessages(prev => [...prev, { role: "assistant", text: msg }]);
                                        }}
                                    >
                                        <TrendingUp className="h-3 w-3 mr-1" />
                                        Top 5
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-7 text-xs"
                                        onClick={() => {
                                            setInput("show distribution");
                                        }}
                                    >
                                        <Sparkles className="h-3 w-3 mr-1" />
                                        Distribution
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-7 text-xs"
                                        onClick={() => {
                                            const sorted = [...data].sort((a, b) => a.value - b.value);
                                            setData(sorted);
                                            toast.success("Sorted ascending");
                                        }}
                                    >
                                        Sort ↑
                                    </Button>
                                </div>
                            )}
                            
                            <div className="text-xs text-muted-foreground">
                                Press Ctrl+Enter to send • Try: "add Apple 25", "switch to pie", or "stats"
                            </div>
                        </div>

                        {/* Chat History */}
                        <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
                            {messages.slice(-5).map((msg, idx) => (
                                <div key={idx} className={cn("rounded-lg p-2 text-xs border", msg.role === "assistant" ? "bg-muted/50" : "bg-primary/5 border-primary/30")}>
                                    <div className="flex items-center gap-1 mb-1 text-[10px] text-muted-foreground uppercase tracking-wide">
                                        {msg.role === "assistant" ? <Bot className="h-2.5 w-2.5" /> : <User className="h-2.5 w-2.5" />}
                                        <span>{msg.role}</span>
                                    </div>
                                    <div>{msg.text}</div>
                                </div>
                            ))}
                        </div>

                        {/* Active Columns Display */}
                        {columns.length > 0 && (
                            <div className="space-y-2 pt-2 border-t">
                                <div className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                                    <Database className="h-3 w-3" />
                                    Active Columns
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {columns.map((col) => (
                                        <Badge
                                            key={col.name}
                                            variant={activeColumns.includes(col.name) ? "default" : "outline"}
                                            className="text-xs"
                                        >
                                            {col.name}
                                            <span className="ml-1 opacity-70">
                                                ({col.type === "categorical" ? "📊" : "🔢"})
                                            </span>
                                        </Badge>
                                    ))}
                                </div>
                                {csvMetadata && (
                                    <div className="text-xs text-muted-foreground">
                                        {csvMetadata.rowCount} rows • {csvMetadata.filename}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* CSV Upload */}
                        <div className="flex gap-2 pt-2">
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
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Categorical Insights Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-primary" />
                            Categorical Insights
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* NLP Narrative Summary */}
                        {insights && (
                            <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                                <p className="text-sm leading-relaxed">{insights.narrative}</p>
                            </div>
                        )}

                        {/* Categorical Metrics */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Cardinality</span>
                                <span className="font-semibold">{insights?.cardinality || 0} Unique Categories</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Total Sum</span>
                                <span className="font-semibold">{formatNumber(stats.sum)}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Average Value</span>
                                <span className="font-semibold">{formatNumber(stats.mean)}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Missing Data</span>
                                <span className="font-semibold text-green-600">{insights?.missingData || 0} Null Rows</span>
                            </div>
                        </div>

                        {/* Top/Bottom Performers */}
                        {insights && (
                            <div className="space-y-2 border-t pt-3">
                                <div className="flex items-center justify-between p-2 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
                                    <div className="flex items-center gap-2">
                                        <TrendingUp className="h-4 w-4 text-green-600" />
                                        <div>
                                            <div className="font-semibold text-sm">{insights.topPerformer.label}</div>
                                            <div className="text-xs text-muted-foreground">Top Performer</div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-semibold">{insights.topPerformer.value}</div>
                                        <div className="text-xs text-muted-foreground">{insights.topPerformerPercent}%</div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between p-2 rounded-lg bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800">
                                    <div className="flex items-center gap-2">
                                        <TrendingDown className="h-4 w-4 text-orange-600" />
                                        <div>
                                            <div className="font-semibold text-sm">{insights.bottomPerformer.label}</div>
                                            <div className="text-xs text-muted-foreground">Bottom Performer</div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-semibold">{insights.bottomPerformer.value}</div>
                                        <div className="text-xs text-muted-foreground">{insights.bottomPerformerPercent}%</div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Data Table with Search and Pagination */}
                <Card className="md:col-span-2">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                            <Database className="h-4 w-4" />
                            Smart Data Grid
                            <Badge variant="outline">{filteredData.length}</Badge>
                            {selectedCategory && (
                                <Badge variant="default" className="ml-2">
                                    Filtered: {selectedCategory}
                                </Badge>
                            )}
                        </CardTitle>
                        <div className="flex items-center gap-2">
                            {selectedCategory && (
                                <Button 
                                    size="sm" 
                                    variant="outline" 
                                    onClick={() => {
                                        setSelectedCategory(null);
                                        toast.success("Filter cleared");
                                    }}
                                >
                                    Clear Filter
                                </Button>
                            )}
                            {data.length > 0 && (
                                <Button size="sm" variant="outline" onClick={clearAll}>
                                    Clear All
                                </Button>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {data.length === 0 && (
                            <Alert>
                                <AlertDescription>No categories yet. Use chat, Quick Add, or import CSV.</AlertDescription>
                            </Alert>
                        )}
                        
                        {data.length > 0 && (
                            <>
                                {/* Search */}
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search categories..."
                                        value={tableSearch}
                                        onChange={(e) => {
                                            setTableSearch(e.target.value);
                                            setCurrentPage(1);
                                        }}
                                        className="pl-9"
                                    />
                                </div>

                                {/* Table */}
                                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                                    {paginatedData.map((item) => (
                                        <div key={item.label} className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm hover:bg-muted/50 transition">
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

                                {/* Pagination */}
                                {totalPages > 1 && (
                                    <div className="flex items-center justify-between pt-2 border-t">
                                        <div className="text-xs text-muted-foreground">
                                            Page {currentPage} of {totalPages}
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                                disabled={currentPage === 1}
                                            >
                                                Previous
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                                disabled={currentPage === totalPages}
                                            >
                                                Next
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </>
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
