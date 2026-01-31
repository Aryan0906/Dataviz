import { useState, useRef, useEffect, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
    Upload, 
    Plus, 
    Zap, 
    Save, 
    AlertCircle, 
    FileUp, 
    ArrowRight, 
    Moon, 
    Sun, 
    RefreshCw,
    Download, 
    FileImage, 
    FileText 
} from "lucide-react";
import { toast } from "sonner";
import { DataTable } from "./DataTable";
import { dataAPI } from "@/lib/api";
import { debounce } from "@/utils/debounce";
import Papa from "papaparse";
import regression from "regression";
import { UniversalChart } from "./UniversalChart";
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
import { cn } from "@/lib/utils";

export const DataAnalyzer = () => {
    const [searchParams] = useSearchParams();
    const { session } = useAuth();
    const navigate = useNavigate();
    const fileInputRef = useRef(null);

    // State initialization - will be loaded from Supabase
    const [data, setData] = useState([]);
    const [regressionResult, setRegressionResult] = useState(null);
    const [xValue, setXValue] = useState("");
    const [yValue, setYValue] = useState("");
    const [csvText, setCsvText] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [regressionType, setRegressionType] = useState("linear");
    const [polynomialDegree, setPolynomialDegree] = useState(2);

    const chartContainerRef = useRef(null);

    // Export theme dialog state
    const [showExportDialog, setShowExportDialog] = useState(false);
    const [exportFormat, setExportFormat] = useState("png");
    const [exportTheme, setExportTheme] = useState("light");

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

    // Auto-save to Supabase with debounce (2 seconds after last change)
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
        if (data.length === 0) return; // Don't save empty drafts

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
        toast.success("Data point added");
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
        
        // Auto-scroll to chart after analysis
        setTimeout(() => {
            if (chartContainerRef.current) {
                chartContainerRef.current.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'start' 
                });
            }
        }, 100);

        try {
            console.log('Sending data to backend:', data);
            
            // Call backend API for comprehensive regression analysis
            const result = await dataAPI.analyze(data);
            
            console.log('Received result from backend:', result);
            
            if (!result) {
                setError("Failed to analyze data");
                return;
            }

            // Update state to track selected model type
            const modelType = result.model_type;
            if (modelType.startsWith('polynomial-')) {
                const degree = parseInt(modelType.split('-')[1]);
                setRegressionType('polynomial');
                setPolynomialDegree(degree);
            } else {
                setRegressionType(modelType);
            }

            // Compute descriptive stats
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
                    // Linear interpolation from predictions
                    const predictions = result.predictions || [];
                    if (predictions.length === 0) return null;
                    
                    // Find closest prediction or interpolate
                    const sorted = predictions.sort((a, b) => a[0] - b[0]);
                    
                    // Exact match
                    const exact = sorted.find(p => Math.abs(p[0] - x) < 0.0001);
                    if (exact) return exact[1];
                    
                    // Interpolate
                    for (let i = 0; i < sorted.length - 1; i++) {
                        if (x >= sorted[i][0] && x <= sorted[i + 1][0]) {
                            const t = (x - sorted[i][0]) / (sorted[i + 1][0] - sorted[i][0]);
                            return sorted[i][1] + t * (sorted[i + 1][1] - sorted[i][1]);
                        }
                    }
                    
                    // Extrapolate
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
            
            toast.success(`Analysis complete! Best model: ${result.model_name}`);
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

        if (!file) {
            return;
        }

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

                        // Reset file input
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

    // Load analysis by id from query params
    useEffect(() => {
        const id = searchParams.get("analysis");
        if (!id || !session) return;
        const load = async () => {
            try {
                const a = await dataAPI.getAnalysis(parseInt(id));
                const points = a.data_points;
                setData(points || []);
                // Configure regression type from saved entry
                if (a.regression_type?.startsWith("polynomial")) {
                    const deg = parseInt(a.regression_type.split("-")[1] || "2");
                    setRegressionType("polynomial");
                    setPolynomialDegree(isNaN(deg) ? 2 : deg);
                } else {
                    setRegressionType("linear");
                }
                // Re-run local analysis for charting - debounced to prevent rapid calls
                const debouncedAnalyze = debounce(analyzeData, 300);
                setTimeout(() => debouncedAnalyze(), 0);
            } catch {
                // ignore
            }
        };
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParams, session]);

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

            // Finalize the draft (converts to saved analysis and deletes draft)
            await dataAPI.finalizeDraft({
                title: typeLabel,
                equation: regressionResult.equation || `R² = ${regressionResult.r2.toFixed(4)}`,
                r2: regressionResult.r2
            });

            // Clear local state after saving
            setData([]);
            setRegressionResult(null);

            toast.success("Analysis saved successfully");
        } catch (_err) {
            toast.error("Failed to save analysis");
        } finally {
            setLoading(false);
        }
    };

    const clearData = async () => {
        if (window.confirm("Clear all data? This will delete your draft from the database.")) {
            try {
                // Delete draft from Supabase
                if (session) {
                    await dataAPI.deleteDraft();
                }

                // Clear local state
                setData([]);
                setRegressionResult(null);
                setCsvText("");
                setError("");


                toast.success("Data cleared");
            } catch (error) {
                console.error("Failed to clear draft:", error);
                toast.error("Failed to clear data");
            }
        }
    };

    const clearAll = () => {
        setData([]);
        setRegressionResult(null);
        setCsvText("");
        setError("");
        toast.success("Cleared the plot");
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
        } catch (error) {
            console.error("Export failed:", error);
        }

        setShowExportDialog(false);
    };

    // Logout and header handled by AppLayout

    return (
        <div className="space-y-6">
            {error && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            <Card>
                <CardHeader>
                    <CardTitle>Add Data</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex gap-3">
                        <Input
                            type="number"
                            placeholder="X value"
                            value={xValue}
                            onChange={(e) => setXValue(e.target.value)}
                            onKeyPress={handleKeyPress}
                            className="flex-1"
                        />
                        <Input
                            type="number"
                            placeholder="Y value"
                            value={yValue}
                            onChange={(e) => setYValue(e.target.value)}
                            onKeyPress={handleKeyPress}
                            className="flex-1"
                        />
                        <Button onClick={addPoint} className="gap-2">
                            <Plus className="h-4 w-4" />
                            Add
                        </Button>
                    </div>

                    <div className="border-t pt-4 space-y-3">
                        <div className="flex items-center gap-2 mb-2">
                            <Upload className="h-4 w-4" />
                            <span className="font-medium">Import CSV</span>
                        </div>

                        <div>
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
                                className="w-full gap-2"
                            >
                                <FileUp className="h-4 w-4" />
                                Upload CSV File
                            </Button>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="flex-1 h-px bg-border" />
                            <span className="text-xs text-muted-foreground">or</span>
                            <div className="flex-1 h-px bg-border" />
                        </div>

                        <div>
                            <label className="text-xs text-muted-foreground mb-2 block">Paste CSV Data</label>
                            <Textarea
                                placeholder="Paste CSV data here (X,Y format, one pair per line)"
                                value={csvText}
                                onChange={(e) => setCsvText(e.target.value)}
                                className="h-20 font-mono text-xs"
                            />
                            <Button onClick={importCSV} variant="outline" className="w-full mt-2 gap-2">
                                <Upload className="h-4 w-4" />
                                Import from Text
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {data.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                        <CardContent className="pt-6">
                            <div className="text-center">
                                <div className="text-3xl font-bold">{data.length}</div>
                                <div className="text-sm text-muted-foreground">Data Points</div>
                            </div>
                        </CardContent>
                    </Card>
                    {regressionResult && (
                        <Card className="md:col-span-2">
                            <CardHeader>
                                <CardTitle>Analysis Summary {regressionResult.modelName && `(${regressionResult.modelName})`}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    <div>
                                        <div className="text-xs text-muted-foreground">R²</div>
                                        <div className="text-xl font-semibold">{regressionResult.r2.toFixed(4)}</div>
                                    </div>
                                    {typeof regressionResult.adjustedR2 === "number" && (
                                        <div>
                                            <div className="text-xs text-muted-foreground">Adjusted R²</div>
                                            <div className="text-xl font-semibold">{(regressionResult.adjustedR2 || 0).toFixed(4)}</div>
                                        </div>
                                    )}
                                    <div>
                                        <div className="text-xs text-muted-foreground">Mean (Y)</div>
                                        <div className="text-xl font-semibold">{regressionResult.meanY.toFixed(4)}</div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-muted-foreground">Variance (Y)</div>
                                        <div className="text-xl font-semibold">{regressionResult.varianceY.toFixed(4)}</div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-muted-foreground">Std Dev (Y)</div>
                                        <div className="text-xl font-semibold">{regressionResult.stdDevY.toFixed(4)}</div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-muted-foreground">RMSE</div>
                                        <div className="text-xl font-semibold">{regressionResult.rmse.toFixed(4)}</div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-muted-foreground">MAE</div>
                                        <div className="text-xl font-semibold">{regressionResult.mae.toFixed(4)}</div>
                                    </div>
                                </div>
                                {regressionResult.equation && (
                                    <div className="mt-4">
                                        <div className="text-xs text-muted-foreground">Model Equation</div>
                                        <div className="font-mono text-sm break-words">{regressionResult.equation}</div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}
                </div>
            )}

            {data.length >= 2 && !regressionResult && (
                <Button onClick={analyzeData} size="lg" className="w-full gap-2">
                    <Zap className="h-4 w-4" />
                    Analyze Data
                </Button>
            )}

            {regressionResult && (
                <Button
                    onClick={saveAnalysis}
                    size="lg"
                    className="w-full gap-2"
                    disabled={loading}
                >
                    <Save className="h-4 w-4" />
                    {loading ? "Saving..." : "Save Analysis"}
                </Button>
            )}

            {data.length > 0 && (
                <UniversalChart
                    ref={chartContainerRef}
                    type="regression"
                    data={data}
                    regression={regressionResult}
                />
            )}

            {data.length > 0 && regressionResult && (
                <div className="flex gap-2">
                    <Button
                        onClick={handleExportChart}
                        size="sm"
                        className="gap-2 bg-emerald-500 text-white hover:bg-emerald-600"
                    >
                        <Download className="h-4 w-4" />
                        Export
                    </Button>
                    <Button onClick={clearAll} variant="outline" size="sm" className="gap-2">
                        <RefreshCw className="h-4 w-4" />
                        Clear All
                    </Button>
                </div>
            )}

            {data.length > 0 && (
                <div className="space-y-3">
                    <DataTable data={data} onDataChange={setData} />
                </div>
            )}

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
