import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { usePageSession, useHistoryLogger } from "@/hooks/usePageSession";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
    Upload,
    Plus,
    Zap,
    Save,
    AlertCircle,
    FileUp,
    ArrowRight,
    RefreshCw,
    Download,
    FileImage,
    FileText,
    Code2,
    TrendingUp,
    Database,
    Sparkles,
    BarChart3,
    Grid3x3,
    Trash2,
    PlayCircle,
    CheckCircle2
} from "lucide-react";
import { toast } from "sonner";
import { DataTable } from "./DataTable";
import { dataAPI } from "@/lib/api";
import { debounce } from "@/utils/debounce";
import Papa from "papaparse";
import { UniversalChart } from "./UniversalChart";
import { exportChartAsPNG, exportChartAsPDF } from "@/lib/chartExport";
import ExportCodeButton from "./ExportCodeButton";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";

export const EnhancedDataAnalyzer = () => {
    const [searchParams] = useSearchParams();
    const { session } = useAuth();
    const navigate = useNavigate();
    const fileInputRef = useRef(null);

    // State initialization
    const [data, setData] = useState([]);
    const [regressionResult, setRegressionResult] = useState(null);
    const [xValue, setXValue] = useState("");
    const [yValue, setYValue] = useState("");
    const [csvText, setCsvText] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [regressionType, setRegressionType] = useState("linear");
    const [polynomialDegree, setPolynomialDegree] = useState(2);
    const [activeTab, setActiveTab] = useState("input");

    const chartContainerRef = useRef(null);

    // Export theme dialog state
    const [showExportDialog, setShowExportDialog] = useState(false);
    const [exportFormat, setExportFormat] = useState("png");
    const [exportTheme, setExportTheme] = useState("light");

    // Prepare state for session persistence
    const sessionState = useMemo(() => ({
        data,
        regressionResult,
        regressionType,
        polynomialDegree,
    }), [data, regressionResult, regressionType, polynomialDegree]);

    // Restore state callback
    const restoreState = useCallback((savedState) => {
        if (savedState.data) setData(savedState.data);
        if (savedState.regressionResult) setRegressionResult(savedState.regressionResult);
        if (savedState.regressionType) setRegressionType(savedState.regressionType);
        if (savedState.polynomialDegree) setPolynomialDegree(savedState.polynomialDegree);
    }, []);

    // Enable auto-save and restoration
    const { saveNow } = usePageSession('regression', sessionState, restoreState);

    // Enable history tracking
    const { logCreate, logUpdate, logExport } = useHistoryLogger('regression');

    // Load draft from Supabase on mount
    useEffect(() => {
        const loadDraft = async () => {
            if (!session) return;

            try {
                const { draft } = await dataAPI.getDraft();
                if (draft) {
                    setData(draft.dataPoints || []);
                    setRegressionType(draft.regressionType || "linear");
                    setPolynomialDegree(draft.polynomialDegree || 2);
                }
            } catch (error) {
                console.error("Failed to load draft:", error);
            }
        };

        loadDraft();
    }, [session]);

    // Auto-save to Supabase with debounce
    const debouncedSave = useCallback(
        debounce(async (draftData) => {
            if (!session) return;

            try {
                await dataAPI.saveDraft(draftData);
            } catch (error) {
                console.error("Failed to auto-save draft:", error);
            }
        }, 2000),
        [session]
    );

    // Trigger auto-save when data changes
    useEffect(() => {
        if (!session) return;
        if (data.length === 0) return;

        debouncedSave({
            dataPoints: data,
            categories: [],
            tabType: "regression",
            regressionType: regressionType,
            polynomialDegree: polynomialDegree,
        });
    }, [data, regressionType, polynomialDegree, session, debouncedSave]);

    const addPoint = () => {
        setError("");
        const x = parseFloat(xValue);
        const y = parseFloat(yValue);

        if (isNaN(x) || isNaN(y)) {
            setError("Please enter valid numbers for X and Y");
            return;
        }

        const newData = [...data, { x, y }];
        newData.sort((a, b) => a.x - b.x);
        setData(newData);
        setXValue("");
        setYValue("");
        toast.success("Data point added", {
            icon: <CheckCircle2 className="h-4 w-4 text-green-500" />
        });
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            addPoint();
        }
    };

    const analyzeData = useCallback(async () => {
        setError("");
        if (data.length < 2) {
            setError("Need at least 2 data points to analyze");
            return;
        }

        setLoading(true);
        setActiveTab("results");

        try {
            const result = await dataAPI.analyze(data);

            if (!result) {
                setError("Failed to analyze data");
                return;
            }

            const modelType = result.model_type;
            if (modelType.startsWith('polynomial-')) {
                const degree = parseInt(modelType.split('-')[1]);
                setRegressionType('polynomial');
                setPolynomialDegree(degree);
            } else {
                setRegressionType(modelType);
            }

            const n = data.length;
            const ys = data.map(d => d.y);
            const meanY = ys.reduce((acc, y) => acc + y, 0) / n;
            const varianceY = n > 1
                ? ys.reduce((acc, y) => acc + Math.pow(y - meanY, 2), 0) / (n - 1)
                : 0;
            const stdDevY = Math.sqrt(varianceY);

            setRegressionResult({
                r2: result.r2,
                predict: (x) => {
                    const predictions = result.predictions || [];
                    if (predictions.length === 0) return null;

                    const sorted = predictions.sort((a, b) => a[0] - b[0]);
                    const exact = sorted.find(p => Math.abs(p[0] - x) < 0.0001);
                    if (exact) return exact[1];

                    for (let i = 0; i < sorted.length - 1; i++) {
                        if (x >= sorted[i][0] && x <= sorted[i + 1][0]) {
                            const t = (x - sorted[i][0]) / (sorted[i + 1][0] - sorted[i][0]);
                            return sorted[i][1] + t * (sorted[i + 1][1] - sorted[i][1]);
                        }
                    }

                    if (x < sorted[0][0]) return sorted[0][1];
                    return sorted[sorted.length - 1][1];
                },
                type: modelType,
                equation: result.equation || '',
                meanY,
                varianceY,
                stdDevY,
                rmse: result.rmse,
                mae: result.mae,
                adjustedR2: result.adjusted_r2,
                modelName: result.model_name
            });

            toast.success(`Analysis complete! Best model: ${result.model_name}`, {
                icon: <Sparkles className="h-4 w-4 text-blue-500" />
            });
        } catch (error) {
            console.error("Analysis error:", error);
            setError(`Failed to analyze data: ${error.message || error}`);
            toast.error(`Failed to analyze data: ${error.message || error}`);
        } finally {
            setLoading(false);
        }
    }, [data]);

    const importCSV = () => {
        setError("");
        if (!csvText.trim()) {
            setError("Please paste CSV data");
            return;
        }

        Papa.parse(csvText, {
            header: false,
            skipEmptyLines: true,
            complete: (results) => {
                try {
                    const newData = results.data
                        .map((row) => ({
                            x: parseFloat(row[0]),
                            y: parseFloat(row[1]),
                        }))
                        .filter((d) => !isNaN(d.x) && !isNaN(d.y));

                    if (newData.length === 0) {
                        setError("No valid data found in CSV");
                        return;
                    }

                    newData.sort((a, b) => a.x - b.x);
                    setData(newData);
                    setCsvText("");
                    toast.success(`Imported ${newData.length} data points`);
                } catch (_err) {
                    setError("Failed to parse CSV data");
                }
            },
            error: () => {
                setError("Failed to parse CSV");
            },
        });
    };

    const handleFileUpload = (event) => {
        setError("");
        const file = event.target.files?.[0];

        if (!file) return;

        if (!file.name.endsWith('.csv')) {
            setError("Please select a CSV file");
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const csv = e.target?.result;
            Papa.parse(csv, {
                header: false,
                skipEmptyLines: true,
                complete: (results) => {
                    try {
                        const newData = results.data
                            .map((row) => ({
                                x: parseFloat(row[0]),
                                y: parseFloat(row[1]),
                            }))
                            .filter((d) => !isNaN(d.x) && !isNaN(d.y));

                        if (newData.length === 0) {
                            setError("No valid data found in CSV file");
                            return;
                        }

                        newData.sort((a, b) => a.x - b.x);
                        setData(newData);
                        setCsvText("");
                        toast.success(`Imported ${newData.length} data points from file`);

                        if (fileInputRef.current) {
                            fileInputRef.current.value = '';
                        }
                    } catch (_err) {
                        setError("Failed to parse CSV file");
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

    const clearData = async () => {
        if (window.confirm("Clear all data? This will delete your draft from the database.")) {
            try {
                if (session) {
                    await dataAPI.deleteDraft();
                }

                setData([]);
                setRegressionResult(null);
                setCsvText("");
                setError("");
                setActiveTab("input");

                toast.success("Data cleared");
            } catch (error) {
                console.error("Failed to clear draft:", error);
                toast.error("Failed to clear data");
            }
        }
    };

    const saveAnalysis = async () => {
        if (!regressionResult || data.length === 0) {
            setError("No analysis to save");
            return;
        }

        setLoading(true);
        try {
            if (!session) throw new Error("Not authenticated");

            const typeLabel = regressionResult.type.includes("polynomial")
                ? `Polynomial Regression (Degree ${polynomialDegree})`
                : "Linear Regression";

            await dataAPI.finalizeDraft({
                title: typeLabel,
                equation: regressionResult.equation || `R² = ${regressionResult.r2.toFixed(4)}`,
                r2: regressionResult.r2
            });

            setData([]);
            setRegressionResult(null);

            toast.success("Analysis saved successfully");
        } catch (_err) {
            toast.error("Failed to save analysis");
        } finally {
            setLoading(false);
        }
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
        const regressionLabel = regressionResult?.type.includes("polynomial")
            ? `polynomial-degree${regressionResult.type.split("-")[1]}`
            : "linear";
        const filename = `regression-${regressionLabel}-${exportTheme}-${timestamp}`;

        try {
            if (exportFormat === "png") {
                await exportChartAsPNG(chartContainerRef.current, filename, exportTheme);
            } else {
                await exportChartAsPDF(chartContainerRef.current, filename, exportTheme);
            }

            logExport(`Regression: ${regressionLabel}`, { data, regressionResult }, {
                format: exportFormat,
                theme: exportTheme,
                filename,
                regressionType: regressionResult?.type,
            });
        } catch (error) {
            console.error("Export failed:", error);
        }

        setShowExportDialog(false);
    };

    return (
        <div className="space-y-6">
            {/* Hero Section */}
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 p-8 text-white">
                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="h-8 w-8" />
                        <Badge variant="secondary" className="bg-blue-600 text-white border-0">
                            Advanced Analytics
                        </Badge>
                    </div>
                    <h2 className="text-3xl font-bold mb-2">Data Analyzer</h2>
                    <p className="text-slate-200 max-w-2xl">
                        Professional regression analysis with automatic model selection. Upload your data and get instant insights.
                    </p>
                </div>
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full -mr-32 -mt-32" />
                <div className="absolute bottom-0 right-0 w-48 h-48 bg-blue-600/10 rounded-full -mr-24 -mb-24" />
            </div>

            {/* Quick Stats */}
            {data.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="border-2 hover:border-slate-700 transition-colors">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Data Points</p>
                                    <h3 className="text-3xl font-bold mt-1">{data.length}</h3>
                                </div>
                                <Database className="h-10 w-10 text-slate-500 opacity-20" />
                            </div>
                        </CardContent>
                    </Card>

                    {regressionResult && (
                        <>
                            <Card className="border-2 hover:border-blue-600 transition-colors">
                                <CardContent className="pt-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-muted-foreground">R² Score</p>
                                            <h3 className="text-3xl font-bold mt-1">
                                                {regressionResult.r2.toFixed(4)}
                                            </h3>
                                        </div>
                                        <BarChart3 className="h-10 w-10 text-blue-600 opacity-20" />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-2 hover:border-slate-600 transition-colors">
                                <CardContent className="pt-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-muted-foreground">Model</p>
                                            <h3 className="text-lg font-bold mt-1">
                                                {regressionResult.modelName || 'Linear'}
                                            </h3>
                                        </div>
                                        <Sparkles className="h-10 w-10 text-slate-600 opacity-20" />
                                    </div>
                                </CardContent>
                            </Card>
                        </>
                    )}
                </div>
            )}

            {error && (
                <Alert variant="destructive" className="border-2">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {/* Main Content Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="input" className="gap-2">
                        <Upload className="h-4 w-4" />
                        Input Data
                    </TabsTrigger>
                    <TabsTrigger value="data" className="gap-2" disabled={data.length === 0}>
                        <Grid3x3 className="h-4 w-4" />
                        View Data
                    </TabsTrigger>
                    <TabsTrigger value="results" className="gap-2" disabled={!regressionResult}>
                        <BarChart3 className="h-4 w-4" />
                        Results
                    </TabsTrigger>
                </TabsList>

                {/* Input Tab */}
                <TabsContent value="input" className="space-y-4 mt-6">
                    <Card className="border-2">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Plus className="h-5 w-5" />
                                Add Data Points
                            </CardTitle>
                            <CardDescription>
                                Enter X,Y coordinates manually or import from CSV (must have X,Y columns)
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex gap-3">
                                <div className="flex-1 space-y-2">
                                    <label className="text-sm font-medium">X Value</label>
                                    <Input
                                        type="number"
                                        placeholder="Enter X value"
                                        value={xValue}
                                        onChange={(e) => setXValue(e.target.value)}
                                        onKeyPress={handleKeyPress}
                                        title="Enter the independent variable (X-axis)"
                                    />
                                </div>
                                <div className="flex-1 space-y-2">
                                    <label className="text-sm font-medium">Y Value</label>
                                    <Input
                                        type="number"
                                        placeholder="Enter Y value"
                                        value={yValue}
                                        onChange={(e) => setYValue(e.target.value)}
                                        onKeyPress={handleKeyPress}
                                        title="Enter the dependent variable (Y-axis)"
                                    />
                                </div>
                                <div className="flex items-end">
                                    <Button onClick={addPoint} className="gap-2 h-10" title="Add this data point (or press Enter)">
                                        <Plus className="h-4 w-4" />
                                        Add Point
                                    </Button>
                                </div>
                            </div>

                            <div className="border-t pt-6 space-y-4">
                                <div className="flex items-center gap-2">
                                    <FileUp className="h-5 w-5 text-muted-foreground" />
                                    <h3 className="font-semibold">Import from CSV</h3>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept=".csv"
                                            onChange={handleFileUpload}
                                            className="hidden"
                                        />
                                        <Button
                                            onClick={() => fileInputRef.current?.click()}
                                            variant="outline"
                                            className="w-full gap-2 h-12 border-2 border-dashed hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950 transition-colors"
                                        >
                                            <FileUp className="h-5 w-5" />
                                            Upload CSV File
                                        </Button>
                                        <p className="text-xs text-muted-foreground text-center">
                                            Click to browse or drag & drop
                                        </p>
                                    </div>

                                    <div className="space-y-2">
                                        <Textarea
                                            placeholder="Or paste CSV data here...&#10;Example:&#10;1.0, 2.5&#10;2.0, 4.1&#10;3.0, 6.2"
                                            value={csvText}
                                            onChange={(e) => setCsvText(e.target.value)}
                                            className="h-24 font-mono text-xs border-2"
                                        />
                                        <Button onClick={importCSV} variant="outline" className="w-full gap-2">
                                            <Upload className="h-4 w-4" />
                                            Import from Text
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Data View Tab */}
                <TabsContent value="data" className="space-y-4 mt-6">
                    <Card className="border-2">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Grid3x3 className="h-5 w-5" />
                                Data Table
                            </CardTitle>
                            <CardDescription>
                                Review your data points before analysis
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <DataTable data={data} onDelete={(idx) => {
                                const newData = data.filter((_, i) => i !== idx);
                                setData(newData);
                                toast.success("Data point removed");
                            }} />
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Results Tab */}
                <TabsContent value="results" className="space-y-4 mt-6">
                    {regressionResult && (
                        <>
                            <Card className="border-2">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <BarChart3 className="h-5 w-5" />
                                        Analysis Results
                                    </CardTitle>
                                    <CardDescription>
                                        {regressionResult.modelName} - {regressionResult.equation}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                        <div className="p-4 rounded-lg bg-muted/50">
                                            <p className="text-xs font-medium text-muted-foreground mb-1">R² Score</p>
                                            <p className="text-2xl font-bold">{regressionResult.r2.toFixed(4)}</p>
                                            <Progress value={regressionResult.r2 * 100} className="mt-2" />
                                        </div>

                                        {typeof regressionResult.adjustedR2 === "number" && (
                                            <div className="p-4 rounded-lg bg-muted/50">
                                                <p className="text-xs font-medium text-muted-foreground mb-1">Adjusted R²</p>
                                                <p className="text-2xl font-bold">{regressionResult.adjustedR2.toFixed(4)}</p>
                                            </div>
                                        )}

                                        {typeof regressionResult.rmse === "number" && (
                                            <div className="p-4 rounded-lg bg-muted/50">
                                                <p className="text-xs font-medium text-muted-foreground mb-1">RMSE</p>
                                                <p className="text-2xl font-bold">{regressionResult.rmse.toFixed(4)}</p>
                                            </div>
                                        )}

                                        {typeof regressionResult.mae === "number" && (
                                            <div className="p-4 rounded-lg bg-muted/50">
                                                <p className="text-xs font-medium text-muted-foreground mb-1">MAE</p>
                                                <p className="text-2xl font-bold">{regressionResult.mae.toFixed(4)}</p>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-2">
                                <CardHeader>
                                    <CardTitle>Visualization</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div ref={chartContainerRef}>
                                        <UniversalChart
                                            data={data}
                                            regressionResult={regressionResult}
                                            title={`${regressionResult.modelName} Analysis`}
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        </>
                    )}
                </TabsContent>
            </Tabs>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
                <Button
                    onClick={analyzeData}
                    disabled={data.length < 2 || loading}
                    className="gap-2 bg-slate-700 hover:bg-slate-800"
                    size="lg"
                >
                    {loading ? (
                        <>
                            <RefreshCw className="h-4 w-4 animate-spin" />
                            Analyzing...
                        </>
                    ) : (
                        <>
                            <PlayCircle className="h-4 w-4" />
                            Analyze Data
                        </>
                    )}
                </Button>

                {regressionResult && (
                    <>
                        <Button onClick={saveAnalysis} disabled={loading} variant="default" size="lg" className="gap-2">
                            <Save className="h-4 w-4" />
                            Save Analysis
                        </Button>

                        <Button onClick={handleExportChart} variant="outline" size="lg" className="gap-2">
                            <Download className="h-4 w-4" />
                            Export Chart
                        </Button>

                        <ExportCodeButton
                            data={data}
                            regressionResult={regressionResult}
                        />
                    </>
                )}

                {data.length > 0 && (
                    <Button onClick={clearData} variant="outline" size="lg" className="gap-2 ml-auto text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950">
                        <Trash2 className="h-4 w-4" />
                        Clear All Data
                    </Button>
                )}
            </div>

            {/* Export Dialog */}
            <AlertDialog open={showExportDialog} onOpenChange={setShowExportDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Export Chart</AlertDialogTitle>
                        <AlertDialogDescription>
                            Choose format and theme for your export
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Format</label>
                            <div className="grid grid-cols-2 gap-2">
                                <Button
                                    variant={exportFormat === "png" ? "default" : "outline"}
                                    onClick={() => setExportFormat("png")}
                                    className="justify-start gap-2"
                                >
                                    <FileImage className="h-4 w-4" />
                                    PNG Image
                                </Button>
                                <Button
                                    variant={exportFormat === "pdf" ? "default" : "outline"}
                                    onClick={() => setExportFormat("pdf")}
                                    className="justify-start gap-2"
                                >
                                    <FileText className="h-4 w-4" />
                                    PDF Document
                                </Button>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Theme</label>
                            <div className="grid grid-cols-2 gap-2">
                                <Button
                                    variant={exportTheme === "light" ? "default" : "outline"}
                                    onClick={() => setExportTheme("light")}
                                >
                                    Light
                                </Button>
                                <Button
                                    variant={exportTheme === "dark" ? "default" : "outline"}
                                    onClick={() => setExportTheme("dark")}
                                >
                                    Dark
                                </Button>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-2 justify-end">
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmExport}>
                            Export
                        </AlertDialogAction>
                    </div>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default EnhancedDataAnalyzer;
