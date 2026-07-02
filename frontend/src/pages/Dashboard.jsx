import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
    Plus,
    Trash2,
    RefreshCcw,
    Edit,
    LineChart,
    Activity,
    Sparkles,
    FileText,
    TrendingUp,
    Upload,
    Clock,
    BarChart3,
    Zap,
    Rocket,
    ArrowRight
} from "lucide-react";
import { toast } from "sonner";

import AppLayout from "@/components/AppLayout";
import ProgressTracker from "@/components/ProgressTracker";
import PageTransition from "@/components/PageTransition";
import { useAuth } from "@/context/AuthContext";
import { useStorytelling } from "@/context/StorytellingContext";
import { dataAPI } from "@/lib/api";
import { getUserSessions, deletePageSession } from "@/lib/sessionManager";

import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const Dashboard = () => {
    const { session, user } = useAuth();
    const navigate = useNavigate();
    const { unlockAchievement } = useStorytelling();
    const [_loading, setLoading] = useState(true);
    const [analyses, setAnalyses] = useState([]);
    const [draft, setDraft] = useState(null);
    const [savedSessions, setSavedSessions] = useState([]);
    const [sessionsLoading, setSessionsLoading] = useState(true);

    const fetchHistory = async () => {
        if (!session) return;
        setLoading(true);
        try {
            const items = await dataAPI.getAnalyses();
            setAnalyses(items);

            // Also fetch draft
            const { draft: draftData } = await dataAPI.getDraft();
            setDraft(draftData);
        } catch {
            toast.error("Failed to load history");
        } finally {
            setLoading(false);
        }
    };

    const fetchSessions = async () => {
        setSessionsLoading(true);
        try {
            const sessions = await getUserSessions();
            // Sort by updated_at descending
            const sorted = sessions.sort((a, b) =>
                new Date(b.updated_at) - new Date(a.updated_at)
            );
            setSavedSessions(sorted);
        } catch (error) {
            console.error('Failed to fetch sessions:', error);
            toast.error("Failed to load saved charts");
        } finally {
            setSessionsLoading(false);
        }
    };

    useEffect(() => {
        fetchHistory();
        fetchSessions();
        
        // Check for achievements based on data
        if (analyses.length >= 5) {
            unlockAchievement('five-analyses');
        }
        if (analyses.length > 0) {
            unlockAchievement('first-analysis');
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [session, analyses.length]);

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

    const handleEditSession = (sessionData) => {
        const pageTypeMap = {
            'categorical': '/manual-plot/categorical',
            'regression': '/manual-plot/regression',
            'curve': '/manual-plot/curve',
        };

        const path = pageTypeMap[sessionData.page_type];
        if (path) {
            const storageKey = `session_id_${sessionData.page_type}`;
            sessionStorage.setItem(storageKey, sessionData.session_id);
            navigate(path);
            toast.success('Loading saved chart...');
        } else {
            console.error('[Dashboard] Unknown page type:', sessionData.page_type);
            toast.error('Unknown chart type');
        }
    };

    const handleCreateNew = (type) => {
        const routeMap = {
            'curve': '/manual-plot/curve',
            'regression': '/manual-plot/regression',
            'categorical': '/manual-plot/categorical',
        };
        navigate(routeMap[type]);
    };

    const getChartIcon = (pageType) => {
        switch (pageType) {
            case 'categorical':
                return <Sparkles className="h-5 w-5 text-purple-500" />;
            case 'regression':
                return <LineChart className="h-5 w-5 text-blue-500" />;
            case 'curve':
                return <Activity className="h-5 w-5 text-green-500" />;
            default:
                return <Activity className="h-5 w-5" />;
        }
    };

    const getChartTypeLabel = (pageType) => {
        switch (pageType) {
            case 'categorical':
                return 'Categorical Plot';
            case 'regression':
                return 'Regression Model';
            case 'curve':
                return 'Curve Plot';
            default:
                return 'Chart';
        }
    };

    const getChartTypeBadgeColor = (pageType) => {
        switch (pageType) {
            case 'categorical':
                return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300';
            case 'regression':
                return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
            case 'curve':
                return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300';
            default:
                return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300';
        }
    };

    // Calculate stats
    const totalAnalyses = analyses.length;
    const totalReports = savedSessions.length;
    const draftCount = draft ? 1 : 0;

    // Time-based greeting
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return "Good morning";
        if (hour < 18) return "Good afternoon";
        return "Good evening";
    };

    const userName = user?.user_metadata?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'User';

    return (
        <AppLayout>
            <PageTransition>
            <div className="flex flex-col space-y-8">
                {/* Animated Welcome Section */}
                <div className="flex items-center justify-between space-y-2">
                    <div className="space-y-1">
                        <h2 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
                            {getGreeting()}, {userName} 👋
                        </h2>
                        <p className="text-lg text-muted-foreground">
                            Ready to visualize your data? Let's create something amazing.
                        </p>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Button onClick={() => { fetchHistory(); fetchSessions(); }} variant="outline" size="sm">
                            <RefreshCcw className="mr-2 h-4 w-4" />
                            Refresh
                        </Button>
                    </div>
                </div>

                {/* Enhanced Stats Grid with Gradients */}
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                    <Card className="border-l-4 border-l-blue-500 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Datasets</CardTitle>
                            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{totalAnalyses}</div>
                            <p className="text-xs text-muted-foreground mt-1">
                                {totalAnalyses === 0 ? "Start by uploading data" : "Datasets analyzed"}
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-emerald-500 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Saved Charts</CardTitle>
                            <div className="p-2 bg-slate-100 dark:bg-emerald-900/30 rounded-lg">
                                <TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{totalReports}</div>
                            <p className="text-xs text-muted-foreground mt-1">
                                {totalReports === 0 ? "Create your first chart" : "Charts created"}
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-amber-500 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Active Drafts</CardTitle>
                            <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                                <Edit className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-amber-600 dark:text-amber-400">{draftCount}</div>
                            <p className="text-xs text-muted-foreground mt-1">
                                {draftCount > 0 ? "You have unsaved work" : "All caught up"}
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-violet-500 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">System Status</CardTitle>
                            <div className="p-2 bg-violet-100 dark:bg-violet-900/30 rounded-lg">
                                <Zap className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-green-600 dark:text-green-400">Online</div>
                            <p className="text-xs text-muted-foreground mt-1">
                                All systems operational
                            </p>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
                    {/* Main Content Area */}
                    <div className="col-span-4 space-y-6">
                        {/* Enhanced Quick Actions */}
                        <Card className="border-2">
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="text-xl">Quick Actions</CardTitle>
                                        <CardDescription>Choose a chart type to get started</CardDescription>
                                    </div>
                                    <Rocket className="h-6 w-6 text-primary" />
                                </div>
                            </CardHeader>
                            <CardContent className="grid gap-4 md:grid-cols-2">
                                <Card
                                    className="cursor-pointer hover:shadow-md hover:border-green-500 transition-all duration-300 hover:-translate-y-1 border-2 border-dashed"
                                    onClick={() => handleCreateNew('curve')}
                                >
                                    <CardContent className="pt-6">
                                        <div className="flex flex-col items-center text-center space-y-3">
                                            <div className="p-4 bg-green-100 dark:bg-green-900/30 rounded-full">
                                                <Activity className="h-8 w-8 text-green-600 dark:text-green-400" />
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-lg">Curve Plot</h3>
                                                <p className="text-sm text-muted-foreground mt-1">
                                                    Mathematical curves with Desmos
                                                </p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card
                                    className="cursor-pointer hover:shadow-md hover:border-blue-500 transition-all duration-300 hover:-translate-y-1 border-2 border-dashed"
                                    onClick={() => handleCreateNew('regression')}
                                >
                                    <CardContent className="pt-6">
                                        <div className="flex flex-col items-center text-center space-y-3">
                                            <div className="p-4 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                                                <LineChart className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-lg">Regression</h3>
                                                <p className="text-sm text-muted-foreground mt-1">
                                                    Linear & polynomial models
                                                </p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card
                                    className="cursor-pointer hover:shadow-md hover:border-purple-500 transition-all duration-300 hover:-translate-y-1 border-2 border-dashed"
                                    onClick={() => handleCreateNew('categorical')}
                                >
                                    <CardContent className="pt-6">
                                        <div className="flex flex-col items-center text-center space-y-3">
                                            <div className="p-4 bg-purple-100 dark:bg-purple-900/30 rounded-full">
                                                <Sparkles className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-lg">Categorical</h3>
                                                <p className="text-sm text-muted-foreground mt-1">
                                                    Bar, pie & treemap charts
                                                </p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="cursor-pointer hover:shadow-md hover:border-primary transition-all duration-300 hover:-translate-y-1 border-2 border-dashed">
                                    <CardContent className="pt-6">
                                        <div className="flex flex-col items-center text-center space-y-3">
                                            <div className="p-4 bg-primary/10 rounded-full">
                                                <Upload className="h-8 w-8 text-primary" />
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-lg">Upload CSV</h3>
                                                <p className="text-sm text-muted-foreground mt-1">
                                                    Import your dataset
                                                </p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </CardContent>
                        </Card>

                        {/* Recent Projects with Better Empty State */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-xl">Recent Projects</CardTitle>
                                <CardDescription>Your recently saved charts and analysis sessions</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {sessionsLoading ? (
                                    <div className="space-y-4">
                                        {[...Array(3)].map((_, i) => (
                                            <Skeleton key={i} className="h-20 w-full" />
                                        ))}
                                    </div>
                                ) : savedSessions.length === 0 ? (
                                    <div className="text-center py-12">
                                        <div className="flex justify-center mb-4">
                                            <div className="p-4 bg-muted rounded-full">
                                                <BarChart3 className="h-12 w-12 text-muted-foreground" />
                                            </div>
                                        </div>
                                        <h3 className="text-lg font-semibold mb-2">No projects yet</h3>
                                        <p className="text-muted-foreground mb-6">
                                            Create your first chart to get started with data visualization
                                        </p>
                                        <Button onClick={() => handleCreateNew('regression')} className="gap-2">
                                            <Plus className="h-4 w-4" />
                                            Create Your First Chart
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {savedSessions.slice(0, 5).map(sessionData => (
                                            <div
                                                key={sessionData.session_id}
                                                className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-all duration-200 hover:shadow-sm group"
                                            >
                                                <div className="flex items-center gap-4 flex-1">
                                                    <div className="p-3 bg-background rounded-lg border-2 group-hover:border-primary transition-colors">
                                                        {getChartIcon(sessionData.page_type)}
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="font-semibold text-base">
                                                            {sessionData.state_data?.chartTitle || getChartTypeLabel(sessionData.page_type)}
                                                        </div>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <span className="text-sm text-muted-foreground">
                                                                {new Date(sessionData.updated_at).toLocaleDateString()}
                                                            </span>
                                                            <span className="text-muted-foreground">·</span>
                                                            <Badge variant="secondary" className={`text-xs ${getChartTypeBadgeColor(sessionData.page_type)}`}>
                                                                {getChartTypeLabel(sessionData.page_type)}
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleEditSession(sessionData)}
                                                        className="gap-2"
                                                    >
                                                        Open
                                                        <ArrowRight className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleDeleteSession(sessionData.session_id)}
                                                    >
                                                        <Trash2 className="h-4 w-4 text-destructive" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Sidebar */}
                    <div className="col-span-3 space-y-6">
                        {/* Progress Tracker */}
                        <ProgressTracker />
                        {/* Draft Card if exists */}
                        {draft && (
                            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-blue-200 dark:border-blue-800">
                                <CardHeader>
                                    <div className="flex items-center gap-2">
                                        <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                        <CardTitle className="text-base text-blue-900 dark:text-blue-100">Continue Working</CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        <div>
                                            <div className="font-semibold text-blue-900 dark:text-blue-100">{draft.title || "Untitled Draft"}</div>
                                            <div className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                                                Last saved: {new Date(draft.updated_at).toLocaleTimeString()}
                                            </div>
                                        </div>
                                        <Link to="/manual-plot">
                                            <Button size="sm" className="w-full gap-2">
                                                Resume Work
                                                <ArrowRight className="h-4 w-4" />
                                            </Button>
                                        </Link>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Getting Started Guide for New Users */}
                        {totalReports === 0 && (
                            <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 border-purple-200 dark:border-purple-800">
                                <CardHeader>
                                    <CardTitle className="text-base flex items-center gap-2">
                                        <Rocket className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                                        Getting Started
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <div className="flex gap-3">
                                            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-600 dark:bg-purple-400 text-white dark:text-purple-950 flex items-center justify-center text-sm font-bold">
                                                1
                                            </div>
                                            <div>
                                                <div className="font-medium text-sm">Choose a chart type</div>
                                                <div className="text-xs text-muted-foreground mt-1">
                                                    Pick from curve, regression, or categorical
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex gap-3">
                                            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-600 dark:bg-purple-400 text-white dark:text-purple-950 flex items-center justify-center text-sm font-bold">
                                                2
                                            </div>
                                            <div>
                                                <div className="font-medium text-sm">Add your data</div>
                                                <div className="text-xs text-muted-foreground mt-1">
                                                    Upload CSV or enter data manually
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex gap-3">
                                            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-600 dark:bg-purple-400 text-white dark:text-purple-950 flex items-center justify-center text-sm font-bold">
                                                3
                                            </div>
                                            <div>
                                                <div className="font-medium text-sm">Visualize & export</div>
                                                <div className="text-xs text-muted-foreground mt-1">
                                                    Create beautiful charts and export as SVG/PNG
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* User Profile Card */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Your Profile</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-4">
                                    <Avatar className="h-16 w-16">
                                        <AvatarImage src={user?.user_metadata?.avatar_url} alt="Avatar" />
                                        <AvatarFallback className="text-lg font-semibold bg-gradient-to-br from-primary to-purple-500 text-white">
                                            {userName.charAt(0).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1">
                                        <div className="font-semibold">{user?.user_metadata?.full_name || userName}</div>
                                        <div className="text-sm text-muted-foreground">{user?.email}</div>
                                    </div>
                                </div>
                                <Link to="/profile" className="mt-4 block">
                                    <Button variant="outline" size="sm" className="w-full gap-2">
                                        View Profile
                                        <ArrowRight className="h-4 w-4" />
                                    </Button>
                                </Link>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
            </PageTransition>
        </AppLayout>
    );
};

export default Dashboard;
