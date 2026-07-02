import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, FileImage, FileText, FileCode, Sun, Moon } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { exportChartAsPNG, exportChartAsPDF, exportChartAsSVG, generateFilename } from '@/lib/chartExport';

export const ChartExportButton = ({
    elementRef,
    filenamePrefix = 'chart',
    chartTitle = 'DataViz Export',
    chartType = 'chart',
    buttonText = 'Export',
    buttonSize = 'sm',
    buttonVariant = 'outline',
    buttonClassName = '',
    onExport = null,
}) => {
    const [showExportDialog, setShowExportDialog] = useState(false);
    const [exportFormat, setExportFormat] = useState('png');
    const [exportTheme, setExportTheme] = useState('light');
    const [isExporting, setIsExporting] = useState(false);

    const handleExportClick = () => {
        if (!elementRef || !elementRef.current) {
            toast.error("Chart container not found");
            return;
        }
        setShowExportDialog(true);
    };

    const confirmExport = async () => {
        if (!elementRef || !elementRef.current) {
            toast.error("Chart container not found");
            return;
        }

        setIsExporting(true);
        const filename = generateFilename(filenamePrefix);
        try {
            if (exportFormat === 'png') {
                await exportChartAsPNG(elementRef.current, filename, exportTheme);
            } else if (exportFormat === 'pdf') {
                await exportChartAsPDF(elementRef.current, filename, exportTheme);
            } else if (exportFormat === 'svg') {
                await exportChartAsSVG(elementRef.current, filename, exportTheme, {
                    title: chartTitle,
                    chartType: chartType,
                    description: `${chartTitle} exported from DataViz`,
                });
            }
            toast.success(`Chart exported as ${exportFormat.toUpperCase()} (${exportTheme} mode)`);
            if (onExport) {
                onExport({ format: exportFormat, theme: exportTheme, filename });
            }
        } catch (err) {
            console.error("Chart export failed:", err);
            toast.error("Failed to export chart. Try again.");
        } finally {
            setIsExporting(false);
            setShowExportDialog(false);
        }
    };

    return (
        <>
            <Button
                onClick={handleExportClick}
                size={buttonSize}
                variant={buttonVariant}
                className={cn("gap-2", buttonClassName)}
                disabled={isExporting}
            >
                <Download className="h-4 w-4" />
                <span>{buttonText}</span>
            </Button>

            <AlertDialog open={showExportDialog} onOpenChange={setShowExportDialog}>
                <AlertDialogContent className="max-w-md">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Export Visualization</AlertDialogTitle>
                        <AlertDialogDescription>
                            Configure the theme and format for your export.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="space-y-4 py-2">
                        {/* Format Selection */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Format</label>
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
        </>
    );
};

export default ChartExportButton;
