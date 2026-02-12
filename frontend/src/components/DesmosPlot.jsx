import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import { Download, RefreshCw, ChevronDown, FileImage, FileText, FileCode, Sun, Moon, Save } from "lucide-react";
import jsPDF from "jspdf";
import { toast } from "@/components/ui/sonner";
import { wrapSvgWithXmlMetadata } from "@/lib/chartExport";
import { usePageSession, useHistoryLogger } from "@/hooks/usePageSession";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { generateFilename } from "@/lib/chartExport";
import { cn } from "@/lib/utils";

// Shared loader promise to avoid parallel loads
let desmosPromise = null;

const PRESET_EXPRESSIONS = [
    { label: "Linear", latex: "y = x" },
    { label: "Quadratic", latex: "y = x^2" },
    { label: "Cubic", latex: "y = x^3" },
    { label: "Sine", latex: "y = sin(x)" },
    { label: "Cosine", latex: "y = cos(x)" },
    { label: "Tangent", latex: "y = tan(x)" },
    { label: "Square Root", latex: "y = sqrt(x)" },
    { label: "Circle", latex: "x^2 + y^2 = 25" },
    { label: "Absolute Value", latex: "y = abs(x)" },
    { label: "Exponential", latex: "y = e^x" },
    { label: "Logarithm", latex: "y = log(x)" },
    { label: "Parabola", latex: "y = -x^2 + 4" },
];

const ensureCdnCss = () => {
    if (document.querySelector("link[data-graph-cdn-css]")) return;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://www.desmos.com/api/v1.8/calculator.css";
    link.dataset.graphCdnCss = "true";
    document.head.appendChild(link);
};

const loadLocalGraph = async () => {
    try {
        if (!desmosPromise) {
            desmosPromise = import("desmos");
        }
        const mod = await desmosPromise;
        ensureCdnCss();
        return mod?.default || mod;
    } catch (err) {
        console.warn("Local graph engine load failed, will try CDN", err);
        return null;
    }
};

const loadCdnGraph = () =>
    new Promise((resolve, reject) => {
        const existing = document.querySelector("script[data-graph-cdn]");
        if (existing) {
            existing.addEventListener(
                "load",
                () => {
                    ensureCdnCss();
                    resolve(window.Desmos);
                },
                { once: true },
            );
            existing.addEventListener("error", reject, { once: true });
            return;
        }
        const script = document.createElement("script");
        script.src = "https://www.desmos.com/api/v1.8/calculator.js";
        script.async = true;
        script.dataset.graphCdn = "true";
        script.onload = () => {
            ensureCdnCss();
            resolve(window.Desmos);
        };
        script.onerror = reject;
        document.head.appendChild(script);
    });

const DesmosPlot = () => {
    const containerRef = useRef(null);
    const calculatorRef = useRef(null);
    const expressionsRef = useRef([]);
    const { theme } = useTheme();
    const [currentTheme, setCurrentTheme] = useState("light");
    const [expressions, setExpressions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState(false);
    const [showExportDialog, setShowExportDialog] = useState(false);
    const [exportFormat, setExportFormat] = useState("png");
    const [exportTheme, setExportTheme] = useState("light");

    // Function to extract expressions from calculator
    const extractExpressionsFromCalculator = () => {
        if (!calculatorRef.current) {
            console.warn('[DesmosPlot] Calculator not initialized');
            return [];
        }

        try {
            const state = calculatorRef.current.getState();
            console.log('[DesmosPlot] Calculator state:', state);

            if (!state || !state.expressions) {
                console.warn('[DesmosPlot] No expressions in state');
                return [];
            }

            const extractedExpressions = [];
            const exprList = state.expressions.list || state.expressions;

            console.log('[DesmosPlot] Expressions list:', exprList);

            // Handle both array and List types
            if (Array.isArray(exprList)) {
                exprList.forEach((expr) => {
                    if (expr.latex && expr.latex.trim() && expr.type !== 'folder') {
                        extractedExpressions.push(expr.latex);
                    }
                });
            } else if (exprList && typeof exprList.forEach === 'function') {
                exprList.forEach((expr) => {
                    if (expr.latex && expr.latex.trim() && expr.type !== 'folder') {
                        extractedExpressions.push(expr.latex);
                    }
                });
            }

            console.log('[DesmosPlot] Extracted expressions:', extractedExpressions);
            return extractedExpressions;
        } catch (error) {
            console.error('[DesmosPlot] Error extracting expressions:', error);
            return [];
        }
    };

    // Session state for persistence
    const sessionState = useMemo(() => ({
        expressions,
        exportTheme,
    }), [expressions, exportTheme]);

    // Restore state callback
    const restoreState = useCallback((savedState) => {
        console.log('[DesmosPlot] Restoring state:', savedState);
        if (savedState.expressions) {
            setExpressions(savedState.expressions);
            // Restore expressions to calculator if it's ready
            if (calculatorRef.current) {
                savedState.expressions.forEach(expr => {
                    try {
                        calculatorRef.current.setExpression(expr);
                    } catch (error) {
                        console.error('[DesmosPlot] Error restoring expression:', error);
                    }
                });
            }
        }
        if (savedState.exportTheme) {
            setExportTheme(savedState.exportTheme);
        }
    }, []);

    // Session persistence hooks
    const { saveNow } = usePageSession('curve', sessionState, restoreState);
    const { logExport } = useHistoryLogger('curve');

    // Follow app theme (system aware)
    useEffect(() => {
        if (theme === "system") {
            const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
            setCurrentTheme(systemTheme);
        } else {
            setCurrentTheme(theme);
        }
    }, [theme]);

    // Load and initialize calculator once
    useEffect(() => {
        let cancelled = false;

        const init = async () => {
            setIsLoading(true);
            setLoadError(false);
            try {
                let Desmos = await loadLocalGraph();
                if (!Desmos) {
                    Desmos = await loadCdnGraph();
                }
                if (cancelled || !containerRef.current) return;
                if (!Desmos?.GraphingCalculator) throw new Error("Graph engine unavailable");

                const calc = Desmos.GraphingCalculator(containerRef.current, {
                    expressionsCollapsed: false,
                    settingsMenu: true,
                    zoomButtons: true,
                    expressionsTopbar: true,
                    border: false,
                    lockViewport: false,
                });

                calculatorRef.current = calc;
                applyTheme(calc, currentTheme);
                setIsLoading(false);
            } catch (error) {
                console.error("Graph init error", error);
                if (!cancelled) {
                    setLoadError(true);
                    setIsLoading(false);
                    toast.error("Failed to load graphing engine. Check connection or blockers and retry.");
                }
            }
        };

        init();
        return () => {
            cancelled = true;
        };
    }, []);

    // Theme updates
    useEffect(() => {
        if (calculatorRef.current) {
            applyTheme(calculatorRef.current, currentTheme);
        }
        setExportTheme(currentTheme === "dark" ? "dark" : "light");
    }, [currentTheme]);

    const applyTheme = (calc, themeMode) => {
        const getColor = (name, fallback) => {
            const value = getComputedStyle(document.documentElement).getPropertyValue(`--${name}`);
            const trimmed = value.trim();
            if (!trimmed) return fallback;
            return `hsl(${trimmed})`;
        };

        const bg = getColor("background", "#0a0a0a");
        const panel = getColor("card", "#0f0f0f");
        const border = getColor("border", "#1f1f1f");
        const text = getColor("foreground", "#e6e6e6");
        const mutedText = getColor("muted-foreground", "#cfd2d4");

        const containerId = containerRef.current?.id || "graph-container";
        let styleElement = document.getElementById(`${containerId}-theme-style`);
        if (!styleElement) {
            styleElement = document.createElement("style");
            styleElement.id = `${containerId}-theme-style`;
            document.head.appendChild(styleElement);
        }

        styleElement.textContent = `
            #${containerId} {
                background-color: ${bg} !important;
            }
            #${containerId} .dcg-container,
            #${containerId} .dcg-expressions,
            #${containerId} .dcg-expressionlist,
            #${containerId} .dcg-expressions-scrollable,
            #${containerId} .dcg-expressions-content,
            #${containerId} .dcg-grapher-container,
            #${containerId} .dcg-left-gutter,
            #${containerId} .dcg-hud,
            #${containerId} .dcg-expressionsTopbar {
                background-color: ${panel} !important;
                color: ${text} !important;
                border-color: ${border} !important;
            }
            #${containerId} .dcg-expressionitem,
            #${containerId} .dcg-expressionitem input,
            #${containerId} .dcg-expressionitem textarea,
            #${containerId} .dcg-basic-toggle,
            #${containerId} .dcg-action-card,
            #${containerId} .dcg-exppanel {
                background-color: ${panel} !important;
                color: ${text} !important;
                border-color: ${border} !important;
            }
            #${containerId} input,
            #${containerId} textarea,
            #${containerId} .dcg-mq-root-block,
            #${containerId} .dcg-math-field {
                background-color: ${panel} !important;
                color: ${text} !important;
                border-color: ${border} !important;
            }
            #${containerId} .dcg-tooltip,
            #${containerId} .dcg-menu,
            #${containerId} .dcg-popover,
            #${containerId} .dcg-option-item,
            #${containerId} .dcg-selectable {
                background-color: ${panel} !important;
                color: ${text} !important;
                border-color: ${border} !important;
            }
            #${containerId} .dcg-icon-btn,
            #${containerId} .dcg-btn-flat,
            #${containerId} .dcg-btn-light-gray {
                background-color: ${panel} !important;
                color: ${text} !important;
                border-color: ${border} !important;
            }
            #${containerId} .dcg-icon-btn:hover,
            #${containerId} .dcg-btn-flat:hover,
            #${containerId} .dcg-btn-light-gray:hover {
                background-color: ${bg} !important;
            }
            #${containerId} .dcg-graphpaper {
                background-color: ${bg} !important;
            }
            #${containerId} .dcg-axis-label, #${containerId} .dcg-tick-label {
                color: ${mutedText} !important;
            }
            #${containerId} .dcg-icon-btn svg,
            #${containerId} .dcg-btn-flat svg,
            #${containerId} .dcg-btn-light-gray svg,
            #${containerId} .dcg-icon svg,
            #${containerId} .dcg-expressionitem .dcg-action-button svg,
            #${containerId} .dcg-icon-inline svg {
                fill: ${text} !important;
                color: ${text} !important;
            }
        `;

        // Align Desmos internal settings with theme (no forced projector mode)
        try {
            calc.updateSettings({ projectorMode: themeMode === "dark" });
        } catch (err) {
            console.warn("Unable to set calculator settings", err);
        }
    };

    const handleExportClick = (format) => {
        setExportFormat(format);
        setShowExportDialog(true);
    };

    const takeScreenshot = async (themeChoice) => {
        if (!calculatorRef.current) throw new Error("Graph not ready");
        const rect = containerRef.current?.getBoundingClientRect();
        const width = Math.max(1, Math.floor(rect?.width || 800));
        const height = Math.max(1, Math.floor(rect?.height || 600));
        const bg = themeChoice === "dark" ? "#09090b" : "#ffffff";
        return calculatorRef.current.screenshot({ width, height, backgroundColor: bg });
    };

    const confirmExport = async () => {
        if (!containerRef.current) {
            toast.error("Graph not found");
            return;
        }

        const filename = generateFilename("desmos-graph");
        try {
            const dataUrl = await takeScreenshot(exportTheme);
            if (!dataUrl) throw new Error("Empty screenshot");

            if (exportFormat === "png") {
                const link = document.createElement("a");
                link.href = dataUrl;
                link.download = `${filename}.png`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                toast.success(`Chart exported as PNG (${exportTheme})`);
            } else if (exportFormat === "svg") {
                // Create SVG with embedded image and XML metadata
                const rect = containerRef.current?.getBoundingClientRect();
                const width = Math.max(1, Math.floor(rect?.width || 800));
                const height = Math.max(1, Math.floor(rect?.height || 600));
                const bg = exportTheme === "dark" ? "#09090b" : "#ffffff";

                const rawSvg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="${bg}" />
  <image href="${dataUrl}" width="${width}" height="${height}" />
</svg>`;

                // Get current expressions for metadata
                const currentExpressions = expressions.map(e => e.latex || e.label || '').filter(Boolean);
                const xmlDocument = wrapSvgWithXmlMetadata(rawSvg, {
                    title: 'Desmos Graph Export',
                    chartType: 'mathematical-curve',
                    description: `Desmos graph with ${currentExpressions.length} expression(s): ${currentExpressions.slice(0, 3).join(', ')}${currentExpressions.length > 3 ? '...' : ''}`,
                });

                const blob = new Blob([xmlDocument], { type: 'image/svg+xml;charset=utf-8' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.href = url;
                link.download = `${filename}.svg`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
                toast.success(`Chart exported as SVG/XML (${exportTheme})`);
            } else {
                const img = new Image();
                img.src = dataUrl;
                await new Promise((resolve, reject) => {
                    img.onload = resolve;
                    img.onerror = reject;
                });

                const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
                const pageWidth = pdf.internal.pageSize.getWidth();
                const pageHeight = pdf.internal.pageSize.getHeight();
                const ratio = Math.min(pageWidth / img.width, pageHeight / img.height);
                const w = img.width * ratio;
                const h = img.height * ratio;
                const x = (pageWidth - w) / 2;
                const y = (pageHeight - h) / 2;
                pdf.addImage(dataUrl, "PNG", x, y, w, h);
                pdf.save(`${filename}.pdf`);
                toast.success(`Chart exported as PDF (${exportTheme})`);
            }

            // Log export to history
            logExport({
                title: 'Desmos Graph Export',
                metadata: {
                    expressionCount: expressions.length,
                    format: exportFormat,
                    theme: exportTheme,
                    filename: filename,
                },
            });
        } catch (error) {
            console.error("Export failed", error);
            toast.error("Export failed. Try again after the graph loads.");
        }

        setShowExportDialog(false);
    };

    const addPreset = (latex) => {
        if (!calculatorRef.current) {
            toast.error("Calculator not initialized");
            return;
        }

        try {
            const id = `expr-${Date.now()}`;
            calculatorRef.current.setExpression({
                id,
                latex: latex,
            });

            setExpressions([...expressions, { id, latex: latex }]);
            toast.success("Expression added!");
        } catch (error) {
            console.error("Error adding preset:", error);
            toast.error(`Invalid expression: ${error.message}`);
        }
    };

    const clearAll = () => {
        if (calculatorRef.current) {
            try {
                const state = calculatorRef.current.getState();
                console.log("Current state:", state);

                if (state && state.expressions) {
                    // expressions is a Map, so we need to iterate using .forEach
                    const expressionIds = [];
                    state.expressions.forEach((expr) => {
                        expressionIds.push(expr.id);
                    });

                    console.log("Expression IDs to remove:", expressionIds);

                    // Remove each expression by ID
                    expressionIds.forEach((id) => {
                        calculatorRef.current.removeExpression({ id });
                    });
                }

                setExpressions([]);
                toast.success("All expressions cleared");
            } catch (error) {
                console.error("Error clearing expressions:", error);
                console.error("Error details:", error.message);
                toast.error("Failed to clear expressions");
            }
        }
    };

    return (
        <div className="space-y-4">
            {/* Top Toolbar */}
            <div className="flex gap-2 items-center justify-between bg-card border rounded-lg p-3">
                <div className="flex gap-2 items-center flex-wrap">
                    <Button
                        onClick={() => saveNow()}
                        size="sm"
                        variant="outline"
                        className="gap-2"
                    >
                        <Save className="h-4 w-4" />
                        Save Session
                    </Button>
                    <Button
                        onClick={() => handleExportClick("png")}
                        size="sm"
                        className="gap-2 bg-emerald-500 text-white hover:bg-emerald-600"
                    >
                        <Download className="h-4 w-4" />
                        Export
                    </Button>
                    <Button onClick={clearAll} variant="outline" size="sm" className="gap-2">
                        <RefreshCw className="h-4 w-4" />
                        Clear
                    </Button>

                    {/* Presets Dropdown */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="gap-2">
                                <ChevronDown className="h-4 w-4" />
                                Presets
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-48">
                            {PRESET_EXPRESSIONS.map((preset) => (
                                <DropdownMenuItem
                                    key={preset.label}
                                    onClick={() => addPreset(preset.latex)}
                                >
                                    <span className="flex-1">{preset.label}</span>
                                    <code className="text-xs text-muted-foreground">{preset.latex}</code>
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
                <div className="text-sm text-muted-foreground">
                    Theme: <span className="font-semibold">{currentTheme === "dark" ? "Dark" : "Light"}</span>
                </div>
            </div>

            {/* Main Layout */}
            <div className="grid grid-cols-1 gap-4">
                {/* Graph - Full Width */}
                <div className="relative border rounded-lg overflow-hidden bg-card">
                    {isLoading && (
                        <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-10">
                            <div className="text-center space-y-2">
                                <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
                                <p className="text-sm text-muted-foreground">Loading graph...</p>
                            </div>
                        </div>
                    )}
                    {loadError && (
                        <div className="absolute inset-0 bg-background/80 flex items-center justify-center z-30 backdrop-blur-sm">
                            <div className="text-center space-y-3 max-w-sm">
                                <p className="text-sm font-semibold text-destructive">Failed to load graph</p>
                                <p className="text-xs text-muted-foreground">Check your internet connection or ad-block settings, then click retry.</p>
                                <div className="flex justify-center">
                                    <Button size="sm" onClick={() => window.location.reload()}>
                                        Retry
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                    <div
                        ref={containerRef}
                        id="graph-container"
                        className="w-full h-[600px]"
                        style={{
                            backgroundColor: "hsl(var(--background))",
                        }}
                    />
                </div>
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
                        <div className="space-y-2">
                            <label className="text-sm font-medium">File Format</label>
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
                                    onClick={() => setExportFormat("svg")}
                                    className={cn(
                                        "flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition",
                                        exportFormat === "svg"
                                            ? "border-primary bg-primary/10"
                                            : "border-border hover:border-primary/50"
                                    )}
                                >
                                    <FileCode className="h-5 w-5" />
                                    <span className="text-sm font-medium">SVG</span>
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

export default DesmosPlot;
