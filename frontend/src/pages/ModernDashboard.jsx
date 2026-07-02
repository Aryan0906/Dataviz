import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
    Plus,
    Trash2,
    LineChart,
    Activity,
    TrendingUp,
    Upload,
    BarChart3,
    Zap,
    ArrowRight,
    Database,
    FileText,
    Brain,
    Play,
    FolderOpen,
    Star,
    History,
    Share2,
    Code
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

import AppLayout from "@/components/AppLayout";
import { DashboardTour } from "@/components/DashboardTour";
import { useAuth } from "@/context/AuthContext";
import { useWorkspace } from "@/context/WorkspaceContext";
import { dataAPI } from "@/lib/api";
import { getUserSessions, deletePageSession } from "@/lib/sessionManager";
import { analysisTemplates } from "@/lib/templates";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

/* ── Animation Variants ── */
const fadeUp = {
    hidden: { opacity: 0, y: 24 },
    visible: (i = 0) => ({
        opacity: 1,
        y: 0,
        transition: { delay: i * 0.08, duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] },
    }),
};

/* ── Luxury Stat Card ── */
function StatCard({ icon: Icon, label, value, loading, accent = false }) {
    return (
        <div className={`relative border p-5 transition-all duration-300 hover:-translate-y-0.5 ${accent
            ? "bg-[#D4AF37]/10 border-[#D4AF37]/30"
            : "bg-white/10 border-white/15"
            }`}>
            <div className="flex items-center gap-2 mb-3">
                <Icon className={`h-4 w-4 ${accent ? "text-[#D4AF37]" : "text-white/60"}`} />
                <span
                    className={`text-xs uppercase tracking-widest ${accent ? "text-[#D4AF37]/80" : "text-white/50"}`}
                    style={{ fontFamily: "'Raleway', sans-serif", fontSize: "0.6rem", letterSpacing: "0.2em" }}
                >
                    {label}
                </span>
            </div>
            <p
                className={`text-4xl font-bold ${accent ? "text-[#D4AF37]" : "text-white"}`}
                style={{ fontFamily: "'Playfair Display', serif" }}
            >
                {loading ? "—" : value}
            </p>
        </div>
    );
}

/* ── Feature Card ── */
const featureColors = [
    { bg: "bg-[#0F172A]", accent: "bg-[#0B1120]", icon: "text-[#D4AF37]" },
    { bg: "bg-[#0D1117]", accent: "bg-[#1A1A1A]", icon: "text-[#D4AF37]" },
    { bg: "bg-[#0B1120]", accent: "bg-[#0F172A]", icon: "text-white/80" },
    { bg: "bg-[#1A1A1A]", accent: "bg-[#0D1117]", icon: "text-[#D4AF37]" },
    { bg: "bg-[#D4AF37]", accent: "bg-[#A8893A]", icon: "text-[#0D1117]" },
    { bg: "bg-[#6B6B6B]", accent: "bg-[#4A4A4A]", icon: "text-white" },
];

function FeatureCard({ title, description, icon: Icon, href, badge, index }) {
    const colors = featureColors[index % featureColors.length];
    return (
        <motion.div variants={fadeUp} custom={index}>
            <Link to={href} className="block group">
                <div className="bg-card border border-luxury-silk luxury-card-hover h-full">
                    {/* Colored top accent bar */}
                    <div className={`h-1 w-full ${colors.bg}`} />
                    <div className="p-7">
                        <div className="flex items-start justify-between mb-5">
                            <div className={`inline-flex p-3 ${colors.bg} group-hover:scale-105 transition-transform duration-300`}>
                                <Icon className={`h-6 w-6 ${colors.icon}`} />
                            </div>
                            {badge && (
                                <span
                                    className="bg-[#D4AF37] text-[#0D1117] px-2 py-0.5 text-[10px] font-semibold"
                                    style={{ letterSpacing: "0.1em", textTransform: "uppercase" }}
                                >
                                    {badge}
                                </span>
                            )}
                        </div>
                        <h3
                            className="text-lg font-semibold text-[#0D1117] mb-2 group-hover:text-[#0F172A] transition-colors duration-300"
                            style={{ fontFamily: "'Playfair Display', serif" }}
                        >
                            {title}
                        </h3>
                        <p className="text-sm text-[#6B6B6B] leading-relaxed mb-4" style={{ fontFamily: "'Raleway', sans-serif" }}>
                            {description}
                        </p>
                        <span className="luxury-link text-xs text-[#0F172A] font-medium uppercase tracking-wider">
                            Explore <span className="ml-1">›</span>
                        </span>
                    </div>
                </div>
            </Link>
        </motion.div>
    );
}

/* ── Quick Action Card ── */
function QuickActionCard({ title, description, icon: Icon, action, index }) {
    return (
        <motion.div variants={fadeUp} custom={index}>
            <div
                className="bg-card border border-luxury-silk p-5 cursor-pointer group luxury-card-hover"
                onClick={action}
            >
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 border border-[#0F172A]/20 bg-[#0F172A]/5 flex items-center justify-center group-hover:bg-[#0F172A] group-hover:border-[#0F172A] transition-all duration-300">
                        <Icon className="h-5 w-5 text-[#0F172A] group-hover:text-white transition-colors duration-300" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-[#0D1117]" style={{ fontFamily: "'Playfair Display', serif" }}>
                            {title}
                        </h3>
                        <p className="text-xs text-[#6B6B6B]" style={{ fontFamily: "'Raleway', sans-serif" }}>
                            {description}
                        </p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-[#D4AF37] opacity-0 group-hover:opacity-100 transition-all duration-300 -translate-x-2 group-hover:translate-x-0" />
                </div>
            </div>
        </motion.div>
    );
}

/* ── Main Component ── */
const ModernDashboard = () => {
    const { session, user } = useAuth();
    const { activeWorkspace } = useWorkspace();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [analyses, setAnalyses] = useState([]);
    const [draft, setDraft] = useState(null);
    const [savedSessions, setSavedSessions] = useState([]);

    const fetchHistory = async () => {
        if (!session) return;
        setLoading(true);
        try {
            const items = await dataAPI.getAnalyses(activeWorkspace?.id);
            setAnalyses(items);
            const { draft: draftData } = await dataAPI.getDraft();
            setDraft(draftData);
        } catch {
            toast.error("Failed to load history");
        } finally {
            setLoading(false);
        }
    };

    const fetchSessions = async () => {
        try {
            const sessions = await getUserSessions();
            setSavedSessions(sessions.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at)));
        } catch (error) {
            console.error('Failed to fetch sessions:', error);
        }
    };

    useEffect(() => {
        fetchHistory();
        fetchSessions();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [session, activeWorkspace]);

    const handleDeleteSession = async (sessionId) => {
        if (!confirm("Delete this saved chart?")) return;
        try {
            await deletePageSession(sessionId);
            toast.success("Chart deleted");
            setSavedSessions(prev => prev.filter(s => s.session_id !== sessionId));
        } catch {
            toast.error("Delete failed");
        }
    };

    const features = [
        { title: "Smart Analytics", description: "Data health, cleaning, correlation & code export", icon: Zap, href: "/smart-analytics", badge: "New" },
        { title: "AI-Powered Analysis", description: "Get intelligent insights from your data automatically", icon: Brain, href: "/ai" },
        { title: "Data Analyzer", description: "Advanced regression analysis and visualization", icon: TrendingUp, href: "/manual-plot" },
        { title: "Mathematical Graphing", description: "Interactive Desmos integration for curve plotting", icon: Activity, href: "/manual-plot?tab=curve" },
        { title: "Categorical Chat", description: "Natural language & manual command chat visualizer", icon: BarChart3, href: "/categorical" },
    ];

    const quickActions = [
        { title: "Upload CSV", description: "Import data from file", icon: Upload, action: () => navigate("/manual-plot") },
        { title: "New Analysis", description: "Start fresh analysis", icon: Plus, action: () => navigate("/manual-plot") },
        { title: "View History", description: "Past analyses", icon: History, action: () => document.getElementById("recent-tab")?.click() },
    ];

    const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'there';

    return (
        <AppLayout>
            <DashboardTour />
            <div className="bg-luxury-bg-main min-h-[calc(100vh-64px)] pb-24" style={{ fontFamily: "'Raleway', sans-serif" }}>

                {/* ── Luxury Hero Banner ── */}
                <div className="relative overflow-hidden bg-[#0F172A]">
                    {/* Dot pattern overlay */}
                    <div
                        className="absolute inset-0 opacity-[0.04]"
                        style={{
                            backgroundImage: "radial-gradient(circle, #ffffff 1px, transparent 1px)",
                            backgroundSize: "28px 28px",
                        }}
                    />
                    {/* Gold right accent */}
                    <div className="absolute right-0 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-[#D4AF37]/30 to-transparent" />

                    <div className="relative z-10 p-8 md:p-10">
                        {/* Label */}
                        <p
                            className="text-[#D4AF37]/70 mb-2"
                            style={{ fontSize: "0.6rem", letterSpacing: "0.3em", textTransform: "uppercase" }}
                        >
                            Analytics Platform
                        </p>
                        {/* Headline */}
                        <h2
                            className="text-3xl md:text-4xl font-bold text-white mb-1"
                            style={{ fontFamily: "'Playfair Display', serif", lineHeight: 1.15 }}
                        >
                            Welcome back,{" "}
                            <em className="text-[#E8C86A]" style={{ fontStyle: "italic" }}>
                                {userName}
                            </em>
                        </h2>
                        <p className="text-white/50 text-sm mb-8">
                            Your data awaits. Choose a tool below to begin your analysis.
                        </p>

                        {/* Stats row */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <StatCard icon={Database} label="Total Analyses" value={analyses.length} loading={loading} />
                            <StatCard icon={FolderOpen} label="Saved Charts" value={savedSessions.length} loading={loading} />
                            <StatCard icon={Star} label="Active Draft" value={draft ? "1" : "0"} loading={loading} accent />
                        </div>
                    </div>
                </div>

                {/* ── Quick Actions ── */}
                <div className="tour-quick-actions">
                    <div className="flex items-center gap-3 mb-4">
                        <p
                            className="text-[#0F172A]"
                            style={{ fontSize: "0.6rem", letterSpacing: "0.25em", textTransform: "uppercase" }}
                        >
                            Quick Actions
                        </p>
                        <div className="flex-1 h-px bg-[#E8E4DC]" />
                    </div>
                    <motion.div
                        initial="hidden"
                        animate="visible"
                        variants={{ visible: { transition: { staggerChildren: 0.07 } } }}
                        className="grid grid-cols-1 md:grid-cols-3 gap-4"
                    >
                        {quickActions.map((action, index) => (
                            <QuickActionCard key={index} {...action} index={index} />
                        ))}
                    </motion.div>
                </div>

                {/* ── Feature Grid ── */}
                <div className="tour-features">
                    <div className="flex items-center gap-3 mb-4">
                        <p
                            className="text-[#0F172A]"
                            style={{ fontSize: "0.6rem", letterSpacing: "0.25em", textTransform: "uppercase" }}
                        >
                            Explore Features
                        </p>
                        <div className="flex-1 h-px bg-[#E8E4DC]" />
                    </div>
                    <motion.div
                        initial="hidden"
                        animate="visible"
                        variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
                    >
                        {features.map((feature, index) => (
                            <FeatureCard key={index} {...feature} index={index} />
                        ))}
                    </motion.div>
                </div>

                {/* ── Recent Work ── */}
                <div>
                    <div className="flex items-center gap-3 mb-4">
                        <p
                            className="text-[#0F172A]"
                            style={{ fontSize: "0.6rem", letterSpacing: "0.25em", textTransform: "uppercase" }}
                        >
                            Recent Work
                        </p>
                        <div className="flex-1 h-px bg-[#E8E4DC]" />
                    </div>

                    <Tabs defaultValue="drafts" className="w-full">
                        <TabsList className="rounded-none bg-card border border-luxury-silk p-0 h-auto">
                            {[
                                { value: "drafts", label: "Drafts" },
                                { value: "templates", label: "Templates" },
                                { value: "recent", label: "Saved Analyses", id: "recent-tab" },
                                { value: "charts", label: "Saved Charts" },
                            ].map((tab) => (
                                <TabsTrigger
                                    key={tab.value}
                                    value={tab.value}
                                    id={tab.id}
                                    className="rounded-none px-6 py-3 text-xs uppercase tracking-wider font-medium data-[state=active]:bg-[#0F172A] data-[state=active]:text-white data-[state=active]:shadow-none border-r border-luxury-silk last:border-r-0"
                                    style={{ fontFamily: "'Raleway', sans-serif", letterSpacing: "0.1em" }}
                                >
                                    {tab.label}
                                </TabsTrigger>
                            ))}
                        </TabsList>

                        {/* Drafts */}
                        <TabsContent value="drafts" className="mt-5 tour-templates">
                            {draft ? (
                                <div className="bg-card border border-luxury-silk luxury-card-hover">
                                    <div className="h-0.5 w-full bg-[#D4AF37]" />
                                    <div className="p-7">
                                        <div className="flex items-start justify-between mb-4">
                                            <div>
                                                <h3
                                                    className="text-lg font-semibold text-[#0D1117] mb-1"
                                                    style={{ fontFamily: "'Playfair Display', serif" }}
                                                >
                                                    Active Draft
                                                </h3>
                                                <p className="text-sm text-[#6B6B6B]">
                                                    {draft.tabType === 'regression' ? 'Regression Analysis' :
                                                        draft.tabType === 'categorical' ? 'Categorical Data' : 'Data Analysis'}
                                                </p>
                                            </div>
                                            <span className="bg-[#D4AF37]/10 text-[#A8893A] border border-[#D4AF37]/30 px-3 py-1 text-xs"
                                                style={{ letterSpacing: "0.05em" }}>
                                                {draft.dataPoints?.length || 0} points
                                            </span>
                                        </div>
                                        <button
                                            onClick={() => navigate('/manual-plot')}
                                            className="flex items-center gap-2 bg-[#0F172A] text-white px-5 py-2.5 text-xs uppercase tracking-widest hover:bg-[#0B1120] transition-colors duration-300"
                                        >
                                            <Play className="h-3.5 w-3.5" />
                                            Continue Working
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-white border border-dashed border-luxury-silk p-12 text-center">
                                    <FileText className="h-10 w-10 text-[#D4AF37]/40 mx-auto mb-3" />
                                    <p className="text-[#6B6B6B] text-sm mb-4">No active drafts</p>
                                    <button
                                        onClick={() => navigate('/manual-plot')}
                                        className="luxury-link text-xs text-[#0F172A] uppercase tracking-widest"
                                    >
                                        Start New Analysis <span className="ml-1 text-base">›</span>
                                    </button>
                                </div>
                            )}
                        </TabsContent>

                        {/* Templates Gallery */}
                        <TabsContent value="templates" className="mt-5 tour-templates">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                {analysisTemplates.map((template) => (
                                    <div key={template.id} className="bg-card border border-luxury-silk p-6 luxury-card-hover group cursor-pointer" onClick={() => navigate('/manual-plot/regression', { state: { template } })}>
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="w-10 h-10 rounded-none bg-[#0F172A]/5 border border-[#0F172A]/10 flex items-center justify-center group-hover:bg-[#0F172A] group-hover:border-[#0F172A] transition-colors duration-300">
                                                {template.icon === 'trending' && <TrendingUp className="h-5 w-5 text-[#0F172A] group-hover:text-[#D4AF37] transition-colors" />}
                                                {template.icon === 'graduation' && <Brain className="h-5 w-5 text-[#0F172A] group-hover:text-[#D4AF37] transition-colors" />}
                                                {template.icon === 'server' && <Activity className="h-5 w-5 text-[#0F172A] group-hover:text-[#D4AF37] transition-colors" />}
                                            </div>
                                            <h4 className="font-semibold text-[#0D1117]" style={{ fontFamily: "'Playfair Display', serif" }}>
                                                {template.title}
                                            </h4>
                                        </div>
                                        <p className="text-sm text-[#6B6B6B] mb-4 h-10">
                                            {template.description}
                                        </p>
                                        <button className="flex items-center text-xs font-semibold uppercase tracking-wider text-[#0F172A] group-hover:text-[#D4AF37] transition-colors">
                                            Load Template <ArrowRight className="h-3.5 w-3.5 ml-1" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </TabsContent>

                        {/* Saved Analyses */}
                        <TabsContent value="recent" className="mt-5">
                            {loading ? (
                                <div className="bg-card border border-luxury-silk p-8 text-center text-[#6B6B6B] text-sm">
                                    Loading…
                                </div>
                            ) : analyses.length === 0 ? (
                                <div className="bg-white border border-dashed border-luxury-silk p-12 text-center">
                                    <BarChart3 className="h-10 w-10 text-[#D4AF37]/40 mx-auto mb-3" />
                                    <p className="text-[#6B6B6B] text-sm mb-4">No saved analyses yet</p>
                                    <button
                                        onClick={() => navigate('/manual-plot')}
                                        className="luxury-link text-xs text-[#0F172A] uppercase tracking-widest"
                                    >
                                        Create Your First Analysis <span className="ml-1 text-base">›</span>
                                    </button>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {analyses.slice(0, 6).map((item) => (
                                        <div key={item.id} className="bg-card border border-luxury-silk p-5 luxury-card-hover group">
                                            <div className="flex items-start gap-3 mb-3">
                                                <Activity className="h-4 w-4 text-[#0F172A] flex-shrink-0 mt-0.5" />
                                                <div className="min-w-0">
                                                    <h4
                                                        className="text-sm font-semibold text-[#0D1117] truncate"
                                                        style={{ fontFamily: "'Playfair Display', serif" }}
                                                    >
                                                        {item.title || "Untitled Analysis"}
                                                    </h4>
                                                    <p className="text-xs font-mono text-[#6B6B6B] mt-0.5 truncate">{item.equation}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between border-t border-luxury-silk pt-3">
                                                <div className="flex items-center gap-4 text-xs text-[#6B6B6B]">
                                                    <span className="font-medium text-[#D4AF37]">R² = {item.r2?.toFixed(4)}</span>
                                                    <span>{new Date(item.created_at).toLocaleDateString()}</span>
                                                </div>
                                                <button
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        dataAPI.createShareLink(item.id)
                                                            .then(res => {
                                                                const link = `${window.location.origin}/share/${res.token}`;
                                                                navigator.clipboard.writeText(link);
                                                                toast.success('Share link copied to clipboard!');
                                                            })
                                                            .catch(err => toast.error('Failed to create share link'));
                                                    }}
                                                    className="text-[#0F172A] hover:text-[#D4AF37] transition-colors p-1"
                                                    title="Share Analysis"
                                                >
                                                    <Share2 className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        dataAPI.createShareLink(item.id)
                                                            .then(res => {
                                                                const embedCode = `<iframe src="${window.location.origin}/embed/${res.token}" width="100%" height="500px" frameborder="0"></iframe>`;
                                                                navigator.clipboard.writeText(embedCode);
                                                                toast.success('Embed code copied to clipboard!');
                                                            })
                                                            .catch(err => toast.error('Failed to create embed link'));
                                                    }}
                                                    className="text-[#0F172A] hover:text-[#D4AF37] transition-colors p-1"
                                                    title="Get Embed Code"
                                                >
                                                    <Code className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </TabsContent>

                        {/* Saved Charts */}
                        <TabsContent value="charts" className="mt-5">
                            {savedSessions.length === 0 ? (
                                <div className="bg-white border border-dashed border-luxury-silk p-12 text-center">
                                    <LineChart className="h-10 w-10 text-[#D4AF37]/40 mx-auto mb-3" />
                                    <p className="text-[#6B6B6B] text-sm mb-4">No saved charts</p>
                                    <button
                                        onClick={() => navigate('/manual-plot')}
                                        className="luxury-link text-xs text-[#0F172A] uppercase tracking-widest"
                                    >
                                        Create Your First Chart <span className="ml-1 text-base">›</span>
                                    </button>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {savedSessions.slice(0, 6).map((session) => (
                                        <div key={session.session_id} className="bg-card border border-luxury-silk p-5 luxury-card-hover group">
                                            <div className="flex items-start gap-3 mb-3">
                                                <LineChart className="h-4 w-4 text-[#0F172A] flex-shrink-0 mt-0.5" />
                                                <div>
                                                    <h4
                                                        className="text-sm font-semibold text-[#0D1117]"
                                                        style={{ fontFamily: "'Playfair Display', serif" }}
                                                    >
                                                        {session.page_type.charAt(0).toUpperCase() + session.page_type.slice(1)} Chart
                                                    </h4>
                                                    <p className="text-xs text-[#6B6B6B] mt-0.5">
                                                        Last updated: {new Date(session.updated_at).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleDeleteSession(session.session_id)}
                                                className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-700 transition-colors border border-red-200 hover:border-red-400 px-3 py-1.5"
                                            >
                                                <Trash2 className="h-3 w-3" />
                                                Delete
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </AppLayout>
    );
};

export default ModernDashboard;
