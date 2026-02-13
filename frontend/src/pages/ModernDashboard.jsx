import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
    Plus,
    Trash2,
    Edit,
    LineChart,
    Activity,
    Sparkles,
    TrendingUp,
    Upload,
    Clock,
    BarChart3,
    Zap,
    Rocket,
    ArrowRight,
    Database,
    FileText,
    Brain,
    ChevronRight,
    Play,
    FolderOpen,
    Star,
    History
} from "lucide-react";
import { toast } from "sonner";

import AppLayout from "@/components/AppLayout";
import { useAuth } from "@/context/AuthContext";
import { dataAPI } from "@/lib/api";
import { getUserSessions, deletePageSession } from "@/lib/sessionManager";

import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const ModernDashboard = () => {
    const { session, user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [analyses, setAnalyses] = useState([]);
    const [draft, setDraft] = useState(null);
    const [savedSessions, setSavedSessions] = useState([]);

    const fetchHistory = async () => {
        if (!session) return;
        setLoading(true);
        try {
            const items = await dataAPI.getAnalyses();
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
            const sorted = sessions.sort((a, b) =>
                new Date(b.updated_at) - new Date(a.updated_at)
            );
            setSavedSessions(sorted);
        } catch (error) {
            console.error('Failed to fetch sessions:', error);
        }
    };

    useEffect(() => {
        fetchHistory();
        fetchSessions();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [session]);

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
        {
            title: "Smart Analytics",
            description: "Data health, cleaning, correlation & code export",
            icon: Zap,
            href: "/smart-analytics",
            gradient: "from-purple-600 to-purple-800",
            badge: "New"
        },
        {
            title: "AI-Powered Analysis",
            description: "Get intelligent insights from your data automatically",
            icon: Brain,
            href: "/ai",
            gradient: "from-slate-600 to-slate-800",
        },
        {
            title: "Data Analyzer",
            description: "Advanced regression analysis and visualization",
            icon: TrendingUp,
            href: "/manual-plot",
            gradient: "from-blue-600 to-blue-800",
        },
        {
            title: "Mathematical Graphing",
            description: "Interactive Desmos integration for curve plotting",
            icon: Activity,
            href: "/manual-plot?tab=curve",
            gradient: "from-green-600 to-green-800",
        },
        {
            title: "Categorical Analysis",
            description: "Analyze and visualize categorical data patterns",
            icon: BarChart3,
            href: "/categorical",
            gradient: "from-slate-500 to-slate-700",
        },
        {
            title: "NLP Analytics",
            description: "Text analysis and natural language processing",
            icon: FileText,
            href: "/categorical-nlp",
            gradient: "from-gray-600 to-gray-800",
        },
    ];

    const quickActions = [
        {
            title: "Upload CSV",
            description: "Import data from file",
            icon: Upload,
            action: () => navigate("/manual-plot")
        },
        {
            title: "New Analysis",
            description: "Start fresh",
            icon: Plus,
            action: () => navigate("/manual-plot")
        },
        {
            title: "View History",
            description: "Past analyses",
            icon: History,
            action: () => document.getElementById("recent-tab").click()
        },
    ];

    return (
        <AppLayout>
            <div className="space-y-8">
                {/* Hero Section */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 p-8 md:p-12 text-white">
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-4">
                            <Avatar className="h-12 w-12 border-2 border-white/30">
                                <AvatarFallback className="bg-slate-600 text-white text-xl font-bold">
                                    {user?.email?.charAt(0).toUpperCase() || 'U'}
                                </AvatarFallback>
                            </Avatar>
                            <div>
                                <h1 className="text-3xl md:text-4xl font-bold">
                                    Welcome back{user?.user_metadata?.full_name ? `, ${user.user_metadata.full_name}` : ''}!
                                </h1>
                                <p className="text-slate-200 mt-1">
                                    Choose a feature below to analyze your data and discover insights
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
                            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                                <div className="flex items-center gap-2 mb-2">
                                    <Database className="h-5 w-5" />
                                    <span className="text-sm font-medium">Total Analyses</span>
                                </div>
                                <p className="text-3xl font-bold">{analyses.length}</p>
                            </div>
                            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                                <div className="flex items-center gap-2 mb-2">
                                    <FolderOpen className="h-5 w-5" />
                                    <span className="text-sm font-medium">Saved Charts</span>
                                </div>
                                <p className="text-3xl font-bold">{savedSessions.length}</p>
                            </div>
                            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                                <div className="flex items-center gap-2 mb-2">
                                    <Star className="h-5 w-5" />
                                    <span className="text-sm font-medium">Active Draft</span>
                                </div>
                                <p className="text-3xl font-bold">{draft ? '1' : '0'}</p>
                            </div>
                        </div>
                    </div>

                    {/* Decorative elements */}
                    <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -mr-48 -mt-48" />
                    <div className="absolute bottom-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mb-32" />
                    <div className="absolute top-1/2 left-0 w-48 h-48 bg-white/5 rounded-full -ml-24" />
                </div>

                {/* Quick Actions */}
                <div>
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                        <Zap className="h-5 w-5 text-yellow-500" />
                        Quick Actions
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {quickActions.map((action, index) => (
                            <Card
                                key={index}
                                className="border-2 hover:border-slate-700 cursor-pointer transition-all hover:shadow-lg hover:scale-105"
                                onClick={action.action}
                            >
                                <CardContent className="p-6">
                                    <div className="flex items-start gap-4">
                                        <div className="p-3 rounded-lg bg-slate-700 text-white">
                                            <action.icon className="h-6 w-6" />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-semibold mb-1">{action.title}</h3>
                                            <p className="text-sm text-muted-foreground">{action.description}</p>
                                        </div>
                                        <ArrowRight className="h-5 w-5 text-muted-foreground" />
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>

                {/* Feature Cards */}
                <div>
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                        <Rocket className="h-5 w-5 text-blue-500" />
                        Explore Features
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {features.map((feature, index) => (
                            <Link key={index} to={feature.href}>
                                <Card className="border-2 hover:border-slate-700 transition-all hover:shadow-xl hover:scale-102 group h-full">
                                    <CardHeader>
                                        <div className="flex items-start justify-between">
                                            <div className={`p-4 rounded-xl bg-gradient-to-br ${feature.gradient} text-white shadow-lg group-hover:scale-110 transition-transform`}>
                                                <feature.icon className="h-8 w-8" />
                                            </div>
                                            {feature.badge && (
                                                <Badge className="bg-slate-700 text-white border-0">
                                                    {feature.badge}
                                                </Badge>
                                            )}
                                        </div>
                                        <CardTitle className="text-xl mt-4 group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors">
                                            {feature.title}
                                        </CardTitle>
                                        <CardDescription className="text-base">
                                            {feature.description}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <Button variant="ghost" className="gap-2 group-hover:gap-4 transition-all">
                                            Get Started <ChevronRight className="h-4 w-4" />
                                        </Button>
                                    </CardContent>
                                </Card>
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Recent Work Tabs */}
                <div>
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                        <Clock className="h-5 w-5 text-green-500" />
                        Recent Work
                    </h2>
                    <Tabs defaultValue="drafts" className="w-full">
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="drafts">Drafts</TabsTrigger>
                            <TabsTrigger value="recent" id="recent-tab">Saved Analyses</TabsTrigger>
                            <TabsTrigger value="charts">Saved Charts</TabsTrigger>
                        </TabsList>

                        {/* Drafts Tab */}
                        <TabsContent value="drafts" className="mt-6">
                            {draft ? (
                                <Card className="border-2 border-slate-700">
                                    <CardHeader>
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <CardTitle className="flex items-center gap-2">
                                                    <Edit className="h-5 w-5" />
                                                    Active Draft
                                                </CardTitle>
                                                <CardDescription>
                                                    {draft.tabType === 'regression' ? 'Regression Analysis' :
                                                        draft.tabType === 'categorical' ? 'Categorical Data' :
                                                            'Data Analysis'}
                                                </CardDescription>
                                            </div>
                                            <Badge variant="outline" className="bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800">
                                                {draft.dataPoints?.length || 0} points
                                            </Badge>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex gap-2">
                                            <Button
                                                onClick={() => navigate('/manual-plot')}
                                                className="gap-2"
                                            >
                                                <Play className="h-4 w-4" />
                                                Continue Working
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ) : (
                                <Card className="border-2 border-dashed">
                                    <CardContent className="flex flex-col items-center justify-center py-12">
                                        <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                                        <p className="text-muted-foreground mb-4">No active drafts</p>
                                        <Button onClick={() => navigate('/manual-plot')}>
                                            Start New Analysis
                                        </Button>
                                    </CardContent>
                                </Card>
                            )}
                        </TabsContent>

                        {/* Saved Analyses Tab */}
                        <TabsContent value="recent" className="mt-6 space-y-4">
                            {loading ? (
                                <Card>
                                    <CardContent className="p-8 text-center text-muted-foreground">
                                        Loading...
                                    </CardContent>
                                </Card>
                            ) : analyses.length === 0 ? (
                                <Card className="border-2 border-dashed">
                                    <CardContent className="flex flex-col items-center justify-center py-12">
                                        <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
                                        <p className="text-muted-foreground mb-4">No saved analyses yet</p>
                                        <Button onClick={() => navigate('/manual-plot')}>
                                            Create Your First Analysis
                                        </Button>
                                    </CardContent>
                                </Card>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {analyses.slice(0, 6).map((item) => (
                                        <Card key={item.id} className="border hover:border-blue-500 transition-colors">
                                            <CardHeader>
                                                <CardTitle className="text-base flex items-center gap-2">
                                                    <Activity className="h-4 w-4 text-blue-500" />
                                                    {item.title || "Untitled Analysis"}
                                                </CardTitle>
                                                <CardDescription className="font-mono text-xs">
                                                    {item.equation}
                                                </CardDescription>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                                        <span>R² = {item.r2?.toFixed(4)}</span>
                                                        <span>{new Date(item.created_at).toLocaleDateString()}</span>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </TabsContent>

                        {/* Saved Charts Tab */}
                        <TabsContent value="charts" className="mt-6 space-y-4">
                            {savedSessions.length === 0 ? (
                                <Card className="border-2 border-dashed">
                                    <CardContent className="flex flex-col items-center justify-center py-12">
                                        <LineChart className="h-12 w-12 text-muted-foreground mb-4" />
                                        <p className="text-muted-foreground mb-4">No saved charts</p>
                                        <Button onClick={() => navigate('/manual-plot')}>
                                            Create Your First Chart
                                        </Button>
                                    </CardContent>
                                </Card>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {savedSessions.slice(0, 6).map((session) => (
                                        <Card key={session.session_id} className="border hover:border-blue-500 transition-colors group">
                                            <CardHeader>
                                                <CardTitle className="text-base flex items-center gap-2">
                                                    <LineChart className="h-4 w-4 text-purple-500" />
                                                    {session.page_type.charAt(0).toUpperCase() + session.page_type.slice(1)} Chart
                                                </CardTitle>
                                                <CardDescription>
                                                    Last updated: {new Date(session.updated_at).toLocaleDateString()}
                                                </CardDescription>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="flex gap-2">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => handleDeleteSession(session.session_id)}
                                                        className="gap-2 text-red-600 hover:text-red-700"
                                                    >
                                                        <Trash2 className="h-3 w-3" />
                                                        Delete
                                                    </Button>
                                                </div>
                                            </CardContent>
                                        </Card>
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
