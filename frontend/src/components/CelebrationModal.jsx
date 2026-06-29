import { useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

import { Card, CardContent } from "@/components/ui/card";
import {
    TrendingUp,
    Sparkles,
    Star,
    Trophy,
    Zap,
    Share2,
    Download,
    BookOpen
} from "lucide-react";
import confetti from "canvas-confetti";

const CelebrationModal = ({
    open,
    onClose,
    type = "insight",
    data = {}
}) => {
    useEffect(() => {
        if (open) {
            triggerConfetti();
        }
    }, [open]);

    const triggerConfetti = () => {
        const duration = 3 * 1000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

        function randomInRange(min, max) {
            return Math.random() * (max - min) + min;
        }

        const interval = setInterval(function () {
            const timeLeft = animationEnd - Date.now();

            if (timeLeft <= 0) {
                return clearInterval(interval);
            }

            const particleCount = 50 * (timeLeft / duration);

            confetti({
                ...defaults,
                particleCount,
                origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
            });
            confetti({
                ...defaults,
                particleCount,
                origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
            });
        }, 250);
    };

    const celebrations = {
        insight: {
            icon: Sparkles,
            title: "🎉 Insight Discovered!",
            subtitle: "You've uncovered something meaningful",
            color: "from-blue-600 to-purple-600",
            message: data.message || "Your data reveals a clear pattern!",
            stats: [
                { label: "Confidence", value: data.confidence || "High", icon: TrendingUp },
                { label: "Model", value: data.model || "Linear", icon: Zap },
                { label: "Quality", value: data.quality || "Excellent", icon: Star }
            ]
        },
        achievement: {
            icon: Trophy,
            title: "🏆 Achievement Unlocked!",
            subtitle: "You've reached a new milestone",
            color: "from-yellow-500 to-orange-500",
            message: data.message || "Keep up the amazing work!",
            stats: [
                { label: "Achievement", value: data.achievement || "First Analysis", icon: Trophy }
            ]
        },
        export: {
            icon: Share2,
            title: "✨ Story Ready to Share!",
            subtitle: "Your insight is beautifully packaged",
            color: "from-green-600 to-emerald-600",
            message: data.message || "Your data story has been exported successfully!",
            stats: [
                { label: "Format", value: data.format || "PNG", icon: Download }
            ]
        },
        chapter: {
            icon: BookOpen,
            title: "📖 Chapter Saved!",
            subtitle: "Another page in your data story",
            color: "from-slate-600 to-slate-800",
            message: data.message || "Your analysis has been added to your story",
            stats: [
                { label: "Total Chapters", value: data.total || "1", icon: BookOpen }
            ]
        }
    };

    const celebration = celebrations[type] || celebrations.insight;
    const CelebrationIcon = celebration.icon;

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-2xl border-2 overflow-hidden">
                {/* Gradient Header */}
                <div className={`absolute inset-x-0 top-0 h-32 bg-gradient-to-r ${celebration.color} opacity-10`} />

                <DialogHeader className="relative z-10 text-center pt-6">
                    {/* Animated Icon */}
                    <div className="mx-auto mb-6">
                        <div className={`w-24 h-24 rounded-full bg-gradient-to-br ${celebration.color} flex items-center justify-center text-white shadow-2xl animate-bounce`}>
                            <CelebrationIcon className="h-12 w-12" />
                        </div>
                    </div>

                    <DialogTitle className="text-3xl md:text-4xl font-bold mb-2">
                        {celebration.title}
                    </DialogTitle>

                    <DialogDescription className="text-lg text-muted-foreground">
                        {celebration.subtitle}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-6">
                    {/* Main Message */}
                    <Card className={`bg-gradient-to-br from-slate-50 to-gray-50 dark:from-slate-900 dark:to-gray-900 border-2`}>
                        <CardContent className="p-6 text-center">
                            <p className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                                {celebration.message}
                            </p>
                        </CardContent>
                    </Card>

                    {/* Stats Grid */}
                    {celebration.stats && celebration.stats.length > 0 && (
                        <div className={`grid ${celebration.stats.length === 1 ? 'grid-cols-1' : 'grid-cols-3'} gap-4`}>
                            {celebration.stats.map((stat, index) => {
                                const StatIcon = stat.icon;
                                return (
                                    <Card key={index} className="border-2">
                                        <CardContent className="p-4 text-center">
                                            <StatIcon className={`h-6 w-6 mx-auto mb-2 bg-gradient-to-r ${celebration.color} bg-clip-text text-transparent`}
                                                style={{ WebkitTextFillColor: 'transparent', WebkitBackgroundClip: 'text' }} />
                                            <p className="text-xs text-muted-foreground uppercase mb-1">
                                                {stat.label}
                                            </p>
                                            <p className={`text-lg font-bold bg-gradient-to-r ${celebration.color} bg-clip-text text-transparent`}>
                                                {stat.value}
                                            </p>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    )}

                    {/* Additional Content */}
                    {data.details && (
                        <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                            <p className="text-sm text-blue-900 dark:text-blue-100">
                                💡 <strong>What this means:</strong> {data.details}
                            </p>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-3 pt-4">
                        {data.shareAction && (
                            <Button
                                onClick={data.shareAction}
                                className={`flex-1 gap-2 bg-gradient-to-r ${celebration.color}`}
                            >
                                <Share2 className="h-4 w-4" />
                                Share Your Story
                            </Button>
                        )}

                        {data.viewAction && (
                            <Button
                                onClick={data.viewAction}
                                variant="outline"
                                className="flex-1 gap-2"
                            >
                                <BookOpen className="h-4 w-4" />
                                View Details
                            </Button>
                        )}

                        <Button
                            onClick={onClose}
                            variant={data.shareAction || data.viewAction ? "outline" : "default"}
                            className={!data.shareAction && !data.viewAction ? `flex-1 bg-gradient-to-r ${celebration.color}` : "flex-1"}
                        >
                            {data.closeText || "Continue Your Journey"}
                        </Button>
                    </div>

                    {/* Encouragement */}
                    {data.encouragement !== false && (
                        <div className="text-center pt-2">
                            <p className="text-sm text-muted-foreground italic">
                                {data.encouragement || "🌟 You're making great progress! Keep discovering."}
                            </p>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default CelebrationModal;
