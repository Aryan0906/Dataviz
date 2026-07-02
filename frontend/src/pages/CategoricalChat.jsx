import { useMemo, useState, useRef, useCallback, useEffect } from "react";
import AppLayout from "@/components/AppLayout";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const ALL_PLOT_TYPES = [
    { value: "bar", label: "Bar Plot" },
    { value: "count", label: "Count Plot" },
    { value: "box", label: "Box Plot" },
    { value: "violin", label: "Violin Plot" },
    { value: "boxen", label: "Boxen Plot (Letter-Value)" },
    { value: "strip", label: "Strip Plot" },
    { value: "swarm", label: "Swarm Plot" },
    { value: "pie", label: "Pie Chart" },
    { value: "donut", label: "Donut Chart" },
    { value: "stacked_bar", label: "Stacked Bar Chart" },
    { value: "grouped_bar", label: "Grouped Bar Chart" },
    { value: "percent_stacked_bar", label: "100% Stacked Bar Chart" },
    { value: "mosaic", label: "Mosaic Plot" },
    { value: "treemap", label: "Treemap" },
    { value: "sunburst", label: "Sunburst Chart" },
    { value: "heatmap", label: "Heatmap (Cross-tabulation)" },
    { value: "alluvial", label: "Alluvial Diagram (Sankey)" },
    { value: "radar", label: "Radar Chart (Spider Plot)" },
    { value: "dumbbell", label: "Dumbbell Plot" },
    { value: "point", label: "Point Plot (Dot Plot)" },
    { value: "waffle", label: "Waffle Chart" },
    { value: "bubble", label: "Bubble Chart (Categorical)" }
];

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { usePageSession, useHistoryLogger } from "@/hooks/usePageSession";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
    Sparkles, Send, BarChart3, PieChart as PieIcon, TreePalm, LineChart, AreaChart,
    Download, FileUp, RefreshCw, AlertCircle, Database,
    TrendingUp, Search, MessageSquare, Pencil, Trash2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import Papa from "papaparse";
import { UniversalChart } from "@/components/UniversalChart";
import { dataAPI } from "@/lib/api";
import ChartExportButton from "@/components/ChartExportButton";
import ExportCodeButton from "@/components/ExportCodeButton";
import StorySummaryCard from "@/components/StorySummaryCard";

const INITIAL_DATA = [
    { label: "Apples", value: 32 },
    { label: "Bananas", value: 18 },
    { label: "Cherries", value: 24 },
    { label: "Dates", value: 12 },
    { label: "Elderberries", value: 8 },
];

const INITIAL_COLUMNS = [
    { name: "label", type: "categorical" },
    { name: "value", type: "numerical" }
];

const normalizeLabel = (label) => String(label).trim().toLowerCase();

// Regex interpreter for quick local commands
const interpretCommand = (raw, current, currentChart, xAxisKey, dataKeys) => {
    const input = raw.trim();
    const lower = input.toLowerCase();
    
    const xKey = xAxisKey || 'label';
    const yKey = (dataKeys && dataKeys[0]) || 'value';
    
    let nextData = [...current];
    let nextChart = currentChart;
    const notes = [];
    let dataChanged = false;

    const upsertPoint = (label, value) => {
        if (Number.isNaN(value)) return;
        const idx = nextData.findIndex((d) => normalizeLabel(d[xKey]) === normalizeLabel(label));
        if (idx >= 0) {
            nextData[idx] = { ...nextData[idx], [yKey]: value };
        } else {
            nextData.push({ [xKey]: label, [yKey]: value });
        }
        dataChanged = true;
    };

    const chartMatch = lower.match(/(bar|pie|treemap)/);
    if (chartMatch) {
        nextChart = chartMatch[1];
        notes.push(`Switched chart to ${nextChart}.`);
    }

    if (/(clear plot|clear chart|clear data|reset|start over)/.test(lower)) {
        nextData = [];
        notes.push("Cleared all categories.");
        dataChanged = true;
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

    const updatePattern = /(set|update|change)\s+([A-Za-z0-9\s_-]+)\s+(?:to|=)\s+(-?\d+(?:\.\d+)?)/gi;
    while ((match = updatePattern.exec(input)) !== null) {
        const label = match[2].trim();
        const value = parseFloat(match[3]);
        const idx = nextData.findIndex((d) => normalizeLabel(d[xKey]) === normalizeLabel(label));
        if (idx >= 0 && !Number.isNaN(value)) {
            nextData[idx] = { ...nextData[idx], [yKey]: value };
            dataChanged = true;
            notes.push(`Changed ${label} to ${value}.`);
        }
    }

    const removePattern = /(remove|delete|drop)\s+([A-Za-z0-9\s_-]+)/gi;
    while ((match = removePattern.exec(input)) !== null) {
        const label = match[2].trim();
        const before = nextData.length;
        nextData = nextData.filter((d) => normalizeLabel(d[xKey]) !== normalizeLabel(label));
        if (nextData.length !== before) {
            dataChanged = true;
            notes.push(`Removed ${label}.`);
        }
    }

    return { nextData, nextChart, reply: notes.join(" "), dataChanged };
};

export const CategoricalChatPanel = () => {
    const fileInputRef = useRef(null);
    const chartContainerRef = useRef(null);

    // === Categorical Data State ===
    const [categoricalData, setCategoricalData] = useState(INITIAL_DATA);
    const [columns, setColumns] = useState(INITIAL_COLUMNS);
    const [activeColumns, setActiveColumns] = useState(INITIAL_COLUMNS);

    // === NLP & Chat State ===
    const [chatInput, setChatInput] = useState("");
    const [chatHistory, setChatHistory] = useState([
        {
            type: 'system',
            message: "Welcome! Add data using Quick Add, import CSV, or type natural language queries. Example: 'add Mango 22' or 'Show count by label'."
        }
    ]);
    const [isProcessingQuery, setIsProcessingQuery] = useState(false);

    // === Visualization State ===
    const [chartType, setChartType] = useState("bar"); // bar, pie, treemap
    const [chartData, setChartData] = useState(INITIAL_DATA);
    const [chartTitle, setChartTitle] = useState("Categorical Visualizer");
    const [xAxisKey, setXAxisKey] = useState("label");
    const [dataKeys, setDataKeys] = useState(["value"]);

    // === Insights State ===
    const [insights, setInsights] = useState({
        summary: "Loaded default category dataset. Apples leads with 32 units.",
        cardinality: INITIAL_DATA.length,
        topPerformer: { label: "Apples", value: 32 },
        bottomPerformer: { label: "Elderberries", value: 8 },
        missingData: 0,
        totalCount: INITIAL_DATA.length
    });

    // === Table State ===
    const [filteredData, setFilteredData] = useState(INITIAL_DATA);
    const [tableSearch, setTableSearch] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    
    // === AI Data Story State ===
    const [aiSummary, setAiSummary] = useState(null);
    const [isGeneratingStory, setIsGeneratingStory] = useState(false);
    const [error, setError] = useState("");

    // === Interactive Item Edit State ===
    const [selectedChartItem, setSelectedChartItem] = useState(null);
    const [showEditItemDialog, setShowEditItemDialog] = useState(false);

    // Prepare state for session persistence
    const sessionState = useMemo(() => ({
        categoricalData,
        chartData,
        chartType,
        chartTitle,
        xAxisKey,
        dataKeys,
        columns,
        activeColumns,
        chatHistory
    }), [categoricalData, chartData, chartType, chartTitle, xAxisKey, dataKeys, columns, activeColumns, chatHistory]);

    // Restore state callback
    const restoreState = useCallback((savedState) => {
        if (savedState.categoricalData) setCategoricalData(savedState.categoricalData);
        if (savedState.chartData) setChartData(savedState.chartData);
        if (savedState.chartType) setChartType(savedState.chartType);
        if (savedState.chartTitle) setChartTitle(savedState.chartTitle);
        if (savedState.xAxisKey) setXAxisKey(savedState.xAxisKey);
        if (savedState.dataKeys) setDataKeys(savedState.dataKeys);
        if (savedState.columns) setColumns(savedState.columns);
        if (savedState.activeColumns) setActiveColumns(savedState.activeColumns);
        if (savedState.chatHistory) setChatHistory(savedState.chatHistory);
    }, []);

    // Session auto-save
    usePageSession('categorical', sessionState, restoreState);

    // History tracking
    const { logCreate, logExport } = useHistoryLogger('categorical');

    // Dynamically update insights when data changes
    useEffect(() => {
        if (categoricalData.length === 0) {
            setInsights({
                summary: "",
                cardinality: 0,
                topPerformer: null,
                bottomPerformer: null,
                missingData: 0,
                totalCount: 0
            });
            return;
        }

        const xKey = xAxisKey || 'label';
        const yKey = (dataKeys && dataKeys[0]) || 'value';

        const sorted = [...categoricalData]
            .filter(d => d[yKey] !== undefined)
            .sort((a, b) => (Number(b[yKey]) || 0) - (Number(a[yKey]) || 0));

        if (sorted.length === 0) return;

        const top = sorted[0];
        const bottom = sorted[sorted.length - 1];
        const total = categoricalData.reduce((acc, d) => acc + (Number(d[yKey]) || 0), 0);
        const unique = new Set(categoricalData.map(d => d[xKey])).size;

        const summaryText = `${top[xKey]} leads with ${top[yKey]} items, representing a significant portion of the total count (${total} items across ${unique} unique categories).`;

        setInsights({
            summary: summaryText,
            cardinality: unique,
            topPerformer: { label: String(top[xKey]), value: Number(top[yKey]) },
            bottomPerformer: { label: String(bottom[xKey]), value: Number(bottom[yKey]) },
            missingData: categoricalData.filter(d => d[xKey] === undefined || d[yKey] === undefined).length,
            totalCount: categoricalData.length
        });
    }, [categoricalData, xAxisKey, dataKeys]);

    // Local simulated query fallback
    const simulateNLPProcessing = async (queryText, rawData, cols) => {
        const lowerQuery = queryText.toLowerCase();
        let targetColumn = cols.find(col => lowerQuery.includes(col.name.toLowerCase()));

        if (!targetColumn) {
            targetColumn = cols.find(col => col.type === 'categorical') || cols[0];
        }

        if (!targetColumn) {
            throw new Error("No categorical column found");
        }

        const aggregated = {};
        rawData.forEach(row => {
            const val = row[targetColumn.name];
            if (val !== undefined && val !== null) {
                aggregated[val] = (aggregated[val] || 0) + 1;
            }
        });

        const labels = Object.keys(aggregated);
        const values = Object.values(aggregated);

        return {
            chart_config: {
                chartType: "bar",
                title: `Count by ${targetColumn.name}`,
                xAxisKey: "label",
                dataKeys: ["Count"]
            },
            chart_data: labels.map((l, i) => ({ label: l, Count: values[i] })),
            table_data: rawData
        };
    };

    // Chat query submit handler
    const handleChatSubmit = async () => {
        const trimmedInput = chatInput.trim();
        if (!trimmedInput) return;

        setChatInput("");
        setIsProcessingQuery(true);
        setChatHistory(prev => [...prev, { type: 'user', message: trimmedInput }]);

        // 1. Try local regex command first
        const localResult = interpretCommand(trimmedInput, categoricalData, chartType, xAxisKey, dataKeys);
        if (localResult.dataChanged || localResult.reply) {
            setCategoricalData(localResult.nextData);
            setFilteredData(localResult.nextData);
            setChartData(localResult.nextData);
            setChartType(localResult.nextChart);
            setChatHistory(prev => [...prev, { type: 'system', message: localResult.reply || "Command executed." }]);
            setIsProcessingQuery(false);
            toast.success("Command executed locally");
            return;
        }

        // 2. Fall back to backend NLP query
        try {
            const response = await dataAPI.categoricalQuery(trimmedInput, categoricalData, columns);
            
            if (response.chart_config) {
                setChartType(response.chart_config.chartType || "bar");
                setChartTitle(response.chart_config.title || trimmedInput);
                setXAxisKey(response.chart_config.xAxisKey || "label");
                setDataKeys(response.chart_config.dataKeys || ["value"]);
            }

            setChartData(response.chart_data || response.chart);
            setFilteredData(response.table_data || categoricalData);

            setChatHistory(prev => [
                ...prev,
                {
                    type: 'system',
                    message: response.insights?.summary || "Generated visualization based on query."
                }
            ]);
            toast.success("Query processed successfully");
        } catch (_err) {
            console.warn("Backend NLP query failed, trying local fallback:", _err);
            try {
                const localNLP = await simulateNLPProcessing(trimmedInput, categoricalData, columns);
                setChartType(localNLP.chart_config.chartType);
                setChartTitle(localNLP.chart_config.title);
                setXAxisKey(localNLP.chart_config.xAxisKey);
                setDataKeys(localNLP.chart_config.dataKeys);
                setChartData(localNLP.chart_data);
                
                setChatHistory(prev => [
                    ...prev,
                    {
                        type: 'system',
                        message: `Generated local summary count chart by scanning categories.`
                    }
                ]);
            } catch (_) {
                setChatHistory(prev => [
                    ...prev,
                    {
                        type: 'error',
                        message: "Unable to understand that query. Try: 'add Grapes 40', 'set chart to pie', or 'show count of label'."
                    }
                ]);
                toast.error("Failed to parse query");
            }
        } finally {
            setIsProcessingQuery(false);
        }
    };

    // Filter table search
    useEffect(() => {
        if (!tableSearch.trim()) {
            setFilteredData(categoricalData);
            return;
        }

        const filtered = categoricalData.filter(row =>
            Object.values(row).some(val =>
                String(val).toLowerCase().includes(tableSearch.toLowerCase())
            )
        );
        setFilteredData(filtered);
        setCurrentPage(1);
    }, [tableSearch, categoricalData]);

    const paginatedData = filteredData.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const totalPages = Math.ceil(filteredData.length / itemsPerPage);

    // Dynamic coloring for chart bar click
    const handleChartClick = (label) => {
        const xKey = xAxisKey || 'label';
        const yKey = dataKeys[0] || 'value';
        
        // Find current matching item in categoricalData
        const match = categoricalData.find(row => String(row[xKey]) === label);
        const val = match ? Number(match[yKey]) : 0;

        setSelectedChartItem({
            originalLabel: label,
            label: label,
            value: val
        });
        setShowEditItemDialog(true);
    };

    const handleSaveChartItem = () => {
        if (!selectedChartItem) return;
        const xKey = xAxisKey || 'label';
        const yKey = dataKeys[0] || 'value';

        const updatedCat = categoricalData.map(row => {
            if (String(row[xKey]) === selectedChartItem.originalLabel) {
                return {
                    ...row,
                    [xKey]: selectedChartItem.label,
                    [yKey]: Number(selectedChartItem.value)
                };
            }
            return row;
        });

        const updatedChart = chartData.map(row => {
            if (String(row.name) === selectedChartItem.originalLabel) {
                return {
                    ...row,
                    name: selectedChartItem.label,
                    value: Number(selectedChartItem.value)
                };
            }
            return row;
        });

        setCategoricalData(updatedCat);
        setChartData(updatedChart);
        setFilteredData(updatedCat);

        setShowEditItemDialog(false);
        setSelectedChartItem(null);
        toast.success(`Successfully updated category "${selectedChartItem.label}"`);
    };

    const handleExcludeChartItem = () => {
        if (!selectedChartItem) return;
        const xKey = xAxisKey || 'label';

        const updatedCat = categoricalData.filter(row => String(row[xKey]) !== selectedChartItem.originalLabel);
        const updatedChart = chartData.filter(row => String(row.name) !== selectedChartItem.originalLabel);

        setCategoricalData(updatedCat);
        setChartData(updatedChart);
        setFilteredData(updatedCat);

        setShowEditItemDialog(false);
        setSelectedChartItem(null);
        toast.success(`Excluded category "${selectedChartItem.originalLabel}"`);
    };

    const handleFilterTableItem = () => {
        if (!selectedChartItem) return;
        setTableSearch(selectedChartItem.originalLabel);
        setShowEditItemDialog(false);
        setSelectedChartItem(null);
        toast.info(`Filtered table to "${selectedChartItem.originalLabel}"`);
    };

    // Export handler callback for logging
    const handleExportLog = ({ filename }) => {
        logExport(filename, chartData);
    };

    // CSV File Import
    const handleCategoricalFileUpload = (event) => {
        setError("");
        const file = event.target.files?.[0];

        if (!file) return;

        if (!file.name.endsWith('.csv')) {
            setError("Please select a CSV file");
            return;
        }

        setIsGeneratingStory(true);
        dataAPI.uploadCSV(file)
            .then(res => {
                if (res.ai_summary) {
                    setAiSummary(res.ai_summary);
                }
            })
            .catch(err => {
                console.error("Failed to generate AI summary:", err);
            })
            .finally(() => {
                setIsGeneratingStory(false);
            });

        const reader = new FileReader();
        reader.onload = (e) => {
            const csv = e.target?.result;
            Papa.parse(csv, {
                header: true,
                skipEmptyLines: true,
                dynamicTyping: true,
                complete: (results) => {
                    try {
                        const rawData = results.data;
                        if (rawData.length === 0) {
                            setError("No valid data found in CSV file");
                            return;
                        }

                        const headers = Object.keys(rawData[0]);
                        const columnMetadata = headers.map(header => {
                            const sampleValues = rawData.slice(0, 10).map(row => row[header]);
                            const isCategorical = sampleValues.some(val =>
                                typeof val === 'string' || isNaN(parseFloat(val))
                            );

                            return {
                                name: header,
                                type: isCategorical ? 'categorical' : 'numerical'
                            };
                        });

                        const catCol = columnMetadata.find(c => c.type === 'categorical') || columnMetadata[0];
                        const numCol = columnMetadata.find(c => c.type === 'numerical') || columnMetadata[1] || catCol;

                        setCategoricalData(rawData);
                        setColumns(columnMetadata);
                        setActiveColumns(columnMetadata);
                        setFilteredData(rawData);
                        
                        setXAxisKey(catCol.name);
                        setDataKeys([numCol.name]);
                        setChartData(rawData);
                        setChartTitle(`Visualization: ${catCol.name} vs ${numCol.name}`);

                        setChatHistory(prev => [
                            ...prev,
                            {
                                type: 'system',
                                message: `Loaded CSV: ${rawData.length} rows with ${columnMetadata.length} columns. X-Axis bound to '${catCol.name}', values bound to '${numCol.name}'.`
                            }
                        ]);

                        logCreate("Uploaded CSV", rawData);
                        toast.success(`Imported ${rawData.length} rows`);
                        if (fileInputRef.current) {
                            fileInputRef.current.value = '';
                        }
                    } catch (err) {
                        setError("Failed to parse CSV file");
                        console.error(err);
                    }
                },
                error: () => {
                    setError("Failed to read CSV file");
                },
            });
        };
        reader.readAsText(file);
    };

    return (
        <div className="space-y-6">
            {/* Header section */}
            <div>
                <h2 className="text-2xl font-bold tracking-tight">Categorical Analysis Chat</h2>
                <p className="text-muted-foreground">Manage datasets locally, query using NLP, and generate customized charts.</p>
                <p className="text-xs text-muted-foreground mt-1">
                    💡 Try: <span className="font-mono bg-muted px-1 py-0.5 rounded">add Mango 25</span>, <span className="font-mono bg-muted px-1 py-0.5 rounded">set chart to treemap</span>, or ask <span className="font-mono bg-muted px-1 py-0.5 rounded">"Show count by category"</span>
                </p>
            </div>

            {error && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {aiSummary && (
                <StorySummaryCard 
                    story={aiSummary} 
                    onClose={() => setAiSummary(null)} 
                />
            )}
            {isGeneratingStory && !aiSummary && (
                <div className="p-4 rounded-xl border border-indigo-100 bg-indigo-50/50 flex items-center justify-center space-x-2 text-indigo-500 text-sm animate-pulse">
                    <Sparkles className="w-4 h-4" />
                    <span>Generating AI Story narrative from dataset...</span>
                </div>
            )}

            {/* Main grid layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* 1. Visualizer Area */}
                <Card className="lg:row-span-2 flex flex-col justify-between">
                    <CardHeader className="space-y-3">
                        <div className="flex flex-row items-center justify-between flex-wrap gap-2">
                            <CardTitle className="flex items-center gap-2">
                                <Sparkles className="h-5 w-5 text-indigo-500" />
                                {chartTitle}
                            </CardTitle>
                            {chartData.length > 0 && (
                                <div className="flex gap-2 items-center">
                                    <div className="w-[180px]">
                                        <Select value={chartType} onValueChange={setChartType}>
                                            <SelectTrigger className="h-8 text-xs">
                                                <SelectValue placeholder="Select plot type" />
                                            </SelectTrigger>
                                            <SelectContent className="max-h-[300px] overflow-y-auto">
                                                {ALL_PLOT_TYPES.map((pt) => (
                                                    <SelectItem key={pt.value} value={pt.value} className="text-xs">
                                                        {pt.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <ChartExportButton
                                        elementRef={chartContainerRef}
                                        filenamePrefix={`categorical-${chartType}`}
                                        chartTitle={chartTitle}
                                        chartType={chartType}
                                        buttonSize="sm"
                                        buttonClassName="h-8 gap-1.5"
                                        onExport={handleExportLog}
                                    />
                                    <ExportCodeButton
                                        chartType={chartType}
                                        categoricalData={chartData}
                                        chartTitle={chartTitle}
                                        buttonSize="sm"
                                        buttonVariant="outline"
                                        buttonClassName="h-8 gap-1.5"
                                    />
                                </div>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col justify-center">
                        {chartData.length > 0 ? (
                            <div ref={chartContainerRef}>
                                <UniversalChart
                                    type={chartType}
                                    data={chartData}
                                    xAxisKey={xAxisKey}
                                    dataKeys={dataKeys}
                                    onBarClick={handleChartClick}
                                />
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-64 text-center space-y-4">
                                <FileUp className="h-12 w-12 text-muted-foreground opacity-40 animate-bounce" />
                                <div>
                                    <h3 className="font-semibold text-lg">Empty Chart Area</h3>
                                    <p className="text-muted-foreground text-xs">Type commands or upload a dataset to begin.</p>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* 2. Intelligence Hub (Chat Log) */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <MessageSquare className="h-5 w-5 text-primary" />
                            Intelligence Hub
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Chat window log */}
                        <div className="max-h-56 min-h-36 overflow-y-auto space-y-2 p-3 bg-muted/30 rounded-lg border">
                            {chatHistory.map((msg, idx) => (
                                <div
                                    key={idx}
                                    className={cn(
                                        "p-2 rounded text-xs leading-relaxed",
                                        msg.type === 'user' && "bg-primary/10 text-foreground ml-8 text-right",
                                        msg.type === 'system' && "bg-green-500/10 text-foreground mr-8",
                                        msg.type === 'error' && "bg-destructive/10 text-destructive mr-8"
                                    )}
                                >
                                    <span className="font-semibold opacity-80 mr-1">
                                        {msg.type === 'user' ? 'You' : msg.type === 'error' ? 'System Error' : 'AI'}
                                    </span>
                                    {msg.message}
                                </div>
                            ))}
                        </div>

                        {/* Input bar */}
                        <div className="flex gap-2">
                            <Input
                                placeholder="Type local command or NLP query..."
                                value={chatInput}
                                onChange={(e) => setChatInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleChatSubmit()}
                                disabled={isProcessingQuery}
                                className="flex-1"
                            />
                            <Button
                                onClick={handleChatSubmit}
                                disabled={isProcessingQuery || !chatInput.trim()}
                            >
                                {isProcessingQuery ? (
                                    <RefreshCw className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Send className="h-4 w-4" />
                                )}
                            </Button>
                        </div>

                        {/* Active columns badge display */}
                        {activeColumns.length > 0 && (
                            <div className="space-y-1.5 pt-2 border-t text-xs">
                                <div className="font-medium text-muted-foreground flex items-center gap-1.5">
                                    <Database className="h-3.5 w-3.5" />
                                    Active Headers
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                    {activeColumns.map((col, idx) => (
                                        <Badge
                                            key={idx}
                                            variant={col.type === 'categorical' ? 'default' : 'secondary'}
                                            className="px-1.5 py-0.5 text-[10px]"
                                        >
                                            {col.name} ({col.type === 'categorical' ? 'str' : 'num'})
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* CSV Uploader */}
                        <div className="pt-2 border-t">
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".csv"
                                onChange={handleCategoricalFileUpload}
                                className="hidden"
                            />
                            <Button
                                onClick={() => fileInputRef.current?.click()}
                                variant="outline"
                                className="w-full gap-2 text-xs h-9"
                            >
                                <FileUp className="h-4 w-4" />
                                Import CSV Dataset
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* 3. Categorical Insights Summary */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                            <TrendingUp className="h-4 w-4" />
                            Data Insights Summary
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 text-xs">
                        {insights.summary ? (
                            <>
                                <div className="p-3 bg-muted/40 rounded-lg border leading-relaxed">
                                    {insights.summary}
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="p-2.5 bg-muted/30 rounded border">
                                        <div className="text-[10px] text-muted-foreground">Unique Cardinality</div>
                                        <div className="text-xl font-bold">{insights.cardinality}</div>
                                    </div>
                                    <div className="p-2.5 bg-muted/30 rounded border">
                                        <div className="text-[10px] text-muted-foreground">Total Rows</div>
                                        <div className="text-xl font-bold">{insights.totalCount}</div>
                                    </div>
                                    {insights.topPerformer && (
                                        <div className="p-2.5 bg-green-500/5 rounded border border-green-500/10">
                                            <div className="text-[10px] text-green-600 font-medium">Top Category</div>
                                            <div className="font-semibold truncate">{insights.topPerformer.label}</div>
                                            <div className="text-muted-foreground text-[10px]">{insights.topPerformer.value} units</div>
                                        </div>
                                    )}
                                    {insights.bottomPerformer && (
                                        <div className="p-2.5 bg-orange-500/5 rounded border border-orange-500/10">
                                            <div className="text-[10px] text-orange-600 font-medium">Bottom Category</div>
                                            <div className="font-semibold truncate">{insights.bottomPerformer.label}</div>
                                            <div className="text-muted-foreground text-[10px]">{insights.bottomPerformer.value} units</div>
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            <div className="text-center py-6 text-muted-foreground">
                                Upload a CSV or execute commands to view insights.
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* 4. Table Preview */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between text-sm font-semibold">
                            <span className="flex items-center gap-2">
                                <Database className="h-4 w-4" />
                                Dataset Rows
                            </span>
                            <span className="font-normal text-muted-foreground text-xs">{filteredData.length} records</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-xs">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                            <Input
                                placeholder="Filter records..."
                                value={tableSearch}
                                onChange={(e) => setTableSearch(e.target.value)}
                                className="pl-8 h-8 text-xs"
                            />
                        </div>

                        {filteredData.length > 0 ? (
                            <div className="space-y-2">
                                <div className="border rounded-lg overflow-x-auto max-h-44">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-muted/50 border-b">
                                                {columns.map(col => (
                                                    <th key={col.name} className="p-2 font-medium capitalize">{col.name}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {paginatedData.map((row, idx) => (
                                                <tr key={idx} className="border-b last:border-0 hover:bg-muted/10">
                                                    {columns.map(col => (
                                                        <td key={col.name} className="p-2 truncate max-w-[120px]">
                                                            {String(row[col.name] !== undefined ? row[col.name] : '')}
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Pagination */}
                                {totalPages > 1 && (
                                    <div className="flex items-center justify-between pt-1 text-[10px]">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                            disabled={currentPage === 1}
                                            className="h-6 px-2 text-[10px]"
                                        >
                                            Previous
                                        </Button>
                                        <span>Page {currentPage} of {totalPages}</span>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                            disabled={currentPage === totalPages}
                                            className="h-6 px-2 text-[10px]"
                                        >
                                            Next
                                        </Button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="text-center py-6 text-muted-foreground">
                                No records found.
                            </div>
                        )}
                    </CardContent>
                </Card>

            </div>

        </div>
    );
};

const CategoricalChat = () => (
    <AppLayout>
        <div className="container mx-auto p-4 lg:p-8 max-w-6xl">
            <CategoricalChatPanel />
        </div>
    </AppLayout>
);

export default CategoricalChat;
