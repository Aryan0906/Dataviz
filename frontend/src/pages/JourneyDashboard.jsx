import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
    Plus,
    Trash2,
    BookOpen,
    TrendingUp,
    Trophy,
    Star,
    Zap,
    Clock,
    ArrowRight,
    Sparkles,
    Target,
    Award,
    Brain,
    BarChart3,
    FileText,
    Play,
    Edit,
    ChevronRight
} from "lucide-react";
import { toast } from "sonner";

import AppLayout from "@/components/AppLayout";
import { useAuth } from "@/context/AuthContext";
import { dataAPI } from "@/lib/api";

import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";

const JourneyDashboard = () => {
    const { session, user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [analyses, setAnalyses] = useState([]);
    const [draft, setDraft] = useState(null);

    // Journey stats (computed from analyses)
    const journeyStats = {
        totalChapters: analyses.length,
        drafts: draft ? 1 : 0,
        insightsDiscovered: analyses.length * 3, // Mock: avg 3 insights per analysis
        level: Math.min(5, Math.floor(analyses.length / 3) + 1)
    };

    // Achievement system
    const achievements = [
        {
            id: "first_analysis",
            title: "First Steps",
            description: "Complete your first analysis",
            icon: Star,
            unlocked: analyses.length >= 1,
            color: "from-yellow-500 to-orange-500"
        },
        {
            id: "five_analyses",
            title: "Data Explorer",
            description: "Complete 5 analyses",
            icon: Target,
            unlocked: analyses.length >= 5,
            color: "from-blue-500 to-cyan-500"
        },
        {
            id: "ten_analyses",
            title: "Master Analyst",
            description: "Complete 10 analyses",
            icon: Trophy,
            unlocked: analyses.length >= 10,
            color: "from-purple-500 to-pink-500"
        },
        {
            id: "pattern_detective",
            title: "Pattern Detective",
            description: "Find a high-confidence correlation",
            icon: Brain,
            unlocked: analyses.some(a => a.stats?.r_squared > 0.9),
            color: "from-green-500 to-emerald-500"
        }
    ];

    const unlockedCount = achievements.filter(a => a.unlocked).length;

    useEffect(() => {
        fetchHistory();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [session]);

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

    const handleStartNewChapter = () => {
        navigate("/manual-plot");
    };

    const handleResumeDraft = () => {
        navigate("/manual-plot");
    };

    const levelProgress = ((analyses.length % 3) / 3) * 100;

    return (
        <AppLayout>
            <div className="space-y-8">
                {/* Welcome Hero */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 p-8 md:p-12 text-white shadow-2xl">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/20 rounded-full blur-3xl" />
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-600/20 rounded-full blur-3xl" />

                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-4">
                            <Avatar className="h-16 w-16 border-4 border-white/30">
                                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white text-xl font-bold">
                                    {user?.user_metadata?.name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || "U"}
                                </AvatarFallback>
                            </Avatar>
                            <div>
                                <h1 className="text-3xl md:text-4xl font-bold">
                                    Welcome back, {user?.user_metadata?.name || "Explorer"}! 👋
                                </h1>
                                <p className="text-white/80 text-lg mt-1">
                                    Ready to continue your data story?
                                </p>
                            </div>
                        </div>

                        {/* Quick Stats */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
                            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                                <BookOpen className="h-8 w-8 mb-2 text-blue-300" />
                                <p className="text-3xl font-bold">{journeyStats.totalChapters}</p>
                                <p className="text-white/70 text-sm">Chapters Written</p>
                            </div>
                            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                                <Sparkles className="h-8 w-8 mb-2 text-purple-300" />
                                <p className="text-3xl font-bold">{journeyStats.insightsDiscovered}</p>
                                <p className="text-white/70 text-sm">Insights Found</p>
                            </div>
                            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                                <Trophy className="h-8 w-8 mb-2 text-yellow-300" />
                                <p className="text-3xl font-bold">{unlockedCount}/{achievements.length}</p>
                                <p className="text-white/70 text-sm">Achievements</p>
                            </div>
                            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                                <Zap className="h-8 w-8 mb-2 text-green-300" />
                                <p className="text-3xl font-bold">Level {journeyStats.level}</p>
                                <p className="text-white/70 text-sm">Analyst Rank</p>
                            </div>
                        </div>

                        {/* Level Progress */}
                        <div className="mt-6 bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm font-medium">Progress to Level {journeyStats.level + 1}</span>
                                <span className="text-sm text-white/70">{analyses.length % 3}/3 chapters</span>
                            </div>
                            <Progress value={levelProgress} className="h-2 bg-white/20" />
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="grid md:grid-cols-2 gap-6">
                    <Card className="border-2 hover:border-blue-500 hover:shadow-xl transition-all duration-300 cursor-pointer group"
                        onClick={handleStartNewChapter}>
                        <CardContent className="p-8">
                            <div className="flex items-start justify-between mb-4">
                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform">
                                    <Plus className="h-7 w-7" />
                                </div>
                                <ArrowRight className="h-6 w-6 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                            </div>
                            <h3 className="text-2xl font-bold mb-2 text-slate-900 dark:text-slate-100">
                                Start New Chapter
                            </h3>
                            <p className="text-muted-foreground">
                                Begin a fresh analysis and discover new insights in your data
                            </p>
                        </CardContent>
                    </Card>

                    {draft && (
                        <Card className="border-2 border-orange-200 dark:border-orange-900 hover:border-orange-500 hover:shadow-xl transition-all duration-300 cursor-pointer group"
                            onClick={handleResumeDraft}>
                            <CardContent className="p-8">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-600 to-orange-800 flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform">
                                        <Edit className="h-7 w-7" />
                                    </div>
                                    <Badge className="bg-orange-600">Draft</Badge>
                                </div>
                                <h3 className="text-2xl font-bold mb-2 text-slate-900 dark:text-slate-100">
                                    Resume Draft
                                </h3>
                                <p className="text-muted-foreground">
                                    Continue working on your unfinished analysis
                                </p>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Your Story Chapters */}
                <div>
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-3">
                                <BookOpen className="h-8 w-8" />
                                Your Data Story
                            </h2>
                            <p className="text-muted-foreground mt-1">
                                Every analysis is a chapter in your journey
                            </p>
                        </div>
                    </div>

                    {loading ? (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[1, 2, 3].map(i => (
                                <Card key={i} className="animate-pulse">
                                    <CardHeader>
                                        <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded w-3/4 mb-2" />
                                        <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/2" />
                                    </CardHeader>
                                </Card>
                            ))}
                        </div>
                    ) : analyses.length > 0 ? (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {analyses.map((analysis, index) => (
                                <Card key={analysis.id} className="group hover:shadow-xl transition-all duration-300 border-2 hover:border-blue-300 dark:hover:border-blue-700 cursor-pointer"
                                    onClick={() => navigate(`/manual-plot?session=${analysis.id}`)}>
                                    <CardHeader>
                                        <div className="flex items-start justify-between mb-3">
                                            <Badge variant="outline" className="gap-1">
                                                <BookOpen className="h-3 w-3" />
                                                Chapter {analyses.length - index}
                                            </Badge>
                                            <div className="flex gap-1">
                                                {analysis.stats?.r_squared > 0.8 && (
                                                    <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                                                )}
                                            </div>
                                        </div>

                                        <CardTitle className="text-xl group-hover:text-blue-600 transition-colors">
                                            {analysis.title || `Analysis ${analyses.length - index}`}
                                        </CardTitle>

                                        <CardDescription className="flex items-center gap-2 mt-2">
                                            <Clock className="h-3 w-3" />
                                            {new Date(analysis.created_at).toLocaleDateString('en-US', {
                                                month: 'short',
                                                day: 'numeric',
                                                year: 'numeric'
                                            })}
                                        </CardDescription>
                                    </CardHeader>

                                    <CardContent>
                                        <div className="space-y-3">
                                            {analysis.stats && (
                                                <div className="flex items-center gap-2">
                                                    <TrendingUp className="h-4 w-4 text-green-600" />
                                                    <span className="text-sm text-muted-foreground">
                                                        R² = {analysis.stats.r_squared?.toFixed(2) || 'N/A'}
                                                    </span>
                                                    <Badge className="ml-auto bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                                        {analysis.model_type || 'Linear'}
                                                    </Badge>
                                                </div>
                                            )}

                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <Sparkles className="h-4 w-4" />
                                                <span>{analysis.dataPoints || 0} data points</span>
                                            </div>

                                            <Button variant="outline" className="w-full gap-2 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                                View Chapter
                                                <ChevronRight className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <Card className="border-2 border-dashed">
                            <CardContent className="p-12 text-center">
                                <BookOpen className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                                <h3 className="text-xl font-semibold mb-2 text-slate-900 dark:text-slate-100">
                                    Your Story Begins Here
                                </h3>
                                <p className="text-muted-foreground mb-6">
                                    Start your first analysis and write the opening chapter of your data journey
                                </p>
                                <Button onClick={handleStartNewChapter} className="gap-2 bg-gradient-to-r from-blue-600 to-blue-800">
                                    <Plus className="h-4 w-4" />
                                    Write Chapter 1
                                </Button>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Achievements */}
                <div>
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-3">
                                <Trophy className="h-8 w-8 text-yellow-500" />
                                Achievements
                            </h2>
                            <p className="text-muted-foreground mt-1">
                                Unlock milestones as you master data analysis
                            </p>
                        </div>
                        <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-4 py-1">
                            {unlockedCount}/{achievements.length} Unlocked
                        </Badge>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {achievements.map((achievement) => (
                            <Card key={achievement.id} className={`relative overflow-hidden transition-all duration-300 ${achievement.unlocked
                                    ? 'border-2 border-yellow-300 dark:border-yellow-700 shadow-lg'
                                    : 'opacity-50 grayscale'
                                }`}>
                                {achievement.unlocked && (
                                    <div className={`absolute inset-0 bg-gradient-to-r ${achievement.color} opacity-5`} />
                                )}

                                <CardContent className="p-6 text-center relative z-10">
                                    <div className={`w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center ${achievement.unlocked
                                            ? `bg-gradient-to-br ${achievement.color} text-white shadow-lg`
                                            : 'bg-slate-200 dark:bg-slate-800 text-slate-400'
                                        }`}>
                                        <achievement.icon className="h-8 w-8" />
                                    </div>

                                    <h4 className="font-bold mb-1 text-slate-900 dark:text-slate-100">
                                        {achievement.title}
                                    </h4>
                                    <p className="text-sm text-muted-foreground">
                                        {achievement.description}
                                    </p>

                                    {achievement.unlocked && (
                                        <Badge className="mt-3 bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                                            ✓ Unlocked
                                        </Badge>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>

                {/* Next Steps */}
                <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 border-2 border-blue-200 dark:border-blue-800">
                    <CardContent className="p-8">
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white flex-shrink-0">
                                <Target className="h-6 w-6" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-xl font-bold mb-2 text-slate-900 dark:text-slate-100">
                                    What's Next?
                                </h3>
                                <p className="text-muted-foreground mb-4">
                                    {analyses.length === 0
                                        ? "Start your data journey with your first analysis"
                                        : analyses.length < 5
                                            ? `${5 - analyses.length} more chapters to unlock Data Explorer achievement`
                                            : "Continue exploring and unlock all achievements!"
                                    }
                                </p>
                                <Button onClick={handleStartNewChapter} className="gap-2 bg-gradient-to-r from-blue-600 to-purple-600">
                                    <Play className="h-4 w-4" />
                                    {analyses.length === 0 ? "Start First Chapter" : "Continue Journey"}
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
};

export default JourneyDashboard;
