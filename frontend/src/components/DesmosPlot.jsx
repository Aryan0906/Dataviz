import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Download, RefreshCw, ChevronDown, FileImage, FileText, FileCode, Sun, Moon, Save, Upload, Copy, Code } from "lucide-react";
import jsPDF from "jspdf";
import { toast } from "@/components/ui/sonner";
import { wrapSvgWithXmlMetadata } from "@/lib/chartExport";
import { usePageSession, useHistoryLogger } from "@/hooks/usePageSession";
import ExportCodeButton from "./ExportCodeButton";
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
    { label: "Sine", latex: "y = \\sin\\left(x\\right)" },
    { label: "Cosine", latex: "y = \\cos\\left(x\\right)" },
    { label: "Tangent", latex: "y = \\tan\\left(x\\right)" },
    { label: "Square Root", latex: "y = \\sqrt{x}" },
    { label: "Circle", latex: "x^2 + y^2 = 25" },
    { label: "Absolute Value", latex: "y = \\left|x\\right|" },
    { label: "Exponential", latex: "y = e^{x}" },
    { label: "Logarithm", latex: "y = \\ln\\left(x\\right)" },
    { label: "Parabola", latex: "y = -x^2 + 4" },
    { label: "Reciprocal", latex: "y = \\frac{1}{x}" },
    { label: "Ellipse", latex: "\\frac{x^2}{9} + \\frac{y^2}{4} = 1" },
];

export const ensureCdnCss = () => {
    if (document.querySelector("link[data-graph-cdn-css]")) return;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://www.desmos.com/api/v1.13/calculator.css";
    link.dataset.graphCdnCss = "true";
    document.head.appendChild(link);
};

export const loadLocalGraph = async () => {
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

export const loadCdnGraph = () =>
    new Promise((resolve, reject) => {
        const existing = document.querySelector("script[data-graph-cdn]");
        if (existing) {
            if (window.Desmos) {
                ensureCdnCss();
                resolve(window.Desmos);
                return;
            }
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
        const apiKey = import.meta.env.VITE_DESMOS_API_KEY || "dcb31709b452b1cf9dc26972add0fda6";
        script.src = `https://www.desmos.com/api/v1.13/calculator.js?apiKey=${apiKey}`;
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
    const _expressionsRef = useRef([]);
    const { theme } = useTheme();

    // Detect initial theme properly
    const getInitialTheme = () => {
        if (theme === "system") {
            return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
        }
        return theme || "light";
    };

    const [currentTheme, setCurrentTheme] = useState(getInitialTheme());
    const [expressions, setExpressions] = useState([]);
    // Mirrors the calculator's live expression list for code export.
    // Updated via observeEvent('change') so it stays correct regardless of
    // whether expressions come from presets, manual typing, or imports.
    const [liveExpressions, setLiveExpressions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState(false);
    const [showExportDialog, setShowExportDialog] = useState(false);
    const [exportFormat, setExportFormat] = useState("png");
    const [exportTheme, setExportTheme] = useState(getInitialTheme());
    const [showImportModal, setShowImportModal] = useState(false);
    const [importCode, setImportCode] = useState("");

    // Function to extract expressions from calculator
    const _extractExpressionsFromCalculator = () => {
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

    // Holds expressions loaded from a previous session that need to be
    // applied once the calculator finishes initialising.
    const pendingRestoreRef = useRef(null);
    // Tracks whether the initial restore has been consumed, so auto-save
    // doesn't fire during the noisy calculator init phase.
    const readyToSaveRef = useRef(false);

    // Session state — persists live expressions (the real calculator truth)
    // and the chosen export theme.
    const sessionState = useMemo(() => ({
        expressions: liveExpressions.map(latex => ({ latex })),
        exportTheme,
    }), [liveExpressions, exportTheme]);

    // Restore state callback — called by usePageSession on mount.
    // At this point the calculator is usually not ready yet, so we stash
    // the data in a ref and apply it after init (see the effect below).
    const restoreState = useCallback((savedState) => {
        console.log('[DesmosPlot] Restoring state (deferred):', savedState);
        if (savedState?.expressions?.length) {
            pendingRestoreRef.current = savedState.expressions;
        }
        if (savedState?.exportTheme) {
            setExportTheme(savedState.exportTheme);
        }
    }, []);

    // Always pass a valid object — never null — to avoid usePageSession crashing
    // on savePageSession(pageType, null). readyToSaveRef gates writes internally.
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

                // Sync liveExpressions on every calculator state change
                // (covers presets, manual typing, imports, deletions, etc.)
                const syncLiveExpressions = () => {
                    try {
                        const s = calc.getState();
                        const list = s?.expressions?.list || [];
                        setLiveExpressions(
                            list
                                .filter(e => e.latex && e.latex.trim() && e.type !== 'folder')
                                .map(e => e.latex)
                        );
                    } catch (_) { /* ignore */ }
                };
                calc.observeEvent('change', syncLiveExpressions);

                // Apply theme immediately with current theme state
                const themeToApply = getInitialTheme();
                console.log('[DesmosPlot] Applying initial theme:', themeToApply);
                applyTheme(calc, themeToApply);

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
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Once the calculator is ready, apply any expressions that were saved in
    // a previous session (stashed in pendingRestoreRef during restoreState).
    useEffect(() => {
        if (isLoading || !calculatorRef.current) return;
        if (!pendingRestoreRef.current?.length) return;

        const toRestore = pendingRestoreRef.current;
        pendingRestoreRef.current = null; // consume once

        try {
            // Atomic replace so we don't stack on top of init defaults
            const currentState = calculatorRef.current.getState();
            calculatorRef.current.setState({
                ...currentState,
                expressions: {
                    list: toRestore.map((e, i) => ({
                        type: 'expression',
                        id: e.id || `restored-${i}`,
                        latex: e.latex,
                    })),
                },
            });
            console.log('[DesmosPlot] Session restored into calculator:', toRestore.length, 'expressions');
        } catch (err) {
            console.error('[DesmosPlot] Failed to restore session into calculator:', err);
        }
    }, [isLoading]); // eslint-disable-line react-hooks/exhaustive-deps

    // Theme updates with retry for DOM readiness
    useEffect(() => {
        if (calculatorRef.current) {
            console.log('[DesmosPlot] Theme changed to:', currentTheme);
            applyTheme(calculatorRef.current, currentTheme);

            // Re-apply after a short delay to ensure DOM is ready
            setTimeout(() => {
                if (calculatorRef.current) {
                    applyTheme(calculatorRef.current, currentTheme);
                }
            }, 100);
        }
        setExportTheme(currentTheme === "dark" ? "dark" : "light");
    }, [currentTheme]);

    const applyTheme = (calc, themeMode) => {
        const isDark = themeMode === "dark";

        // Use native Desmos settings for clean theme toggling
        try {
            calc.updateSettings({
                invertedColors: isDark,
            });
        } catch (err) {
            console.warn("Unable to set calculator settings", err);
        }

        // Minimal container background override only
        const containerId = containerRef.current?.id || "graph-container";
        let styleElement = document.getElementById(`${containerId}-theme-style`);
        if (!styleElement) {
            styleElement = document.createElement("style");
            styleElement.id = `${containerId}-theme-style`;
            document.head.appendChild(styleElement);
        }

        styleElement.textContent = `
            #${containerId} {
                background-color: ${isDark ? '#1a1a2e' : '#ffffff'} !important;
                border-radius: 0.5rem;
            }
        `;
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
        const bg = themeChoice === "dark" ? "#1a1a1e" : "#ffffff";
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
                const bg = exportTheme === "dark" ? "#1a1a1e" : "#ffffff";

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

        // Defer mutation until after the Radix DropdownMenu has fully closed
        // and released its focus trap — otherwise setExpression can silently fail.
        requestAnimationFrame(() => {
            try {
                const id = `expr-${Date.now()}`;
                calculatorRef.current.setExpression({ id, latex });
                setExpressions(prev => [...prev, { id, latex }]);
                toast.success("Expression added!");
            } catch (error) {
                console.error("Error adding preset:", error);
                toast.error(`Invalid expression: ${error.message}`);
            }
        });
    };

    const clearAll = () => {
        if (!calculatorRef.current) return;
        try {
            // Atomically reset the expression list.
            // state.expressions is { list: [...] }, not a Map — iterating
            // it directly was silently producing an empty ID array.
            const currentState = calculatorRef.current.getState();
            calculatorRef.current.setState({
                ...currentState,
                expressions: { list: [] },
            });
            setExpressions([]);
            toast.success("All expressions cleared");
        } catch (error) {
            console.error("Error clearing expressions:", error);
            toast.error("Failed to clear expressions");
        }
    };


    // Code Import: parse newline-separated LaTeX expressions
    const handleImportCode = () => {
        if (!calculatorRef.current || !importCode.trim()) return;
        const lines = importCode.split('\n').map(l => l.trim()).filter(Boolean);
        const added = [];
        lines.forEach((latex) => {
            try {
                const id = `expr-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
                calculatorRef.current.setExpression({ id, latex });
                added.push({ id, latex });
            } catch (err) {
                console.warn('Skipped invalid expression:', latex, err);
            }
        });
        setExpressions(prev => [...prev, ...added]);
        setImportCode('');
        setShowImportModal(false);
        toast.success(`Imported ${added.length} expression(s)`);
    };

    const getExpressionsArray = () => {
        if (!calculatorRef.current) return [];
        try {
            const state = calculatorRef.current.getState();
            const exprList = state?.expressions?.list || [];
            const latexLines = [];
            exprList.forEach(e => { if (e.latex && e.type !== 'folder') latexLines.push(e.latex); });
            return latexLines;
        } catch {
            return [];
        }
    };

    // Code Export: generate Python matplotlib code
    const getExportedPythonCode = () => {
        if (!calculatorRef.current) return '# Calculator not loaded';
        try {
            const state = calculatorRef.current.getState();
            const exprList = state?.expressions?.list || [];
            const latexLines = [];
            exprList.forEach(e => { if (e.latex && e.type !== 'folder') latexLines.push(e.latex); });
            if (latexLines.length === 0) return '# No expressions to export';

            const lines = [
                'import numpy as np',
                'import matplotlib.pyplot as plt',
                'from matplotlib import rc',
                '',
                'rc("text", usetex=True)',
                'x = np.linspace(-10, 10, 500)',
                '',
                '# Expressions (LaTeX):',
                ...latexLines.map(l => `# ${l}`),
                '',
                'fig, ax = plt.subplots(figsize=(10, 8))',
                '# TODO: Add manual function definitions for each expression above',
                'ax.set_xlabel("x")',
                'ax.set_ylabel("y")',
                'ax.grid(True, alpha=0.3)',
                'ax.axhline(y=0, color="k", linewidth=0.5)',
                'ax.axvline(x=0, color="k", linewidth=0.5)',
                'plt.tight_layout()',
                'plt.show()',
            ];
            return lines.join('\n');
        } catch {
            return '# Error reading calculator state';
        }
    };

    return (
        <div className="space-y-4">
            {/* Help Text */}
            <div className="bg-muted/50 border rounded-lg p-3">
                <p className="text-sm text-muted-foreground">
                    <strong className="text-foreground">📊 Interactive Math Graphing:</strong> Enter LaTeX expressions (e.g., y=x^2, x^2+y^2=25) or choose from presets. Click expressions to edit, drag to pan, scroll to zoom.
                </p>
            </div>

            {/* Top Toolbar */}
            <div className="flex gap-2 items-center justify-between bg-card border rounded-lg p-3">
                <div className="flex gap-2 items-center flex-wrap">
                    <Button
                        onClick={() => saveNow()}
                        size="sm"
                        variant="outline"
                        className="gap-2"
                        title="Save current graph to session"
                    >
                        <Save className="h-4 w-4" />
                        Save Session
                    </Button>
                    <Button
                        onClick={() => handleExportClick("png")}
                        size="sm"
                        className="gap-2 bg-slate-500 text-white hover:bg-emerald-600"
                        title="Export graph as image or PDF"
                    >
                        <Download className="h-4 w-4" />
                        Export
                    </Button>
                    <Button onClick={clearAll} variant="outline" size="sm" className="gap-2" title="Clear all expressions">
                        <RefreshCw className="h-4 w-4" />
                        Clear
                    </Button>

                    {/* Presets Dropdown */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="gap-2" title="Quick-load common mathematical functions">
                                <ChevronDown className="h-4 w-4" />
                                Presets
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-48">
                            {PRESET_EXPRESSIONS.map((preset) => (
                                <DropdownMenuItem
                                    key={preset.label}
                                    onSelect={() => addPreset(preset.latex)}
                                >
                                    <span className="flex-1">{preset.label}</span>
                                    <code className="text-xs text-muted-foreground">{preset.latex}</code>
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Code Import */}
                    <Button
                        onClick={() => setShowImportModal(true)}
                        variant="outline"
                        size="sm"
                        className="gap-2"
                        title="Import LaTeX expressions"
                    >
                        <Upload className="h-4 w-4" />
                        Import
                    </Button>

                    {/* Code Export — always uses the live calculator state */}
                    <ExportCodeButton
                        chartType="curve"
                        curveData={{ expressions: liveExpressions }}
                        chartTitle="Mathematical Curve Plot"
                        buttonText="Code"
                        buttonSize="sm"
                        buttonVariant="outline"
                    />
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
                        style={{ minHeight: "600px" }}
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

            {/* Code Import Modal */}
            <AlertDialog open={showImportModal} onOpenChange={setShowImportModal}>
                <AlertDialogContent className="max-w-lg">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <Upload className="h-5 w-5" />
                            Import LaTeX Expressions
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Paste one LaTeX expression per line. Each line will be added as a separate graph.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <textarea
                        className="w-full h-40 p-3 rounded-lg border bg-muted/30 text-sm font-mono resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
                        placeholder={"y = x^2\ny = \\sin\\left(x\\right)\nx^2 + y^2 = 25"}
                        value={importCode}
                        onChange={(e) => setImportCode(e.target.value)}
                    />
                    <div className="flex justify-end gap-2">
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleImportCode} disabled={!importCode.trim()}>
                            Import
                        </AlertDialogAction>
                    </div>
                </AlertDialogContent>
            </AlertDialog>


        </div>
    );
};

export default DesmosPlot;

