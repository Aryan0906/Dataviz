import { useState, useRef, useEffect } from "react";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
    AlertCircle, FileUp, RefreshCw,
    Send, BarChart3, PieChart, TreePalm, Search, Sparkles, TrendingUp, TrendingDown,
    Database, AlertTriangle, Download, Code2, FileImage, FileText, Moon, Sun
} from "lucide-react";
import { toast } from "sonner";
import Papa from "papaparse";
import { UniversalChart } from "@/components/UniversalChart";
import { dataAPI } from "@/lib/api";
import { exportChartAsPNG, exportChartAsPDF } from "@/lib/chartExport";
import ChartCodeExportModal from "@/components/ChartCodeExportModal";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import StorySummaryCard from "@/components/StorySummaryCard";

const CategoricalChatNLP = () => {
    const fileInputRef = useRef(null);
    const chartContainerRef = useRef(null);

    // === Categorical Data State ===
    const [categoricalData, setCategoricalData] = useState([]); // Raw CSV data
    const [columns, setColumns] = useState([]); // Column metadata with types
    const [activeColumns, setActiveColumns] = useState([]); // Columns available for querying

    // === NLP & Chat State ===
    const [chatInput, setChatInput] = useState("");
    const [chatHistory, setChatHistory] = useState([]);
    const [isProcessingQuery, setIsProcessingQuery] = useState(false);

    // === Visualization State ===
    const [chartType, setChartType] = useState("bar"); // bar, pie, treemap
    const [chartData, setChartData] = useState(null);
    const [chartTitle, setChartTitle] = useState("Visualizer");

    // === Insights State ===
    const [insights, setInsights] = useState({
        summary: "",
        cardinality: 0,
        topPerformer: null,
        bottomPerformer: null,
        missingData: 0,
        totalCount: 0
    });

    // === Table State ===
    const [filteredData, setFilteredData] = useState([]);
    const [tableSearch, setTableSearch] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    
    // === AI Data Story State ===
    const [aiSummary, setAiSummary] = useState(null);
    const [isGeneratingStory, setIsGeneratingStory] = useState(false);

    const [error, setError] = useState("");

    // Export theme dialog state
    const [showExportDialog, setShowExportDialog] = useState(false);
    const [exportFormat, setExportFormat] = useState("png");
    const [exportTheme, setExportTheme] = useState("light");

    // Code export modal state
    const [showCodeExportModal, setShowCodeExportModal] = useState(false);

    // === NLP Query Processing ===
    const handleChatSubmit = async () => {
        if (!chatInput.trim() || !categoricalData.length) {
            toast.error("Please upload data and enter a query");
            return;
        }

        setIsProcessingQuery(true);
        setChatHistory(prev => [...prev, { type: 'user', message: chatInput }]);

        try {
            // Using the new categoricalQuery endpoint with LLM fallback
            const response = await dataAPI.categoricalQuery(
                chatInput, 
                categoricalData, 
                columns
            );

            // Update visualization
            setChartData(response.chart_data || response.chart); // Handling both new and old format if any
            if (response.chart_config) {
                setChartType(response.chart_config.chartType || "bar");
                setChartTitle(response.chart_config.title || chatInput);
            } else if (response.chart) {
                setChartTitle(response.chart.title || chatInput);
            }
            
            // New endpoint might not return full insights yet, handle gracefully
            if (response.insights) {
                setInsights(response.insights);
            }

            setFilteredData(response.table_data || categoricalData);

            // Add system response to chat
            setChatHistory(prev => [
                ...prev,
                {
                    type: 'system',
                    message: response.insights?.summary || "Chart generated successfully based on your query."
                }
            ]);

            setChatInput("");
            toast.success("Query processed successfully");
        } catch (_err) {
            console.error(_err);
            toast.error("Failed to process query");
            setChatHistory(prev => [
                ...prev,
                {
                    type: 'error',
                    message: "I couldn't understand that query or generate a valid chart. Try asking 'Show count by [Column Name]'"
                }
            ]);
        } finally {
            setIsProcessingQuery(false);
        }
    };

    // Simulate NLP processing (will be replaced with backend call)
    const simulateNLPProcessing = async (query, rawData, cols) => {
        // Simple keyword matching for demo
        const lowerQuery = query.toLowerCase();

        // Find column mentioned in query
        let targetColumn = cols.find(col =>
            lowerQuery.includes(col.name.toLowerCase())
        );

        if (!targetColumn) {
            targetColumn = cols.find(col => col.type === 'categorical');
        }

        if (!targetColumn) {
            throw new Error("No categorical column found");
        }

        // Aggregate data
        const aggregated = {};
        rawData.forEach(row => {
            const value = row[targetColumn.name];
            if (value) {
                aggregated[value] = (aggregated[value] || 0) + 1;
            }
        });

        const labels = Object.keys(aggregated);
        const values = Object.values(aggregated);

        // Find top and bottom performers
        const max = Math.max(...values);
        const min = Math.min(...values);
        const maxIndex = values.indexOf(max);
        const minIndex = values.indexOf(min);

        return {
            chart: {
                title: `Count by ${targetColumn.name}`,
                type: "bar",
                labels: labels,
                datasets: [{
                    label: "Count",
                    data: values,
                    backgroundColor: generateColors(labels.length)
                }]
            },
            insights: {
                summary: `${labels[maxIndex]} leads with ${max} items, which is ${(max / min).toFixed(1)}x higher than ${labels[minIndex]}.`,
                cardinality: labels.length,
                topPerformer: { label: labels[maxIndex], value: max },
                bottomPerformer: { label: labels[minIndex], value: min },
                missingData: rawData.length - values.reduce((a, b) => a + b, 0),
                totalCount: rawData.length
            },
            table_data: rawData
        };
    };

    // Generate distinct colors for chart
    const generateColors = (count) => {
        const colors = [
            'rgba(59, 130, 246, 0.8)',   // blue
            'rgba(16, 185, 129, 0.8)',   // green
            'rgba(251, 146, 60, 0.8)',   // orange
            'rgba(239, 68, 68, 0.8)',    // red
            'rgba(168, 85, 247, 0.8)',   // purple
            'rgba(236, 72, 153, 0.8)',   // pink
            'rgba(14, 165, 233, 0.8)',   // sky
            'rgba(251, 191, 36, 0.8)',   // amber
        ];

        return Array(count).fill(0).map((_, i) => colors[i % colors.length]);
    };

    // Handle chart bar click to filter table
    const handleChartClick = (label) => {
        const targetColumn = activeColumns.find(col => col.type === 'categorical');
        if (!targetColumn) return;

        const filtered = categoricalData.filter(row => row[targetColumn.name] === label);
        setFilteredData(filtered);
        setTableSearch(label);
        toast.info(`Filtered to show ${filtered.length} rows for "${label}"`);
    };

    // Handle CSV file upload with metadata extraction
    const handleCategoricalFileUpload = (event) => {
        setError("");
        const file = event.target.files?.[0];

        if (!file) return;

        if (!file.name.endsWith('.csv')) {
            setError("Please select a CSV file");
            return;
        }

        // Call backend to generate AI Data Story and metadata
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

                        // Extract column metadata
                        const headers = Object.keys(rawData[0]);
                        const columnMetadata = headers.map(header => {
                            // Determine if column is categorical or numerical
                            const sampleValues = rawData.slice(0, 10).map(row => row[header]);
                            const isCategorical = sampleValues.some(val =>
                                typeof val === 'string' || isNaN(parseFloat(val))
                            );

                            return {
                                name: header,
                                type: isCategorical ? 'categorical' : 'numerical'
                            };
                        });

                        setCategoricalData(rawData);
                        setColumns(columnMetadata);
                        setActiveColumns(columnMetadata);
                        setFilteredData(rawData);

                        // Add welcome message to chat
                        setChatHistory([
                            {
                                type: 'system',
                                message: `Loaded ${rawData.length} rows with ${columnMetadata.length} columns. Ask me anything about your data!`
                            }
                        ]);

                        toast.success(`Imported ${rawData.length} rows from file`);

                        // Reset file input
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
        reader.onerror = () => {
            setError("Failed to read file");
        };
        reader.readAsText(file);
    };

    // Paginated table data
    const paginatedData = filteredData.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const totalPages = Math.ceil(filteredData.length / itemsPerPage);

    // Filter table by search
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

    const handleExportChart = async () => {
        if (!chartContainerRef.current) {
            toast.error("Chart not found");
            return;
        }

        setShowExportDialog(true);
    };

    const confirmExport = async () => {
        // Handle code export separately
        if (exportFormat === "code") {
            setShowExportDialog(false);
            setShowCodeExportModal(true);
            return;
        }

        if (!chartContainerRef.current) {
            toast.error("Chart not found");
            return;
        }

        const timestamp = new Date().toISOString().slice(0, 10);
        const filename = `categorical-${chartType}-${exportTheme}-${timestamp}`;

        try {
            if (exportFormat === "png") {
                await exportChartAsPNG(chartContainerRef.current, filename, exportTheme);
            } else if (exportFormat === "pdf") {
                await exportChartAsPDF(chartContainerRef.current, filename, exportTheme);
            }
        } catch (error) {
            console.error("Export failed:", error);
        }

        setShowExportDialog(false);
    };

    return (
        <AppLayout>
            <div className="space-y-6">
                {/* Page Header */}
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">NLP Categorical Analysis</h2>
                    <p className="text-muted-foreground">Upload CSV and ask natural language questions to generate visual insights</p>
                    <p className="text-xs text-muted-foreground mt-1">
                        💡 Example: "Show count by category" or "Which region has the most sales?"
                    </p>
                </div>

                {error && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

            {/* Main Content Area */}
            <div className="flex-1 lg:pl-10 pb-20 pt-5 pr-5 lg:pr-10 h-[calc(100vh-4rem)] overflow-y-auto">
                <div className="max-w-6xl mx-auto space-y-6">

                    {/* AI Data Story Card */}
                    {aiSummary && (
                        <StorySummaryCard 
                            story={aiSummary} 
                            onClose={() => setAiSummary(null)} 
                        />
                    )}
                    {isGeneratingStory && !aiSummary && (
                        <div className="mb-6 p-5 rounded-xl border border-indigo-100 bg-indigo-50/50 flex items-center justify-center space-x-2 text-indigo-500 text-sm">
                            <Sparkles className="w-4 h-4 animate-pulse" />
                            <span>Generating AI Data Story...</span>
                        </div>
                    )}

                {/* Main 4-Quadrant Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* TOP-LEFT: Dynamic Visualizer */}
                    <Card ref={chartContainerRef} className="lg:row-span-2">
                        <CardHeader className="space-y-3">
                            <div className="flex flex-row items-center justify-between flex-wrap gap-2">
                                <CardTitle className="flex items-center gap-2">
                                    <Sparkles className="h-5 w-5" />
                                    {chartTitle}
                                </CardTitle>
                                <div className="flex gap-2 items-center flex-wrap">
                                    {chartData && (
                                        <>
                                            <div className="flex gap-1">
                                                <Button
                                                    variant={chartType === 'bar' ? 'default' : 'outline'}
                                                    size="sm"
                                                    onClick={() => setChartType('bar')}
                                                    className="h-8 w-8 p-0"
                                                >
                                                    <BarChart3 className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant={chartType === 'pie' ? 'default' : 'outline'}
                                                    size="sm"
                                                    onClick={() => setChartType('pie')}
                                                    className="h-8 w-8 p-0"
                                                >
                                                    <PieChart className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant={chartType === 'treemap' ? 'default' : 'outline'}
                                                    size="sm"
                                                    onClick={() => setChartType('treemap')}
                                                    className="h-8 w-8 p-0"
                                                >
                                                    <TreePalm className="h-4 w-4" />
                                                </Button>
                                            </div>
                                            <Button
                                                onClick={handleExportChart}
                                                size="sm"
                                                className="gap-2 bg-slate-500 text-white hover:bg-emerald-600"
                                            >
                                                <Download className="h-4 w-4" />
                                                Export
                                            </Button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {!categoricalData.length ? (
                                <div className="flex flex-col items-center justify-center h-64 text-center space-y-4">
                                    <FileUp className="h-16 w-16 text-muted-foreground opacity-50" />
                                    <div>
                                        <h3 className="font-semibold text-lg mb-2">No Data Yet</h3>
                                        <p className="text-muted-foreground text-sm">
                                            Upload a CSV file to get started with intelligent visualization
                                        </p>
                                    </div>
                                </div>
                            ) : chartData ? (
                                <UniversalChart
                                    type={chartType}
                                    data={chartData}
                                    onBarClick={handleChartClick}
                                />
                            ) : (
                                <div className="flex flex-col items-center justify-center h-64 text-center">
                                    <Sparkles className="h-12 w-12 text-muted-foreground opacity-50 mb-4" />
                                    <p className="text-muted-foreground">
                                        Ask a question to visualize your data
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* TOP-RIGHT: Intelligence Hub (Chat + Context) */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Sparkles className="h-5 w-5" />
                                Intelligence Hub
                            </CardTitle>
                            <p className="text-xs text-muted-foreground">
                                Ask questions in plain English and see instant visualizations
                            </p>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Chat History */}
                            {chatHistory.length > 0 && (
                                <div className="max-h-48 overflow-y-auto space-y-2 p-3 bg-muted/30 rounded-lg">
                                    {chatHistory.map((msg, idx) => (
                                        <div
                                            key={idx}
                                            className={cn(
                                                "p-2 rounded text-sm",
                                                msg.type === 'user' && "bg-primary/10 text-foreground ml-8",
                                                msg.type === 'system' && "bg-green-500/10 text-foreground mr-8",
                                                msg.type === 'error' && "bg-destructive/10 text-destructive mr-8"
                                            )}
                                        >
                                            <span className="font-medium text-xs">
                                                {msg.type === 'user' ? 'You' : msg.type === 'error' ? 'Error' : 'AI'}:
                                            </span>{' '}
                                            {msg.message}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Chat Input */}
                            <div className="space-y-2">
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="Ask a question: 'Which city has the highest average sales?'"
                                        value={chatInput}
                                        onChange={(e) => setChatInput(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && handleChatSubmit()}
                                        disabled={!categoricalData.length || isProcessingQuery}
                                        className="flex-1"
                                    />
                                    <Button
                                        onClick={handleChatSubmit}
                                        disabled={!categoricalData.length || isProcessingQuery}
                                        className="gap-2"
                                    >
                                        {isProcessingQuery ? (
                                            <RefreshCw className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <Send className="h-4 w-4" />
                                        )}
                                    </Button>
                                </div>

                                {/* Suggestion Chips */}
                                {categoricalData.length > 0 && !chartData && (
                                    <div className="flex flex-wrap gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setChatInput(`Show count by ${activeColumns[0]?.name || 'category'}`)}
                                            className="text-xs h-7"
                                        >
                                            Top Categories
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setChatInput('Show distribution')}
                                            className="text-xs h-7"
                                        >
                                            Distribution
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setChatInput('Sort ascending')}
                                            className="text-xs h-7"
                                        >
                                            Sort Ascending
                                        </Button>
                                    </div>
                                )}
                            </div>

                            {/* Active Columns Display */}
                            {activeColumns.length > 0 && (
                                <div className="space-y-2">
                                    <div className="text-sm font-medium flex items-center gap-2">
                                        <Database className="h-4 w-4" />
                                        Active Columns
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {activeColumns.map((col, idx) => (
                                            <Badge
                                                key={idx}
                                                variant={col.type === 'categorical' ? 'default' : 'secondary'}
                                                className="text-xs"
                                            >
                                                {col.name}
                                                <span className="ml-1 opacity-60">
                                                    ({col.type === 'categorical' ? 'String' : 'Number'})
                                                </span>
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Upload Button */}
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
                                    className="w-full gap-2"
                                >
                                    <FileUp className="h-4 w-4" />
                                    {categoricalData.length > 0 ? 'Replace Dataset' : 'Import CSV'}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* BOTTOM-LEFT: Categorical Insights */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <TrendingUp className="h-5 w-5" />
                                Categorical Insights
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {insights.summary ? (
                                <>
                                    {/* Narrative Summary */}
                                    <div className="p-3 bg-primary/5 rounded-lg border border-primary/10">
                                        <p className="text-sm leading-relaxed">{insights.summary}</p>
                                    </div>

                                    {/* Stats Grid */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="p-3 bg-muted/50 rounded-lg">
                                            <div className="text-xs text-muted-foreground mb-1">Unique Categories</div>
                                            <div className="text-2xl font-bold">{insights.cardinality}</div>
                                        </div>
                                        <div className="p-3 bg-muted/50 rounded-lg">
                                            <div className="text-xs text-muted-foreground mb-1">Total Count</div>
                                            <div className="text-2xl font-bold">{insights.totalCount}</div>
                                        </div>
                                        <div className="p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                                            <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                                                <TrendingUp className="h-3 w-3" />
                                                Top Performer
                                            </div>
                                            <div className="text-lg font-semibold truncate">
                                                {insights.topPerformer?.label}
                                            </div>
                                            <div className="text-sm text-muted-foreground">
                                                {insights.topPerformer?.value} items
                                            </div>
                                        </div>
                                        <div className="p-3 bg-orange-500/10 rounded-lg border border-orange-500/20">
                                            <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                                                <TrendingDown className="h-3 w-3" />
                                                Bottom Performer
                                            </div>
                                            <div className="text-lg font-semibold truncate">
                                                {insights.bottomPerformer?.label}
                                            </div>
                                            <div className="text-sm text-muted-foreground">
                                                {insights.bottomPerformer?.value} items
                                            </div>
                                        </div>
                                        {insights.missingData > 0 && (
                                            <div className="col-span-2 p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                                                <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                                                    <AlertTriangle className="h-3 w-3" />
                                                    Missing Data
                                                </div>
                                                <div className="text-lg font-semibold">
                                                    {insights.missingData} null rows
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-center py-8">
                                    <Database className="h-12 w-12 text-muted-foreground opacity-30 mb-3" />
                                    <p className="text-sm text-muted-foreground">
                                        Upload data and run a query to see insights
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* BOTTOM-RIGHT: Smart Data Table */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                                <span className="flex items-center gap-2">
                                    <Database className="h-5 w-5" />
                                    Data Table
                                </span>
                                {filteredData.length > 0 && (
                                    <span className="text-sm font-normal text-muted-foreground">
                                        {filteredData.length} rows
                                    </span>
                                )}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Search Bar */}
                            {categoricalData.length > 0 && (
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Search data..."
                                            value={tableSearch}
                                            onChange={(e) => setTableSearch(e.target.value)}
                                            className="pl-8"
                                        />
                                    </div>
                                    {tableSearch && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                                setTableSearch("");
                                                setFilteredData(categoricalData);
                                            }}
                                        >
                                            Clear
                                        </Button>
                                    )}
                                </div>
                            )}

                            {/* Table */}
                            {paginatedData.length > 0 ? (
                                <>
                                    <div className="border rounded-lg overflow-hidden">
                                        <div className="max-h-64 overflow-y-auto">
                                            <table className="w-full text-sm">
                                                <thead className="bg-muted/50 sticky top-0">
                                                    <tr>
                                                        {Object.keys(paginatedData[0]).map((header, idx) => (
                                                            <th key={idx} className="text-left p-2 font-medium">
                                                                {header}
                                                            </th>
                                                        ))}
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {paginatedData.map((row, rowIdx) => (
                                                        <tr key={rowIdx} className="border-t hover:bg-muted/30">
                                                            {Object.values(row).map((cell, cellIdx) => (
                                                                <td key={cellIdx} className="p-2">
                                                                    {String(cell)}
                                                                </td>
                                                            ))}
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    {/* Pagination */}
                                    {totalPages > 1 && (
                                        <div className="flex items-center justify-between">
                                            <div className="text-sm text-muted-foreground">
                                                Page {currentPage} of {totalPages}
                                            </div>
                                            <div className="flex gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                                    disabled={currentPage === 1}
                                                >
                                                    Previous
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                                    disabled={currentPage === totalPages}
                                                >
                                                    Next
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </>
                            ) : categoricalData.length > 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    No matching results for &quot;{tableSearch}&quot;
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-8 text-center">
                                    <FileUp className="h-12 w-12 text-muted-foreground opacity-30 mb-3" />
                                    <p className="text-sm text-muted-foreground">
                                        Upload a CSV file to view data
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Export Actions */}
                {chartData && (
                    <div className="flex gap-2">
                        <Button
                            onClick={handleExportChart}
                            size="sm"
                            className="gap-2 bg-slate-500 text-white hover:bg-emerald-600"
                        >
                            <Download className="h-4 w-4" />
                            Export Chart
                        </Button>
                        <Button
                            onClick={() => setShowCodeExportModal(true)}
                            size="sm"
                            variant="outline"
                            className="gap-2"
                        >
                            <Code2 className="h-4 w-4" />
                            Export as Code
                        </Button>
                        <Button
                            onClick={() => {
                                setCategoricalData([]);
                                setChartData(null);
                                setInsights({});
                                setChatHistory([]);
                                setChartTitle("Visualizer");
                                toast.success("Cleared all data");
                            }}
                            variant="outline"
                            size="sm"
                            className="gap-2"
                        >
                            <RefreshCw className="h-4 w-4" />
                            Clear All
                        </Button>
                    </div>
                )}

                {/* Export Dialog */}
                <AlertDialog open={showExportDialog} onOpenChange={setShowExportDialog}>
                    <AlertDialogContent className="max-w-md">
                        <AlertDialogHeader>
                            <AlertDialogTitle>Export Chart</AlertDialogTitle>
                            <AlertDialogDescription>
                                Choose export format: PNG/PDF image or Python code
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <div className="space-y-4">
                            {/* File Format Selection */}
                            <div className="space-y-3">
                                <label className="text-sm font-semibold">Export As</label>
                                <div className="grid grid-cols-3 gap-3">
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
                                    <button
                                        onClick={() => setExportFormat("code")}
                                        className={cn(
                                            "flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition",
                                            exportFormat === "code"
                                                ? "border-primary bg-primary/10"
                                                : "border-border hover:border-primary/50"
                                        )}
                                    >
                                        <Code2 className="h-5 w-5" />
                                        <span className="text-sm font-medium">Code</span>
                                    </button>
                                </div>
                            </div>

                            {/* Theme Selection - Only show for PNG/PDF */}
                            {exportFormat !== "code" && (
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
                            )}
                        </div>
                        <div className="flex gap-2 justify-end">
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={confirmExport}>
                                {exportFormat === "code" ? "Generate Code" : `Export as ${exportFormat.toUpperCase()}`}
                            </AlertDialogAction>
                        </div>
                    </AlertDialogContent>
                </AlertDialog>

                {/* Code Export Modal */}
                <ChartCodeExportModal
                    isOpen={showCodeExportModal}
                    onClose={() => setShowCodeExportModal(false)}
                    chartType={chartType}
                    chartData={chartData}
                    chartTitle={chartTitle}
                />
            </div>
        </AppLayout>
    );
};

export default CategoricalChatNLP;
