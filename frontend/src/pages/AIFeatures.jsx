import { useState, useCallback, useRef, useEffect } from "react";
import AppLayout from "@/components/AppLayout";
import { Skeleton } from "@/components/ui/skeleton";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { dataAPI, AITimeoutError } from "@/lib/api";
import { toast } from "sonner";
import {
    Upload, FileText, Sparkles, TrendingUp, AlertCircle,
    RefreshCcw, Download, FileImage, Save, ArrowRight,
} from "lucide-react";
import {
    BarChart, Bar, LineChart, Line, ScatterChart, Scatter, PieChart, Pie,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell
} from "recharts";
import { exportChartAsPNG, exportChartAsPDF, generateFilename } from "@/lib/chartExport";
import { motion } from "framer-motion";

const COLORS = ['#0F172A', '#D4AF37', '#0D1117', '#6B6B6B', '#0B1120', '#A8893A'];

const EXAMPLE_QUERIES = [
    "Show sales by month as a line chart",
    "Compare revenue and expenses as a bar chart",
    "Display product distribution as a pie chart",
    "Plot price vs quantity as a scatter chart"
];

const fadeUp = {
    hidden: { opacity: 0, y: 24 },
    visible: (i = 0) => ({
        opacity: 1,
        y: 0,
        transition: { delay: i * 0.09, duration: 0.65, ease: [0.25, 0.46, 0.45, 0.94] },
    }),
};

/* ── Luxury Section Header ── */
function SectionDivider({ label }) {
    return (
        <div className="flex items-center gap-3 mb-4">
            <p className="text-[#0F172A]" style={{ fontSize: "0.6rem", letterSpacing: "0.25em", textTransform: "uppercase" }}>
                {label}
            </p>
            <div className="flex-1 h-px bg-[#E8E4DC]" />
        </div>
    );
}

const AIFeatures = () => {
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [visualizationId, setVisualizationId] = useState(null);
    const [metadata, setMetadata] = useState(null);
    const [cleaningAnalysis, setCleaningAnalysis] = useState(null);
    const [query, setQuery] = useState("");
    const [querying, setQuerying] = useState(false);
    const [chartConfig, setChartConfig] = useState(null);
    const [chartData, setChartData] = useState([]);
    const [dragActive, setDragActive] = useState(false);
    const chartRef = useRef(null);
    const [exporting, setExporting] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const loadDraft = async () => {
            try {
                const { visualization } = await dataAPI.getLatestVisualization();
                if (visualization) {
                    setVisualizationId(visualization.id);
                    setMetadata(visualization.data_schema);
                    setCleaningAnalysis(visualization.cleaning_analysis);
                    setChartConfig(visualization.chart_config);
                    setChartData(visualization.data);
                    if (visualization.chart_config?.title) {
                        toast.info("Resumed previous analysis session");
                    }
                }
            } catch (error) {
                console.error("Failed to auto-resume:", error);
            }
        };
        loadDraft();
    }, []);

    const handleSaveToHistory = async () => {
        if (!visualizationId) return;
        setSaving(true);
        try {
            await dataAPI.saveVisualizationToHistory(visualizationId, chartConfig?.title || "AI Generated Analysis");
            toast.success("Analysis saved to Dashboard History");
        } catch {
            toast.error("Failed to save to history");
        } finally {
            setSaving(false);
        }
    };

    const handleExportPNG = async () => {
        if (!chartRef.current) return;
        setExporting(true);
        try {
            const filename = chartConfig?.title
                ? generateFilename(chartConfig.title.toLowerCase().replace(/\s+/g, '-'))
                : generateFilename('ai-chart');
            await exportChartAsPNG(chartRef.current, filename);
        } finally { setExporting(false); }
    };

    const handleExportPDF = async () => {
        if (!chartRef.current) return;
        setExporting(true);
        try {
            const filename = chartConfig?.title
                ? generateFilename(chartConfig.title.toLowerCase().replace(/\s+/g, '-'))
                : generateFilename('ai-chart');
            await exportChartAsPDF(chartRef.current, filename);
        } finally { setExporting(false); }
    };

    const handleDrag = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
        else if (e.type === "dragleave") setDragActive(false);
    }, []);

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const droppedFile = e.dataTransfer.files[0];
            if (droppedFile.name.endsWith('.csv')) setFile(droppedFile);
            else toast.error("Please upload a CSV file");
        }
    }, []);

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) setFile(e.target.files[0]);
    };

    const handleUpload = async () => {
        if (!file) return;
        setUploading(true);
        try {
            const result = await dataAPI.uploadCSV(file);
            setVisualizationId(result.visualization_id);
            setMetadata(result.metadata);
            setCleaningAnalysis(result.cleaning_analysis);
            toast.success("CSV uploaded and analyzed successfully!");
        } catch (error) {
            if (error instanceof AITimeoutError) toast.error("AI analysis timed out. Please try again.");
            else toast.error(error instanceof Error ? error.message : "Upload failed");
        } finally { setUploading(false); }
    };

    const handleQuery = async () => {
        if (!visualizationId || !query.trim()) return;
        setQuerying(true);
        try {
            const result = await dataAPI.queryAI(visualizationId, query);
            setChartConfig(result.chart_config);
            setChartData(result.chart_data);
            toast.success("Chart generated successfully!");
        } catch (error) {
            if (error instanceof AITimeoutError) toast.error("AI query timed out. Please try again.");
            else toast.error(error instanceof Error ? error.message : "Query failed");
        } finally { setQuerying(false); }
    };

    const renderChart = () => {
        if (!chartConfig || !chartData.length) return null;
        const { chartType, xAxisKey, dataKeys } = chartConfig;
        const commonProps = { data: chartData, margin: { top: 20, right: 30, left: 20, bottom: 20 } };

        switch (chartType) {
            case 'bar':
                return (
                    <ResponsiveContainer width="100%" height={400}>
                        <BarChart {...commonProps}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#E8E4DC" />
                            <XAxis dataKey={xAxisKey} tick={{ fill: '#6B6B6B', fontSize: 12 }} />
                            <YAxis tick={{ fill: '#6B6B6B', fontSize: 12 }} />
                            <Tooltip />
                            <Legend />
                            {dataKeys.map((key, idx) => (
                                <Bar key={key} dataKey={key} fill={COLORS[idx % COLORS.length]} />
                            ))}
                        </BarChart>
                    </ResponsiveContainer>
                );
            case 'line':
                return (
                    <ResponsiveContainer width="100%" height={400}>
                        <LineChart {...commonProps}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#E8E4DC" />
                            <XAxis dataKey={xAxisKey} tick={{ fill: '#6B6B6B', fontSize: 12 }} />
                            <YAxis tick={{ fill: '#6B6B6B', fontSize: 12 }} />
                            <Tooltip />
                            <Legend />
                            {dataKeys.map((key, idx) => (
                                <Line key={key} type="monotone" dataKey={key} stroke={COLORS[idx % COLORS.length]} strokeWidth={2} />
                            ))}
                        </LineChart>
                    </ResponsiveContainer>
                );
            case 'scatter':
                return (
                    <ResponsiveContainer width="100%" height={400}>
                        <ScatterChart {...commonProps}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#E8E4DC" />
                            <XAxis dataKey={xAxisKey} tick={{ fill: '#6B6B6B', fontSize: 12 }} />
                            <YAxis dataKey={dataKeys[0]} tick={{ fill: '#6B6B6B', fontSize: 12 }} />
                            <Tooltip />
                            <Legend />
                            <Scatter name={dataKeys[0]} data={chartData} fill={COLORS[0]} />
                        </ScatterChart>
                    </ResponsiveContainer>
                );
            case 'pie':
                return (
                    <ResponsiveContainer width="100%" height={400}>
                        <PieChart>
                            <Pie data={chartData} dataKey={dataKeys[0]} nameKey={xAxisKey} cx="50%" cy="50%" outerRadius={120} label>
                                {chartData.map((_entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                );
            default:
                return null;
        }
    };

    return (
        <AppLayout>
            <div className="space-y-8" style={{ fontFamily: "'Raleway', sans-serif" }}>

                {/* ── CSV Upload ── */}
                <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}>
                    <SectionDivider label="Upload Data" />
                    <div className="bg-white border border-[#E8E4DC] luxury-card-hover">
                        <div className="h-0.5 w-full bg-[#0F172A]" />
                        <div className="p-7">
                            <div className="flex items-start justify-between mb-5">
                                <div className="w-11 h-11 flex items-center justify-center border border-[#0F172A]/30 bg-[#0F172A]/5">
                                    <Upload className="h-5 w-5 text-[#0F172A]" />
                                </div>
                                <span
                                    className="font-bold opacity-10"
                                    style={{ fontFamily: "'Playfair Display', serif", fontSize: "3rem", lineHeight: 1, color: "#0F172A" }}
                                >
                                    01
                                </span>
                            </div>
                            <h3 className="text-lg font-bold text-[#0D1117] mb-1" style={{ fontFamily: "'Playfair Display', serif" }}>
                                Upload CSV File
                            </h3>
                            <p className="text-xs text-[#6B6B6B] mb-5" style={{ letterSpacing: "0.05em" }}>
                                Drag & drop or click to browse — Max 10MB, CSV format only
                            </p>

                            {/* Drop zone */}
                            <div
                                className={`border-2 border-dashed p-10 text-center transition-all duration-300 mb-4 ${
                                    dragActive ? "border-[#0F172A] bg-[#0F172A]/5" : "border-[#E8E4DC]"
                                }`}
                                onDragEnter={handleDrag}
                                onDragLeave={handleDrag}
                                onDragOver={handleDrag}
                                onDrop={handleDrop}
                            >
                                <FileText className="h-10 w-10 mx-auto text-[#D4AF37]/50 mb-3" />
                                <p className="text-sm text-[#6B6B6B] mb-3">
                                    Drag and drop your CSV file here, or click to browse
                                </p>
                                <label className="cursor-pointer">
                                    <span className="luxury-link text-xs text-[#0F172A] uppercase tracking-widest">
                                        Browse Files <span className="ml-1 text-base">›</span>
                                    </span>
                                    <input type="file" accept=".csv" onChange={handleFileChange} className="hidden" />
                                </label>
                                {file && (
                                    <p className="text-sm font-semibold mt-3 text-[#0F172A]" style={{ fontFamily: "'Playfair Display', serif" }}>
                                        {file.name}
                                    </p>
                                )}
                            </div>

                            <button
                                onClick={handleUpload}
                                disabled={!file || uploading}
                                className="w-full py-3 bg-[#0F172A] text-white disabled:opacity-50 flex items-center justify-center gap-2 transition-colors duration-300 hover:bg-[#0B1120] disabled:cursor-not-allowed"
                                style={{ fontSize: "0.7rem", letterSpacing: "0.15em", textTransform: "uppercase", fontWeight: 600 }}
                            >
                                {uploading ? (
                                    <>
                                        <RefreshCcw className="h-3.5 w-3.5 animate-spin" />
                                        Analyzing with AI...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="h-3.5 w-3.5" />
                                        Upload & Analyze with AI
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </motion.div>

                {/* ── Data Quality Insights ── */}
                {cleaningAnalysis && (
                    <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={1}>
                        <SectionDivider label="Data Quality" />
                        <div className="bg-white border border-[#E8E4DC] luxury-card-hover">
                            <div className="h-0.5 w-full bg-[#D4AF37]" />
                            <div className="p-7">
                                <div className="flex items-start justify-between mb-5">
                                    <div className="w-11 h-11 flex items-center justify-center border border-[#D4AF37]/30 bg-[#D4AF37]/5">
                                        <TrendingUp className="h-5 w-5 text-[#D4AF37]" />
                                    </div>
                                </div>
                                <h3 className="text-lg font-bold text-[#0D1117] mb-1" style={{ fontFamily: "'Playfair Display', serif" }}>
                                    Data Quality Insights
                                </h3>
                                <p className="text-sm text-[#6B6B6B] mb-5">{cleaningAnalysis.summary}</p>

                                {/* Stats grid */}
                                {metadata && (
                                    <div className="grid grid-cols-3 gap-3 mb-5">
                                        {[
                                            { label: "Rows", value: metadata.row_count },
                                            { label: "Columns", value: metadata.columns.length },
                                            { label: "Data Types", value: Object.keys(metadata.dtypes).length },
                                        ].map((stat) => (
                                            <div key={stat.label} className="border border-[#E8E4DC] p-4">
                                                <p className="text-[#6B6B6B] mb-1" style={{ fontSize: "0.6rem", letterSpacing: "0.2em", textTransform: "uppercase" }}>
                                                    {stat.label}
                                                </p>
                                                <p className="text-3xl font-bold text-[#0D1117]" style={{ fontFamily: "'Playfair Display', serif" }}>
                                                    {stat.value}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {cleaningAnalysis.issues.length > 0 && (
                                    <div className="mb-4">
                                        <p className="font-semibold text-[#0D1117] mb-2 text-sm" style={{ fontFamily: "'Playfair Display', serif" }}>
                                            Issues Detected
                                        </p>
                                        <ul className="space-y-1.5">
                                            {cleaningAnalysis.issues.map((issue, idx) => (
                                                <li key={idx} className="flex items-start gap-2 text-sm text-[#6B6B6B]">
                                                    <AlertCircle className="h-3.5 w-3.5 text-[#D4AF37] flex-shrink-0 mt-0.5" />
                                                    {issue}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {cleaningAnalysis.suggested_actions.length > 0 && (
                                    <div>
                                        <p className="font-semibold text-[#0D1117] mb-2 text-sm" style={{ fontFamily: "'Playfair Display', serif" }}>
                                            Suggested Actions
                                        </p>
                                        <ul className="space-y-1.5">
                                            {cleaningAnalysis.suggested_actions.map((action, idx) => (
                                                <li key={idx} className="flex items-start gap-2 text-sm text-[#6B6B6B]">
                                                    <ArrowRight className="h-3.5 w-3.5 text-[#0F172A] flex-shrink-0 mt-0.5" />
                                                    {action}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* ── Natural Language Query ── */}
                {visualizationId && (
                    <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={2}>
                        <SectionDivider label="Generate Chart" />
                        <div className="bg-white border border-[#E8E4DC] luxury-card-hover">
                            <div className="h-0.5 w-full bg-[#0D1117]" />
                            <div className="p-7">
                                <div className="flex items-start justify-between mb-5">
                                    <div className="w-11 h-11 flex items-center justify-center border border-[#0D1117]/20 bg-[#0D1117]/5">
                                        <Sparkles className="h-5 w-5 text-[#0D1117]" />
                                    </div>
                                </div>
                                <h3 className="text-lg font-bold text-[#0D1117] mb-1" style={{ fontFamily: "'Playfair Display', serif" }}>
                                    Generate Chart with AI
                                </h3>
                                <p className="text-xs text-[#6B6B6B] mb-5" style={{ letterSpacing: "0.05em" }}>
                                    Describe the chart you want in natural language
                                </p>

                                <div className="flex gap-2 mb-4">
                                    <input
                                        type="text"
                                        placeholder="Describe the chart you want to create..."
                                        value={query}
                                        onChange={(e) => setQuery(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleQuery()}
                                        className="flex-1 h-11 px-4 border border-[#E8E4DC] text-[#0D1117] text-sm focus:outline-none focus:border-[#0F172A] transition-colors rounded-none"
                                        style={{ fontFamily: "'Raleway', sans-serif", background: "#FAFAF7" }}
                                    />
                                    <button
                                        onClick={handleQuery}
                                        disabled={!query.trim() || querying}
                                        className="px-6 bg-[#0F172A] text-white disabled:opacity-50 transition-colors hover:bg-[#0B1120] disabled:cursor-not-allowed"
                                        style={{ fontSize: "0.7rem", letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600 }}
                                    >
                                        {querying ? "Generating..." : "Generate"}
                                    </button>
                                </div>

                                <div>
                                    <p className="text-[#6B6B6B] mb-2" style={{ fontSize: "0.6rem", letterSpacing: "0.2em", textTransform: "uppercase" }}>
                                        Try these examples
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        {EXAMPLE_QUERIES.map((example, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => setQuery(example)}
                                                className="px-3 py-1.5 border border-[#E8E4DC] text-xs text-[#6B6B6B] hover:border-[#0F172A] hover:text-[#0F172A] transition-all duration-200"
                                                style={{ letterSpacing: "0.05em" }}
                                            >
                                                {example}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* ── Chart Display ── */}
                {chartConfig && (
                    <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={3}>
                        <SectionDivider label="Visualization" />
                        <div ref={chartRef} className="bg-white border border-[#E8E4DC] luxury-card-hover">
                            <div className="h-0.5 w-full bg-[#D4AF37]" />
                            <div className="p-7">
                                {/* Header row */}
                                <div className="flex items-start justify-between mb-6">
                                    <div>
                                        <h3 className="text-lg font-bold text-[#0D1117] mb-1" style={{ fontFamily: "'Playfair Display', serif" }}>
                                            {chartConfig.title}
                                        </h3>
                                        <p className="text-sm text-[#6B6B6B]">{chartConfig.summary}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={handleSaveToHistory}
                                            disabled={saving}
                                            className="flex items-center gap-1.5 border border-[#E8E4DC] text-[#6B6B6B] px-4 py-2 hover:border-[#0F172A] hover:text-[#0F172A] transition-all duration-200 disabled:opacity-50"
                                            style={{ fontSize: "0.65rem", letterSpacing: "0.1em", textTransform: "uppercase" }}
                                        >
                                            <Save className="h-3.5 w-3.5" />
                                            {saving ? "Saving..." : "Save"}
                                        </button>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <button
                                                    disabled={exporting}
                                                    className="flex items-center gap-1.5 border border-[#E8E4DC] text-[#6B6B6B] px-4 py-2 hover:border-[#0F172A] hover:text-[#0F172A] transition-all duration-200 disabled:opacity-50"
                                                    style={{ fontSize: "0.65rem", letterSpacing: "0.1em", textTransform: "uppercase" }}
                                                >
                                                    <Download className="h-3.5 w-3.5" />
                                                    {exporting ? 'Exporting...' : 'Export'}
                                                </button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="rounded-none border-[#E8E4DC]">
                                                <DropdownMenuItem onClick={handleExportPNG} className="text-sm">
                                                    <FileImage className="h-4 w-4 mr-2 text-[#0F172A]" />
                                                    Download as PNG
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={handleExportPDF} className="text-sm">
                                                    <FileText className="h-4 w-4 mr-2 text-[#0F172A]" />
                                                    Download as PDF
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>

                                {/* Chart */}
                                {querying ? (
                                    <Skeleton className="h-[400px] w-full" />
                                ) : (
                                    renderChart()
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </div>
        </AppLayout>
    );
};

export default AIFeatures;
