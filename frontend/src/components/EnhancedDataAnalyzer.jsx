import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useSearchParams, useNavigate, useLocation } from "react-router-dom";
import { usePageSession, useHistoryLogger } from "@/hooks/usePageSession";
import { useTaskPolling } from "@/hooks/useTaskPolling";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
    Upload,
    Plus,
    Save,
    AlertCircle,
    FileUp,
    RefreshCw,
    Download,
    FileImage,
    FileText,
    TrendingUp,
    Database,
    Sparkles,
    BarChart3,
    Grid3x3,
    Trash2,
    PlayCircle,
    CheckCircle2,
    Beaker,
    Zap,
    BookOpen,
    Activity,
    Info,
    Edit2,
    X
} from "lucide-react";
import { toast } from "sonner";
import { DataTable } from "./DataTable";
import { dataAPI } from "@/lib/api";
import { debounce } from "@/utils/debounce";
import regression from "regression";
import Papa from "papaparse";
import { useWorkspace } from "@/context/WorkspaceContext";
import { useAuth } from "@/context/AuthContext";
import { UniversalChart } from "./UniversalChart";
import { exportChartAsPNG, exportChartAsPDF } from "@/lib/chartExport";
import ExportCodeButton from "./ExportCodeButton";
import StatsTester from "./StatsTester";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export const EnhancedDataAnalyzer = () => {
    const [_searchParams] = useSearchParams();
    const { session, isGuest } = useAuth();
    const _navigate = useNavigate();
    const location = useLocation();
    const { activeWorkspace } = useWorkspace();
    const fileInputRef = useRef(null);

    // State initialization
    const [data, setData] = useState([]);
    
    const isMultivariate = useMemo(() => {
        return data.length > 0 && Array.isArray(data[0].x);
    }, [data]);
    
    // Polling hook
    const polling = useTaskPolling();
    const [regressionResult, setRegressionResult] = useState(null);
    const [xValue, setXValue] = useState("");
    const [yValue, setYValue] = useState("");
    const [csvText, setCsvText] = useState("");
    const [loading, setLoading] = useState(false);
    const [isPublic, setIsPublic] = useState(false);
    const [error, setError] = useState("");
    const [regressionType, setRegressionType] = useState("linear");
    const [polynomialDegree, setPolynomialDegree] = useState(2);
    const [selectedModelType, setSelectedModelType] = useState("auto");
    const [bookmarks, setBookmarks] = useState(() => {
        const saved = localStorage.getItem("dataviz_bookmarks");
        return saved ? JSON.parse(saved) : [];
    });
    const [activeTab, setActiveTab] = useState("input");
    const [selectedPointIndex, setSelectedPointIndex] = useState(null);
    const [isEditingSelectedPoint, setIsEditingSelectedPoint] = useState(false);
    const [editSelectedX, setEditSelectedX] = useState("");
    const [editSelectedY, setEditSelectedY] = useState("");

    // Prediction feature state
    const [predictionInput, setPredictionInput] = useState("");
    const [predictionMode, setPredictionMode] = useState("x-to-y");
    const [predictionResult, setPredictionResult] = useState(null);
    const [predictionHistory, setPredictionHistory] = useState([]);

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
    const { saveNow: _saveNow } = usePageSession('regression', sessionState, restoreState);

    // Enable history tracking
    const { logCreate: _logCreate, logUpdate: _logUpdate, logExport } = useHistoryLogger('regression');

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

        if (location.state?.template) {
            const tmpl = location.state.template;
            setData(tmpl.data);
            setSelectedModelType("auto"); // Let the backend decide or set based on template
            if (tmpl.type === 'regression' && tmpl.id === 'student-grades') {
                setSelectedModelType("polynomial");
                setPolynomialDegree(2);
            }
            toast.success(`Loaded template: ${tmpl.title}`);
            // Clear state so it doesn't reload on refresh
            window.history.replaceState({}, document.title);
        } else {
            loadDraft();
        }
    }, [session, location.state]);

    // Auto-save to Supabase with debounce
    const debouncedSave = useMemo(
        () => debounce(async (draftData) => {
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

    const handlePointClick = useCallback((index) => {
        setSelectedPointIndex(index);
        setIsEditingSelectedPoint(false);
        if (data[index]) {
            setEditSelectedX(data[index].x.toString());
            setEditSelectedY(data[index].y.toString());
        }
    }, [data]);

    const analyzeData = useCallback(async (modelTypeOverride) => {
        setError("");
        if (data.length < 2) {
            setError("Need at least 2 data points to analyze");
            return;
        }

        setLoading(true);
        setActiveTab("results");

        let modelToRequest = selectedModelType;
        if (modelTypeOverride && typeof modelTypeOverride === "string") {
            modelToRequest = modelTypeOverride;
        }

        const standardModels = ["auto", "linear", "exponential", "logarithmic", "power", "polynomial"];
        const isStandardModel = standardModels.includes(modelToRequest);

        if (isStandardModel) {
            try {
                // Client-side regression fitting
                const points = data.map(d => [d.x, d.y]);
                let bestResult = null;
                let typeApplied = modelToRequest || "linear";

                if (typeApplied === "auto") {
                    const candidates = [
                        { type: 'linear', res: regression.linear(points) },
                        { type: 'exponential', res: regression.exponential(points) },
                        { type: 'logarithmic', res: regression.logarithmic(points) },
                        { type: 'power', res: regression.power(points) },
                        { type: 'polynomial', res: regression.polynomial(points, { order: 2 }) }
                    ];
                    const valid = candidates.filter(c => c.res && !isNaN(c.res.r2));
                    if (valid.length > 0) {
                        const best = valid.reduce((prev, curr) => curr.res.r2 > prev.res.r2 ? curr : prev);
                        bestResult = best.res;
                        typeApplied = best.type;
                    } else {
                        bestResult = regression.linear(points);
                        typeApplied = 'linear';
                    }
                } else if (typeApplied === "polynomial") {
                    bestResult = regression.polynomial(points, { order: polynomialDegree });
                } else {
                    if (typeApplied === 'linear') bestResult = regression.linear(points);
                    else if (typeApplied === 'exponential') bestResult = regression.exponential(points);
                    else if (typeApplied === 'logarithmic') bestResult = regression.logarithmic(points);
                    else if (typeApplied === 'power') bestResult = regression.power(points);
                    else {
                        bestResult = regression.linear(points);
                        typeApplied = 'linear';
                    }
                }

                if (!bestResult || isNaN(bestResult.r2)) {
                    throw new Error("Unable to fit mathematical model with current points.");
                }

                const predictions = [];
                const minX = Math.min(...data.map(d => d.x));
                const maxX = Math.max(...data.map(d => d.x));
                const step = (maxX - minX) / 100 || 1;
                for (let x = minX; x <= maxX; x += step) {
                    const y = bestResult.predict(x)[1];
                    if (isFinite(y)) {
                        predictions.push([x, y]);
                    }
                }

                const n = data.length;
                const ys = data.map(d => d.y);
                const meanY = ys.reduce((acc, y) => acc + y, 0) / n;
                const varianceY = n > 1 ? ys.reduce((acc, y) => acc + Math.pow(y - meanY, 2), 0) / (n - 1) : 0;
                const stdDevY = Math.sqrt(varianceY);

                const localResult = {
                    r2: bestResult.r2,
                    adjustedR2: bestResult.r2,
                    rmse: 0,
                    mae: 0,
                    modelName: `${typeApplied.charAt(0).toUpperCase() + typeApplied.slice(1)} Regression`,
                    predictions: predictions,
                    predict: (x) => bestResult.predict(x)[1],
                    type: typeApplied,
                    equation: bestResult.string,
                    details: {
                        stdDevX: isMultivariate ? 0 : Math.sqrt(data.length > 1 ? data.map(d => d.x).reduce((acc, x, _, arr) => acc + Math.pow(x - arr.reduce((a, b) => a + b) / arr.length, 2), 0) / (data.length - 1) : 0),
                        stdDevY: stdDevY,
                        varianceX: isMultivariate ? 0 : (data.length > 1 ? data.map(d => d.x).reduce((acc, x, _, arr) => acc + Math.pow(x - arr.reduce((a, b) => a + b) / arr.length, 2), 0) / (data.length - 1) : 0),
                        varianceY: varianceY,
                        adjustedR2: bestResult.r2,
                        rmse: 0,
                        mae: 0,
                        localFallback: true
                    }
                };

                setRegressionResult(localResult);
                setLoading(false);
                toast.success(`Model fitted successfully: ${typeApplied} (Instant Client-Side)`);
                return;
            } catch (fallbackErr) {
                console.error("Local regression fit failed:", fallbackErr);
                setError(fallbackErr.message || "Local analysis failed");
                setLoading(false);
                return;
            }
        }

        // For non-standard complex ML models, make backend request
        try {
            let modelToRequestBackend = modelToRequest;
            if (modelToRequest === "polynomial") {
                modelToRequestBackend = `polynomial-${polynomialDegree}`;
            }

            const response = await dataAPI.analyze(data, modelToRequestBackend);

            if (response && response.task_id) {
                polling.startPolling(response.task_id);
            } else {
                setError("Failed to start analysis task");
                setLoading(false);
            }
        } catch (err) {
            console.warn("Backend analysis failed. Reverting to local linear fit...", err);
            // Revert back to local linear fitting
            try {
                const points = data.map(d => [d.x, d.y]);
                const bestResult = regression.linear(points);
                const predictions = [];
                const minX = Math.min(...data.map(d => d.x));
                const maxX = Math.max(...data.map(d => d.x));
                const step = (maxX - minX) / 100 || 1;
                for (let x = minX; x <= maxX; x += step) {
                    const y = bestResult.predict(x)[1];
                    if (isFinite(y)) {
                        predictions.push([x, y]);
                    }
                }
                const n = data.length;
                const ys = data.map(d => d.y);
                const meanY = ys.reduce((acc, y) => acc + y, 0) / n;
                const varianceY = n > 1 ? ys.reduce((acc, y) => acc + Math.pow(y - meanY, 2), 0) / (n - 1) : 0;
                const stdDevY = Math.sqrt(varianceY);

                const localResult = {
                    r2: bestResult.r2,
                    adjustedR2: bestResult.r2,
                    rmse: 0,
                    mae: 0,
                    modelName: "Linear Regression",
                    predictions: predictions,
                    predict: (x) => bestResult.predict(x)[1],
                    type: "linear",
                    equation: bestResult.string,
                    details: {
                        stdDevX: isMultivariate ? 0 : Math.sqrt(data.length > 1 ? data.map(d => d.x).reduce((acc, x, _, arr) => acc + Math.pow(x - arr.reduce((a, b) => a + b) / arr.length, 2), 0) / (data.length - 1) : 0),
                        stdDevY: stdDevY,
                        varianceX: isMultivariate ? 0 : (data.length > 1 ? data.map(d => d.x).reduce((acc, x, _, arr) => acc + Math.pow(x - arr.reduce((a, b) => a + b) / arr.length, 2), 0) / (data.length - 1) : 0),
                        varianceY: varianceY,
                        adjustedR2: bestResult.r2,
                        rmse: 0,
                        mae: 0,
                        localFallback: true
                    }
                };
                setRegressionResult(localResult);
                setLoading(false);
                toast.success("Local linear fallback model fitted (Offline Mode)");
            } catch (fallbackErr) {
                setError(fallbackErr.message || "Failed to analyze data");
                setLoading(false);
            }
        }
    }, [data, selectedModelType, polynomialDegree, polling]);

    // Handle polling result
    useEffect(() => {
        if (polling.result) {
            const result = polling.result;
            
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
                adjustedR2: result.adjusted_r2,
                rmse: result.rmse,
                mae: result.mae,
                modelName: result.model_name || `${modelType.charAt(0).toUpperCase() + modelType.slice(1)} Regression`,
                predictions: result.predictions || [],
                predict: (x) => {
                    const predictions = result.predictions || [];
                    if (predictions.length === 0) return null;

                    const sorted = [...predictions].sort((a, b) => a[0] - b[0]);
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
                equation: result.equation,
                details: {
                    stdDevX: isMultivariate ? 0 : Math.sqrt(data.length > 1 ? data.map(d => d.x).reduce((acc, x, _, arr) => acc + Math.pow(x - arr.reduce((a, b) => a + b) / arr.length, 2), 0) / (data.length - 1) : 0),
                    stdDevY: stdDevY,
                    varianceX: isMultivariate ? 0 : (data.length > 1 ? data.map(d => d.x).reduce((acc, x, _, arr) => acc + Math.pow(x - arr.reduce((a, b) => a + b) / arr.length, 2), 0) / (data.length - 1) : 0),
                    varianceY: varianceY,
                    adjustedR2: result.adjusted_r2,
                    rmse: result.rmse,
                    mae: result.mae,
                    allModels: result.all_models_tested
                }
            });

            toast.success("Analysis complete!", {
                icon: <Sparkles className="h-4 w-4 text-primary" />
            });
            setLoading(false);
        } else if (polling.error) {
            setError(polling.error);
            setLoading(false);
        }
    }, [polling.result, polling.error, data]);

    // Derived predictions sorted for inverse mapping and interpolation
    const sortedPredictions = useMemo(() => {
        const predictions = regressionResult?.predictions || [];
        return [...predictions].sort((a, b) => a[0] - b[0]);
    }, [regressionResult]);

    // Inverse regression predictor mapping Y -> X via linear segments along fit
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
                if (isBetween) {
                    const ratio = (targetY - y1) / (y2 - y1);
                    const x = x1 + ratio * (x2 - x1);
                    if (Number.isFinite(x)) {
                        candidates.push(x);
                    }
                }
            }

            if (candidates.length > 0) {
                return candidates[0];
            }

            // Fallback to nearest point
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
                        .map((row) => {
                            if (row.length > 2) {
                                return {
                                    x: row.slice(0, -1).map(v => parseFloat(v)),
                                    y: parseFloat(row[row.length - 1]),
                                };
                            }
                            return {
                                x: parseFloat(row[0]),
                                y: parseFloat(row[1]),
                            };
                        })
                        .filter((d) => {
                            if (Array.isArray(d.x)) {
                                return d.x.every(v => !isNaN(v)) && !isNaN(d.y);
                            }
                            return !isNaN(d.x) && !isNaN(d.y);
                        });

                    if (newData.length === 0) {
                        setError("No valid data found in CSV");
                        return;
                    }

                    // Sort only if 1D X
                    if (!Array.isArray(newData[0]?.x)) {
                        newData.sort((a, b) => a.x - b.x);
                    }
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
                            .map((row) => {
                                if (row.length > 2) {
                                    return {
                                        x: row.slice(0, -1).map(v => parseFloat(v)),
                                        y: parseFloat(row[row.length - 1]),
                                    };
                                }
                                return {
                                    x: parseFloat(row[0]),
                                    y: parseFloat(row[1]),
                                };
                            })
                            .filter((d) => {
                                if (Array.isArray(d.x)) {
                                    return d.x.every(v => !isNaN(v)) && !isNaN(d.y);
                                }
                                return !isNaN(d.x) && !isNaN(d.y);
                            });

                        if (newData.length === 0) {
                            setError("No valid data found in CSV file");
                            return;
                        }

                        if (!Array.isArray(newData[0]?.x)) {
                            newData.sort((a, b) => a.x - b.x);
                        }
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

        if (isGuest) {
            toast.warning("Sign up to save analyses and access your history!", {
                action: {
                    label: "Sign Up",
                    onClick: () => _navigate("/signup")
                },
            });
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

            const result = await dataAPI.save(regressionResult.title || "Untitled Analysis", data, regressionType, regressionResult.equation, regressionResult.r2, activeWorkspace?.id, isPublic);
            toast.success("Analysis saved successfully!");
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

    const dropEmptyValues = () => {
        const clean = data.filter(pt => pt.x !== null && pt.x !== undefined && !isNaN(pt.x) && pt.y !== null && pt.y !== undefined && !isNaN(pt.y));
        const dropped = data.length - clean.length;
        setData(clean);
        toast.success(`Removed ${dropped} empty/invalid data points`);
    };

    const filterOutliers = () => {
        if (data.length < 4) {
            toast.warning("Need at least 4 points to calculate outliers");
            return;
        }
        const xs = data.map(d => d.x);
        const ys = data.map(d => d.y);
        
        const getOutlierThresholds = (values) => {
            const sorted = [...values].sort((a, b) => a - b);
            const q1 = sorted[Math.floor(sorted.length * 0.25)];
            const q3 = sorted[Math.floor(sorted.length * 0.75)];
            const iqr = q3 - q1;
            return [q1 - 1.5 * iqr, q3 + 1.5 * iqr];
        };
        
        const [minX, maxX] = getOutlierThresholds(xs);
        const [minY, maxY] = getOutlierThresholds(ys);
        
        const clean = data.filter(d => d.x >= minX && d.x <= maxX && d.y >= minY && d.y <= maxY);
        const outliersCount = data.length - clean.length;
        setData(clean);
        toast.success(`Removed ${outliersCount} statistical outliers`);
    };

    const scaleData = () => {
        if (data.length === 0) return;
        const minX = Math.min(...data.map(d => d.x));
        const maxX = Math.max(...data.map(d => d.x));
        const minY = Math.min(...data.map(d => d.y));
        const maxY = Math.max(...data.map(d => d.y));
        
        const rangeX = maxX - minX || 1;
        const rangeY = maxY - minY || 1;
        
        const scaled = data.map(d => ({
            x: (d.x - minX) / rangeX,
            y: (d.y - minY) / rangeY
        }));
        setData(scaled);
        toast.success("Normalized data points to [0, 1] range");
    };

    const exportDetailedPDFReport = async () => {
        if (!regressionResult) return;
        setLoading(true);
        try {
            const chartEl = chartContainerRef.current;
            if (!chartEl) return;
            
            const canvas = await html2canvas(chartEl, { scale: 2 });
            const imgData = canvas.toDataURL('image/png');
            
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4',
            });
            
            const pdfWidth = pdf.internal.pageSize.getWidth();
            
            // Header
            pdf.setFillColor(15, 23, 42); // slate-900
            pdf.rect(0, 0, pdfWidth, 40, 'F');
            
            pdf.setFontSize(22);
            pdf.setTextColor(255, 255, 255);
            pdf.text("DataViz Regression Analysis Report", 20, 25);
            
            pdf.setFontSize(9);
            pdf.setTextColor(203, 213, 225); // slate-300
            pdf.text(`Generated on: ${new Date().toLocaleString()}`, 20, 32);
            
            // Section: Model Summary
            pdf.setFontSize(14);
            pdf.setTextColor(15, 23, 42);
            pdf.text("Model Summary", 20, 50);
            pdf.setDrawColor(226, 232, 240);
            pdf.line(20, 52, pdfWidth - 20, 52);
            
            pdf.setFontSize(10);
            pdf.setTextColor(51, 65, 85);
            
            pdf.text(`Selected Model Type:`, 20, 60);
            pdf.setFont(undefined, 'bold');
            pdf.text(`${regressionResult.modelName}`, 60, 60);
            pdf.setFont(undefined, 'normal');
            
            pdf.text(`Mathematical Fit:`, 20, 66);
            pdf.setFont(undefined, 'bold');
            pdf.text(`${regressionResult.equation}`, 60, 66);
            pdf.setFont(undefined, 'normal');
            
            pdf.text(`R-Squared (R²):`, 20, 72);
            pdf.setFont(undefined, 'bold');
            pdf.text(`${regressionResult.r2.toFixed(6)}`, 60, 72);
            pdf.setFont(undefined, 'normal');
            
            if (regressionResult.adjustedR2) {
                pdf.text(`Adjusted R²:`, 20, 78);
                pdf.text(`${regressionResult.adjustedR2.toFixed(6)}`, 60, 78);
            }
            
            pdf.text(`Root Mean Squared Error (RMSE):`, 20, 84);
            pdf.text(`${regressionResult.rmse.toFixed(6)}`, 80, 84);
            
            pdf.text(`Mean Absolute Error (MAE):`, 20, 90);
            pdf.text(`${regressionResult.mae.toFixed(6)}`, 80, 90);
            
            // Section: Plot
            pdf.setFontSize(14);
            pdf.setTextColor(15, 23, 42);
            pdf.text("Regression Plot", 20, 102);
            pdf.line(20, 104, pdfWidth - 20, 104);
            
            const imgWidth = pdfWidth - 40;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            pdf.addImage(imgData, 'PNG', 20, 110, imgWidth, imgHeight);
            
            const sanitizeFilename = regressionResult.modelName.replace(/\s+/g, '_').toLowerCase();
            pdf.save(`dataviz_report_${sanitizeFilename}.pdf`);
            toast.success("Detailed PDF Report exported successfully!");
        } catch (error) {
            console.error("PDF export failed:", error);
            toast.error("Failed to generate PDF Report");
        } finally {
            setLoading(false);
        }
    };

    const saveBookmark = () => {
        if (!regressionResult) {
            toast.error("No analysis results to bookmark");
            return;
        }
        const title = prompt("Enter a name for this bookmark:", `${regressionResult.modelName} Fit - ${data.length} Points`);
        if (!title) return;
        
        const newBookmark = {
            id: Date.now().toString(),
            title,
            data,
            regressionResult,
            regressionType,
            polynomialDegree,
            selectedModelType,
            created_at: new Date().toISOString()
        };
        
        const updated = [newBookmark, ...bookmarks];
        setBookmarks(updated);
        localStorage.setItem("dataviz_bookmarks", JSON.stringify(updated));
        toast.success("Analysis bookmarked successfully!");
    };

    const loadBookmark = (bookmark) => {
        setData(bookmark.data || []);
        setRegressionResult(bookmark.regressionResult || null);
        setRegressionType(bookmark.regressionType || "linear");
        setPolynomialDegree(bookmark.polynomialDegree || 2);
        if (bookmark.selectedModelType) {
            setSelectedModelType(bookmark.selectedModelType);
        }
        setActiveTab("results");
        toast.success(`Loaded bookmark: ${bookmark.title}`);
    };

    const deleteBookmark = (id) => {
        const updated = bookmarks.filter(b => b.id !== id);
        setBookmarks(updated);
        localStorage.setItem("dataviz_bookmarks", JSON.stringify(updated));
        toast.success("Bookmark removed");
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
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="input" className="gap-2">
                        <Upload className="h-4 w-4" />
                        Input Data
                    </TabsTrigger>
                    <TabsTrigger value="data" className="gap-2" disabled={data.length === 0}>
                        <Grid3x3 className="h-4 w-4" />
                        View Data
                    </TabsTrigger>
                    {(regressionResult || loading) && (
                        <TabsTrigger value="results" className="gap-2">
                            <BarChart3 className="h-4 w-4" />
                            Results
                        </TabsTrigger>
                    )}
                    <TabsTrigger value="stats" className="gap-2" disabled={data.length === 0}>
                        <Beaker className="h-4 w-4" />
                        Compare Groups
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

                    {/* Data Cleaning Panel */}
                    <Card className="border-2 mt-4">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Sparkles className="h-5 w-5 text-blue-500" />
                                Data Cleaning & Preparation
                            </CardTitle>
                            <CardDescription>
                                Pre-process your data points to improve regression accuracy
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-wrap gap-3">
                                <Button onClick={dropEmptyValues} variant="outline" className="gap-2">
                                    <Trash2 className="h-4 w-4 text-red-500" />
                                    Drop Empty/NaN
                                </Button>
                                <Button onClick={filterOutliers} variant="outline" className="gap-2">
                                    <AlertCircle className="h-4 w-4 text-orange-500" />
                                    Filter Outliers (IQR)
                                </Button>
                                <Button onClick={scaleData} variant="outline" className="gap-2">
                                    <RefreshCw className="h-4 w-4 text-blue-500" />
                                    Normalize Data [0, 1]
                                </Button>
                                <Button onClick={clearData} variant="outline" className="gap-2 text-destructive hover:bg-destructive/5 hover:text-destructive">
                                    <Trash2 className="h-4 w-4" />
                                    Clear All Data
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Bookmarks History */}
                    {bookmarks.length > 0 && (
                        <Card className="border-2 mt-4">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-yellow-600">
                                    <Save className="h-5 w-5" />
                                    Bookmarked Analyses ({bookmarks.length})
                                </CardTitle>
                                <CardDescription>
                                    Quickly reload previously saved configurations and datasets
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {bookmarks.map((bookmark) => (
                                        <div key={bookmark.id} className="p-4 rounded-lg border-2 bg-muted/10 hover:bg-muted/20 flex flex-col justify-between space-y-3">
                                            <div>
                                                <h4 className="font-semibold text-sm line-clamp-1">{bookmark.title}</h4>
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    {bookmark.data?.length || 0} points • {bookmark.regressionResult?.modelName || "Regression"}
                                                </p>
                                                <p className="text-[10px] text-muted-foreground mt-1">
                                                    {new Date(bookmark.created_at).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <div className="flex gap-2">
                                                <Button onClick={() => loadBookmark(bookmark)} size="sm" variant="outline" className="flex-1">
                                                    Load
                                                </Button>
                                                <Button onClick={() => deleteBookmark(bookmark.id)} size="sm" variant="ghost" className="text-red-500 hover:text-red-600 hover:bg-red-50">
                                                    Delete
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                    {/* Curve Plotter Best Practices Reference */}
                    <Card className="border-2 mt-4">
                        <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-2 text-primary">
                                <BookOpen className="h-5 w-5 text-slate-800 dark:text-slate-100" />
                                Curve Plotter Principles & Best Practices
                            </CardTitle>
                            <CardDescription>
                                Key guidelines for constructing mathematical functions that accurately reflect physical or statistical trends.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <div className="p-3.5 rounded-lg border bg-muted/20 space-y-2">
                                    <div className="flex items-center gap-2 font-semibold text-sm">
                                        <Sparkles className="h-4 w-4 text-blue-500" />
                                        Model Selection
                                    </div>
                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                        Choose the simplest equation that adequately explains the data. Avoid overfitting with high-order polynomials unless physically justified.
                                    </p>
                                </div>
                                <div className="p-3.5 rounded-lg border bg-muted/20 space-y-2">
                                    <div className="flex items-center gap-2 font-semibold text-sm">
                                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                        Data Quality
                                    </div>
                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                        Ensure variables are truly related. Aim for at least <strong>five or six data points</strong> to establish statistical confidence in the curve fit.
                                    </p>
                                </div>
                                <div className="p-3.5 rounded-lg border bg-muted/20 space-y-2">
                                    <div className="flex items-center gap-2 font-semibold text-sm">
                                        <Activity className="h-4 w-4 text-purple-500" />
                                        Error Handling
                                    </div>
                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                        Use weighted least squares for non-uniform errors, assigning higher weights to data points with smaller measurement errors (w<sub>i</sub> = 1/&Delta;Y<sub>i</sub><sup>2</sup>).
                                    </p>
                                </div>
                                <div className="p-3.5 rounded-lg border bg-muted/20 space-y-2">
                                    <div className="flex items-center gap-2 font-semibold text-sm">
                                        <Zap className="h-4 w-4 text-amber-500" />
                                        Algorithm Choice
                                    </div>
                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                        Use direct least-squares for linear models. For non-linear equations, iterative algorithms like Levenberg-Marquardt are preferred but require a close initial guess.
                                    </p>
                                </div>
                                <div className="p-3.5 rounded-lg border bg-muted/20 space-y-2">
                                    <div className="flex items-center gap-2 font-semibold text-sm">
                                        <AlertCircle className="h-4 w-4 text-red-500" />
                                        Robustness to Outliers
                                    </div>
                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                        If outliers are present, use robust fitting methods like Least Absolute Residuals (LAR) or Bisquare rather than standard ordinary least squares.
                                    </p>
                                </div>
                                <div className="p-3.5 rounded-lg border bg-muted/20 space-y-2">
                                    <div className="flex items-center gap-2 font-semibold text-sm">
                                        <Info className="h-4 w-4 text-slate-500" />
                                        Interpretation
                                    </div>
                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                        Always transform results back to natural physical units, and verify that the fitted curve aligns with the underlying physical relationship.
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Data View Tab */}
                <TabsContent value="data" className="space-y-6 mt-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                                <DataTable
                                    data={data}
                                    onDataChange={setData}
                                    selectedPointIndex={selectedPointIndex}
                                    onRowSelect={handlePointClick}
                                    onClearAll={clearData}
                                />
                            </CardContent>
                        </Card>

                        {/* Live Data Visualization */}
                        {data.length > 0 ? (
                            <div className="space-y-6">
                                <Card className="border-2 flex flex-col justify-between">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="flex items-center gap-2">
                                            <TrendingUp className="h-5 w-5 text-primary" />
                                            Live Visualization
                                        </CardTitle>
                                        <CardDescription>
                                            Real-time preview of the {data.length} plotted data points. Click a point to edit or filter it out.
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="flex-1 flex flex-col justify-center min-h-[350px]">
                                        <UniversalChart
                                            type="regression"
                                            data={data}
                                            regression={regressionResult}
                                            title={regressionResult ? `${regressionResult.modelName} Analysis` : "Data Points Preview"}
                                            selectedPointIndex={selectedPointIndex}
                                            onPointClick={handlePointClick}
                                        />
                                    </CardContent>
                                </Card>
                            </div>
                        ) : (
                            <Card className="border-2 h-full flex flex-col items-center justify-center p-8 text-center bg-muted/10 min-h-[350px]">
                                <TrendingUp className="h-12 w-12 text-muted-foreground opacity-30 mb-4 animate-pulse" />
                                <h3 className="font-semibold text-lg">No Data Points Yet</h3>
                                <p className="text-sm text-muted-foreground max-w-sm mt-1">
                                    Enter coordinates or upload a CSV file on the input tab to visualize your data points here.
                                </p>
                            </Card>
                        )}
                    </div>
                </TabsContent>

                {/* Results Tab */}
                <TabsContent value="results" className="space-y-4 mt-6">
                    {loading && !regressionResult && (
                        <Card className="border-2 p-12 text-center flex flex-col items-center justify-center space-y-4 bg-white dark:bg-slate-950">
                            <RefreshCw className="h-10 w-10 animate-spin text-primary mx-auto" />
                            <div>
                                <h3 className="font-semibold text-lg">Fitting Regression Model...</h3>
                                <p className="text-sm text-muted-foreground mt-1">
                                    {polling.status || "Fitting curve parameters. Please wait..."}
                                </p>
                            </div>
                        </Card>
                    )}
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
                                            selectedPointIndex={selectedPointIndex}
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

            {/* Regression Model Selector Option */}
            <Card className="border-2 p-4 bg-muted/20">
                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex-1 min-w-[240px] space-y-1.5">
                        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Regression Model Option</label>
                        <Select value={selectedModelType} onValueChange={setSelectedModelType}>
                            <SelectTrigger className="bg-card border-2">
                                <SelectValue placeholder="Select regression model" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="auto">Auto Select Best Fit</SelectItem>
                                <SelectItem value="linear">Simple Linear Regression</SelectItem>
                                <SelectItem value="polynomial">Polynomial Regression</SelectItem>
                                <SelectItem value="logarithmic">Logarithmic Regression</SelectItem>
                                <SelectItem value="exponential">Exponential Regression</SelectItem>
                                <SelectItem value="power">Power Regression</SelectItem>
                                <SelectItem value="ridge">Ridge Regression</SelectItem>
                                <SelectItem value="lasso">Lasso Regression</SelectItem>
                                <SelectItem value="elasticnet">Elastic Net Regression</SelectItem>
                                <SelectItem value="svr">Support Vector Regression (SVR)</SelectItem>
                                <SelectItem value="decision_tree">Decision Tree Regression</SelectItem>
                                <SelectItem value="random_forest">Random Forest Regression</SelectItem>
                                <SelectItem value="quantile">Quantile Regression</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {selectedModelType === "polynomial" && (
                        <div className="w-[120px] space-y-1.5">
                            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Degree (2-6)</label>
                            <Input
                                type="number"
                                min={2}
                                max={6}
                                value={polynomialDegree}
                                onChange={(e) => setPolynomialDegree(Math.max(2, Math.min(6, parseInt(e.target.value) || 2)))}
                                className="bg-card border-2"
                            />
                        </div>
                    )}
                </div>
            </Card>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
                <Button
                    onClick={() => analyzeData()}
                    disabled={data.length < 2 || loading}
                    className="gap-2"
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

                        <Button onClick={exportDetailedPDFReport} variant="outline" size="lg" className="gap-2">
                            <FileText className="h-4 w-4" />
                            PDF Report
                        </Button>

                        <Button onClick={saveBookmark} variant="outline" size="lg" className="gap-2">
                            <Save className="h-4 w-4" />
                            Bookmark Fit
                        </Button>

                        <ExportCodeButton
                            chartType="regression"
                            regressionData={{
                                dataPoints: data || [],
                                equation: regressionResult?.equation || '',
                                modelType: regressionType || 'linear',
                                rSquared: regressionResult?.r2 || 0
                            }}
                            chartTitle="Regression Analysis"
                            buttonText="Export Code"
                            buttonSize="lg"
                            buttonVariant="outline"
                        />
                    </>
                )}

                {data.length > 0 && (
                    <Button 
                        onClick={clearData} 
                        variant="ghost" 
                        size="lg" 
                        className="gap-2 ml-auto text-muted-foreground hover:text-destructive hover:bg-destructive/5"
                    >
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
