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
import { toast } from "sonner";

const EnhancedDataAnalyzer = () => {
    const inverseRegressionPredictor = useMemo(() => {
        if (sortedPredictions.length === 0) {
            return null;
        }

        return (targetY) => {
            const candidates = [];

            for (let index = 0; index < sortedPredictions.length - 1; index += 1) {
                const [x1, y1] = sortedPredictions[index];
                const [x2, y2] = sortedPredictions[index + 1];

                if (Math.abs(y2 - y1) < 0.0001) {
                    if (Math.abs(targetY - y1) < 0.0001) {
                        candidates.push(x1);
                    }
                    continue;
                }

                const isBetween = targetY >= Math.min(y1, y2) && targetY <= Math.max(y1, y2);
                if (!isBetween) {
                    continue;
                }

                const ratio = (targetY - y1) / (y2 - y1);
                const x = x1 + ratio * (x2 - x1);
                if (Number.isFinite(x)) {
                    candidates.push(x);
                }
            }

            if (candidates.length > 0) {
                return candidates[0];
            }

            let nearest = sortedPredictions[0][0];
            let bestDistance = Math.abs(sortedPredictions[0][1] - targetY);

            sortedPredictions.forEach(([x, y]) => {
                const distance = Math.abs(y - targetY);
                if (distance < bestDistance) {
                    bestDistance = distance;
                    nearest = x;
                }
            });

            return nearest;
        };
    }, [sortedPredictions]);

    const handlePrediction = useCallback(() => {
        if (!regressionResult) {
            setPredictionResult(null);
            return;
        }

        const numericInput = parseFloat(predictionInput);
        if (Number.isNaN(numericInput)) {
            setPredictionResult({ error: "Enter a valid number to predict." });
            return;
        }

        const runId = Date.now();

        if (sortedPredictions.length === 0) {
            setPredictionResult({ error: "Prediction curve is not available yet." });
            return;
        }

        if (predictionMode === "x-to-y") {
            const exactMatch = sortedPredictions.find((point) => Math.abs(point[0] - numericInput) < 0.0001);
            let predictedY = exactMatch?.[1];
            let method = "exact";
            let lowerPoint = exactMatch || null;
            let upperPoint = exactMatch || null;
            let ratio = 0;

            if (!exactMatch) {
                for (let index = 0; index < sortedPredictions.length - 1; index += 1) {
                    const current = sortedPredictions[index];
                    const next = sortedPredictions[index + 1];

                    if (numericInput >= current[0] && numericInput <= next[0]) {
                        lowerPoint = current;
                        upperPoint = next;
                        ratio = (numericInput - current[0]) / (next[0] - current[0]);
                        predictedY = current[1] + ratio * (next[1] - current[1]);
                        method = "interpolated";
                        break;
                    }
                }

                if (!Number.isFinite(predictedY)) {
                    if (numericInput < sortedPredictions[0][0]) {
                        lowerPoint = sortedPredictions[0];
                        upperPoint = sortedPredictions[1] || sortedPredictions[0];
                        predictedY = sortedPredictions[0][1];
                        method = "clamped-low";
                    } else {
                        lowerPoint = sortedPredictions[sortedPredictions.length - 2] || sortedPredictions[0];
                        upperPoint = sortedPredictions[sortedPredictions.length - 1];
                        predictedY = sortedPredictions[sortedPredictions.length - 1][1];
                        method = "clamped-high";
                    }
                }
            }

            if (!Number.isFinite(predictedY)) {
                setPredictionResult({ error: "Could not calculate a prediction for that X value." });
                return;
            }

            const nextResult = {
                runId,
                inputLabel: "X",
                outputLabel: "Predicted Y",
                inputValue: numericInput,
                outputValue: predictedY,
                mode: "x-to-y",
                method,
                lowerPoint,
                upperPoint,
                ratio,
                equation: method === "interpolated" && lowerPoint && upperPoint
                    ? `y = ${lowerPoint[1].toFixed(4)} + ${ratio.toFixed(4)} × (${upperPoint[1].toFixed(4)} - ${lowerPoint[1].toFixed(4)})`
                    : method === "exact"
                        ? `y = ${predictedY.toFixed(4)} at x = ${numericInput.toFixed(4)}`
                        : `y is clamped to the nearest fitted point`,
                steps: method === "interpolated" && lowerPoint && upperPoint
                    ? [
                        `Find bracketing points: (${lowerPoint[0].toFixed(4)}, ${lowerPoint[1].toFixed(4)}) and (${upperPoint[0].toFixed(4)}, ${upperPoint[1].toFixed(4)})`,
                        `Interpolation ratio t = (${numericInput.toFixed(4)} - ${lowerPoint[0].toFixed(4)}) / (${upperPoint[0].toFixed(4)} - ${lowerPoint[0].toFixed(4)}) = ${ratio.toFixed(6)}`,
                        `Predicted Y = ${lowerPoint[1].toFixed(4)} + t × (${upperPoint[1].toFixed(4)} - ${lowerPoint[1].toFixed(4)}) = ${predictedY.toFixed(4)}`,
                    ]
                    : method === "exact"
                        ? [
                            `Exact prediction found at x = ${numericInput.toFixed(4)}`,
                            `Predicted Y = ${predictedY.toFixed(4)}`,
                        ]
                        : [
                            `Value lies outside the fitted range, so the nearest fitted point was used.`,
                            `Predicted Y = ${predictedY.toFixed(4)}`,
                        ],
                computedAt: new Date().toISOString(),
            };

            setPredictionResult(nextResult);
            setPredictionHistory((prev) => [nextResult, ...prev].slice(0, 5));
            setPredictionInput("");
            return;
        }

        const predictedX = inverseRegressionPredictor?.(numericInput);
        if (!Number.isFinite(predictedX)) {
            setPredictionResult({ error: "Could not calculate a matching X value for that Y value." });
            return;
        }

        const exactMatch = sortedPredictions.find((point) => Math.abs(point[1] - numericInput) < 0.0001);
        const method = exactMatch ? "exact" : "nearest";
        const lowerPoint = exactMatch || null;
        const upperPoint = exactMatch || null;
        const ratio = 0;

        const nextResult = {
            runId,
            inputLabel: "Y",
            outputLabel: "Estimated X",
            inputValue: numericInput,
            outputValue: predictedX,
            mode: "y-to-x",
            method,
            lowerPoint,
            upperPoint,
            ratio,
            equation: method === "exact"
                ? `x = ${predictedX.toFixed(4)} at y = ${numericInput.toFixed(4)}`
                : `x is selected from the nearest fitted point`,
            steps: method === "exact"
                ? [
                    `Exact prediction found at y = ${numericInput.toFixed(4)}`,
                    `Estimated X = ${predictedX.toFixed(4)}`,
                ]
                : [
                    `No bracketing segment matched, so the nearest fitted point was used.`,
                    `Estimated X = ${predictedX.toFixed(4)}`,
                ],
            computedAt: new Date().toISOString(),
        };

        setPredictionResult(nextResult);
        setPredictionHistory((prev) => [nextResult, ...prev].slice(0, 5));
        setPredictionInput("");
    }, [predictionInput, predictionMode, sortedPredictions, regressionResult, inverseRegressionPredictor]);
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
            setData([]);
            setRegressionResult(null);
            setCsvText("");
            setError("");
            setPredictionInput("");
            setPredictionResult(null);
                setPredictionHistory([]);
            setActiveTab("input");

            try {
                if (session) {
                    await dataAPI.deleteDraft();
                }

                toast.success("Data cleared");
            } catch (error) {
                console.error("Failed to clear draft:", error);
                toast.warning("Data cleared locally, but the saved draft could not be removed.");
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
                                            type="regression"
                                            data={data}
                                            regression={regressionResult}
                                            title={`${regressionResult.modelName} Analysis`}
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-2">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Zap className="h-5 w-5" />
                                        Prediction
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex flex-wrap gap-2">
                                        <Button
                                            type="button"
                                            variant={predictionMode === "x-to-y" ? "default" : "outline"}
                                            onClick={() => setPredictionMode("x-to-y")}
                                        >
                                            X to Y
                                        </Button>
                                        <Button
                                            type="button"
                                            variant={predictionMode === "y-to-x" ? "default" : "outline"}
                                            onClick={() => setPredictionMode("y-to-x")}
                                        >
                                            Y to X
                                        </Button>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3">
                                        <Input
                                            type="number"
                                            placeholder={predictionMode === "x-to-y" ? "Enter X value" : "Enter Y value"}
                                            value={predictionInput}
                                            onChange={(e) => setPredictionInput(e.target.value)}
                                        />
                                        <Button onClick={handlePrediction} className="gap-2">
                                            <Zap className="h-4 w-4" />
                                            Predict
                                        </Button>
                                    </div>

                                    {predictionResult && (
                                        <div className="space-y-4">
                                            <div className="rounded-lg border bg-muted/40 p-4 space-y-2">
                                                {predictionResult.error ? (
                                                    <p className="text-sm text-destructive">{predictionResult.error}</p>
                                                ) : (
                                                    <>
                                                        <p className="text-xs uppercase tracking-wide text-muted-foreground">
                                                            {predictionResult.inputLabel} = {predictionResult.inputValue.toFixed(4)}
                                                        </p>
                                                        <p className="text-lg font-semibold">
                                                            {predictionResult.outputLabel}: {predictionResult.outputValue.toFixed(4)}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">
                                                            Method: {predictionResult.method === "interpolated" ? "Interpolated along fitted curve" : predictionResult.method === "exact" ? "Exact fitted value" : "Nearest fitted point"}
                                                        </p>
                                                        <p className="text-sm font-medium text-foreground">
                                                            {predictionResult.equation}
                                                        </p>
                                                        <div className="space-y-1 pt-2">
                                                            <p className="text-xs uppercase tracking-wide text-muted-foreground">Calculation Steps</p>
                                                            {predictionResult.steps?.map((step, index) => (
                                                                <p key={`${predictionResult.runId}-step-${index}`} className="text-sm text-muted-foreground">
                                                                    {index + 1}. {step}
                                                                </p>
                                                            ))}
                                                        </div>
                                                    </>
                                                )}
                                            </div>

                                            {predictionHistory.length > 0 && (
                                                <div className="rounded-lg border p-4 space-y-3">
                                                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Recent Predictions</p>
                                                    <div className="space-y-3">
                                                        {predictionHistory.map((item) => (
                                                            <div key={item.runId} className="rounded-md bg-muted/30 p-3 space-y-1">
                                                                <p className="text-sm font-medium">
                                                                    {item.inputLabel} {item.inputValue.toFixed(4)} → {item.outputLabel} {item.outputValue.toFixed(4)}
                                                                </p>
                                                                <p className="text-xs text-muted-foreground">{item.equation}</p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
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
