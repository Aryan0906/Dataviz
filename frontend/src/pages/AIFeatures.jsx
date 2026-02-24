import { useState, useCallback, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { dataAPI, AITimeoutError } from "@/lib/api";
import { toast } from "sonner";
import { Send, Upload, Sparkles, MessageSquare, Plus, FileText, LayoutDashboard, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import {
    BarChart, Bar, LineChart, Line, ScatterChart, Scatter, PieChart, Pie,
    XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, Cell
} from "recharts";
import { useTheme } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";

const THEMES = {
    dark: { // Midnight & Champagne
        bgMain: "bg-[#0F172A]",
        bgSidebar: "bg-[#1E293B]",
        textPrimary: "text-[#F8F9FA]",
        textSecondary: "text-slate-400",
        textMuted: "text-slate-500",
        accent: "text-[#D4AF37]",
        bgAccent: "bg-[#D4AF37]",
        textAccent: "text-[#0F172A]",
        borderAccent: "border-[#D4AF37]",
        borderMuted: "border-slate-700",
        bgInput: "bg-[#1E293B]",
        borderInput: "border-slate-600",
        focusInput: "focus-within:border-[#D4AF37]",
        buttonDisabled: "bg-slate-700 text-slate-400",
        chartColors: ['#D4AF37', '#F8F9FA', '#94A3B8', '#475569', '#CBD5E1'],
        tooltipStyle: { backgroundColor: '#1E293B', border: '1px solid #D4AF37', color: '#F8F9FA' },
        axisStroke: "#94A3B8",
        gridStroke: "#334155",
        userMsgBg: "bg-slate-700 text-white shadow-sm",
        userIconBg: "bg-slate-600 border border-slate-500 text-white",
        cardBg: "bg-[#0F172A]/50",
        dropzoneBg: "bg-slate-800/50 hover:bg-slate-800",
        gradientOverlay: "from-[#D4AF37]/50 to-slate-600/50",
        gradientMask: "from-[#0F172A] via-[#0F172A]",
        botIconColor: "text-[#0F172A]",
        sidebarHeaderBorder: "border-slate-700/50",
        sidebarDivider: "border-slate-700/50",
        schemaBg: "bg-[#0F172A]/30",
        headerBg: "bg-[#1E293B]",
        toastStyle: { background: '#1E293B', color: '#D4AF37', border: '1px solid #D4AF37' }
    },
    light: { // Ethereal Minimalist
        bgMain: "bg-[#F8F9FA]",
        bgSidebar: "bg-white",
        textPrimary: "text-[#1A1A1A]",
        textSecondary: "text-slate-500",
        textMuted: "text-slate-400",
        accent: "text-[#1A1A1A]",
        bgAccent: "bg-[#1A1A1A]",
        textAccent: "text-white",
        borderAccent: "border-[#1A1A1A]",
        borderMuted: "border-slate-200",
        bgInput: "bg-white",
        borderInput: "border-slate-300",
        focusInput: "focus-within:border-[#1A1A1A]",
        buttonDisabled: "bg-slate-100 text-slate-400",
        chartColors: ['#1A1A1A', '#475569', '#94A3B8', '#CBD5E1', '#F8F9FA'],
        tooltipStyle: { backgroundColor: '#FFFFFF', border: '1px solid #1A1A1A', color: '#1A1A1A' },
        axisStroke: "#64748B",
        gridStroke: "#E2E8F0",
        userMsgBg: "bg-slate-100 text-[#1A1A1A] border border-slate-200",
        userIconBg: "bg-slate-200 border border-slate-300 text-[#1A1A1A]",
        cardBg: "bg-white border border-slate-200 shadow-sm",
        dropzoneBg: "bg-slate-50 hover:bg-slate-100",
        gradientOverlay: "from-[#1A1A1A]/10 to-transparent",
        gradientMask: "from-[#F8F9FA] via-[#F8F9FA]",
        botIconColor: "text-white",
        sidebarHeaderBorder: "border-slate-200",
        sidebarDivider: "border-slate-200",
        schemaBg: "bg-slate-50",
        headerBg: "bg-white border-b border-slate-200",
        toastStyle: { background: '#FFFFFF', color: '#1A1A1A', border: '1px solid #1A1A1A' }
    }
};

const AIFeatures = () => {
    const { theme } = useTheme();
    const isDark = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    const activeTheme = isDark ? THEMES.dark : THEMES.light;

    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [visualizationId, setVisualizationId] = useState(null);
    const [metadata, setMetadata] = useState(null);
    const [query, setQuery] = useState("");
    const [querying, setQuerying] = useState(false);

    // Chat history state
    const [messages, setMessages] = useState([
        { role: 'assistant', content: 'Welcome to the AI Analytics Dashboard. Please upload a dataset to begin discovering insights.' }
    ]);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Auto-resume functionality
    useEffect(() => {
        const loadDraft = async () => {
            try {
                const { visualization } = await dataAPI.getLatestVisualization();
                if (visualization) {
                    setVisualizationId(visualization.id);
                    setMetadata(visualization.data_schema);
                    if (visualization.chart_config) {
                        setMessages(prev => [
                            ...prev,
                            { role: 'assistant', content: 'I have restored your previous session.' },
                            { role: 'assistant', chartConfig: visualization.chart_config, chartData: visualization.data, isChart: true }
                        ]);
                    }
                    toast.success("Resumed previous analysis session", {
                        style: activeTheme.toastStyle
                    });
                }
            } catch (error) {
                console.error("Failed to auto-resume:", error);
            }
        };
        loadDraft();
    }, [activeTheme.toastStyle]);

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            handleUpload(e.target.files[0]);
        }
    };

    const handleUpload = async (selectedFile) => {
        const fileToUpload = selectedFile || file;
        if (!fileToUpload) return;

        setUploading(true);
        const loadingId = Date.now();
        setMessages(prev => [...prev, { id: loadingId, role: 'user', content: `Uploaded file: ${fileToUpload.name}` }]);

        try {
            const result = await dataAPI.uploadCSV(fileToUpload);
            setVisualizationId(result.visualization_id);
            setMetadata(result.metadata);

            setMessages(prev => [
                ...prev,
                { role: 'assistant', content: `Successfully analyzed ${fileToUpload.name}. I found ${result.metadata.row_count} rows. What would you like to know about this data? You can ask me to plot trends, compare categories, or summarize distributions.` }
            ]);

        } catch (error) {
            setMessages(prev => [...prev, { role: 'assistant', content: `Error uploading file: ${error.message}` }]);
        } finally {
            setUploading(false);
        }
    };

    const handleQuery = async (e) => {
        if (e) e.preventDefault();
        if (!visualizationId || !query.trim()) return;

        const currentQuery = query;
        setQuery("");
        setMessages(prev => [...prev, { role: 'user', content: currentQuery }]);
        setQuerying(true);

        try {
            const result = await dataAPI.queryAI(visualizationId, currentQuery);

            // Add explanation message if any
            if (result.chart_config?.summary) {
                setMessages(prev => [...prev, { role: 'assistant', content: result.chart_config.summary }]);
            }

            // Add chart component to chat
            setMessages(prev => [
                ...prev,
                {
                    role: 'assistant',
                    chartConfig: result.chart_config,
                    chartData: result.chart_data,
                    isChart: true
                }
            ]);

        } catch (error) {
            setMessages(prev => [...prev, { role: 'assistant', content: `Sorry, I couldn't generate that chart. Error: ${error.message}` }]);
        } finally {
            setQuerying(false);
        }
    };

    const renderChart = (chartConfig, chartData) => {
        if (!chartConfig || !chartData?.length) return null;

        const { chartType, xAxisKey, dataKeys } = chartConfig;
        const commonProps = { data: chartData, margin: { top: 20, right: 30, left: 20, bottom: 20 } };

        const cTheme = activeTheme;

        const renderInnerChart = () => {
            switch (chartType) {
                case 'bar':
                    return (
                        <BarChart {...commonProps}>
                            <CartesianGrid strokeDasharray="3 3" stroke={cTheme.gridStroke} />
                            <XAxis dataKey={xAxisKey} stroke={cTheme.axisStroke} />
                            <YAxis stroke={cTheme.axisStroke} />
                            <RechartsTooltip contentStyle={cTheme.tooltipStyle} />
                            <Legend wrapperStyle={{ color: isDark ? '#F8F9FA' : '#1A1A1A' }} />
                            {dataKeys.map((key, idx) => (
                                <Bar key={key} dataKey={key} fill={cTheme.chartColors[idx % cTheme.chartColors.length]} radius={[4, 4, 0, 0]} />
                            ))}
                        </BarChart>
                    );
                case 'line':
                    return (
                        <LineChart {...commonProps}>
                            <CartesianGrid strokeDasharray="3 3" stroke={cTheme.gridStroke} />
                            <XAxis dataKey={xAxisKey} stroke={cTheme.axisStroke} />
                            <YAxis stroke={cTheme.axisStroke} />
                            <RechartsTooltip contentStyle={cTheme.tooltipStyle} />
                            <Legend wrapperStyle={{ color: isDark ? '#F8F9FA' : '#1A1A1A' }} />
                            {dataKeys.map((key, idx) => (
                                <Line key={key} type="monotone" dataKey={key} stroke={cTheme.chartColors[idx % cTheme.chartColors.length]} strokeWidth={3} dot={{ fill: isDark ? '#1E293B' : '#FFFFFF', strokeWidth: 2 }} />
                            ))}
                        </LineChart>
                    );
                case 'scatter':
                    return (
                        <ScatterChart {...commonProps}>
                            <CartesianGrid strokeDasharray="3 3" stroke={cTheme.gridStroke} />
                            <XAxis dataKey={xAxisKey} stroke={cTheme.axisStroke} />
                            <YAxis dataKey={dataKeys[0]} stroke={cTheme.axisStroke} />
                            <RechartsTooltip contentStyle={cTheme.tooltipStyle} cursor={{ strokeDasharray: '3 3' }} />
                            <Legend wrapperStyle={{ color: isDark ? '#F8F9FA' : '#1A1A1A' }} />
                            <Scatter name={dataKeys[0]} data={chartData} fill={cTheme.chartColors[0]} />
                        </ScatterChart>
                    );
                case 'pie':
                    return (
                        <PieChart>
                            <Pie data={chartData} dataKey={dataKeys[0]} nameKey={xAxisKey} cx="50%" cy="50%" innerRadius={60} outerRadius={100} label={{ fill: isDark ? '#F8F9FA' : '#1A1A1A' }}>
                                {chartData.map((_entry, index) => (
                                    <Cell key={`cell-${index}`} fill={cTheme.chartColors[index % cTheme.chartColors.length]} stroke={isDark ? '#1E293B' : '#FFFFFF'} strokeWidth={2} />
                                ))}
                            </Pie>
                            <RechartsTooltip contentStyle={cTheme.tooltipStyle} />
                            <Legend wrapperStyle={{ color: isDark ? '#F8F9FA' : '#1A1A1A' }} />
                        </PieChart>
                    );
                default:
                    return <div className="text-center p-4">Unsupported chart type</div>;
            }
        };

        return (
            <div className={`mt-4 p-6 rounded-xl ${cTheme.cardBg} w-full`}>
                <h3 className={`text-lg font-medium mb-4 ${cTheme.textPrimary}`}>{chartConfig.title}</h3>
                <div className="h-[350px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        {renderInnerChart()}
                    </ResponsiveContainer>
                </div>
            </div>
        );
    };

    return (
        <div className={`flex h-screen w-full ${activeTheme.bgMain} ${activeTheme.textPrimary} font-sans overflow-hidden font-['Inter',sans-serif] transition-colors duration-500`}>
            {/* Sidebar */}
            <aside className={`w-72 flex flex-col border-r ${activeTheme.borderMuted} ${activeTheme.bgSidebar} transition-colors duration-500 hidden md:flex z-10`}>
                <div className={`p-4 flex items-center justify-between border-b ${activeTheme.sidebarHeaderBorder}`}>
                    <div className="flex items-center gap-2">
                        <Sparkles className={`w-6 h-6 ${activeTheme.accent}`} />
                        <span className="font-semibold text-lg tracking-wide uppercase text-sm">Aurora AI</span>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    <Button
                        onClick={() => {
                            setMessages([{ role: 'assistant', content: 'New session started. Please upload a dataset.' }]);
                            setVisualizationId(null);
                            setMetadata(null);
                        }}
                        className={`w-full justify-start gap-3 bg-transparent hover:bg-black/5 hover:dark:bg-white/5 border ${activeTheme.borderMuted} ${activeTheme.textPrimary} shadow-sm rounded-lg py-6`}
                    >
                        <Plus className="w-5 h-5" />
                        <span className="font-medium">New Analysis</span>
                    </Button>

                    <div className="pt-4">
                        <h4 className={`text-xs uppercase tracking-wider ${activeTheme.textSecondary} font-semibold mb-3 px-2`}>Data Source</h4>

                        <div className="relative">
                            <input
                                type="file"
                                accept=".csv"
                                onChange={handleFileChange}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                disabled={uploading}
                            />
                            <div className={`flex flex-col items-center justify-center p-6 border-2 border-dashed ${activeTheme.borderMuted} rounded-xl ${activeTheme.dropzoneBg} transition-colors group`}>
                                <FileText className={`w-8 h-8 mb-2 ${metadata ? 'text-green-500 dark:text-green-400' : `${activeTheme.textSecondary} group-hover:${activeTheme.textPrimary}`} transition-colors`} />
                                <span className={`text-sm text-center ${activeTheme.textSecondary} font-medium`}>
                                    {metadata ? 'Data Loaded Successfully' : (uploading ? 'Uploading...' : 'Upload CSV Dataset')}
                                </span>
                            </div>
                        </div>

                        {metadata && (
                            <div className={`mt-4 p-4 rounded-xl border ${activeTheme.borderMuted} ${activeTheme.schemaBg}`}>
                                <div className={`text-xs ${activeTheme.textMuted} uppercase tracking-widest mb-2 font-bold`}>Schema</div>
                                <div className="flex justify-between text-sm">
                                    <span className={activeTheme.textSecondary}>Rows:</span>
                                    <span className={`${activeTheme.accent} font-mono font-medium`}>{metadata.row_count}</span>
                                </div>
                                <div className="flex justify-between text-sm mt-1">
                                    <span className={activeTheme.textSecondary}>Columns:</span>
                                    <span className={`${activeTheme.accent} font-mono font-medium`}>{metadata.columns.length}</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className={`p-4 border-t ${activeTheme.sidebarDivider} flex gap-2 justify-between items-center`}>
                    <Link to="/dashboard" className="flex-1">
                        <Button variant="ghost" className={`w-full justify-start gap-3 ${activeTheme.textSecondary} hover:${activeTheme.textPrimary} hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg`}>
                            <ArrowLeft className="w-4 h-4" />
                            Dashboard
                        </Button>
                    </Link>
                    <ThemeToggle />
                </div>
            </aside>

            {/* Main Chat Area */}
            <main className="flex-1 flex flex-col relative transition-colors duration-500">
                {/* Mobile Header */}
                <header className={`md:hidden flex items-center justify-between p-4 border-b ${activeTheme.borderMuted} ${activeTheme.headerBg}`}>
                    <div className="flex items-center gap-2">
                        <Sparkles className={`w-5 h-5 ${activeTheme.accent}`} />
                        <span className="font-bold">Aurora AI</span>
                    </div>
                    <ThemeToggle />
                </header>

                {/* Chat History */}
                <div className="flex-1 overflow-y-auto w-full p-4 md:p-8 scroll-smooth pb-32">
                    <div className="max-w-4xl mx-auto space-y-8">
                        {messages.map((msg, index) => (
                            <div key={index} className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                                {msg.role === 'assistant' && (
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${activeTheme.bgAccent} ${isDark ? 'shadow-[0_0_15px_rgba(212,175,55,0.3)]' : 'shadow-md'}`}>
                                        <Sparkles className={`w-5 h-5 ${activeTheme.botIconColor}`} />
                                    </div>
                                )}

                                <div className={`max-w-[85%] ${msg.role === 'user' ? '' : 'w-full'}`}>
                                    {msg.content && (
                                        <div className={`px-5 py-3.5 inline-block ${msg.role === 'user'
                                                ? `${activeTheme.userMsgBg} rounded-2xl rounded-tr-sm`
                                                : `${activeTheme.textPrimary} leading-relaxed text-[15px]`
                                            }`}>
                                            {msg.content}
                                        </div>
                                    )}

                                    {msg.isChart && renderChart(msg.chartConfig, msg.chartData)}
                                </div>

                                {msg.role === 'user' && (
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${activeTheme.userIconBg}`}>
                                        <span className="text-xs font-bold">U</span>
                                    </div>
                                )}
                            </div>
                        ))}

                        {querying && (
                            <div className="flex gap-4 items-center animate-pulse">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${activeTheme.bgAccent} opacity-70`}>
                                    <Sparkles className={`w-5 h-5 ${activeTheme.botIconColor}`} />
                                </div>
                                <div className={`${activeTheme.textSecondary} text-sm`}>Analyzing data and crafting visualization...</div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                </div>

                {/* Input Area */}
                <div className={`p-4 md:p-6 bg-gradient-to-t ${activeTheme.gradientMask} to-transparent absolute bottom-0 w-full`}>
                    <div className="max-w-4xl mx-auto relative group">
                        <div className={`absolute -inset-0.5 bg-gradient-to-r ${activeTheme.gradientOverlay} rounded-2xl blur opacity-30 group-hover:opacity-60 transition duration-500`}></div>
                        <form onSubmit={handleQuery} className={`relative flex items-end gap-2 ${activeTheme.bgInput} border ${activeTheme.borderInput} ${activeTheme.focusInput} p-2 rounded-2xl shadow-xl transition-all duration-300`}>
                            <Input
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder={metadata ? "Ask for a chart, trend, or comparison..." : "Please upload a CSV file first..."}
                                disabled={!visualizationId || querying}
                                className={`border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 ${activeTheme.textPrimary} placeholder:${activeTheme.textMuted} min-h-[50px] text-base resize-none py-3`}
                                autoComplete="off"
                            />
                            <Button
                                type="submit"
                                disabled={!query.trim() || !visualizationId || querying}
                                className={`rounded-xl h-12 w-12 shrink-0 ${query.trim() && visualizationId ? `${activeTheme.bgAccent} ${activeTheme.textAccent} hover:opacity-80` : activeTheme.buttonDisabled} transition-all shadow-md flex items-center justify-center p-0`}
                            >
                                <Send className="w-5 h-5 ml-1" />
                            </Button>
                        </form>
                    </div>

                    <div className={`max-w-4xl mx-auto mt-3 text-center text-xs ${activeTheme.textSecondary}`}>
                        AI can make mistakes. Verify critical insights natively.
                    </div>
                </div>
            </main>
        </div>
    );
};

export default AIFeatures;
