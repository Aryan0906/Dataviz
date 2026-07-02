import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import { Download, RefreshCw, ChevronDown, Save, Upload } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { usePageSession, useHistoryLogger } from "@/hooks/usePageSession";
import ExportCodeButton from "./ExportCodeButton";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { loadCdnGraph, loadLocalGraph } from "./DesmosPlot";

const PRESET_3D_EXPRESSIONS = [
    { label: "Paraboloid", latex: "z = x^2 + y^2" },
    { label: "Saddle", latex: "z = x^2 - y^2" },
    { label: "Sphere", latex: "x^2 + y^2 + z^2 = 25" },
    { label: "Sine Wave", latex: "z = \\sin(x) \\cdot \\cos(y)" },
    { label: "Cone", latex: "z^2 = x^2 + y^2" },
    { label: "Ripple", latex: "z = \\sin(x^2 + y^2)" },
    { label: "Hyperboloid", latex: "x^2 + y^2 - z^2 = 1" },
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
                if (!Desmos) {
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

    // Exports screenshot
    const handleScreenshotExport = () => {
        if (!calculatorRef.current) return;
        try {
            const dataUrl = calculatorRef.current.screenshot({
                width: 1200,
                height: 800,
                targetPixelRatio: 2,
            });
            
            const link = document.createElement("a");
            link.download = `desmos-3d-graph-${Date.now()}.png`;
            link.href = dataUrl;
            link.click();
            toast.success("Screenshot downloaded!");
            logExport("3D Chart Screenshot", dataUrl);
        } catch (err) {
            console.error("Screenshot failed", err);
            toast.error("Failed to export image.");
        }
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
                        onClick={handleScreenshotExport}
                        size="sm"
                        className="gap-2 bg-slate-500 text-white hover:bg-emerald-600"
                        title="Export 3D graph as image"
                    >
                        <Download className="h-4 w-4" />
                        Export Image
                    </Button>
                    <Button onClick={clearAll} variant="outline" size="sm" className="gap-2" title="Clear all expressions">
                        <RefreshCw className="h-4 w-4" />
                        Clear
                    </Button>

                    {/* Presets Dropdown */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="gap-2" title="Quick-load common 3D mathematical functions">
                                <ChevronDown className="h-4 w-4" />
                                Presets
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-48">
                            {PRESET_3D_EXPRESSIONS.map((preset) => (
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
        </div>
    );
};

export default DesmosPlot3D;
