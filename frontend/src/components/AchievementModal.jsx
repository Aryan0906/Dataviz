import { useStorytelling } from "@/context/StorytellingContext";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Trophy, Award, Star, Target } from "lucide-react";
import { useState } from "react";

const AchievementModal = () => {
    const { achievements } = useStorytelling();
    const [isOpen, setIsOpen] = useState(false);

    const totalPossiblePoints = 615; // Sum of all achievement points
    const currentPoints = achievements.reduce((sum, a) => sum + a.points, 0);
    const progressPercentage = (currentPoints / totalPossiblePoints) * 100;

    // Group achievements by earned/not earned
    const earnedAchievements = achievements;
    const allAchievements = [
        { id: 'first-login', title: 'Welcome Aboard!', description: 'Logged in for the first time', icon: '🎉', points: 10 },
        { id: 'completed-onboarding', title: 'Quick Learner', description: 'Completed the onboarding tutorial', icon: '🎓', points: 25 },
        { id: 'first-analysis', title: 'Data Explorer', description: 'Created your first analysis', icon: '📊', points: 30 },
        { id: 'first-save', title: 'Saver', description: 'Saved your first chart', icon: '💾', points: 20 },
        { id: 'used-ai', title: 'AI Pioneer', description: 'Used AI-powered features', icon: '🤖', points: 40 },
        { id: 'five-analyses', title: 'Analyst', description: 'Created 5 analyses', icon: '🔬', points: 50 },
        { id: 'explorer', title: 'Explorer', description: 'Visited all main pages', icon: '🗺️', points: 60 },
        { id: 'customizer', title: 'Customizer', description: 'Customized your profile', icon: '⚙️', points: 15 },
        { id: 'export-master', title: 'Export Master', description: 'Exported 3 charts', icon: '📤', points: 35 },
        { id: 'week-streak', title: 'Dedicated User', description: 'Used the app 7 days in a row', icon: '🔥', points: 100 },
    ];

    const lockedAchievements = allAchievements.filter(
        a => !achievements.some(earned => earned.id === a.id)
    );

    return (
        <>
            <Button
                onClick={() => setIsOpen(true)}
                variant="outline"
                size="sm"
                className="gap-2"
            >
                <Trophy className="h-4 w-4 text-yellow-600" />
                <span className="hidden md:inline">Achievements</span>
                <Badge variant="secondary" className="ml-1">
                    {achievements.length}
                </Badge>
            </Button>

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-2xl">
                            <Trophy className="h-6 w-6 text-yellow-600" />
                            Your Achievements
                        </DialogTitle>
                        <DialogDescription>
                            Track your progress and unlock rewards as you master the platform
                        </DialogDescription>
                    </DialogHeader>

                    {/* Overall Progress */}
                    <div className="space-y-3 p-4 bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-950/20 dark:to-amber-950/20 rounded-lg border">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Star className="h-5 w-5 text-yellow-600" />
                                <span className="font-semibold">Overall Progress</span>
                            </div>
                            <div className="text-2xl font-bold text-yellow-600">
                                {currentPoints} / {totalPossiblePoints}
                            </div>
                        </div>
                        <Progress value={progressPercentage} className="h-3" />
                        <div className="flex justify-between text-xs text-muted-foreground">
                            <span>{achievements.length} of {allAchievements.length} achievements</span>
                            <span>{Math.round(progressPercentage)}% complete</span>
                        </div>
                    </div>

                    {/* Unlocked Achievements */}
                    {earnedAchievements.length > 0 && (
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <Award className="h-5 w-5 text-green-600" />
                                <h3 className="font-semibold">Unlocked ({earnedAchievements.length})</h3>
                            </div>
                            <div className="grid gap-3">
                                {earnedAchievements.map((achievement) => (
                                    <div
                                        key={achievement.id}
                                        className="flex items-start gap-3 p-3 border rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200 dark:border-green-800"
                                    >
                                        <div className="text-3xl">{achievement.icon}</div>
                                        <div className="flex-1">
                                            <div className="font-semibold">{achievement.title}</div>
                                            <div className="text-sm text-muted-foreground">
                                                {achievement.description}
                                            </div>
                                            {achievement.unlockedAt && (
                                                <div className="text-xs text-muted-foreground mt-1">
                                                    Unlocked {new Date(achievement.unlockedAt).toLocaleDateString()}
                                                </div>
                                            )}
                                        </div>
                                        <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                            +{achievement.points}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Locked Achievements */}
                    {lockedAchievements.length > 0 && (
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <Target className="h-5 w-5 text-gray-500" />
                                <h3 className="font-semibold text-muted-foreground">
                                    Locked ({lockedAchievements.length})
                                </h3>
                            </div>
                            <div className="grid gap-3">
                                {lockedAchievements.map((achievement) => (
                                    <div
                                        key={achievement.id}
                                        className="flex items-start gap-3 p-3 border rounded-lg bg-muted/30 opacity-60"
                                    >
                                        <div className="text-3xl grayscale">{achievement.icon}</div>
                                        <div className="flex-1">
                                            <div className="font-semibold text-muted-foreground">
                                                {achievement.title}
                                            </div>
                                            <div className="text-sm text-muted-foreground">
                                                {achievement.description}
                                            </div>
                                        </div>
                                        <Badge variant="outline" className="text-muted-foreground">
                                            +{achievement.points}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
};

export default AchievementModal;
