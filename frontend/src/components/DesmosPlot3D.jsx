import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import { Download, RefreshCw, ChevronDown, Save, Upload, FileImage, FileText, FileCode, Sun, Moon } from "lucide-react";
import jsPDF from "jspdf";
import { toast } from "@/components/ui/sonner";
import { wrapSvgWithXmlMetadata, generateFilename } from "@/lib/chartExport";
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
import { cn } from "@/lib/utils";
import { loadCdnGraph, loadLocalGraph } from "./DesmosPlot";

const PRESET_3D_EXPRESSIONS = [
    { label: "Paraboloid", latex: "z = x^2 + y^2" },
    { label: "Saddle", latex: "z = x^2 - y^2" },
    { label: "Sphere", latex: "x^2 + y^2 + z^2 = 25" },
    { label: "Sine Wave Grid", latex: "z = \\sin(x) \\cdot \\cos(y)" },
    { label: "Cone", latex: "z^2 = x^2 + y^2" },
    { label: "Ripple", latex: "z = \\sin(x^2 + y^2)" },
    { label: "Torus", latex: "z^2 + \\left(\\sqrt{x^2 + y^2} - 3\\right)^2 = 1" },
    { label: "Cylinder", latex: "x^2 + y^2 = 9" },
    { label: "Monkey Saddle", latex: "z = x^3 - 3xy^2" },
    { label: "Damped Wave", latex: "z = \\cos(x + y) \\cdot e^{-0.1(x^2 + y^2)}" },
    { label: "Heart 3D", latex: "\\left(x^{2}+\\frac{9}{4}y^{2}+z^{2}-1\\right)^{3}-x^{2}z^{3}-\\frac{9}{80}y^{2}z^{3}=0" },
    { label: "Helicoid", latex: "z = \\arctan\\left(\\frac{y}{x}\\right)" },
];

const DesmosPlot3D = () => {
    const containerRef = useRef(null);
    const calculatorRef = useRef(null);
    const pendingRestoreRef = useRef(null);
    const { theme } = useTheme();

    const getInitialTheme = () => {
        if (theme === "system") {
            return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
        }
        return theme || "light";
    };

    const [currentTheme, setCurrentTheme] = useState(getInitialTheme());
    const [liveExpressions, setLiveExpressions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState(false);
    const [exportTheme, setExportTheme] = useState(getInitialTheme());
    const [showExportDialog, setShowExportDialog] = useState(false);
    const [exportFormat, setExportFormat] = useState("png");
    const [showImportModal, setShowImportModal] = useState(false);
    const [importCode, setImportCode] = useState("");

    // Session state - persists live 3D expressions
    const sessionState = useMemo(() => ({
        expressions: liveExpressions.map(latex => ({ latex })),
        exportTheme,
    }), [liveExpressions, exportTheme]);

    // Restore state callback
    const restoreState = useCallback((savedState) => {
        console.log('[DesmosPlot3D] Restoring state (deferred):', savedState);
        if (savedState?.expressions?.length) {
            pendingRestoreRef.current = savedState.expressions;
        }
        if (savedState?.exportTheme) {
            setExportTheme(savedState.exportTheme);
        }
    }, []);

    const { saveNow } = usePageSession('curve3d', isLoading ? null : sessionState, restoreState);
    const { logExport } = useHistoryLogger('curve3d');

    // Follow app theme (system aware)
    useEffect(() => {
        if (theme === "system") {
            const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
            setCurrentTheme(systemTheme);
        } else {
            setCurrentTheme(theme);
        }
    }, [theme]);

    // Initialize 3D calculator
    useEffect(() => {
        let cancelled = false;

        const init = async () => {
            setIsLoading(true);
            setLoadError(false);
            try {
                let Desmos = await loadLocalGraph();
                if (!Desmos || !Desmos.Calculator3D) {
                    console.log("[DesmosPlot3D] Local graph module lacks 3D support, falling back to CDN...");
                    Desmos = await loadCdnGraph();
                }
                if (cancelled || !containerRef.current) return;
                if (!Desmos?.Calculator3D) throw new Error("3D Graph engine unavailable");

                const calc = Desmos.Calculator3D(containerRef.current, {
                    expressionsCollapsed: false,
                    settingsMenu: true,
                    zoomButtons: true,
                    expressionsTopbar: true,
                    border: false,
                    lockViewport: false,
                });

                calculatorRef.current = calc;

                // Sync liveExpressions on change
                const syncLiveExpressions = () => {
                    try {
                        const s = calc.getState();
                        const list = s?.expressions?.list || [];
                        setLiveExpressions(
                            list
                                .filter(e => e.latex && e.latex.trim() && e.type !== 'folder')
                                .map(e => e.latex)
                        );
                    } catch (_) {}
                };
                calc.observeEvent('change', syncLiveExpressions);

                // Apply initial theme
                const themeToApply = getInitialTheme();
                calc.updateSettings({ invertedColors: themeToApply === "dark" });

                setIsLoading(false);
            } catch (error) {
                console.error("3D Graph init error", error);
                if (!cancelled) {
                    setLoadError(true);
                    setIsLoading(false);
                    toast.error("Failed to load 3D graphing engine. Check connection or blockers and retry.");
                }
            }
        };

        init();
        return () => {
            cancelled = true;
        };
    }, []);

    // Apply pending restores when loaded
    useEffect(() => {
        if (isLoading || !calculatorRef.current) return;
        if (!pendingRestoreRef.current?.length) return;

        const toRestore = pendingRestoreRef.current;
        pendingRestoreRef.current = null;

        try {
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
            console.log('[DesmosPlot3D] Session restored:', toRestore.length, 'expressions');
        } catch (err) {
            console.error('[DesmosPlot3D] Failed to restore session:', err);
        }
    }, [isLoading]);

    // Theme changes
    useEffect(() => {
        if (calculatorRef.current) {
            calculatorRef.current.updateSettings({
                invertedColors: currentTheme === "dark",
            });
        }
        setExportTheme(currentTheme === "dark" ? "dark" : "light");
    }, [currentTheme]);

    const addPreset = (latex) => {
        if (!calculatorRef.current) {
            toast.error("Calculator not initialized");
            return;
        }

        requestAnimationFrame(() => {
            try {
                const id = `expr-${Date.now()}`;
                calculatorRef.current.setExpression({ id, latex });
                toast.success("Preset expression added!");
            } catch (error) {
                console.error("Error adding preset:", error);
                toast.error(`Invalid expression: ${error.message}`);
            }
        });
    };

    const clearAll = () => {
        if (!calculatorRef.current) return;
        try {
            const currentState = calculatorRef.current.getState();
            calculatorRef.current.setState({
                ...currentState,
                expressions: { list: [] },
            });
            toast.success("All expressions cleared");
        } catch (error) {
            console.error("Error clearing expressions:", error);
            toast.error("Failed to clear expressions");
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
        const bg = themeChoice === "dark" ? "#1a1a1e" : "#ffffff";
        return calculatorRef.current.screenshot({ width, height, backgroundColor: bg });
    };

    const confirmExport = async () => {
        if (!containerRef.current) {
            toast.error("Graph not found");
            return;
        }

        const filename = generateFilename("desmos-3d-graph");
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
                const rect = containerRef.current?.getBoundingClientRect();
                const width = Math.max(1, Math.floor(rect?.width || 800));
                const height = Math.max(1, Math.floor(rect?.height || 600));
                const bg = exportTheme === "dark" ? "#1a1a1e" : "#ffffff";

                const rawSvg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="${bg}" />
  <image href="${dataUrl}" width="${width}" height="${height}" />
</svg>`;

                const currentExpressions = liveExpressions;
                const xmlDocument = wrapSvgWithXmlMetadata(rawSvg, {
                    title: 'Desmos 3D Graph Export',
                    chartType: 'mathematical-curve-3d',
                    description: `Desmos 3D graph with ${currentExpressions.length} expression(s): ${currentExpressions.slice(0, 3).join(', ')}${currentExpressions.length > 3 ? '...' : ''}`,
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

            logExport({
                title: 'Desmos 3D Graph Export',
                metadata: {
                    expressionCount: liveExpressions.length,
                    format: exportFormat,
                    theme: exportTheme,
                }
            });
        } catch (err) {
            console.error("Export failed", err);
            toast.error("Failed to export graph.");
        } finally {
            setShowExportDialog(false);
        }
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
        setImportCode('');
        setShowImportModal(false);
        toast.success(`Imported ${added.length} expression(s)`);
    };

    return (
        <div className="space-y-4">
            <div className="bg-muted/50 border rounded-lg p-3">
                <p className="text-sm text-muted-foreground">
                    <strong className="text-foreground">🌐 Interactive 3D Math Graphing:</strong> Enter 3D LaTeX equations (e.g., z=x^2+y^2, x^2+y^2+z^2=25) or use presets. Left click and drag to rotate, right click and drag to pan, scroll to zoom.
                </p>
            </div>

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
                    <Button onClick={() => setShowImportModal(true)} variant="outline" size="sm" className="gap-2" title="Import LaTeX expressions from text">
                        <Upload className="h-4 w-4" />
                        Import
                    </Button>

                    {/* Presets Dropdown */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="gap-2" title="Quick-load common 3D mathematical functions">
                                <ChevronDown className="h-4 w-4" />
                                Presets
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-[320px] max-h-[300px] overflow-y-auto">
                            {PRESET_3D_EXPRESSIONS.map((preset) => (
                                <DropdownMenuItem
                                    key={preset.label}
                                    onSelect={() => addPreset(preset.latex)}
                                    className="flex justify-between items-center gap-3 py-1.5 px-2.5 cursor-pointer"
                                >
                                    <span className="font-medium text-xs text-foreground shrink-0">{preset.label}</span>
                                    <code className="text-[10px] text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded truncate max-w-[180px]" title={preset.latex}>
                                        {preset.latex}
                                    </code>
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Code Export — registers is3d: true in curveData */}
                    <ExportCodeButton
                        chartType="curve"
                        curveData={{ expressions: liveExpressions, is3d: true }}
                        chartTitle="Mathematical 3D Curve Plot"
                        buttonText="Code"
                        buttonSize="sm"
                        buttonVariant="outline"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
                <div className="relative border rounded-lg overflow-hidden bg-card">
                    {isLoading && (
                        <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-10">
                            <div className="text-center space-y-2">
                                <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
                                <p className="text-sm text-muted-foreground">Loading 3D graph...</p>
                            </div>
                        </div>
                    )}
                    {loadError && (
                        <div className="absolute inset-0 bg-background/80 flex items-center justify-center z-30 backdrop-blur-sm">
                            <div className="text-center space-y-3 max-w-sm">
                                <p className="text-sm font-semibold text-destructive">Failed to load 3D graph</p>
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
                        id="graph-container-3d"
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
                <AlertDialogContent className="max-w-md">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Import LaTeX Expressions</AlertDialogTitle>
                        <AlertDialogDescription>
                            Paste newline-separated LaTeX expressions (e.g. z=x^2+y^2).
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="py-2">
                        <textarea
                            className="w-full h-40 p-2.5 text-xs font-mono border rounded-md focus:ring-1 focus:ring-primary focus:outline-none"
                            placeholder="z = x^2 + y^2&#10;z = \sin(x)\cos(y)"
                            value={importCode}
                            onChange={(e) => setImportCode(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2 justify-end">
                        <AlertDialogCancel onClick={() => setImportCode('')}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleImportCode} disabled={!importCode.trim()}>
                            Import
                        </AlertDialogAction>
                    </div>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default DesmosPlot3D;
